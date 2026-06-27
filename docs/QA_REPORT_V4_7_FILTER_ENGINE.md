# QA Report — V4.7 Data Filter & Report Engine

## Scope

Triển khai phiên bản đầu tiên theo kế hoạch rà soát toàn bộ: chuẩn hóa bộ lọc thật và đưa bộ lọc vào API/report engine.

## Files changed

- `src/lib/reports/report-filters.ts` — contract bộ lọc dùng chung, parse URL/query, lọc dòng theo ngày/kỳ/chi nhánh/kênh/nguồn/trạng thái/người nhập.
- `src/lib/reports/report-aggregator.ts` — nhận bộ lọc, tính KPI từ dòng đã lọc, trả `appliedFilters`, `filterOptions`, `filterActive`, `rawSourceCounts`.
- `src/components/layout/GlobalFilterBar.tsx` — bộ lọc thật có form GET, lưu filter vào URL, lấy option từ `/api/reports/filter-options`.
- `app/api/reports/*` — nhận query string và áp dụng cùng bộ lọc cho Dashboard/P&L/Dòng tiền/Cân đối/Thất thoát/Doanh thu.
- `app/api/reports/filter-options/route.ts` — endpoint trả lựa chọn filter từ dữ liệu thật.
- `app/api/ai/report-analysis/route.ts`, `src/lib/ai/agent.ts` — AI nhận cùng filter với báo cáo.
- Các page báo cáo chính — đọc `searchParams` và gọi report engine theo filter hiện tại.
- `src/lib/reports/__tests__/report-filters.test.ts` — test filter/date/options.

## Commands run

| Command | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript OK |
| `npm run lint` | PASS | ESLint OK |
| `npm run test` | PASS | 5 files, 12 tests |
| `npm run agent-check` | PASS | Agent/skill/map structure OK |
| `npm run static-ui-qa` | PASS | 9 tabs + compact filter OK |
| `npm run kiem-tra-schema` | PASS | 21 sheets defined |
| `npm run smoke` | PASS | schema + import hash foundation OK |
| `NEXT_TELEMETRY_DISABLED=1 npm run vercel-build` | PASS | Next build exit 0 |

## Build warning

Turbopack/NFT vẫn cảnh báo do runtime đọc `.agents/AI_FINANCE_AGENT.md` bằng filesystem. Warning này không làm fail build và được giữ lại vì app cần đọc agent markdown riêng.

## Verification

- Bộ lọc không còn chỉ là giao diện tĩnh.
- Query URL như `?branch=Làng%20NVT&weekCode=2026-W23&source=Sổ%20quỹ` được API và page cùng hiểu.
- Nếu filter hiện tại không có dòng dữ liệu, hệ thống trả `Chưa đủ dữ liệu để kết luận`, không hiển thị số mẫu.
- API trả thêm bằng chứng filter: `appliedFilters`, `filterActive`, `filterOptions`, `rawSourceCounts`.
- AI report dùng cùng bộ lọc khi gọi `/api/ai/report-analysis?...`.

## Not included in V4.7

- Chưa làm parser công nợ/thu mua.
- Chưa làm rollback dữ liệu thật theo mã import.
- Chưa làm RBAC đầy đủ cho từng API.
- Chưa làm Agent Dự toán theo chuỗi thời gian.
- Chưa ghi kết quả báo cáo vào các sheet báo cáo; V4.7 chỉ đọc/tính từ dữ liệu nguồn.

## Status

Staging-ready candidate. Deploy Vercel Preview/Staging trước, sau đó smoke test URL/filter với Google Sheet thật.
