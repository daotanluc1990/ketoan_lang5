# Báo cáo kiểm tra Production Readiness — 24/06/2026

## Tình hình chung

Trạng thái hiện tại: **Cảnh báo — đủ điều kiện build/test local, chưa nên deploy production công khai**.

App đã qua các kiểm tra kỹ thuật chính sau khi sửa lỗi build Next.js:

- Unit test: pass.
- Typecheck: pass.
- Lint: pass.
- Build production: pass bằng `next build --webpack`.
- Static UI QA: pass.
- Synthetic data QA: pass, chỉ dùng dữ liệu giả lập local, không chạm Google Sheet production.
- Schema Google Sheet: pass, đủ 21 sheet tiếng Việt theo blueprint.
- Agent structure check: pass.
- Local production smoke test: pass các trang/API chính trả HTTP 200.

## Các lỗi đã sửa trong đợt kiểm tra này

1. Sửa lỗi `searchParams` không tương thích Next.js 16 ở các trang server component.
2. Đổi build script sang webpack để tránh Turbopack lỗi đường dẫn dài trên Windows/Next 16.
3. Bổ sung `.gitignore` cho `*.tsbuildinfo` để tránh commit file cache TypeScript.

## Kết quả test đã chạy

| Hạng mục | Kết quả | Ghi chú |
|---|---:|---|
| `npm run test` | Pass | 10 test files, 28 tests |
| `npm run typecheck` | Pass | Sau khi sửa `searchParams` |
| `npm run lint` | Pass | Không warning |
| `npm run build` | Pass | Dùng `next build --webpack` |
| `npm run smoke` | Pass | Schema + import hash foundation |
| `npm run static-ui-qa` | Pass | 9 tab UI, batch upload, sidebar, KPI |
| `npm run synthetic-data-qa` | Pass | Seed 7 source sheets local rồi dọn fixtures |
| `npm run kiem-tra-schema` | Pass | 21 sheet tiếng Việt |
| `npm run agent-check` | Pass | Agent runtime, skill, blueprint, map, API linkage |
| Local production smoke | Pass | `/`, `/ban-lam-viec-ke-toan`, `/import-nhap-lieu`, `/kiem-soat-du-lieu`, `/api/health`, `/api/reports/import-status`, `/api/reports/filter-options`, `/api/ai/agents` đều HTTP 200 |

## Luồng dữ liệu/import đã giả lập

Đã dùng synthetic data QA để kiểm tra luồng vận hành không chạm dữ liệu thật:

1. Seed dữ liệu giả lập vào local `.data`.
2. Kiểm tra dashboard/report tabs đọc được dữ liệu.
3. Kiểm tra import hash/dedupe foundation.
4. Dọn lại fixtures sau test.

Lỗi import file cũ trước đó đã có test chống tái phát:

- Cùng dữ liệu nghiệp vụ nhưng metadata import khác vẫn được tính là **Dữ liệu trùng**.
- Nếu dữ liệu nghiệp vụ thật sự thay đổi vẫn báo **Dữ liệu lệch**.

## Luồng agent đã kiểm tra

Agent structure check pass:

- Runtime agent file tồn tại.
- Skill/blueprint/map/API linkage tồn tại.
- `/api/ai/agents?intent=kiem-tra-du-lieu` trả HTTP 200 ở production local smoke.

Lưu ý: nếu AI provider thật lỗi hoặc thiếu key, app có rule-based fallback. Không được coi fallback là AI phân tích đầy đủ.

## Blocker trước production công khai

### P0 — Git root đang sai/nested

Repo Git bên ngoài đang thấy nhiều file cũ bị xóa và toàn bộ app thật nằm trong thư mục con chưa được track đúng. Nếu deploy/push trong trạng thái này có nguy cơ Vercel lấy sai root hoặc GitHub nhận sai cấu trúc.

Việc cần làm:

