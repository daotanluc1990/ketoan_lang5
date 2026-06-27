import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'resolve_conflict');
  if (!rbac.ok) return rbac.response;
  const body = await request.json().catch(() => null);
  if (!body?.maLech || !body?.hanhDong) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Thiếu mã lệch hoặc hành động xử lý.' } }, { status: 400 });
  }
  await writeAuditLog({ eventType: AUDIT_EVENTS.CONFLICT_RESOLVE, actor: body.actor ?? rbac.context.actor, target: body.maLech, after: body });
  return NextResponse.json(appendRbacMeta({ ok: true, message: 'Đã ghi nhận xử lý dữ liệu lệch ở audit log. Ghi đè dữ liệu thật sẽ làm ở phase sau theo quyền.' }, rbac.context));
}
