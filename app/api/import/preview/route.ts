import { NextRequest, NextResponse } from 'next/server';
import { previewImport } from '@/lib/import/import-preview';
import { previewExcelBatch } from '@/lib/import/parsers/excel-batch';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handleMultipart(request: NextRequest, actor: string) {
  const formData = await request.formData();
  const rawFiles = [...formData.getAll('files'), ...formData.getAll('file')].filter((value): value is File => value instanceof File);
  if (!rawFiles.length) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Chưa có file Excel nào. Hãy upload ít nhất 1 file.' } }, { status: 400 });
  }
  const files = await Promise.all(rawFiles.map(async (file) => ({ filename: file.name, buffer: Buffer.from(await file.arrayBuffer()) })));
  const result = await previewExcelBatch(files, actor);
  return { ok: true as const, data: result };
}

async function handleJson(request: NextRequest, actor: string) {
  const body = await request.json().catch(() => null);
  if (!body?.rows || !body?.sheetDich) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu rows hoặc sheetDich. Với Excel thật, hãy gửi multipart/form-data field files[].' } }, { status: 400 });
  }
  const result = await previewImport({
    loaiDuLieu: body.loaiDuLieu ?? 'Chưa xác định',
    chiNhanh: body.chiNhanh ?? 'NVT',
    tenFile: body.tenFile ?? 'manual.json',
    dauVetFile: body.dauVetFile ?? `manual-${Date.now()}`,
    sheetDich: body.sheetDich,
    rows: body.rows,
    actor
  });
  return { ok: true as const, data: result };
}

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'import_preview');
  if (!rbac.ok) return rbac.response;
  const contentType = request.headers.get('content-type') ?? '';
  try {
    const result = contentType.includes('multipart/form-data')
      ? await handleMultipart(request, rbac.context.actor)
      : await handleJson(request, rbac.context.actor);
    if (result instanceof NextResponse) return result;
    return NextResponse.json(appendRbacMeta(result, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'IMPORT_FAILED', message: error instanceof Error ? error.message : 'Không preview được dữ liệu import.' } }, { status: 500 });
  }
}
