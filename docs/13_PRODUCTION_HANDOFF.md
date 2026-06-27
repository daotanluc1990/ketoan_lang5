# Production Handoff — Cơm Tấm Làng CEO Report Dashboard

## Mục tiêu

Web dùng cho cả CEO và kế toán:

- CEO xem dashboard, P&L, dòng tiền, cân đối, dự toán, thất thoát.
- Kế toán nhập/import file, đối soát, chốt báo cáo, gửi CEO/Bot.

## Luồng vận hành đề xuất

1. Kế toán vào `Bàn làm việc kế toán`.
2. Chọn kỳ báo cáo trên filter bar.
3. Upload batch nhiều file.
4. Chạy kiểm tra batch.
5. Xử lý dòng lỗi/trùng/lệch.
6. Bổ sung công nợ, dự toán, thất thoát.
7. Chốt báo cáo tuần.
8. CEO xem dashboard.
9. Bot gửi báo cáo sau khi đủ điều kiện.

## Điều kiện để lên production-live

- Có đăng nhập thật.
- Có RBAC thật cho CEO/Kế toán/Admin/Quản lý cửa hàng.
- Có Google Sheet thật và quyền truy cập an toàn.
- Parser Excel thật chạy được với file KiotViet/app/sổ quỹ/tồn kho/thất thoát.
- Import có dry-run, confirm, rollback.
- Bot Telegram gửi test thành công.
- UAT ít nhất 1 tuần với kế toán.

## Rollback

Nếu lỗi:

1. Ngưng gửi bot tự động.
2. Khóa import ghi dữ liệu.
3. Quay lại báo cáo Excel tuần trước.
4. Dùng import log để xác định batch lỗi.
5. Sửa parser/mapping, chạy lại dry-run trước khi ghi.
