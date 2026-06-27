import { NextRequest, NextResponse } from 'next/server';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';
import { buildWeeklyClosePreview } from '@/lib/reports/v7/weekly-close-engine';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'weekly_close_preview');
  if (!rbac.ok) return rbac.response;
  const body = await request.json().catch(() => null);
  const periodCode = String(body?.periodCode ?? '').trim();
  if (!periodCode) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu kỳ báo cáo cần preview chốt.' } }, { status: 400 });
  }
  try {
    const preview = await buildWeeklyClosePreview({ periodCode, branch: body?.branch, actor: rbac.context.actor });
    await writeAuditLog({ eventType: AUDIT_EVENTS.WEEKLY_CLOSE_PREVIEW, actor: rbac.context.actor, target: periodCode, after: preview });
    return NextResponse.json(appendRbacMeta({ ok: true, data: preview }, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'WEEKLY_CLOSE_PREVIEW_FAILED', message: error instanceof Error ? error.message : 'Không preview chốt báo cáo được.' } }, { status: 500 });
  }
}
