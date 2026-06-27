# V7 Final Deployment Checklist

## Trạng thái nhánh

Nhánh làm việc hiện tại: `v7-3-import-parsers`.

Nhánh này gom các phần:

- V7.3 Import/parser chuyên sâu cho Data Master V7.
- V7.4 Chốt báo cáo tuần thật.
- V7.5 Tinh gọn UI/UX ở top bar và global filter bar.
- V7.6 Production hardening cơ bản.

## Việc cần làm trước khi merge main

Chạy đầy đủ local QA:

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run smoke
npm run static-ui-qa
npm run build
```

Không merge vào `main` nếu các bước trên fail.

## Vercel

Hiện Vercel có thể đang bị giới hạn quota free plan:

```text
Resource is limited - try again in 24 hours
code: api-deployments-free-per-day
```

Khi hết giới hạn, hãy redeploy commit mới nhất của PR hoặc merge vào `main` rồi deploy production.

## Environment variables khuyến nghị cho production

```env
DATA_STORE=google_sheets
APP_BASIC_AUTH_ENABLED=true
APP_RBAC_ENABLED=true
APP_DEFAULT_ROLE=Kế toán
APP_ALLOW_ROLE_OVERRIDE=false
```

Cần cấu hình thêm:

```env
GOOGLE_SHEET_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
APP_USERNAME=...
APP_PASSWORD=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Không commit file `.env` hoặc service account JSON vào GitHub.

## Test thủ công sau deploy

### 1. Auth/RBAC

- Mở production URL phải có Basic Auth nếu `APP_BASIC_AUTH_ENABLED=true`.
- Role Kế toán không được confirm chốt báo cáo.
- Role CEO/Admin được confirm chốt báo cáo.
- Không dùng query `?role=CEO` để vượt quyền trên production.

### 2. Import V7

Test preview trước, không confirm ngay:

- XNT cửa hàng.
- XNT BTT.
- BTT xuất cho cửa hàng.
- Cửa hàng nhận từ BTT.
- Hàng hủy cửa hàng.
- Hàng hủy BTT.
- Chế biến thực tế.
- Định mức món bán/NVL/công thức.

Kiểm tra preview đúng:

- Loại dữ liệu.
- Sheet đích.
- Dòng mới.
- Dòng lỗi.
- Dòng trùng/lệch.

### 3. Report engine

Mở các tab:

- Kho cửa hàng.
- Kho Bếp Trung Tâm.
- Đối chiếu BTT - Cửa hàng.
- Hàng hủy.
- Hao hụt / Vượt định mức.
- Thất thoát tồn kho.

Nếu sheet chưa có dữ liệu, màn hình phải báo `Chưa đủ dữ liệu để kết luận`, không bịa số mẫu.

### 4. Chốt báo cáo tuần

Vào tab `Lịch sử chốt báo cáo`:

- Bấm Preview chốt.
- Xem các lỗi chặn.
- Nếu đủ điều kiện, CEO/Admin bấm Xác nhận chốt.
- Kiểm tra sheet `LICH_SU_CHOT_BAO_CAO` có dòng snapshot mới.
- Kiểm tra sheet `AUDIT_LOG` có log chốt báo cáo.

## Rollback

Nếu production lỗi sau merge:

1. Vercel rollback về deployment trước.
2. Hoặc revert PR trên GitHub.
3. Không sửa tay Google Sheet production trước khi xác định nguyên nhân.
