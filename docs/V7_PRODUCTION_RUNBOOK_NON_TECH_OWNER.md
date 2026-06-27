# V8.0 Production Runbook cho chủ không rành kỹ thuật

Tài liệu này dùng khi chuẩn bị đưa app vào dùng thật cho kế toán báo cáo tuần.

## 1. Trước khi bấm merge

Không merge nếu chưa có ít nhất một trong hai điều kiện:

- Vercel preview chạy lại được và không báo lỗi.
- Hoặc máy dev đã chạy đủ bộ lệnh QA và pass.

Bộ lệnh QA:

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run smoke
npm run static-ui-qa
npm run build
```

## 2. Cấu hình Vercel production

Vercel project mới cần kiểm tra: `https://vercel.com/com-tam-lang/ketoan-lang2`.

Vào Vercel project `ketoan-lang2`, kiểm tra Environment Variables.

Bắt buộc cho dữ liệu thật:

- DATA_STORE = google_sheets
- GOOGLE_SHEET_ID
- GOOGLE_CLIENT_EMAIL
- GOOGLE_PRIVATE_KEY

Bảo vệ app:

- APP_BASIC_AUTH_ENABLED = true
- APP_USERNAME
- APP_PASSWORD
- APP_RBAC_ENABLED = true
- APP_DEFAULT_ROLE = Kế toán
- APP_ALLOW_ROLE_OVERRIDE = false

Bot nếu dùng:

- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID

Không đưa service account JSON lên GitHub.

## 3. Sau khi merge main

Làm theo thứ tự:

1. Vào GitHub PR.
2. Merge bằng squash merge.
3. Vào Vercel project mới.
4. Chờ deployment production chạy xong.
5. Nếu deployment lỗi, không test tiếp; đọc lỗi trước.
6. Nếu deployment ready, mở app production.

## 4. Test production nhanh trong 15 phút

### Kiểm tra đăng nhập

- Mở app bằng trình duyệt ẩn danh.
- App phải hỏi Basic Auth nếu đã bật.
- Nhập user/password đã cấu hình.

### Kiểm tra quyền

- Vào tab Lịch sử chốt báo cáo.
- Thử bằng vai trò Kế toán.
- Kế toán không được xác nhận chốt.
- Đổi sang CEO/Admin theo cách hợp lệ rồi test lại.

### Kiểm tra dữ liệu

Mở các tab:

- Tổng quan kế toán.
- Nhập liệu & Import.
- Kho cửa hàng.
- Kho Bếp Trung Tâm.
- Đối chiếu BTT - Cửa hàng.
- Hàng hủy.
- Hao hụt / Vượt định mức.
- Thất thoát tồn kho.
- Lịch sử chốt báo cáo.

Yêu cầu: không trang nào trắng, không crash, không bịa số mẫu.

## 5. Quy trình dùng hằng tuần

1. Kế toán gom file nguồn.
2. Kế toán vào Nhập liệu & Import.
3. Bấm Kiểm tra batch.
4. Sửa lỗi nếu preview báo lỗi.
5. Import file đạt.
6. Mở các tab đối chiếu.
7. Xử lý cảnh báo.
8. Vào Lịch sử chốt báo cáo.
9. Preview chốt.
10. CEO/Admin xác nhận chốt khi đủ điều kiện.
11. Kiểm tra snapshot và audit log.

## 6. Khi có lỗi production

Không sửa tay dữ liệu trước khi ghi nhận lỗi.

Ghi lại:

- Trang bị lỗi.
- Thời điểm lỗi.
- File đang import nếu có.
- Ảnh màn hình.
- Kết quả mong muốn.
- Kết quả thực tế.

Sau đó chọn một trong hai phương án:

- Rollback Vercel về deployment trước.
- Revert PR trên GitHub nếu lỗi do code.

## 7. Khi nào được gọi là live

App được xem là live khi:

- Kế toán import được ít nhất 1 tuần dữ liệu thật.
- Các báo cáo kho/BTT/hủy/hao hụt/thất thoát đọc đúng dữ liệu.
- Có chốt báo cáo tuần thành công.
- CEO xem được dashboard và cảnh báo.
- Có rollback rõ ràng.
