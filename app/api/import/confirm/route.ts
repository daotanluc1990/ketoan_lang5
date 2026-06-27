import { NextRequest, NextResponse } from 'next/server';
import { confirmImport } from '@/lib/import/import-confirm';
import type { ImportPreviewResult } from '@/lib/import/import-types';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function canForceClosedPeriod(role: string | null) {
  return role === 'CEO' || role === 'Admin';
}

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'import_confirm');
  if (!rbac.ok) return rbac.response;
  const body = await request.json().catch(() => null);
  if (!body?.preview && !body?.batch) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu preview hoặc batch. Phải kiểm tra trước khi ghi.' } }, { status: 400 });
  }
  const forceClosedPeriod = body.forceClosedPeriod === true && canForceClosedPeriod(rbac.context.role);
  try {
    if (body.batch?.files) {
      const previews = (body.batch.files as Array<{ preview: ImportPreviewResult }>).map((file) => file.preview);
      const results = [];
      for (const preview of previews) {
        results.push(await confirmImport(preview, body.actor ?? rbac.context.actor, { allowPartial: body.allowPartial === true, forceClosedPeriod }));
      }
      const allOk = results.every((result) => result.ok);
      return NextResponse.json(appendRbacMeta({ ok: allOk, mode: 'batch', results }, rbac.context), { status: allOk ? 200 : 409 });
    }
    const preview = body.preview as ImportPreviewResult;
    const result = await confirmImport(preview, body.actor ?? rbac.context.actor, { allowPartial: body.allowPartial === true, forceClosedPeriod });
    return NextResponse.json(appendRbacMeta(result, rbac.context), { status: result.ok ? 200 : 409 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'IMPORT_FAILED', message: error instanceof Error ? error.message : 'Không xác nhận import được.' } }, { status: 500 });
  }
}
