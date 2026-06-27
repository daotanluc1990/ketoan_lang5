import { z } from 'zod';

const rawEnvSchema = z.object({
  DATA_STORE: z.enum(['local', 'google_sheets']).optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['auto', 'openai', 'gemini']).optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  APP_USERNAME: z.string().optional(),
  APP_PASSWORD: z.string().optional(),
  APP_BASIC_AUTH_ENABLED: z.string().optional(),
  APP_RBAC_ENABLED: z.string().optional(),
  APP_DEFAULT_ROLE: z.string().optional()
});

export type EnvCheck = {
  name: string;
  configured: boolean;
  requiredFor: string;
};

export function getServerEnv() {
  const env = rawEnvSchema.parse(process.env);
  return {
    dataStore: env.DATA_STORE ?? 'local',
    googleSheetId: env.GOOGLE_SHEET_ID,
    googleClientEmail: env.GOOGLE_CLIENT_EMAIL,
    googlePrivateKey: normalizePrivateKey(env.GOOGLE_PRIVATE_KEY),
    aiProvider: env.AI_PROVIDER ?? 'auto',
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    telegramBotToken: env.TELEGRAM_BOT_TOKEN,
    telegramChatId: env.TELEGRAM_CHAT_ID,
    appUsername: env.APP_USERNAME,
    appPassword: env.APP_PASSWORD,
    basicAuthEnabled: env.APP_BASIC_AUTH_ENABLED === 'true',
    rbacEnabled: env.APP_RBAC_ENABLED === 'true',
    appDefaultRole: env.APP_DEFAULT_ROLE
  };
}

export function normalizePrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

export function getEnvChecklist(): EnvCheck[] {
  const env = getServerEnv();
  return [
    { name: 'DATA_STORE', configured: env.dataStore === 'google_sheets' || env.dataStore === 'local', requiredFor: 'Chọn local hoặc Google Sheets' },
    { name: 'GOOGLE_SHEET_ID', configured: Boolean(env.googleSheetId), requiredFor: 'Đọc/ghi Google Sheet thật' },
    { name: 'GOOGLE_CLIENT_EMAIL', configured: Boolean(env.googleClientEmail), requiredFor: 'Google service account' },
    { name: 'GOOGLE_PRIVATE_KEY', configured: Boolean(env.googlePrivateKey), requiredFor: 'Google service account' },
    { name: 'AI_PROVIDER', configured: ['auto', 'openai', 'gemini'].includes(env.aiProvider), requiredFor: 'Chọn nhà cung cấp AI: auto/openai/gemini' },
    { name: 'GEMINI_API_KEY', configured: Boolean(env.geminiApiKey), requiredFor: 'AI Agent thật nếu dùng Gemini' },
    { name: 'GEMINI_MODEL', configured: Boolean(env.geminiModel), requiredFor: 'Model Gemini, mặc định gemini-2.5-flash' },
    { name: 'OPENAI_API_KEY', configured: Boolean(env.openAiApiKey), requiredFor: 'AI Agent thật nếu dùng OpenAI' },
    { name: 'OPENAI_MODEL', configured: Boolean(env.openAiModel), requiredFor: 'Model OpenAI dự phòng' },
    { name: 'TELEGRAM_BOT_TOKEN', configured: Boolean(env.telegramBotToken), requiredFor: 'Gửi Telegram thật' },
    { name: 'TELEGRAM_CHAT_ID', configured: Boolean(env.telegramChatId), requiredFor: 'Gửi Telegram thật' },
    { name: 'APP_USERNAME', configured: Boolean(env.appUsername), requiredFor: 'Basic Auth tạm' },
    { name: 'APP_PASSWORD', configured: Boolean(env.appPassword), requiredFor: 'Basic Auth tạm' },
    { name: 'APP_RBAC_ENABLED', configured: env.rbacEnabled, requiredFor: 'Bật kiểm soát quyền server-side' },
    { name: 'APP_DEFAULT_ROLE', configured: Boolean(env.appDefaultRole), requiredFor: 'Vai trò mặc định khi RBAC chưa bật cứng' }
  ];
}

export function hasGoogleSheetsEnv() {
  const env = getServerEnv();
  return Boolean(env.googleSheetId && env.googleClientEmail && env.googlePrivateKey);
}

export function hasOpenAiEnv() {
  return Boolean(getServerEnv().openAiApiKey);
}

export function hasGeminiEnv() {
  return Boolean(getServerEnv().geminiApiKey);
}

export function getConfiguredAiProvider(): 'openai' | 'gemini' | 'missing' {
  const env = getServerEnv();
  if (env.aiProvider === 'gemini') return env.geminiApiKey ? 'gemini' : 'missing';
  if (env.aiProvider === 'openai') return env.openAiApiKey ? 'openai' : 'missing';
  if (env.geminiApiKey) return 'gemini';
  if (env.openAiApiKey) return 'openai';
  return 'missing';
}

export function hasAiProviderEnv() {
  return getConfiguredAiProvider() !== 'missing';
}

export function hasTelegramEnv() {
  const env = getServerEnv();
  return Boolean(env.telegramBotToken && env.telegramChatId);
}
