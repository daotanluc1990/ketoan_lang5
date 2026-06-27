# QA_REPORT_V4_6_1_GEMINI_PROVIDER_SUPPORT

## Tình hình chung

Đạt để redeploy Vercel Preview/Staging.

Bản V4.6.1 bổ sung Gemini Provider Support cho AI Finance Agent. App không còn phụ thuộc OpenAI-only; có thể dùng Gemini 2.5 Flash bằng Vercel Environment Variables.

## Phạm vi đã sửa

| File | Nội dung |
|---|---|
| `src/lib/env/server-env.ts` | Thêm `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, chọn provider auto/openai/gemini |
| `src/lib/ai/agent.ts` | Thêm provider `real_gemini`, gọi Gemini REST Interactions API, giữ OpenAI fallback |
| `src/lib/ai/__tests__/agent.test.ts` | Thêm test chọn Gemini provider và fallback an toàn |
| `app/api/health/route.ts` | Trả trạng thái AI provider, Gemini ready, OpenAI ready |
| `app/cai-dat-bot/page.tsx` | UI cấu hình hiển thị AI Agent là Gemini/OpenAI theo env |
| `.env.example` | Thêm biến Gemini và `AI_PROVIDER=gemini` |
| `docs/14_VERCEL_ENV_AND_E2E_SETUP.md` | Thêm hướng dẫn Vercel env cho Gemini 2.5 Flash |
| `docs/AGENT_TOOL_MAP.md` | Thêm Gemini API vào tool map |
| `docs/AGENT_EVALUATION.md` | Thêm test cases Gemini provider |
| `README.md` | Thêm hướng dẫn chọn AI provider |
| `package.json` | Version `0.1.3` |

## Luồng AI mới

```text
Google Sheet/Data report
→ .agents/AI_FINANCE_AGENT.md
→ AI_PROVIDER=gemini
→ Gemini Interactions API
→ JSON output
→ Web/Telegram hiển thị phân tích
```

Nếu thiếu dữ liệu thật hoặc thiếu API key, AI không bịa số và fallback rule-based với thông báo `Chưa đủ dữ liệu để kết luận.`

## ENV Vercel cần dùng

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

OpenAI không bắt buộc nếu dùng Gemini.

## Commands run

| Command | Result | Notes |
|---|---|---|
| `npm install --no-audit --no-fund --progress=false` | PASS | 467 packages installed |
| `npm run agent-check` | PASS | Agent structure QA passed |
| `npm run typecheck` | PASS | TypeScript OK |
| `npm run lint` | PASS | ESLint OK |
| `npm run test` | PASS | 4 files, 8 tests |
| `npm run static-ui-qa` | PASS | 9 tabs, compact filter, sidebar, batch upload OK |
| `npm run kiem-tra-schema` | PASS | 21 sheet defined |
| `npm run smoke` | PASS | schema + import hash foundation OK |
| `NEXT_TELEMETRY_DISABLED=1 npm run vercel-build` | PASS | Exit 0 |

## Build warning

`next build` còn 1 warning Turbopack/NFT do runtime AI đọc file markdown `.agents/AI_FINANCE_AGENT.md` bằng filesystem. Warning này không làm fail build; `vercel-build` exit 0. Giữ markdown file vì đây là yêu cầu vận hành agent của owner.

## Secret safety

Không đóng gói:

- `.env`
- `.env.local`
- `.next`
- `.vercel`
- `node_modules`
- `package-lock.json`
- `tsconfig.tsbuildinfo`

`.env.example` chỉ có tên biến, không có secret thật.

## Vercel smoke test sau redeploy

```text
/api/health
/api/google-sheets/health
/api/reports/pl-tuan
/api/ai/report-analysis
/pl-tuan
```

Kỳ vọng:

- `/api/health` trả `aiProvider: gemini` khi `AI_PROVIDER=gemini` và `GEMINI_API_KEY` đã cấu hình.
- Nếu Google Sheet chưa có dữ liệu thật, `/api/ai/report-analysis` vẫn báo `Chưa đủ dữ liệu để kết luận.`
- Nếu Google Sheet có dữ liệu thật và Gemini key hợp lệ, AI trả `mode: real_gemini`.

## Remaining risks

- Chưa gọi Gemini thật trong sandbox vì không có `GEMINI_API_KEY` của owner.
- Cần set env trên Vercel và redeploy.
- Cần test runtime `/api/ai/report-analysis` trên Vercel bằng dữ liệu thật.
