# QA_REPORT_V5_0_FORECAST_AGENT

## Tình hình chung

Đạt để redeploy Preview/Staging.

V5.0 triển khai Forecast Agent theo nguyên tắc: **code tính số dự toán, AI/Gemini chỉ giải thích giả định, rủi ro và hành động**. Bản này không ghi dữ liệu vào `DU_TOAN_TUAN_TOI` và không chạm Google Sheet production khi QA.

## Phạm vi đã triển khai

- Thêm calculation engine: `src/lib/forecast/forecast-engine.ts`.
- Thêm unit test: `src/lib/forecast/__tests__/forecast-engine.test.ts`.
- Thêm API số học/read-only: `/api/reports/du-toan`.
- Thêm API Forecast Agent: `/api/ai/forecast-analysis`.
- Cập nhật trang `/du-toan` để hiển thị:
  - 3 kịch bản: Thận trọng, Cơ sở, Tăng trưởng.
  - Bằng chứng lịch sử.
  - Điều kiện dữ liệu.
  - Công thức tính.
  - Việc cần làm trước khi chốt.
- Cập nhật `.agents/AI_FORECAST_AGENT.md`.
- Cập nhật `.agents/skills/forecast-budget-skill/SKILL.md` lên version 1.1.0.
- Cập nhật agent map: Forecast Agent = Active, primary API = `/api/ai/forecast-analysis`.
- Cập nhật docs Agent Map/Sequence/Tool Map/Evaluation.

## Quy tắc dự toán

- Tối thiểu 4 tuần lịch sử hợp lệ.
- Nếu thiếu lịch sử: trả đúng `Chưa đủ dữ liệu để lập dự toán`.
- Baseline dùng trung bình động có trọng số 4 tuần gần nhất: 10% / 20% / 30% / 40%, có điều chỉnh 25% xu hướng gần nhất.
- Kịch bản thận trọng = doanh thu baseline × 92%, chi baseline × 105%.
- Kịch bản cơ sở = doanh thu baseline, chi baseline.
- Kịch bản tăng trưởng = doanh thu baseline × 107%, chi baseline × 103%.
- Nếu chỉ có Sổ quỹ, doanh thu dùng proxy từ `Nhóm thu/chi = Doanh thu` và phải báo `Cần đối chiếu`.
- Không ghi `DU_TOAN_TUAN_TOI` trong V5.0.

## QA đã chạy

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 10 files, 26 tests |
| `npm run synthetic-data-qa` | PASS |
| `npm run agent-check` | PASS |
| `npm run static-ui-qa` | PASS |
| `npm run kiem-tra-schema` | PASS — 21 sheets |
| `npm run smoke` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 npm run vercel-build` | PASS |

## Build note

Build còn warning Turbopack/NFT do app đọc file `.agents/AI_FINANCE_AGENT.md` bằng filesystem. Warning này có từ các bản trước và không làm fail build.

## Cách kiểm tra sau deploy

- `/api/reports/du-toan?role=CEO`
- `/api/ai/forecast-analysis?role=CEO`
- `/du-toan`

Kết quả đúng:

- Nếu lịch sử dưới 4 tuần: không dự toán, báo thiếu dữ liệu.
- Nếu đủ lịch sử: trả đủ baseline và 3 kịch bản.
- Nếu dùng proxy từ Sổ quỹ: báo cần đối chiếu.
- API không ghi Google Sheet.

## Rủi ro còn lại

- Chưa có màn hình CEO duyệt để ghi bản chốt vào `DU_TOAN_TUAN_TOI`.
- Chưa tính sai số dự toán sau khi có số thực tế tuần sau.
- Nếu chỉ import Sổ quỹ mà chưa import doanh thu app/cửa hàng, forecast vẫn có thể có proxy nhưng không được xem là dự toán chốt.

## Khuyến nghị bản tiếp theo

V5.1 — Forecast Approval & Actual Error Tracking:

- CEO duyệt/từ chối kịch bản.
- Ghi bản chốt vào `DU_TOAN_TUAN_TOI` sau duyệt.
- Sau tuần thực tế, ghi sai số dự toán để cải thiện độ tin cậy.
