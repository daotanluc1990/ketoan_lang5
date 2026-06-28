# Migration Sheet V7 — Dọn Google Sheets 40 → 19

**Trạng thái:** Hướng dẫn thực hiện (KHÔNG tự động xóa)
**Người thực hiện:** Kế toán + Developer
**Rủi ro:** Mất dữ liệu nếu xóa sheet trước khi migrate

---

## 📊 BẢNG MIGRATION

### 🟢 GIỮ NGUYÊN (15 sheet — Data Master + Import)

| # | Sheet | Vai trò |
|---|-------|---------|
| 1 | DM_CHI_NHANH | Danh mục chi nhánh |
| 2 | DM_KHO_CHI_NHANH | Danh mục kho |
| 3 | DM_MON_BAN | Danh mục món bán |
| 4 | DM_NGUYEN_VAT_LIEU | Danh mục NVL |
| 5 | DM_CONG_THUC_CHE_BIEN | Công thức chế biến |
| 6 | DM_HAO_HUT_HOP_LE | Hao hụt hợp lệ |
| 7 | DM_DON_GIA_NVL | Đơn giá NVL |
| 8 | DL_DOANH_THU_CUA_HANG | Doanh thu cửa hàng |
| 9 | DL_DOANH_THU_APP | Doanh thu app |
| 10 | DL_SO_QUY | Sổ quỹ |
| 11 | DL_XNT_CUA_HANG | XNT cửa hàng |
| 12 | DL_XNT_BEP_TRUNG_TAM | XNT BTT |
| 13 | DL_XUAT_BTT_CHO_CUA_HANG | Xuất BTT cho CH |
| 14 | DL_HUY_HANG_CUA_HANG | Hủy cửa hàng |
| 15 | DL_CONG_NO | Công nợ |

### 🟡 GỘP (10 sheet → 4)

| Gộp thành | Từ sheet | Cách |
|-----------|----------|------|
| **DL_CUA_HANG_NHAN_TU_BTT** (giữ) | DL_XUAT_BTT + DL_CUA_HANG_NHAN | Đối chiếu bằng `Mã phiếu`, thêm cột `Loại dòng` (xuat/nhan) |
| **DL_HUY_HANG_BTT** (giữ) | DL_HUY_HANG_CUA_HANG + DL_HUY_HANG_BTT | Thêm cột `Kho` (CH/BTT) để phân biệt |
| **DL_CHE_BIEN_THUC_TE** (giữ) | DL_CHE_BIEN_THUC_TE + KQ_HAO_HUT_CHE_BIEN | KQ là output tính từ input, có thể regenerate |
| **IMPORT_LICH_SU** (giữ) | IMPORT_LICH_SU + IMPORT_DONG_LOI + IMPORT_DU_LIEU_TRUNG + IMPORT_DU_LIEU_LECH + AUDIT_LOG | Thêm cột `Loại sự kiện` |

### 🔴 BỎ (15 sheet)

| Sheet bỏ | Lý do | Hành động trước khi bỏ |
|----------|-------|------------------------|
| **DL_TON_KHO** | Legacy V4, đã thay bằng DL_XNT_CUA_HANG | Backup dữ liệu |
| **DL_THAT_THOAT_NVL** | Legacy V4, đã thay bằng KQ_THAT_THOAT_TON_KHO | Backup |
| **DL_THU_MUA** | Legacy V4 | Backup |
| **CEO_DASHBOARD** | Tính runtime (GĐ-B buildAccountingOverview) | Đã có engine |
| **P&L_TUAN** | Tính runtime (buildProfitLossReport) | Đã có engine |
| **DONG_TIEN_TUAN** | Tính runtime (buildCashflowReport) | Đã có engine |
| **CAN_DOI_RUT_GON** | Tính runtime (buildBalanceReport) | Đã có engine |
| **DU_TOAN_TUAN_TOI** | Tính từ forecast engine | Đã có engine |
| **THAT_THOAT_CHI_TIET** | Tính runtime (buildStockLossReport) | Đã có engine |
| **BAN_LAM_VIEC_KE_TOAN** | Tổng hợp từ IMPORT_LICH_SU + data quality | Tính runtime |
| **LICH_SU_CHOT_BAO_CAO** | Giữ nguyên thực ra — gộp vào IMPORT_LICH_SU | ⚠️ Đang dùng weekly-close, CHỜ GĐ sau |
| **TONG_QUAN_KE_TOAN** | Tính runtime | Đã có engine |
| **KQ_HAO_HUT_CHE_BIEN** | Tính từ DL_CHE_BIEN + công thức | Regenerate |
| **KQ_THAT_THOAT_TON_KHO** | Tính từ DL_XNT | ⚠️ Đang dùng, CHỜ GĐ sau |
| **CAI_DAT_BOT / CAI_DAT_NGUONG** | Gộp thành CAI_DAT | ⚠️ CHỜ GĐ sau |

---

## ⚠️ QUAN TRỌNG — KHÔNG BỎ NGAY

Vì code hiện tại ĐANG đọc các sheet:
- `KQ_HAO_HUT_CHE_BIEN` (report-engines.ts)
- `KQ_THAT_THOAT_TON_KHO` (report-engines.ts)
- `LICH_SU_CHOT_BAO_CAO` (weekly-close-engine.ts)
- `CAI_DAT_BOT / CAI_DAT_NGUONG` (settings page)

→ **GĐ-C thực hiện 2 phase:**

### Phase C1 (NGAY — an toàn): Bỏ 7 sheet báo cáo tĩnh
Bỏ: CEO_DASHBOARD, P&L_TUAN, DONG_TIEN_TUAN, CAN_DOI_RUT_GON, DU_TOAN_TUAN_TOI, THAT_THOAT_CHI_TIET, BAN_LAM_VIEC_KE_TOAN, TONG_QUAN_KE_TOAN

**Điều kiện:** Đã có 4 engines tài chính (GĐ-B) ✅. Pages tài chính phải wire sang v7 engine TRƯỚC khi bỏ.

### Phase C2 (SAU — cần refactor code): Bỏ/gộp còn lại
- KQ_* sheets: refactor engines tính trực tiếp từ DL_* thay vì đọc KQ_*
- IMPORT_* gộp: thêm cột `Loại sự kiện`
- CAI_DAT gộp: refactor settings page

---

## 🛠️ SCRIPT MIGRATION

```bash
# 1. Backup toàn bộ Google Sheet (export .xlsx) TRƯỚC khi làm gì
# 2. Chạy script đánh dấu sheet nào active:
npm run sheet-audit

# 3. Phase C1: Sau khi wire pages sang v7 engine, xóa 7 sheet tĩnh trên Google Sheet
# 4. Verify app vẫn chạy: npm run build && npm run smoke
```

---

## ✅ KẾT QUẢ SAU MIGRATION

**Phase C1:** 40 sheet → 33 sheet (bỏ 7 báo cáo tĩnh)
**Phase C2:** 33 sheet → 19 sheet (gộp + bỏ legacy)
