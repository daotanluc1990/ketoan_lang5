import { NextResponse } from 'next/server';
import { getConfiguredAiProvider, getEnvChecklist, getServerEnv, hasAiProviderEnv, hasGeminiEnv, hasGoogleSheetsEnv, hasOpenAiEnv, hasTelegramEnv } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';

export function GET() {
  const env = getServerEnv();
  return NextResponse.json({
    ok: true,
    app: 'Cơm Tấm Làng — CEO Report Dashboard',
    phase: 'V4.9 RBAC & Permission',
    dataStore: process.env.DATA_STORE ?? 'local',
    security: {
      rbacEnabled: env.rbacEnabled,
      defaultRole: env.appDefaultRole,
      basicAuthEnabled: env.basicAuthEnabled,
      note: env.rbacEnabled ? 'Server-side RBAC đang bật.' : 'RBAC đang ở chế độ mềm. Bật APP_RBAC_ENABLED=true khi UAT quyền xong.'
    },
    integrations: {
      googleSheetsReady: hasGoogleSheetsEnv(),
      aiProvider: getConfiguredAiProvider(),
      aiReady: hasAiProviderEnv(),
      geminiReady: hasGeminiEnv(),
      openAiReady: hasOpenAiEnv(),
      telegramReady: hasTelegramEnv()
    },
    env: getEnvChecklist().map((item) => ({ name: item.name, configured: item.configured, requiredFor: item.requiredFor }))
  });
}
