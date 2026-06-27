# V7.7 UAT Kế toán thực chiến

Mục tiêu của UAT là cho kế toán dùng thử bằng dữ liệu thật trước khi production live. Không đánh giá bằng cảm giác giao diện; chỉ đánh giá theo số liệu có đúng, quy trình có chạy được, và lỗi có truy vết được hay không.

## Nguyên tắc UAT

1. Không import thẳng nếu chưa preview.
2. Không chốt báo cáo nếu còn thiếu nguồn dữ liệu quan trọng.
3. Không sửa tay dữ liệu trong Google Sheet khi đang test một lỗi.
4. Mỗi lỗi phải ghi lại: file nguồn, sheet đích, dòng lỗi, kết quả mong muốn, kết quả thực tế.
5. CEO chỉ xem kết luận và cảnh báo; kế toán chịu trách nhiệm đối chiếu số.

## Người tham gia

- CEO: kiểm tra dashboard, cảnh báo, chốt báo cáo, quyền truy cập.
- Kế toán: import file, đối chiếu số, ghi lỗi nghiệp vụ.
- Admin/kỹ thuật: kiểm tra deploy, env, rollback.

## Bộ dữ liệu cần chuẩn bị

Chuẩn bị tối thiểu 1 tuần dữ liệu thật gồm:

- Doanh thu cửa hàng.
- Doanh thu app.
- Sổ quỹ.
- XNT cửa hàng.
- XNT Bếp Trung Tâm.
- Phiếu BTT xuất cho cửa hàng.
- Phiếu cửa hàng nhận từ BTT.
- Hàng hủy cửa hàng.
- Hàng hủy BTT.
- Chế biến thực tế.
- Định mức món bán, NVL, công thức chế biến, hao hụt hợp lệ, đơn giá NVL.
- Công nợ nếu có.

## Kịch bản UAT 01: Import V7

### Mục tiêu

Xác nhận app nhận diện đúng file và không ghi nhầm sheet.

### Cách test

1. Vào tab Nhập liệu & Import.
2. Chọn từng file theo nhóm dữ liệu.
3. Bấm Kiểm tra batch.
4. Không bấm Import ngay.
5. Kiểm tra preview.

### Điều kiện đạt

- Loại dữ liệu đúng.
- Sheet đích đúng.
- Chi nhánh đúng hoặc báo Chưa xác định nếu không có dữ liệu chi nhánh.
- Dòng lỗi hiển thị rõ.
- Dòng trùng/lệch được cảnh báo.
- Preview không ghi vào Google Sheet.

## Kịch bản UAT 02: Report engine kho và BTT

### Mục tiêu

Xác nhận các tab vận hành đọc dữ liệu thật và không bịa số.

### Tab cần kiểm tra

- Kho cửa hàng.
- Kho Bếp Trung Tâm.
- Đối chiếu BTT - Cửa hàng.
- Hàng hủy.
- Hao hụt / Vượt định mức.
- Thất thoát tồn kho.

### Điều kiện đạt

- Nếu chưa có dữ liệu, màn hình báo Chưa đủ dữ liệu để kết luận.
- Nếu có dữ liệu, chỉ số tổng dòng, tổng giá trị, top cảnh báo phải khớp logic với Google Sheet gốc.
- Hủy hàng không được tính nhầm thành xuất BTT.
- Xuất BTT cho cửa hàng không được tính nhầm là hàng hủy.
- Hao hụt chế biến phải tách khỏi thất thoát tồn kho.

## Kịch bản UAT 03: Chốt báo cáo tuần

### Mục tiêu

Xác nhận chỉ chốt khi đủ điều kiện và có snapshot.

### Cách test

1. Vào tab Lịch sử chốt báo cáo.
2. Nhập kỳ báo cáo.
3. Bấm Preview chốt.
4. Xem các hạng mục bị chặn.
5. Nếu đủ điều kiện, dùng CEO/Admin bấm Xác nhận chốt.
6. Kiểm tra sheet LICH_SU_CHOT_BAO_CAO.
7. Kiểm tra AUDIT_LOG.

### Điều kiện đạt

- Kế toán không được confirm chốt.
- CEO/Admin được confirm chốt.
- Khi còn lỗi chặn, chốt thường phải bị từ chối.
- Sau chốt có Snapshot JSON.
- Sau chốt có Audit log.

## Kịch bản UAT 04: Auth/RBAC production

### Mục tiêu

Đảm bảo production không bị vượt quyền đơn giản.

### Điều kiện đạt

- Nếu bật Basic Auth, người không có tài khoản không vào được app.
- Production không cho đổi quyền bằng query role.
- Kế toán không được gọi API confirm chốt.
- CEO/Admin mới được gọi API confirm chốt.

## Mẫu ghi lỗi UAT

| Mã lỗi | Ngày test | Người test | Khu vực | File/sheet | Kết quả mong muốn | Kết quả thực tế | Mức độ | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| UAT-001 |  |  | Import V7 |  |  |  | Cao/Trung bình/Thấp | Mới |

## Quyết định Go/No-Go

Chỉ được go-live khi:

- Import V7 không ghi nhầm sheet.
- Report engine không bịa số.
- Chốt báo cáo có snapshot và audit log.
- Basic Auth/RBAC production hoạt động.
- Có phương án rollback rõ ràng.
