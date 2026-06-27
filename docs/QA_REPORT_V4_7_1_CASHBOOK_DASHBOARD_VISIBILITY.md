# QA Report — V4.7.1 Cashbook Dashboard Visibility

## Scope

Bản này chỉnh trên nền V4.7 Filter Engine để xử lý đúng yêu cầu: khi `DL_SO_QUY` đã có dữ liệu thật, dashboard và dòng tiền phải hiện được thu/chi, top khoản thu, top khoản chi, chi bất thường và trạng thái dữ liệu từng mảng. Không chờ đủ 7 nguồn mới hiện dữ liệu dòng tiền.

## Google Sheet verification

Google Sheet production đã được kiểm tra trực tiếp trước khi sửa:

- `DL_SO_QUY`: có 510 dòng dữ liệu import thật từ batch `IMP-1782253873378`.
- `IMPORT_LICH_SU`: có 1 batch xác nhận, 510 dòng mới, 0 trùng, 0 lệch, 0 lỗi.
- `DL_DOANH_THU_CUA_HANG`: chưa có dữ liệu thật.
- `DL_TON_KHO`: chưa có dữ liệu thật.
- `DL_THAT_THOAT_NVL`: chưa có dữ liệu thật.
- `CEO_DASHBOARD`, `P&L_TUAN`, `DONG_TIEN_TUAN`, `CAN_DOI_RUT_GON`: các sheet kết quả vẫn đang trống/không được dùng làm nguồn tính chính.

## Implemented changes

### Report engine

File chính:

- `src/lib/reports/report-aggregator.ts`

Đã thêm:

- `cashbookRevenueIn`
- `biggestCashOut`
- `cashbookTopInRows`
- `cashbookTopOutRows`
- `cashbookGroupRows`
- `cashbookDailyRows`
- `cashbookWarningRows`
- `dataReadinessRows`

Logic mới:

- Có `DL_SO_QUY` thì `Dòng tiền` được xem là có dữ liệu.
- CEO Dashboard không báo chung chung “chưa đủ dữ liệu” nữa; thay bằng thông báo: có thể phân tích dòng tiền nhưng chưa được chốt P&L/tồn kho/thất thoát.
- Khoản chi lớn được lấy từ `DL_SO_QUY`, sắp xếp theo số tiền âm lớn nhất.
- Khoản chi lớn vượt ngưỡng được đẩy lên `issueRows` để CEO nhìn thấy.
- Doanh thu trong sổ quỹ được tách riêng là “Doanh thu thu qua sổ quỹ”, chỉ dùng để đối chiếu app/cửa hàng, không tự động chốt P&L.

### UI pages

Đã sửa:

- `app/tong-quan/page.tsx`
- `app/dong-tien/page.tsx`

CEO Dashboard thêm:

- Độ sẵn sàng dữ liệu theo mảng.
- Cảnh báo Sổ quỹ — khoản chi lớn.
- Doanh thu đã thu qua sổ quỹ để đối chiếu.

Dòng tiền tuần thêm:

- Doanh thu đã thu.
- Top khoản chi lớn.
- Top khoản thu.
- Thu/chi theo nhóm.
- Thu/chi theo ngày.

### API

Đã sửa:

- `app/api/reports/dong-tien/route.ts`

API giờ trả thêm:

- `topInRows`
- `topOutRows`
- `groupRows`
- `dailyRows`
- `warningRows`
- `dataReadinessRows`

### AI rule-based fallback

Đã sửa:

- `src/lib/ai/agent.ts`

Nếu chưa có Gemini/OpenAI key nhưng có `cashbookWarningRows`, rule-based AI vẫn cảnh báo khoản chi lớn từ Sổ quỹ.

### Tests

Đã thêm:

- `src/lib/reports/__tests__/cashbook-insights.test.ts`

Test xác nhận: chỉ cần có Sổ quỹ thì report vẫn có `hasRealData=true`, có tiền vào/ra, có doanh thu thu qua sổ quỹ, có top chi và có cảnh báo chi lớn.

## QA commands

Đã chạy:

```bash
npm run typecheck
npm run lint
npm run test
npm run agent-check
npm run static-ui-qa
npm run kiem-tra-schema
npm run smoke
NEXT_TELEMETRY_DISABLED=1 npm run vercel-build
```

## QA result

| Check | Result |
|---|---|
| TypeScript | PASS |
| ESLint | PASS |
| Unit tests | PASS — 6 files, 13 tests |
| Agent structure | PASS |
| Static UI QA | PASS |
| Google Sheet schema | PASS — 21 sheets |
| Smoke test | PASS |
| Vercel build | PASS — exit 0 |

## Known warning

Next/Turbopack vẫn có warning NFT do AI runtime đọc file `.agents/AI_FINANCE_AGENT.md` bằng filesystem. Warning này không làm fail build. Giữ nguyên vì yêu cầu của owner là Agent phải là file markdown riêng.

## Expected production behavior

Nếu production chỉ có `DL_SO_QUY`:

- `/tong-quan`: hiện dữ liệu dòng tiền, doanh thu đã thu qua sổ quỹ, top vấn đề chi lớn và cảnh báo thiếu nguồn khác.
- `/dong-tien`: hiện tổng tiền vào, tiền ra, dòng tiền tạm, top thu/chi, thu/chi theo nhóm và theo ngày.
- `/pl-tuan`: chưa được chốt lợi nhuận đầy đủ vì thiếu doanh thu app/cửa hàng, giá vốn, tồn kho, thất thoát.
- `/that-thoat-chi-tiet`: vẫn báo thiếu dữ liệu nếu `DL_THAT_THOAT_NVL` trống.

## Deployment status

Đạt để redeploy Vercel Preview/Staging. Chưa gọi production-live cho đến khi owner smoke-test các API trên Vercel.
