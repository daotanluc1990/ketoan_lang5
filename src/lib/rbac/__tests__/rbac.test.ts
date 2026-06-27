import { describe, expect, test } from 'vitest';
import { canRole, maskDashboardReportForRole, normalizeRole } from '@/lib/rbac/rbac';
import type { DashboardReport } from '@/lib/reports/report-aggregator';

describe('rbac', () => {
  test('normalizes Vietnamese and English role aliases', () => {
    expect(normalizeRole('CEO')).toBe('CEO');
    expect(normalizeRole('kế toán')).toBe('Kế toán');
    expect(normalizeRole('accountant')).toBe('Kế toán');
    expect(normalizeRole('store_manager')).toBe('Quản lý cửa hàng');
  });

  test('denies manager from sensitive finance permissions', () => {
    expect(canRole('Quản lý cửa hàng', 'view_cashflow')).toBe(true);
    expect(canRole('Quản lý cửa hàng', 'view_pnl')).toBe(false);
    expect(canRole('Quản lý cửa hàng', 'rollback_confirm')).toBe(false);
    expect(canRole('CEO', 'rollback_confirm')).toBe(true);
    expect(canRole('Admin', 'send_bot')).toBe(true);
  });

  test('masks P&L and balance rows for low permission role', () => {
    const report = {
      executiveKpis: [{ label: 'Tổng doanh thu', value: '10tr' }, { label: 'Tiền vào', value: '5tr' }],
      pnlRows: [['P&L', 'Lợi nhuận', '1tr']],
      balanceRows: [['Cân đối', 'Tiền', '5tr']],
      totals: { revenue: 100, storeSales: 50, appNet: 50, appGross: 60, appFees: 10, appCogs: 20, lossValue: 3, cogsPercent: 0.2, appFeePercent: 0.1 }
    } as unknown as DashboardReport;
    const masked = maskDashboardReportForRole(report, 'Quản lý cửa hàng');
    expect(masked.executiveKpis.map((item) => item.label)).toEqual(['Tiền vào']);
    expect(masked.pnlRows[0][2]).toBe('Không có quyền xem');
    expect(masked.totals.revenue).toBe(0);
  });
});
