import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { ImportPreviewResult, ImportRow } from './import-types';

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

  if (errorRows.length) {
    await store.append(SHEET_NAMES.IMPORT_DONG_LOI, errorRows.map((row, index) => {
      const detail = getFieldError(row);
      return {
        'Mã lỗi': `${preview.maLanImport}-ERR-${index + 1}`,
        'Mã lần import': preview.maLanImport,
        'Tên file': preview.tenFile,
        'Dòng nguồn': rowSource(row),
        'Sheet nguồn': row.sheetDich,
        'Trường lỗi': detail.field,
        'Giá trị lỗi': '',
        'Mô tả lỗi': detail.message,
        'Mức độ': 'Chặn ghi',
        'Cách xử lý': 'Sửa file nguồn hoặc loại dòng lỗi rồi preview lại.',
        'Trạng thái': 'Chờ xử lý'
      };
    }));
  }

  if (duplicateRows.length) {
    await store.append(SHEET_NAMES.IMPORT_DU_LIEU_TRUNG, duplicateRows.map((row, index) => ({
      'Mã trùng': `${preview.maLanImport}-DUP-${index + 1}`,
      'Mã lần import': preview.maLanImport,
      'Tên file': preview.tenFile,
      'Dòng nguồn': rowSource(row),
      'Khóa dữ liệu': row.maDongDuLieu,
      'Dữ liệu hiện có': row.dauVetDong,
      'Dữ liệu mới': safeJson(row.data),
      'Hành động': 'Bỏ qua khi confirm'
    })));
  }

  if (mismatchRows.length) {
    await store.append(SHEET_NAMES.IMPORT_DU_LIEU_LECH, mismatchRows.map((row, index) => ({
      'Mã lệch': `${preview.maLanImport}-DIFF-${index + 1}`,
      'Mã lần import': preview.maLanImport,
      'Tên file': preview.tenFile,
      'Khóa dữ liệu': row.maDongDuLieu,
      'Chỉ số lệch': 'Dấu vết dòng',
      'Giá trị cũ': 'Đã có dữ liệu cùng khóa nhưng khác dấu vết',
      'Giá trị mới': row.dauVetDong,
      'Chênh lệch': safeJson(row.data),
      'Người xử lý': '',
      'Trạng thái': 'Chờ đối chiếu'
    })));
  }

  return {
    writtenAt: now,
    errorRows: errorRows.length,
    duplicateRows: duplicateRows.length,
    mismatchRows: mismatchRows.length
  };
}
