import { getServerEnv, hasTelegramEnv } from '@/lib/env/server-env';

type Snapshot = {
  periodCode?: string;
  branch?: string;
  status?: string;
  generatedAt?: string;
  executiveKpis?: Array<{ label: string; value: string; status?: string }>;
  checks?: Array<{ label: string; status: string; detail: string }>;
};

function html(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function row(label: string, value: unknown) {
  return `• <b>${html(label)}:</b> ${html(value)}`;
}

export function buildCeoWeeklyCloseMessage(snapshot: Snapshot, closeId: string) {
  const kpis = (snapshot.executiveKpis ?? []).slice(0, 6).map((item) => row(item.label, item.value));
  const warnings = (snapshot.checks ?? []).filter((check) => check.status !== 'Tốt').slice(0, 6).map((check) => row(check.label, `${check.status} · ${check.detail}`));
  return [
    '<b>Cơm Tấm Làng · Chốt báo cáo tuần</b>',
    row('Mã chốt', closeId),
    row('Kỳ', snapshot.periodCode ?? '—'),
    row('Chi nhánh', snapshot.branch ?? '—'),
    row('Trạng thái', snapshot.status ?? '—'),
    row('Thời gian', snapshot.generatedAt ?? new Date().toISOString()),
    '',
    '<b>Chỉ số CEO</b>',
    ...(kpis.length ? kpis : ['• Chưa đủ dữ liệu KPI']),
    '',
    '<b>Cảnh báo cần xem</b>',
    ...(warnings.length ? warnings : ['• Không có cảnh báo nổi bật'])
  ].join('\n');
}

export async function sendCeoWeeklyCloseMessage(snapshot: Snapshot, closeId: string) {
  if (!hasTelegramEnv()) return { ok: false, skipped: true, message: 'Thiếu cấu hình Telegram.' };
  const env = getServerEnv();
  const endpoint = new URL(`/bot${env.telegramBotToken}/sendMessage`, 'https://api.telegram.org');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.telegramChatId, text: buildCeoWeeklyCloseMessage(snapshot, closeId), parse_mode: 'HTML', disable_web_page_preview: true })
  });
  if (!response.ok) return { ok: false, skipped: false, message: `Telegram lỗi ${response.status}` };
  return { ok: true, skipped: false, message: 'Đã gửi báo cáo cho CEO.' };
}
