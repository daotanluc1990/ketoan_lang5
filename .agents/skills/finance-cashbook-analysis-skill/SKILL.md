---
name: finance_cashbook_analysis
description: Phân tích Sổ quỹ, dòng tiền, top thu/chi và chi bất thường.
version: 1.0.0
owner: Com Tam Lang Finance App
---

# Finance Cashbook Analysis Skill

## Purpose
Phân tích `DL_SO_QUY` thành dòng tiền, cảnh báo chi lớn và việc cần kế toán kiểm tra.

## When to Use
Khi có dữ liệu Sổ quỹ hoặc CEO hỏi về tiền vào/tiền ra/khoản chi lớn.

## Inputs
- Dữ liệu JSON đã được code/report engine tổng hợp.
- Bộ lọc kỳ/chi nhánh/kênh/trạng thái.
- Bằng chứng từ Google Sheet, API hoặc import preview.

## Procedure
1. Xác định nguồn dữ liệu liên quan.
2. Kiểm tra dữ liệu thật hay thiếu dữ liệu.
3. Không tính toán lại nếu code đã có kết quả.
4. Phân tích theo đúng phạm vi skill.
5. Trả output theo JSON/schema đã quy định.
6. Ghi rõ missing data và data quality notes.

## Mandatory Rules
- Không bịa số.
- Không dùng dữ liệu mẫu làm dữ liệu thật.
- Không kết luận gian lận nếu chưa có bằng chứng.
- Nếu thiếu dữ liệu, ghi đúng: Chưa đủ dữ liệu để kết luận.
- Mọi hành động nguy hiểm phải cần CEO/Admin duyệt.

## Output Format
Trả JSON thuần, không markdown. Tối thiểu có:

```json
{
  "overall_status": "tot|canh_bao|nguy_hiem|chua_du_du_lieu",
  "summary": "...",
  "actions": [],
  "missing_data": [],
  "confidence": 0.0
}
```

## Quality Criteria
- Rõ dữ liệu nguồn.
- Rõ kỳ và chi nhánh.
- Rõ việc cần làm.
- Có owner/deadline nếu phát sinh action.
- Không lan man ngoài phạm vi.

## Verification
- So khớp số dòng và tổng tiền với report engine.
- Kiểm tra dữ liệu thiếu không bị mặc định thành 0.
- Kiểm tra output parse được JSON.

## Edge Cases
- Sheet trống.
- Chỉ có Sổ quỹ nhưng thiếu nguồn còn lại.
- Batch import thành công một phần.
- Có dòng trùng/lệch/lỗi.
- AI provider lỗi và phải fallback rule-based.

## Examples
Input: dữ liệu thiếu tồn kho/thất thoát. Output: nêu rõ thiếu nguồn, không kết luận P&L đầy đủ.

## Definition of Done
- Đúng phạm vi skill.
- Không bịa số.
- Có missing_data rõ ràng.
- Có action khả thi.

## Changelog
- 1.0.0: Tạo mới cho V4.8.1 Agent/Skill Map.
