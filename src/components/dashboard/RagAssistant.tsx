'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';

type RagResponse = {
  question: string;
  answer: string;
  aiProvider: 'gemini' | 'rule-based';
  sources: Array<{ id: string; title: string; module: string; loai: string }>;
  suggestions: string[];
};

export function RagAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RagResponse | null>(null);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    'Báo cáo tuần cần kiểm tra gì?',
    'Tồn âm xử lý sao?',
    'File Xuất Hủy có phải hàng hủy không?',
    'Kế toán mới ngày đầu học gì?',
    'Có đủ điều kiện chốt báo cáo chưa?',
  ];

  async function ask(q?: string) {
    const query = (q ?? question).trim();
    if (!query || loading) return;
    setLoading(true);
    setError('');
    setQuestion(query);
    try {
      const res = await fetch('/api/ai/rag-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message || 'Lỗi không xác định');
        setResponse(null);
      } else {
        setResponse(json.data);
      }
    } catch {
      setError('Không kết nối được đến server.');
      setResponse(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [response, loading]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-lang-red text-white shadow-lg transition hover:bg-lang-redDark lg:bottom-8 lg:right-8"
        aria-label="Hỏi AI nội bộ"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      {/* Panel */}
      {open ? (
        <div className="fixed bottom-24 right-4 z-40 flex h-[520px] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-xl border border-lang-line bg-white shadow-xl lg:bottom-28 lg:right-8">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-lang-line bg-lang-redSoft px-4 py-3">
            <Sparkles className="h-4 w-4 text-lang-red" />
            <span className="text-sm font-bold text-lang-ink">Trợ lý hướng dẫn nội bộ</span>
            <span className="ml-auto text-xs font-semibold text-lang-muted">AI RAG</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            {!response && !loading && !error ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-lang-ink">Hỏi về quy trình, checklist, tình huống, biểu mẫu:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="rounded-lg border border-lang-line bg-white px-3 py-1.5 text-xs font-semibold text-lang-ink transition hover:border-lang-red hover:bg-lang-redSoft hover:text-lang-red"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm font-semibold text-lang-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-lang-red border-t-transparent" />
                Đang tìm tài liệu...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>
            ) : null}

            {response ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-lang-redSoft px-3 py-2 text-sm font-bold text-lang-red">
                  Q: {response.question}
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-lang-line bg-gray-50 px-3 py-2 text-xs font-medium leading-relaxed text-lang-ink">{response.answer}</pre>
                {response.sources.length ? (
                  <div>
                    <p className="mb-1 text-xs font-bold text-lang-muted">Nguồn tài liệu:</p>
                    <div className="space-y-1">
                      {response.sources.map((src) => (
                        <div key={src.id} className="rounded border border-lang-line px-2 py-1 text-xs">
                          <span className="font-bold text-lang-red">{src.id}</span> · {src.title} <span className="text-lang-muted">({src.module})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-lang-muted">
                    {response.aiProvider === 'gemini' ? '✨ Gemini AI' : '📋 Rule-based'}
                  </span>
                  <button onClick={() => { setResponse(null); setQuestion(''); }} className="text-xs font-semibold text-lang-red hover:underline">
                    Hỏi câu khác
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Input */}
          <div className="border-t border-lang-line p-3">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
                placeholder="Nhập câu hỏi..."
                className="flex-1 rounded-lg border border-lang-line px-3 py-2 text-sm outline-none focus:border-lang-red"
              />
              <button
                onClick={() => ask()}
                disabled={loading || !question.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-lang-red text-white transition hover:bg-lang-redDark disabled:opacity-50"
                aria-label="Gửi"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
