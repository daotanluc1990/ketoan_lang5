# Cơm Tấm Làng — CEO Report Dashboard

Phiên bản hiện tại: **V4.9 — RBAC & Permission**.

Bản này bổ sung kiểm soát quyền theo vai trò cho UI/API: CEO, Kế toán, Admin, Quản lý cửa hàng. Các API ghi dữ liệu như import confirm, rollback confirm, gửi bot và các báo cáo tài chính nhạy cảm đều được kiểm tra quyền server-side.


Web app nội bộ để kế toán nhập/import báo cáo thứ 2, hệ thống kiểm tra dữ liệu, tạo dashboard cho CEO và chuẩn bị báo cáo Telegram/Zalo.

## Trạng thái bản xuất code

Bản này là **production-style code package / staging-ready candidate**, chưa được gọi là production-live vì chưa kết nối dữ liệu thật, chưa có đăng nhập thật, chưa gửi bot thật.

Đã có:

- Next.js + TypeScript + Tailwind.
- UI desktop-first có 17 trang (chia 5 nhóm điều hướng):
  - **Tổng quan & xử lý:** Tổng quan kế toán, Bàn làm việc kế toán, Nhập liệu & Import
  - **Báo cáo tài chính quản trị:** P&L Tuần, Dòng tiền Tuần, Cân đối rút gọn, Dự toán tuần tới
  - **Kho & vận hành hàng hóa:** Kho cửa hàng, Kho Bếp Trung Tâm, Đối chiếu BTT - Cửa hàng, Hàng hủy
  - **Thất thoát & định mức:** Hao hụt / Vượt định mức, Thất thoát tồn kho, Định mức món bán
  - **Hệ thống:** Công nợ, Cài đặt & Bot báo cáo, Lịch sử chốt báo cáo
- Sidebar có thể thu gọn/mở rộng và có vùng cuộn nội bộ.
- Filter bar toàn cục.
- KPI có cảnh báo Tốt/Cảnh báo/Nguy hiểm.
- Batch upload nhiều file mock.
- Checklist báo cáo tuần cho kế toán.
- Trạng thái báo cáo tuần.
- Phân quyền mock: CEO / Kế toán / Admin / Quản lý cửa hàng.
- Top 5 nguyên liệu thất thoát, tỷ lệ thất thoát, định mức, vượt định mức.
- Import core foundation, audit foundation, Google Sheet schema foundation từ phase trước.

Chưa có:

- Parser Excel thật cho từng file KiotViet/app/sổ quỹ/tồn kho/thất thoát.
- Google Sheet write thật.
- Đăng nhập/session thật.
- RBAC server-side thật.
- Bot Telegram/Zalo thật.
- AI Agent thật; hiện chỉ là rule-based mock UI.

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở:

```text
http://localhost:3000
```

Trên Windows có thể bấm:

```text
start-local-windows.bat
```

## Kiểm tra

```bash
npm run typecheck
npm run lint
npm run build
npm run test
npm run smoke
npm run static-ui-qa
```

Nếu máy chưa có internet hoặc chưa cài dependencies, cần chạy `npm install` trước. Không commit `node_modules`, `.next`, `.env.local`, hoặc secret.

## Nguyên tắc dữ liệu

- Google Sheet dùng tên sheet và tên cột tiếng Việt.
- Code nội bộ có thể dùng không dấu/tiếng Anh để tránh lỗi kỹ thuật.
- Import bắt buộc preview trước khi ghi.
- Không ghi đè dữ liệu cũ tự động.
- Rollback bằng trạng thái lần import, không xóa raw data.
- Khi thiếu dữ liệu phải hiển thị: `Chưa đủ dữ liệu để kết luận.`

## Rủi ro trước production-live

1. Cần kết nối nguồn dữ liệu thật.
2. Cần đăng nhập và phân quyền thật.
3. Cần test bằng file kế toán thật trong 1–2 tuần.
4. Cần staging deploy + UAT trước khi dùng chính thức.

## V4.4 End-to-End additions

V4.4 adds the real integration foundation:

- Google Sheets service-account client.
- Multipart Excel batch preview/import for 5 real accounting files.
- Dashboard API reading from the current data store.
- OpenAI AI Agent endpoint with rule-based fallback when env is missing.
- Telegram send-test endpoint.
- Basic Auth temporary check endpoint.

### Important

Do not commit `.env`.
Set secrets in Vercel Environment Variables.

### Required Vercel env for real mode

See `docs/14_VERCEL_ENV_AND_E2E_SETUP.md`.

### Main E2E test endpoints

