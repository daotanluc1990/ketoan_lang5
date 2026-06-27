# QA Report — V4.9 RBAC & Permission

## Tình hình chung

Đạt để redeploy Vercel Preview/Staging.

V4.9 bổ sung kiểm soát quyền theo vai trò cho app Kế toán Làng. Trọng tâm là bảo vệ API ghi dữ liệu, API rollback, API bot và các báo cáo tài chính nhạy cảm. Không ghi Google Sheet trong quá trình QA.

## Phạm vi đã làm

- Thêm RBAC server-side tại `src/lib/rbac/rbac.ts`.
- Thêm permission matrix theo vai trò: CEO, Kế toán, Admin, Quản lý cửa hàng.
- Thêm no-permission UI component.
- Thêm cookie role `ctl_role` khi đổi vai trò ở TopBar để hỗ trợ UAT quyền.
- Sidebar ẩn menu không phù hợp với vai trò hiện tại.
- Bảo vệ API report, import, rollback, conflicts, AI agent, Telegram/Zalo test.
- Mask P&L/cân đối/tổng số tài chính nhạy cảm với vai trò không đủ quyền.
- Thêm ENV `APP_RBAC_ENABLED` và `APP_DEFAULT_ROLE`.
- Cập nhật `api/health` hiển thị trạng thái RBAC.
- Tạo `.env.example` không chứa secret.

## Vai trò và quyền chính

| Vai trò | Quyền chính | Giới hạn |
|---|---|---|
| CEO | Xem toàn bộ, duyệt rollback, gửi bot | Không sửa số liệu nguồn ngoài quy trình audit |
| Kế toán | Import, đối soát, xem P&L, dòng tiền, thất thoát | Không confirm rollback, không gửi bot production |
| Admin | Cấu hình hệ thống, quyền, rollback kỹ thuật | Không tự ý thay số liệu đã chốt |
| Quản lý cửa hàng | Xem dashboard vận hành, dòng tiền, thất thoát, workbench | Không xem P&L/cân đối, không import/rollback |

## API được bảo vệ

- `/api/import/preview` → CEO/Kế toán/Admin.
- `/api/import/confirm` → CEO/Kế toán/Admin.
- `/api/import/rollback` preview → CEO/Kế toán/Admin.
- `/api/import/rollback` confirm → CEO/Admin.
- `/api/reports/pl-tuan` → CEO/Kế toán/Admin.
- `/api/reports/can-doi` → CEO/Kế toán/Admin.
- `/api/telegram/send-test` POST → CEO/Admin.
- `/api/ai/agents` và `/api/ai/report-analysis` → CEO/Kế toán/Admin.
- `/api/conflicts` và `/api/conflicts/resolve` → CEO/Kế toán/Admin.

## Cách truyền role khi test API

Có 3 cách:

```text
x-ctl-role: CEO
```

hoặc:

```text
?role=CEO
```

hoặc cookie:

```text
ctl_role=CEO
```

## ENV mới

```env
APP_RBAC_ENABLED=false
APP_DEFAULT_ROLE=Kế toán
```

Khuyến nghị UAT:

```env
APP_RBAC_ENABLED=false
APP_DEFAULT_ROLE=Kế toán
```

Khi đã test quyền xong mới bật chặt:

```env
APP_RBAC_ENABLED=true
APP_DEFAULT_ROLE=
```

Khi bật chặt, request không có role hợp lệ sẽ bị từ chối.

## QA commands

| Lệnh | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS — 9 files, 23 tests |
| `npm run agent-check` | PASS |
| `npm run static-ui-qa` | PASS |
| `npm run kiem-tra-schema` | PASS — 21 sheets |
| `npm run smoke` | PASS |
| `npm run synthetic-data-qa` | PASS |
| `NEXT_TELEMETRY_DISABLED=1 npm run vercel-build` | PASS |

## Warning còn lại

Turbopack/NFT vẫn warning do app đọc `.agents/AI_FINANCE_AGENT.md` bằng filesystem trong runtime AI Agent. Warning này có từ các bản trước và không làm fail build.

## Chưa làm

- Chưa tích hợp đăng nhập người dùng thật/SSO.
- Chưa có mapping chi nhánh theo từng quản lý cửa hàng.
- RBAC đang dựa vào cookie/header/query role để UAT; khi production thật cần kết nối auth provider hoặc cơ chế đăng nhập nội bộ.
- Chưa làm audit cho thao tác đổi quyền người dùng thật vì chưa có module user management.

## Điều kiện deploy

Được deploy Preview/Staging để UAT quyền.

Chưa nên bật `APP_RBAC_ENABLED=true` trên production nếu chưa test đủ role thực tế và chưa xác định cách cấp role cho người dùng.
