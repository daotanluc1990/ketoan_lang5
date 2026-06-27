# Google Sheets Contract tiếng Việt

## Trạng thái

Tài liệu này thuộc blueprint đã duyệt cho app **Cơm Tấm Làng — CEO Report Dashboard**.

## Nguyên tắc chung

- UI và Google Sheet dùng tiếng Việt.
- Import phải có kiểm tra trước khi ghi.
- Không ghi đè tự động.
- Không bịa số nếu thiếu dữ liệu.
- Dashboard phải trả lời: tốt/xấu, vì sao, cần làm gì ngay.

## Phạm vi phase hiện tại

Phase 0–4 chỉ dựng nền app, docs, layout 8 tab, schema Google Sheet tiếng Việt, local data store, audit và import core foundation. Các nghiệp vụ parser/forecast/loss/AI/bot sẽ làm ở phase sau.

## V4.4 End-to-End Contract

### Sheet source of truth

- Nguồn dữ liệu chính giai đoạn V4.4: Google Sheet Data Master.
- App chỉ append dòng mới sau khi kế toán preview và xác nhận.
- Không tự tạo sheet, không tự sửa header, không ghi đè header.
- Nếu sheet thiếu header: API báo lỗi và dừng.

### Env bắt buộc

- `DATA_STORE=google_sheets`
- `GOOGLE_SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

### API

- `GET /api/google-sheets/health`: kiểm tra service account có truy cập được spreadsheet không.
- `GET /api/reports/dashboard`: đọc dữ liệu từ Google Sheet/local store và tổng hợp KPI.
- `GET /api/reports/tong-quan`: alias cho dashboard report.

### Safety

- Write path chỉ nằm ở `POST /api/import/confirm`.
- Import phải đi qua `POST /api/import/preview` trước.
- Dòng lỗi/lệch không được ghi nếu chưa bật confirm partial rõ ràng.
