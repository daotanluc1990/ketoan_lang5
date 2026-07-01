import { NextRequest, NextResponse } from 'next/server';
import { allTaiLieu, type TaiLieu } from '@/lib/tai-lieu/noi-dung';
import { getServerEnv } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';

type RagRequest = {
  question?: string;
  module?: string;
  role?: string;
};

/**
 * Tìm tài liệu liên quan bằng keyword matching (RAG retrieval).
 * Score theo số keyword trùng.
 */
function findRelevantDocs(question: string, moduleFilter?: string, roleFilter?: string): TaiLieu[] {
  const q = question.toLowerCase().trim();
  // Tách keyword: bỏ dấu, chia theo từ
  const keywords = q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let candidates = allTaiLieu;
  // Filter theo module
  if (moduleFilter) {
    candidates = candidates.filter((d) => d.module.toLowerCase().includes(moduleFilter.toLowerCase()));
  }
  // Filter theo role (đơn giản: nếu role truyền vào, kiểm tra vaiTro contains hoặc '*')
  if (roleFilter && roleFilter !== 'CEO' && roleFilter !== 'Admin') {
    candidates = candidates.filter((d) => d.vaiTro.includes(roleFilter) || d.vaiTro.includes('*'));
  }

  // Score: đếm keyword match trong title + moTa + noiDung
  return candidates
    .map((doc) => {
      const text = (doc.title + ' ' + doc.moTa + ' ' + doc.noiDung.join(' ') + ' ' + doc.module)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
      const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
      return { doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.doc);
}

/**
 * Format câu trả lời theo template cố định (spec AI RAG).
 */
function formatAnswer(question: string, docs: TaiLieu[]): string {
  if (!docs.length) {
    return [
      'Chưa có tài liệu nội bộ đủ để trả lời chắc chắn câu hỏi này.',
      'Cần bổ sung tài liệu hoặc hỏi người phụ trách trước khi thực hiện.',
      '',
      'Gợi ý làm rõ:',
      '1. Vấn đề xảy ra ở cửa hàng hay BTT?',
      '2. Liên quan tiền, hàng, chứng từ hay báo cáo?',
      '3. Có chứng từ/ảnh/biên bản chưa?',
      '4. Người phụ trách hiện tại là ai?',
    ].join('\n');
  }

  const primary = docs[0];
  const sections: string[] = [];

  // Kết luận nhanh
  sections.push('Kết luận nhanh:');
  sections.push(primary.moTa);
  sections.push('');

  // Việc cần làm
  sections.push('Việc cần làm:');
  primary.noiDung.forEach((step, i) => {
    sections.push(`${i + 1}. ${step.replace(/^\[\s\]\s*/, '')}`);
  });
  sections.push('');

  // Người phụ trách
  sections.push(`Người phụ trách: ${primary.nguoiPhuTrach}`);
  sections.push('');

  // Khi nào báo CEO
  sections.push(`Khi nào báo CEO: ${primary.khiNaoBaoCeo}`);
  sections.push('');

  // Nguồn tài liệu
  sections.push('Nguồn tài liệu:');
  docs.forEach((doc) => {
    sections.push(`- ${doc.title} (${doc.id}) | Mục: ${doc.module} | Loại: ${doc.loai}`);
  });

  return sections.join('\n');
}

/**
 * Gemini prompt-based RAG.
 * Gửi context tài liệu + câu hỏi → Gemini trả lời theo format.
 */
async function callGeminiRAG(question: string, context: string): Promise<string | null> {
  const env = getServerEnv();
  const apiKey = env.geminiApiKey;
  const model = env.geminiModel || 'gemini-2.5-flash';
  if (!apiKey) return null;

  const systemPrompt = `Bạn là "Trợ lý hướng dẫn kế toán nội bộ" cho Cơm Tấm Làng.
Nguyên tắc BẮT BUỘC:
1. Chỉ trả lời dựa trên tài liệu nội bộ được cung cấp bên dưới.
2. KHÔNG bịa quy định, KHÔNG lấy thông tin từ internet.
3. Nếu không có đủ tài liệu → nói "Chưa đủ dữ liệu để kết luận."
4. KHÔNG duyệt chi, KHÔNG sửa số liệu, KHÔNG quy trách nhiệm đền bù.
5. Trích nguồn tài liệu khi trả lời.
6. Trả lời theo format: Kết luận nhanh / Việc cần làm / Người phụ trách / Khi nào báo CEO / Nguồn tài liệu.

Tài liệu nội bộ tham khảo:
${context}

Câu hỏi: ${question}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let body: RagRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, { status: 400 });
  }

  const question = (body.question || '').trim();
  if (!question) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu câu hỏi.' } }, { status: 400 });
  }

  // Step 1: RAG retrieval — tìm tài liệu liên quan
  const docs = findRelevantDocs(question, body.module, body.role);

  // Step 2: Build context từ tài liệu
  const context = docs.length
    ? docs.map((d) => `[${d.id}] ${d.title}\nModule: ${d.module}\n${d.moTa}\nCác bước: ${d.noiDung.join('; ')}\nNgười phụ trách: ${d.nguoiPhuTrach}\nBáo CEO khi: ${d.khiNaoBaoCeo}`).join('\n\n---\n\n')
    : 'Không tìm thấy tài liệu liên quan.';

  // Step 3: Gọi Gemini (nếu có API key) — fallback rule-based
  let answer: string;
  let aiProvider: 'gemini' | 'rule-based';

  const geminiAnswer = await callGeminiRAG(question, context);
  if (geminiAnswer) {
    answer = geminiAnswer;
    aiProvider = 'gemini';
  } else {
    answer = formatAnswer(question, docs);
    aiProvider = 'rule-based';
  }

  // Step 4: Trả về + sources + suggestions
  const sources = docs.map((d) => ({ id: d.id, title: d.title, module: d.module, loai: d.loai }));

  const suggestions = [
    'Báo cáo tuần cần kiểm tra gì?',
    'Tồn âm xử lý sao?',
    'File Xuất Hủy có phải hàng hủy không?',
    'Hàng hủy cần biểu mẫu gì?',
    'Kế toán mới ngày đầu học gì?',
    'Có đủ điều kiện chốt báo cáo chưa?',
  ];

  return NextResponse.json({
    ok: true,
    data: {
      question,
      answer,
      aiProvider,
      sources,
      suggestions,
    },
  });
}