- `GET /api/health`
- `GET /api/google-sheets/health`
- `POST /api/import/preview`
- `POST /api/import/confirm`
- `GET /api/reports/dashboard`
- `GET|POST /api/ai/report-analysis`
- `GET|POST /api/telegram/send-test`

### Local QA commands

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run smoke
npm run kiem-tra-schema
npm run static-ui-qa
npm run build
```

## V4.6 — AI Finance Agent

Bản này đã thêm AI Finance Agent chuyên sâu theo chuẩn Skill/Agent:

- Runtime agent: `.agents/AI_FINANCE_AGENT.md`
- Skill: `.agents/skills/finance-report-analysis-agent/SKILL.md`
- Blueprint: `docs/AGENT_BLUEPRINTS/01_ai_finance_agent.md`
- Agent maps/evaluation: `docs/AGENT_MAP.md`, `docs/AGENT_SEQUENCE.md`, `docs/AGENT_TOOL_MAP.md`, `docs/AGENT_MEMORY_MAP.md`, `docs/AGENT_EVALUATION.md`

API `/api/ai/report-analysis` sẽ cố gắng đọc `.agents/AI_FINANCE_AGENT.md`. Nếu không đọc được file hoặc thiếu `OPENAI_API_KEY`, hệ thống dùng fallback an toàn và vẫn giữ nguyên tắc: không bịa số, nếu thiếu dữ liệu trả `Chưa đủ dữ liệu để kết luận.`

QA report: `docs/QA_REPORT_V4_6_AGENT_FINAL.md`.


### AI Agent provider

V4.6.1 hỗ trợ chọn nhà cung cấp AI bằng biến môi trường:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Nếu muốn dùng OpenAI dự phòng:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Nếu thiếu dữ liệu thật hoặc thiếu API key, AI Agent phải trả `Chưa đủ dữ liệu để kết luận.` và fallback rule-based an toàn.

## V4.7 — Data Filter & Report Engine

- Bộ lọc toàn cục đã chuyển sang filter thật qua URL query.
- Các API report chính nhận cùng bộ lọc: ngày, mã tuần, chi nhánh, kênh, nguồn, trạng thái, nhóm chi phí, người nhập.
- Report engine trả `appliedFilters`, `filterActive`, `filterOptions`, `rawSourceCounts` để kiểm tra bằng chứng dữ liệu.
- Nếu filter không có dữ liệu thật, app trả “Chưa đủ dữ liệu để kết luận”, không dùng số mẫu.


## V4.7.1 — Cashbook Dashboard Visibility

- Nếu chỉ có `DL_SO_QUY`, dashboard vẫn phân tích được dòng tiền, top thu, top chi và khoản chi lớn bất thường.
- P&L/tồn kho/thất thoát vẫn giữ trạng thái thiếu dữ liệu nếu các nguồn tương ứng chưa import.
- CEO Dashboard hiển thị rõ: đã có Sổ quỹ nhưng chưa đủ nguồn để chốt toàn bộ.

## V4.8 — Import Control & Rollback

Bản này nâng cấp luồng import an toàn theo kế hoạch rà soát:

- Preview vẫn là bước bắt buộc trước khi ghi.
- Confirm ghi log kiểm soát vào đúng 3 tab:
  - `IMPORT_DONG_LOI`
  - `IMPORT_DU_LIEU_TRUNG`
  - `IMPORT_DU_LIEU_LECH`
- Import bị lỗi/lệch sẽ bị chặn nếu không bật `allowPartial=true`, nhưng vẫn ghi lịch sử và log kiểm soát để kế toán biết dòng nào cần xử lý.
- Bổ sung parser cho `DL_CONG_NO` và `DL_THU_MUA`.
- Rollback theo `Mã lần import` có 2 bước:
  1. Preview: xem số dòng và sheet bị ảnh hưởng, chưa đổi dữ liệu.
  2. Confirm: CEO/Admin duyệt, hệ thống đổi `Trạng thái dữ liệu` thành `Đã hoàn tác`, không xóa cứng.
- Thêm kiểm thử giả lập dữ liệu 7 nguồn bằng local `.data`, sau đó tự xóa fixture; không đụng Google Sheet production.

Lệnh kiểm thử giả lập:

```bash
npm run synthetic-data-qa
```

Endpoint rollback:

```http
POST /api/import/rollback
{
  "maLanImport": "IMP-...",
  "reason": "Lý do hoàn tác",
  "actor": "CEO",
  "actorRole": "CEO",
  "confirm": false
}
```

Đổi `confirm=true` chỉ khi CEO/Admin đã duyệt.