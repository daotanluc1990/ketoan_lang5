import { describe, expect, it } from 'vitest';
import { buildForecastFromRows } from '@/lib/forecast/forecast-engine';

function cashbookRow(week: string, amount: number, type: 'Thu' | 'Chi', group: string, id: string) {
  return {
    'Mã dòng dữ liệu': id,
    'Mã lần import': 'IMP-TEST',
    'Mã tuần': week,
    'Chi nhánh': 'NVT',
    'Loại giao dịch': type,
    'Nhóm thu/chi': group,
    'Số tiền': amount,
    'Tên file nguồn': 'soquy.xlsx',
    'Trạng thái dữ liệu': 'Đã xác nhận'
  };
}

function storeRow(week: string, amount: number, id: string) {
  return {
    'Mã dòng dữ liệu': id,
    'Mã lần import': 'IMP-TEST',
    'Mã tuần': week,
    'Chi nhánh': 'NVT',
    'Doanh thu bán hàng thực': amount,
    'Tên file nguồn': 'store.xlsx',
    'Trạng thái dữ liệu': 'Đã xác nhận'
  };
}

describe('forecast engine', () => {
  it('refuses forecast when history is below four weeks', () => {
    const report = buildForecastFromRows({
      storeRevenueRows: [storeRow('2026-W21', 10_000_000, 'S1'), storeRow('2026-W22', 11_000_000, 'S2')],
      cashbookRows: [cashbookRow('2026-W21', 8_000_000, 'Thu', 'Doanh thu', 'C1'), cashbookRow('2026-W22', -5_000_000, 'Chi', 'Khác', 'C2')]
    });
    expect(report.canForecast).toBe(false);
    expect(report.message).toContain('Chưa đủ dữ liệu');
    expect(report.scenarios).toHaveLength(0);
  });

  it('creates three read-only scenarios when history is sufficient', () => {
    const report = buildForecastFromRows({
      storeRevenueRows: [
        storeRow('2026-W21', 10_000_000, 'S1'),
        storeRow('2026-W22', 12_000_000, 'S2'),
        storeRow('2026-W23', 14_000_000, 'S3'),
        storeRow('2026-W24', 16_000_000, 'S4')
      ],
      cashbookRows: [
        cashbookRow('2026-W21', -4_000_000, 'Chi', 'Khác', 'C1'),
        cashbookRow('2026-W22', -5_000_000, 'Chi', 'Khác', 'C2'),
        cashbookRow('2026-W23', -6_000_000, 'Chi', 'Khác', 'C3'),
        cashbookRow('2026-W24', -7_000_000, 'Chi', 'Khác', 'C4')
      ]
    });
    expect(report.canForecast).toBe(true);
    expect(report.scenarios.map((scenario) => scenario.id)).toEqual(['than_trong', 'co_so', 'tang_truong']);
    expect(report.approval.canWriteToSheet).toBe(false);
    expect(report.baseline.revenue).toBeGreaterThan(0);
  });

  it('marks cashbook revenue proxy as requiring reconciliation', () => {
    const cashbookRows = ['2026-W21', '2026-W22', '2026-W23', '2026-W24'].map((week, index) =>
      cashbookRow(week, 10_000_000 + index * 1_000_000, 'Thu', 'Doanh thu', `C${index}`)
    );
    const report = buildForecastFromRows({ cashbookRows });
    expect(report.canForecast).toBe(true);
    expect(report.status).toBe('can_doi_chieu');
    expect(report.baseline.revenueSource).toBe('cashbook_revenue_proxy');
  });
});
