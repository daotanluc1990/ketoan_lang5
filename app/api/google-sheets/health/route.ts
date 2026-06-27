import { NextResponse } from 'next/server';
import { sheetsRepository } from '@/lib/google-sheets/sheets-repository';
import { getEnvChecklist } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health = await sheetsRepository.healthCheck();
  return NextResponse.json({ ok: health.ok, data: health, env: getEnvChecklist().map((item) => ({ name: item.name, configured: item.configured, requiredFor: item.requiredFor })) }, { status: health.ok ? 200 : 503 });
}
