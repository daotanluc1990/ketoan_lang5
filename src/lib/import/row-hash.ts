import crypto from 'node:crypto';

const IMPORT_METADATA_KEYS = new Set([
  'Mã dòng dữ liệu',
  'Mã lần import',
  'Tên file nguồn',
  'Dấu vết file',
  'Dấu vết dòng',
  'Trạng thái dữ liệu',
  'Ngày import',
  'Người import',
  'Ngày hoàn tác',
  'Người hoàn tác',
  'Ghi chú hoàn tác',
  'Mã hoàn tác',
  'Lý do hoàn tác',
  'Hoàn tác từ',
  'Rollback từ',
  'Rollback bởi',
  'Rollback lúc'
]);

function isEmptyComparableValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function normalizeComparableValue(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ');
  if (typeof value === 'number') return Number.isNaN(value) ? '' : value;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(normalizeComparableValue).filter((item) => !isEmptyComparableValue(item));
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const normalized = normalizeComparableValue((value as Record<string, unknown>)[key]);
        if (!isEmptyComparableValue(normalized)) acc[key] = normalized;
        return acc;
      }, {});
  }
  return String(value).trim().replace(/\s+/g, ' ');
}

export function createComparableRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(row)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      if (IMPORT_METADATA_KEYS.has(key)) return acc;
      const normalized = normalizeComparableValue(row[key]);
      if (!isEmptyComparableValue(normalized)) acc[key] = normalized;
      return acc;
    }, {});
}

export function createRowHash(row: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(createComparableRow(row))).digest('hex');
}
