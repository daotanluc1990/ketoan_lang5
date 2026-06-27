import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';

const ROLLBACK_SOURCE_SHEETS = [
  SHEET_NAMES.DL_DOANH_THU_APP,
  SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
  SHEET_NAMES.DL_SO_QUY,
  SHEET_NAMES.DL_TON_KHO,
  SHEET_NAMES.DL_THAT_THOAT_NVL,
  SHEET_NAMES.DL_CONG_NO,
  SHEET_NAMES.DL_THU_MUA,
  SHEET_NAMES.DM_CHI_NHANH,
  SHEET_NAMES.DM_KHO_CHI_NHANH,
  SHEET_NAMES.DM_MON_BAN,
  SHEET_NAMES.DM_NGUYEN_VAT_LIEU,
  SHEET_NAMES.DM_CONG_THUC_CHE_BIEN,
  SHEET_NAMES.DM_HAO_HUT_HOP_LE,
  SHEET_NAMES.DM_DON_GIA_NVL,
  SHEET_NAMES.DL_XNT_CUA_HANG,
  SHEET_NAMES.DL_XNT_BEP_TRUNG_TAM,
  SHEET_NAMES.DL_XUAT_BTT_CHO_CUA_HANG,
  SHEET_NAMES.DL_CUA_HANG_NHAN_TU_BTT,
  SHEET_NAMES.DL_HUY_HANG_CUA_HANG,
  SHEET_NAMES.DL_HUY_HANG_BTT,
  SHEET_NAMES.DL_CHE_BIEN_THUC_TE,
  SHEET_NAMES.KQ_HAO_HUT_CHE_BIEN,
  SHEET_NAMES.KQ_THAT_THOAT_TON_KHO
];

type RollbackInput = {
  maLanImport: string;
  actor: string;
  reason: string;
  confirm?: boolean;
};

async function findRowsByImportId(maLanImport: string) {
  const store = getDataStore();
  const results = [];
  for (const sheetName of ROLLBACK_SOURCE_SHEETS) {
    const rows = await store.read(sheetName).catch(() => [] as Record<string, unknown>[]);
    const matchingRows = rows.filter((row) => String(row['Mã lần import'] ?? '') === maLanImport);
    const activeRows = matchingRows.filter((row) => String(row['Trạng thái dữ liệu'] ?? '') !== 'Đã hoàn tác');
    if (matchingRows.length) {
      results.push({ sheetName, matchedRows: matchingRows.length, activeRows: activeRows.length });
    }
  }
  return results;
}

export async function rollbackImport(input: RollbackInput) {
  const store = getDataStore();
  const preview = await findRowsByImportId(input.maLanImport);
  const affectedRows = preview.reduce((total, item) => total + item.activeRows, 0);

  if (!input.confirm) {
    await writeAuditLog({
      eventType: AUDIT_EVENTS.IMPORT_ROLLBACK,
      actor: input.actor,
      target: input.maLanImport,
      note: `Rollback preview: ${input.reason}`,
      after: { affectedRows, sheets: preview }
    });
    return {
      ok: true,
      mode: 'preview',
      maLanImport: input.maLanImport,
      affectedRows,
      sheets: preview,
      message: affectedRows ? 'Đây là bản xem trước hoàn tác. Chưa đổi dữ liệu. Gửi confirm=true nếu CEO/Admin duyệt.' : 'Không tìm thấy dòng dữ liệu còn hiệu lực để hoàn tác.'
    };
  }

  if (!store.markRowsByImportId) {
    throw new Error('Data store hiện tại không hỗ trợ hoàn tác theo mã import.');
  }

  const updates = [];
  for (const item of preview) {
    if (!item.activeRows) continue;
    updates.push(await store.markRowsByImportId({
      sheetName: item.sheetName,
      maLanImport: input.maLanImport,
      actor: input.actor,
      reason: input.reason
    }));
  }
  const updatedRows = updates.reduce((total, item) => total + item.updatedRows, 0);

  await store.append(SHEET_NAMES.IMPORT_LICH_SU, [
    {
      'Mã lần import': input.maLanImport,
      'Ngày import': new Date().toISOString(),
      'Người import': input.actor,
      'Chi nhánh': 'Theo lần import gốc',
      'Tuần': 'Theo lần import gốc',
      'Số file': 0,
      'Tổng dòng mới': -updatedRows,
      'Tổng dòng trùng': 0,
      'Tổng dòng lệch': 0,
      'Tổng dòng lỗi': 0,
      'Trạng thái': 'Đã hoàn tác',
      'Ghi chú': `Hoàn tác mềm theo mã import. Lý do: ${input.reason}`
    }
  ]);

  await writeAuditLog({
    eventType: AUDIT_EVENTS.IMPORT_ROLLBACK,
    actor: input.actor,
    target: input.maLanImport,
    note: `Rollback confirmed: ${input.reason}`,
    before: { affectedRows, sheets: preview },
    after: { updatedRows, updates }
  });

  return {
    ok: true,
    mode: 'confirmed',
    maLanImport: input.maLanImport,
    affectedRows,
    updatedRows,
    sheets: updates,
    message: updatedRows ? 'Đã hoàn tác mềm: đổi Trạng thái dữ liệu thành Đã hoàn tác. Không xóa cứng dòng dữ liệu.' : 'Không có dòng nào cần hoàn tác.'
  };
}
