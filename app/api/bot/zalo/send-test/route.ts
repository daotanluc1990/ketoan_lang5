import { NextRequest, NextResponse } from 'next/server';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_settings');
  if (!rbac.ok) return rbac.response;
  return NextResponse.json(appendRbacMeta({ ok: true, mode: 'contract_only', message: 'Zalo chưa bật trong V4.9. Telegram là kênh test thật trước.' }, rbac.context));
}

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'send_bot');
  if (!rbac.ok) return rbac.response;
  return NextResponse.json(appendRbacMeta({ ok: false, message: 'Zalo chưa được triển khai. Không gửi thật để tránh cấu hình sai kênh.' }, rbac.context), { status: 501 });
}
