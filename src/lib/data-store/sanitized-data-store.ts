import type { DataRow, DataStore } from './store-interface';

const DATA_SHEET_PREFIXES = ['DL_'];

function isDataSheet(sheetName: string) {
  return DATA_SHEET_PREFIXES.some((prefix) => sheetName.startsWith(prefix));
}

function hasImportMetadata(rows: DataRow[]) {
  return rows.some((row) =>
    String(row['Mã dòng dữ liệu'] ?? '').trim() ||
    String(row['Mã lần import'] ?? '').trim() ||
    String(row['Tên file nguồn'] ?? '').trim()
  );
}

function isRolledBack(row: DataRow) {
  return String(row['Trạng thái dữ liệu'] ?? '').trim().toLowerCase() === 'đã hoàn tác';
}

function hasTrustedImportId(value: string) {
  return value.startsWith('IMP-') || value.startsWith('BATCH-');
}

function isConfirmedImportRow(sheetName: string, row: DataRow) {
  if (isRolledBack(row)) return false;

  const rowId = String(row['Mã dòng dữ liệu'] ?? '').trim();
  const importId = String(row['Mã lần import'] ?? '').trim();

  if (rowId.startsWith(`${sheetName}|`)) return true;
  if (hasTrustedImportId(importId)) return true;

  return false;
}

export function sanitizeDataRows(sheetName: string, rows: DataRow[]) {
  if (!isDataSheet(sheetName)) return rows;
  if (!hasImportMetadata(rows)) return rows;
  return rows.filter((row) => isConfirmedImportRow(sheetName, row));
}

export function withSanitizedReads(store: DataStore): DataStore {
  return {
    async read(sheetName) {
      const rows = await store.read(sheetName);
      return sanitizeDataRows(sheetName, rows);
    },
    append(sheetName, rows) {
      return store.append(sheetName, rows);
    },
    replace(sheetName, rows) {
      return store.replace(sheetName, rows);
    },
    markRowsByImportId(input) {
      if (!store.markRowsByImportId) {
        return Promise.resolve({ sheetName: input.sheetName, matchedRows: 0, updatedRows: 0 });
      }
      return store.markRowsByImportId(input);
    }
  };
}
