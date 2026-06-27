import { NextRequest, NextResponse } from 'next/server';
import { rollbackImport } from '@/lib/import/import-rollback';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.maLanImport || !body?.reason) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu mã lần import hoặc lý do hủy.' } }, { status: 400 });
  }
  const rbac = requireApiPermission(request, body.confirm === true ? 'rollback_confirm' : 'rollback_preview');
  if (!rbac.ok) return rbac.response;
  try {
    const result = await rollbackImport({
      maLanImport: String(body.maLanImport),
      reason: String(body.reason),
      actor: String(body.actor ?? rbac.context.actor),
      confirm: body.confirm === true
    });
    return NextResponse.json(appendRbacMeta(result, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'IMPORT_FAILED', message: error instanceof Error ? error.message : 'Không hoàn tác được lần import.' } }, { status: 500 });
  }
}
