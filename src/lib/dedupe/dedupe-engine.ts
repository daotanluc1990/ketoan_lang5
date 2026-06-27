import { createComparableRow, createRowHash } from '@/lib/import/row-hash';
import type { ImportRow, ImportRowStatus } from '@/lib/import/import-types';

export type ExistingRowIndex = Map<string, Set<string>>;

function hasComparableBusinessData(row: Record<string, unknown>) {
  return Object.keys(createComparableRow(row)).length > 0;
}

export function buildExistingRowIndex(existingRows: Record<string, unknown>[]): ExistingRowIndex {
  const index: ExistingRowIndex = new Map<string, Set<string>>();
  for (const row of existingRows) {
    const key = String(row['Mã dòng dữ liệu'] ?? '').trim();
    if (!key) continue;

    const hashes = index.get(key) ?? new Set<string>();
    const storedHash = String(row['Dấu vết dòng'] ?? '').trim();
    if (storedHash) hashes.add(storedHash);
    if (hasComparableBusinessData(row)) hashes.add(createRowHash(row));

    index.set(key, hashes);
  }
  return index;
}

export function classifyImportRows(rows: ImportRow[], existingIndex: ExistingRowIndex): ImportRow[] {
  return rows.map((row) => {
    let status: ImportRowStatus = 'Dòng mới';
    const existingHashes = existingIndex.get(row.maDongDuLieu);
    if (row.errors?.length) status = 'Dòng lỗi';
    else if (existingHashes?.has(row.dauVetDong)) status = 'Dữ liệu trùng';
    else if (existingHashes?.size) status = 'Dữ liệu lệch';
    return { ...row, status };
  });
}
