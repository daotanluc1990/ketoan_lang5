import { NextRequest, NextResponse } from 'next/server';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';
import { confirmWeeklyClose } from '@/lib/reports/v7/weekly-close-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'weekly_close_confirm');
  if (!rbac.ok) return rbac.response;
  const body = await request.json().catch(() => null);
  const periodCode = String(body?.periodCode ?? '').trim();
  if (!periodCode) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu kỳ báo cáo cần chốt.' } }, { status: 400 });
  }
  try {
    const result = await confirmWeeklyClose({
      periodCode,
      branch: body?.branch,
      actor: body?.actor ?? rbac.context.actor,
      note: body?.note,
      force: body?.force === true
    });
    return NextResponse.json(appendRbacMeta(result, rbac.context), { status: result.ok ? 200 : 409 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'WEEKLY_CLOSE_CONFIRM_FAILED', message: error instanceof Error ? error.message : 'Không chốt báo cáo được.' } }, { status: 500 });
  }
}
