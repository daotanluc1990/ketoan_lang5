import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CanDoiPage({ searchParams }: PageProps) {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_balance')) return <NoPermission role={rbac.role} permission="view_balance" />;
  const filters = await parsePageReportFilters(searchParams);
  const report = await buildDashboardReport(filters);
  const hasData = report.sourceCounts.cashbook > 0 || report.sourceCounts.inventory > 0 || report.sourceCounts.lossRows > 0;
  const alertRows = [
    ['Dữ liệu', hasData ? 'Tốt' : 'Chưa đủ dữ liệu', report.message],
    ['Tồn âm', report.totals.negativeStockCount ? 'Cảnh báo' : 'Tốt', `${report.totals.negativeStockCount} mặt hàng`],
    ['Công nợ/TSCĐ', 'Cần đối chiếu', 'Chờ nguồn riêng']
  ];
  return (
    <div className="space-y-2.5">
      <PageHeader title="Cân đối rút gọn" status={hasData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Dòng tiền tạm" value={report.executiveKpis.find((kpi) => kpi.label === 'Dòng tiền tạm')?.value ?? '—'} status={report.totals.cashEnding < 0 ? 'danger' : hasData ? 'good' : 'neutral'} compact />
        <MetricCard label="Tồn kho" value={report.executiveKpis.find((kpi) => kpi.label === 'Tồn kho')?.value ?? '—'} status={report.totals.negativeStockCount ? 'warning' : hasData ? 'good' : 'neutral'} compact />
        <MetricCard label="Thất thoát" value={report.executiveKpis.find((kpi) => kpi.label === 'Thất thoát quy tiền')?.value ?? '—'} status={report.totals.lossValue ? 'warning' : 'neutral'} compact />
        <MetricCard label="Nguồn thiếu" value={`${report.missingSources.length}`} status={report.missingSources.length ? 'warning' : 'good'} compact />
      </section>
      <section className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="p-0"><div className="border-b border-lang-line px-3 py-2"><CardTitle>Bảng cân đối</CardTitle></div><div className="p-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái']} rows={report.balanceRows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[5]])} maxHeight="max-h-[300px]" /></div></Card>
        <Card><CardTitle>Cảnh báo</CardTitle><div className="mt-2"><ReportTable headers={['Mảng', 'Trạng thái', 'Ghi chú']} rows={alertRows} maxHeight="max-h-[180px]" /></div></Card>
      </section>
    </div>
  );
}
