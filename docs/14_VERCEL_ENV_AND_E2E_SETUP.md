# Hướng dẫn cấu hình Vercel Env và test E2E V4.4

## 1. Không upload `.env` lên GitHub

Chỉ copy từng biến vào Vercel:

`Vercel → Project → Settings → Environment Variables`

## 2. Biến bắt buộc

```env
DATA_STORE=google_sheets
GOOGLE_SHEET_ID=
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
APP_BASIC_AUTH_ENABLED=true
APP_USERNAME=
APP_PASSWORD=
```

## 3. Google Sheet

- Mở Google Sheet Data Master.
- Share quyền Editor cho `GOOGLE_CLIENT_EMAIL` của service account.
- Không đổi tên sheet/header nếu app đang dùng.

## 4. Test sau deploy

Mở URL Vercel Preview và test:

```text
/api/health
/api/google-sheets/health
/api/reports/dashboard
/api/ai/report-analysis
/api/telegram/send-test
```

Sau đó vào web:

- Bàn làm việc kế toán
- Nhập liệu & Import
- Báo cáo thất thoát chi tiết
- CEO Dashboard

## 5. Khi nào được gọi production-live

Chỉ khi:

- Google Sheet health `ok: true`
- Import preview 5 file pass
- Import confirm ghi Google Sheet pass
- Dashboard đọc số thật pass
- AI Agent trả `mode: real_openai`
- Telegram gửi tin nhắn thật pass
- CEO và kế toán UAT pass


## AI Agent — Gemini 2.5 Flash

Nếu dùng Gemini thay OpenAI, cấu hình Vercel Environment Variables như sau:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

OpenAI không bắt buộc khi `AI_PROVIDER=gemini`. Nếu thiếu `GEMINI_API_KEY`, endpoint `/api/ai/report-analysis` sẽ fallback rule-based và không gọi AI thật.

Smoke test sau deploy:

```text
/api/health          -> integrations.aiProvider phải là gemini nếu key đã set
/api/ai/report-analysis -> data.mode là real_gemini khi có dữ liệu thật và Gemini key hợp lệ
```
