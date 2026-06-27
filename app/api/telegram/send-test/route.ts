import { NextRequest, NextResponse } from 'next/server';
import { buildTelegramWeeklyMessage, sendTelegramMessage } from '@/lib/telegram/telegram-client';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'send_bot');
  if (!rbac.ok) return rbac.response;
  const body = await request.json().catch(() => ({}));
  try {
    const message = body?.message ? String(body.message) : await buildTelegramWeeklyMessage();
    const result = await sendTelegramMessage(message);
    return NextResponse.json(appendRbacMeta({ ok: result.ok, data: result }, rbac.context), { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'EXTERNAL_SERVICE_ERROR', message: error instanceof Error ? error.message : 'Không gửi Telegram test được.' } }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_settings');
  if (!rbac.ok) return rbac.response;
  try {
    const message = await buildTelegramWeeklyMessage();
    return NextResponse.json(appendRbacMeta({ ok: true, mode: 'preview_only', message }, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Không tạo được message Telegram.' } }, { status: 500 });
  }
}
