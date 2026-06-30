import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { ImportPreviewResult, ImportRow } from './import-types';

/**
 * Ghi log dòng lỗi/trùng/lệch vào IMPORT_LICH_SU với cột `Loại sự kiện`.
 *
 * Trước đây 3 loại ghi vào 3 sheet riêng: IMPORT_DONG_LOI/TRUNG/LECH.
 * GĐ-C Phase 2: gộp về IMPORT_LICH_SU, phân biệt bằng `Loại sự kiện`.
 */

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value).slice(0, 5000);
  } catch {
    return String(value ?? '').slice(0, 5000);
  }
}

function rowSource(row: ImportRow) {
  return String(row.data['Dấu vết dòng'] ?? row.dauVetDong ?? '');
}

function getFieldError(row: ImportRow) {
  const message = row.errors?.join('; ') ?? 'Dòng lỗi chưa rõ nguyên nhân';
  const match = message.match(/Thiếu\s+(.+)/i);
  return { field: match?.[1] ?? 'Chưa xác định', message };
}

export async function writeImportControlLogs(preview: ImportPreviewResult) {
  const store = getDataStore();
  const now = new Date().toISOString();
  const errorRows = preview.rows.filter((row) => row.status === 'Dòng lỗi');
  const duplicateRows = preview.rows.filter((row) => row.status === 'Dữ liệu trùng');
  const mismatchRows = preview.rows.filter((row) => row.status === 'Dữ liệu lệch');

  const logRows: Array<Record<string, unknown>> = [];

  // Dòng lỗi → IMPORT_LICH_SU với loại sự kiện 'DÒNG_LỖI'
  errorRows.forEach((row, index) => {
    const detail = getFieldError(row);
    logRows.push({
      'Loại sự kiện': 'DÒNG_LỖI',
      'Mã lần import': `${preview.maLanImport}-ERR-${index + 1}`,
      'Ngày import': now,
      'Người import': '',
      'Chi nhánh': preview.chiNhanh,
      'Tuần': '',
      'Số file': 1,
      'Tổng dòng mới': 0,
      'Tổng dòng trùng': 0,
      'Tổng dòng lệch': 0,
      'Tổng dòng lỗi': 1,
      'Trạng thái': 'Chờ xử lý',
      'Ghi chú': `${preview.tenFile} | Dòng: ${rowSource(row)} | Sheet: ${row.sheetDich} | Trường: ${detail.field} | Lỗi: ${detail.message} | Xử lý: Sửa file nguồn rồi preview lại`
    });
  });

  // Dữ liệu trùng → IMPORT_LICH_SU với loại sự kiện 'DỮ_LIỆU_TRÙNG'
  duplicateRows.forEach((row, index) => {
    logRows.push({
      'Loại sự kiện': 'DỮ_LIỆU_TRÙNG',
      'Mã lần import': `${preview.maLanImport}-DUP-${index + 1}`,
      'Ngày import': now,
      'Người import': '',
      'Chi nhánh': preview.chiNhanh,
      'Tuần': '',
      'Số file': 1,
      'Tổng dòng mới': 0,
      'Tổng dòng trùng': 1,
      'Tổng dòng lệch': 0,
      'Tổng dòng lỗi': 0,
      'Trạng thái': 'Bỏ qua khi confirm',
      'Ghi chú': `${preview.tenFile} | Dòng: ${rowSource(row)} | Khóa: ${row.maDongDuLieu} | Cũ: ${row.dauVetDong} | Mới: ${safeJson(row.data).slice(0, 500)}`
    });
  });

  // Dữ liệu lệch → IMPORT_LICH_SU với loại sự kiện 'DỮ_LIỆU_LỆCH'
  mismatchRows.forEach((row, index) => {
    logRows.push({
      'Loại sự kiện': 'DỮ_LIỆU_LỆCH',
      'Mã lần import': `${preview.maLanImport}-DIFF-${index + 1}`,
      'Ngày import': now,
      'Người import': '',
      'Chi nhánh': preview.chiNhanh,
      'Tuần': '',
      'Số file': 1,
      'Tổng dòng mới': 0,
      'Tổng dòng trùng': 0,
      'Tổng dòng lệch': 1,
      'Tổng dòng lỗi': 0,
      'Trạng thái': 'Chờ đối chiếu',
      'Ghi chú': `${preview.tenFile} | Khóa: ${row.maDongDuLieu} | Cũ: Đã có dữ liệu cùng khóa khác dấu vết | Mới: ${row.dauVetDong} | Chênh: ${safeJson(row.data).slice(0, 500)}`
    });
  });

  if (logRows.length) {
    await store.append(SHEET_NAMES.IMPORT_LICH_SU, logRows);
  }

  return {
    writtenAt: now,
    errorRows: errorRows.length,
    duplicateRows: duplicateRows.length,
    mismatchRows: mismatchRows.length
  };
}
