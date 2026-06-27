import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env/server-env';
import { normalizeRole } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const body = await request.json().catch(() => null);
  const requestedRole = normalizeRole(body?.role) ?? normalizeRole(env.appDefaultRole) ?? 'Kế toán';
  if (!env.basicAuthEnabled) {
    const response = NextResponse.json({ ok: true, mode: 'disabled', role: requestedRole, message: 'Basic Auth tạm đang tắt. Đã ghi role cookie phục vụ UAT RBAC.' });
    response.cookies.set('ctl_role', requestedRole, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set('ctl_actor', String(body?.actor ?? requestedRole), { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    return response;
  }
  const ok = body?.username === env.appUsername && body?.password === env.appPassword;
  const response = NextResponse.json({ ok, mode: 'basic_auth', role: ok ? requestedRole : null, message: ok ? 'Đăng nhập tạm thành công.' : 'Sai tài khoản hoặc mật khẩu.' }, { status: ok ? 200 : 401 });
  if (ok) {
    response.cookies.set('ctl_role', requestedRole, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set('ctl_actor', String(body?.actor ?? requestedRole), { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}
