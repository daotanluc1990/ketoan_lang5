import { describe, expect, it } from 'vitest';
import { buildExistingRowIndex, classifyImportRows } from '@/lib/dedupe/dedupe-engine';
import { createRowHash } from '@/lib/import/row-hash';

describe('dedupe-engine', () => {
  it('phân loại dòng mới, trùng, lệch', () => {
    const index = buildExistingRowIndex([{ 'Mã dòng dữ liệu': 'A', 'Dấu vết dòng': 'HASH1' }]);
    const rows = classifyImportRows([
      { maDongDuLieu: 'A', dauVetDong: 'HASH1', sheetDich: 'S', data: {} },
      { maDongDuLieu: 'A', dauVetDong: 'HASH2', sheetDich: 'S', data: {} },
      { maDongDuLieu: 'B', dauVetDong: 'HASH3', sheetDich: 'S', data: {} }
    ], index);
    expect(rows.map((r) => r.status)).toEqual(['Dữ liệu trùng', 'Dữ liệu lệch', 'Dòng mới']);
  });

  it('cùng dữ liệu nghiệp vụ nhưng khác metadata import vẫn là dữ liệu trùng', () => {
    const existingRows = [
      {
        'Mã dòng dữ liệu': 'DL_SO_QUY|PT001|2026-06-23|100000',
        'Mã lần import': 'IMP-OLD',
        'Ngày': '2026-06-23',
        'Năm': 2026,
        'Tháng': 6,
        'Tuần': '26',
        'Mã tuần': '2026-W26',
        'Chi nhánh': 'NVT',
        'Loại giao dịch': 'Thu',
        'Nhóm thu/chi': 'Doanh thu',
        'Diễn giải': 'Thu tiền mặt',
        'Số tiền': 100000,
        'Tên file nguồn': 'SoQuy_cu.xlsx',
        'Dấu vết dòng': 'legacy-hash-from-old-algorithm',
        'Trạng thái dữ liệu': 'Đã xác nhận',
        'Ngày import': '2026-06-23T01:00:00.000Z',
        'Người import': 'ke-toan'
      }
    ];

    const newData = {
      'Ngày': '2026-06-23',
      'Năm': 2026,
      'Tháng': 6,
      'Tuần': '26',
      'Mã tuần': '2026-W26',
      'Chi nhánh': 'NVT',
      'Loại giao dịch': 'Thu',
      'Nhóm thu/chi': 'Doanh thu',
      'Diễn giải': '  Thu tiền mặt  ',
      'Số tiền': 100000,
      'Tên file nguồn': 'SoQuy_moi.xlsx',
      'Dấu vết dòng': 'SoQuy_moi.xlsx#2',
      'Trạng thái dữ liệu': 'Preview',
      'Ngày import': '2026-06-24T02:00:00.000Z',
      'Người import': 'system'
    };

    const rows = classifyImportRows([
      {
        maDongDuLieu: 'DL_SO_QUY|PT001|2026-06-23|100000',
        dauVetDong: createRowHash(newData),
        sheetDich: 'DL_SO_QUY',
        data: newData
      }
    ], buildExistingRowIndex(existingRows));

    expect(rows[0].status).toBe('Dữ liệu trùng');
  });

  it('cùng khóa nhưng dữ liệu nghiệp vụ thay đổi vẫn là dữ liệu lệch', () => {
    const existingRows = [
      {
        'Mã dòng dữ liệu': 'DL_SO_QUY|PT001|2026-06-23|100000',
        'Ngày': '2026-06-23',
        'Chi nhánh': 'NVT',
        'Diễn giải': 'Thu tiền mặt',
        'Số tiền': 100000,
        'Dấu vết dòng': 'legacy-hash-from-old-algorithm',
        'Trạng thái dữ liệu': 'Đã xác nhận',
        'Ngày import': '2026-06-23T01:00:00.000Z'
      }
    ];

    const changedData = {
      'Ngày': '2026-06-23',
      'Chi nhánh': 'NVT',
      'Diễn giải': 'Thu tiền mặt',
      'Số tiền': 120000,
      'Dấu vết dòng': 'SoQuy_moi.xlsx#2',
      'Trạng thái dữ liệu': 'Preview',
      'Ngày import': '2026-06-24T02:00:00.000Z'
    };

    const rows = classifyImportRows([
      {
        maDongDuLieu: 'DL_SO_QUY|PT001|2026-06-23|100000',
        dauVetDong: createRowHash(changedData),
        sheetDich: 'DL_SO_QUY',
        data: changedData
      }
    ], buildExistingRowIndex(existingRows));

    expect(rows[0].status).toBe('Dữ liệu lệch');
  });
});