- Chốt lại root deploy: hoặc đưa app thật về root repo, hoặc cấu hình Vercel Root Directory trỏ đúng thư mục con.
- Chỉ commit path-scoped các file cần thiết sau khi secret scan.

### P1 — RBAC/Auth hiện là chế độ UAT mềm

Code hiện cho phép lấy role từ header/query/cookie và `/api/auth/check` có thể set role cookie khi Basic Auth tắt. Cách này phù hợp test nội bộ, chưa phù hợp production công khai.

Việc cần làm:

- Nếu chỉ deploy private sau lớp Vercel Protection: có thể UAT tiếp, nhưng phải giữ protection bật.
- Nếu mở cho nhân sự thật: cần auth thật hoặc Basic Auth bật + bỏ khả năng tự chọn role từ query/header.

### P1 — Import confirm vẫn tin preview client gửi lên

`POST /api/import/confirm` nhận preview từ client rồi ghi dữ liệu. UI đã có nút confirm, preview/dry-run, log lỗi; nhưng server chưa có preview token/signature để chứng minh preview đó thật sự do server vừa tạo.

Việc cần làm:

- Thêm server-side preview signature hoặc lưu preview session trước khi confirm.
- Confirm phải từ chối preview giả/sửa tay.

### P2 — Dung lượng ổ C local rất thấp

Build local có lúc bị `ENOSPC` vì ổ C gần hết dung lượng. Sau khi dọn `.next` vẫn chỉ còn vài trăm MB.

Việc cần làm:

- Dọn cache/node_modules cũ hoặc chuyển project sang đường dẫn ngắn hơn.
- Trên Vercel thường không gặp đúng lỗi ổ C này, nhưng local developer máy anh sẽ dễ build chập chờn.

### P2 — Chưa có lockfile

Không thấy `package-lock.json`. Deploy vẫn có thể chạy `npm install`, nhưng thiếu lockfile làm dependency khó tái lập 100%.

Việc cần làm:

- Tạo lockfile trước khi release chính thức nếu còn đủ dung lượng và network ổn.

## Đề xuất deploy

### Có thể deploy không?

- **Staging/private UAT:** Có thể, nếu Vercel Protection vẫn bật và Root Directory đúng.
- **Production công khai:** Chưa nên.

### Thứ tự an toàn

1. Sửa/cấu hình lại Git root hoặc Vercel Root Directory.
2. Commit các file đã sửa bằng path-scoped commit, không dùng `git add .`.
3. Secret scan lại.
4. Deploy preview/staging.
5. Smoke test trên Vercel:
   - `/api/health`
   - `/api/google-sheets/health`
   - `/api/reports/import-status`
   - `/ban-lam-viec-ke-toan`
   - `/import-nhap-lieu`
   - `/api/ai/agents?intent=kiem-tra-du-lieu`
6. UAT import bằng file thật:
   - File cũ phải báo trùng.
   - File có dòng lệch phải không cho import.
   - File đạt mới được ghi.
7. Sau UAT mới quyết định mở production.

## Rollback

Nếu deploy lỗi:

1. Rollback về deployment Vercel trước đó.
2. Không rollback Google Sheet bằng tay nếu chưa xác định import ID.
3. Nếu import ghi sai, dùng luồng rollback theo `Mã lần import`.
4. Kiểm tra lại `IMPORT_LICH_SU`, `IMPORT_DONG_LOI`, `IMPORT_DONG_TRUNG`, `IMPORT_DONG_LECH`.

## Production readiness score

| Nhóm | Điểm |
|---|---:|
| Product fit | 13/15 |
| UI/UX | 12/15 |
| Architecture | 11/15 |
| Security/RBAC | 6/15 |
| Testing | 14/15 |
| Deploy/UAT | 5/10 |
| Monitoring/Rollback | 6/10 |
| Documentation | 5/5 |
| **Tổng** | **72/100** |

Kết luận: **Local/GitHub-ready sau khi sửa Git root; chưa production-ready công khai vì còn blocker quyền và import confirm.**
