import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { DataStore } from '@/lib/data-store/store-interface';

const rowsBySheet: Record<string, Record<string, unknown>[]> = {};
const store: DataStore = {
  read: async (sheetName) => rowsBySheet[sheetName] ?? [],
  append: async (sheetName, rows) => {
    rowsBySheet[sheetName] = [...(rowsBySheet[sheetName] ?? []), ...rows];
  },
  replace: async (sheetName, rows) => {
    rowsBySheet[sheetName] = rows;
  },
  markRowsByImportId: async ({ sheetName, maLanImport, actor, reason }) => {
    const current = rowsBySheet[sheetName] ?? [];
    let matchedRows = 0;
    let updatedRows = 0;
    rowsBySheet[sheetName] = current.map((row) => {
      if (row['Mã lần import'] !== maLanImport) return row;
      matchedRows += 1;
      if (row['Trạng thái dữ liệu'] === 'Đã hoàn tác') return row;
      updatedRows += 1;
      return { ...row, 'Trạng thái dữ liệu': 'Đã hoàn tác', 'Người hoàn tác': actor, 'Ghi chú hoàn tác': reason };
    });
    return { sheetName, matchedRows, updatedRows };
  }
};

vi.mock('@/lib/data-store', () => ({ getDataStore: () => store }));
vi.mock('@/lib/audit/audit-log', () => ({ writeAuditLog: vi.fn(async () => undefined) }));

import { confirmImport } from '../import-confirm';
import { rollbackImport } from '../import-rollback';

describe('import control and rollback', () => {
  beforeEach(() => {
    for (const key of Object.keys(rowsBySheet)) delete rowsBySheet[key];
  });

  it('writes control logs and blocks confirm when preview has row errors', async () => {
    const result = await confirmImport({
      maLanImport: 'IMP-ERR',
      loaiDuLieu: 'Sổ quỹ',
      chiNhanh: 'NVT',
      tenFile: 'SoQuy.xlsx',
      dauVetFile: 'file-hash',
      rows: [
        {
          maDongDuLieu: 'bad-row',
          dauVetDong: 'hash-1',
          sheetDich: SHEET_NAMES.DL_SO_QUY,
          data: { 'Dấu vết dòng': 'row-2' },
          status: 'Dòng lỗi',
          errors: ['Thiếu mã phiếu']
        }
      ],
      summary: { dongMoi: 0, duLieuTrung: 0, duLieuLech: 0, dongLoi: 1 }
    }, 'accountant');

    expect(result.ok).toBe(false);
    expect(rowsBySheet[SHEET_NAMES.IMPORT_DONG_LOI]).toHaveLength(1);
    expect(rowsBySheet[SHEET_NAMES.IMPORT_LICH_SU][0]['Trạng thái']).toBe('Thất bại');
  });

  it('previews and confirms soft rollback by import id', async () => {
    rowsBySheet[SHEET_NAMES.DL_SO_QUY] = [
      { 'Mã dòng dữ liệu': 'SQ-1', 'Mã lần import': 'IMP-1', 'Trạng thái dữ liệu': 'Đã xác nhận', 'Số tiền': 1000 }
    ];

    const preview = await rollbackImport({ maLanImport: 'IMP-1', actor: 'CEO', reason: 'Test rollback' });
    expect(preview.mode).toBe('preview');
    expect(preview.affectedRows).toBe(1);
    expect(rowsBySheet[SHEET_NAMES.DL_SO_QUY][0]['Trạng thái dữ liệu']).toBe('Đã xác nhận');

    const confirmed = await rollbackImport({ maLanImport: 'IMP-1', actor: 'CEO', reason: 'Test rollback', confirm: true });
    expect(confirmed.mode).toBe('confirmed');
    expect(confirmed.updatedRows).toBe(1);
    expect(rowsBySheet[SHEET_NAMES.DL_SO_QUY][0]['Trạng thái dữ liệu']).toBe('Đã hoàn tác');
  });
});
