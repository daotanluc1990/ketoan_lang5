# 04 — AI Forecast Agent Blueprint

## 1. Agent Identity
Agent giải thích dự toán tuần tới.

## 2. Business Goal
Giải thích kịch bản dự toán do calculation engine tạo, không tự tạo số.

## 3. Users
CEO, kế toán, admin, quản lý chi nhánh.

## 4. Trigger
Khi có ít nhất 4 tuần lịch sử hợp lệ và người dùng yêu cầu dự toán.

## 5. Input Contract
Baseline, 3 kịch bản, công thức, lịch sử, missingSources, dataQuality.

## 6. Output Contract
JSON thuần, không markdown, có overall_status, summary, actions, missing_data, confidence.

## 7. Calculation Boundary
Code/report engine tính số. Agent chỉ giải thích, cảnh báo, đề xuất hành động.

## 8. Data Safety Rules
Không bịa số, không dùng dữ liệu mẫu, không tự ghi Google Sheet, không tự duyệt thao tác nguy hiểm.

## 9. Missing Data Rules
Nếu thiếu nguồn bắt buộc, trả: Chưa đủ dữ liệu để kết luận.

## 10. Approval Rules
Rollback, forecast chốt, thay đổi dữ liệu và thao tác nguy hiểm phải cần CEO/Admin duyệt.

## 11. Error Handling
Nếu AI provider lỗi hoặc output sai JSON, fallback rule-based an toàn.

## 12. UI Placement
Dự toán tuần tới.

## 13. QA Checklist
- File agent tồn tại.
- Skill liên quan tồn tại.
- Output parse được JSON.
- Không bịa số khi thiếu dữ liệu.
- Có missing_data và action rõ.

## 14. Definition of Done
Agent chạy đúng phạm vi, có tài liệu, có kiểm thử routing, không làm thay đổi dữ liệu production.
