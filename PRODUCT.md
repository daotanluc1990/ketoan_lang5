# PRODUCT.md — ERP Mini Cơm Tấm Làng

## Product
ERP mini kế toán quản trị cho chuỗi F&B Cơm Tấm Làng. App web nội bộ giúp CEO và kế toán kiểm soát tiền, hàng, thất thoát, báo cáo tuần.

## Register
product (design serves the product — dashboard/tool, not brand identity)

## Users
- CEO: xem tổng quan, duyệt, cảnh báo
- Kế toán: nhập liệu, đối soát, chốt báo cáo
- Admin: cấu hình, phân quyền
- Quản lý cửa hàng: xem vận hành kho

## Core surfaces
1. Trang chủ dashboard điều hành (KPI, cảnh báo, việc cần làm)
2. Doanh thu (Tiền mặt / CK / App)
3. Kho cửa hàng + Kho BTT
4. Tài chính (Tổng quan / Dòng tiền / Cân đối / Dự toán)
5. Lương & Nhân sự (mock V1)
6. Báo cáo quản trị (Ngày / Tuần / Tháng)
7. Tài liệu (Quy trình / Tình huống / Biểu mẫu)
8. AI RAG Assistant (Trợ lý hướng dẫn nội bộ)

## Tech stack
- Next.js 16 App Router + TypeScript + Tailwind CSS 3.4
- Google Sheets data store (22 tabs)
- Gemini AI (RAG prompt-based)
- Vercel deployment

## Design system
- Colors: lang-red (#C90013), lang-ink (#111827), lang-muted (#6B7280), lang-line (#E5E7EB)
- Density: compact (13px base font, 8px radius)
- Icons: lucide-react
- Pattern: V7ReportEnginePage (KPI + table + readiness + issues)
