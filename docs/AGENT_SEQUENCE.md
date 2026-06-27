# AGENT_SEQUENCE — Finance App Runtime Flow

## 1. Import Flow

1. Kế toán upload file.
2. Code chạy parser và preview.
3. Code phân loại dòng mới/trùng/lệch/lỗi.
4. AI Import Validation Agent chỉ giải thích kết quả preview.
5. Kế toán confirm nếu đạt.
6. Code ghi dữ liệu vào DL_* và IMPORT_*.
7. Audit log ghi batch.

## 2. Cashbook Flow

1. Code đọc `DL_SO_QUY` theo filter.
2. Code tính tổng thu, tổng chi, dòng tiền ròng, top thu/chi, nhóm chi, chi bất thường.
3. AI Cashbook Agent giải thích rủi ro và việc cần xử lý.
4. Dashboard/Dòng tiền hiển thị kết quả.

## 3. CEO Finance Flow

1. Code đọc 7 nguồn dữ liệu chính.
2. Code tính Dashboard, P&L, dòng tiền, cân đối, thất thoát.
3. Code xác định missingSources và dataQuality.
4. AI Finance Agent phân tích tổng hợp.
5. CEO xem cảnh báo/action.

## 4. Forecast Flow

1. Code kiểm tra lịch sử tối thiểu 4 tuần.
2. Code tính baseline và 3 kịch bản.
3. AI Forecast Agent giải thích giả định/rủi ro.
4. Kế toán rà soát.
5. CEO duyệt mới ghi bản chốt.

## 5. Accountant Workbench Flow

1. Code gom missingSources, import issues, cashbook warnings, pending approvals.
2. AI Accountant Workbench Agent tạo checklist.
3. Kế toán xử lý.
4. CEO duyệt việc cần quyền cao.

## Non-Negotiable Rule

AI không tự ghi Google Sheet, không tự rollback, không tự chốt dự toán, không tự tạo số.


## V5.0 Forecast Agent

1. `/api/reports/du-toan` đọc dữ liệu lịch sử và tạo số dự toán nháp.
2. Calculation engine kiểm tra tối thiểu 4 tuần lịch sử.
3. Code tạo baseline và 3 kịch bản: Thận trọng, Cơ sở, Tăng trưởng.
4. `/api/ai/forecast-analysis` chỉ gửi JSON đã tính cho Forecast Agent để giải thích.
5. V5.0 không ghi `DU_TOAN_TUAN_TOI`; cần CEO duyệt ở phase sau.
