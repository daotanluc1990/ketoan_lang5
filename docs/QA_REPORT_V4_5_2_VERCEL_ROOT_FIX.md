# QA_REPORT_V4_5_2_VERCEL_ROOT_FIX

## Mục tiêu

Sửa lỗi Vercel build:

```text
Couldn't find any `pages` or `app` directory
```

## Thay đổi

- Chuyển `src/app` ra `app` ở project root để Vercel/Next chắc chắn nhận diện App Router.
- Thêm script `vercel-build` trong `package.json`.
- Thêm `vercel.json` với build command `npm run vercel-build`.
- Cập nhật `scripts/static-ui-qa.mjs` để kiểm tra `app/...` thay vì `src/app/...`.
- Giữ nguyên `src/components`, `src/lib`, `src/hooks`, `src/styles`.
- Không đóng gói `.env`, `.next`, `node_modules`, `package-lock.json`, `tsconfig.tsbuildinfo`.

## Lưu ý deploy

Khi đưa lên GitHub/Vercel, project root phải thấy trực tiếp:

```text
app/
src/
package.json
vercel.json
next.config.ts
```

Không để code nằm lồng trong một thư mục con.
