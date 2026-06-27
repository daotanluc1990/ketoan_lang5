import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { analyzeCashbookBusiness, filterCashbookBusiness } from '@/lib/reports/cashbook-business';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

async function readCashbookRows() { try { return await getDataStore().read(SHEET_NAMES.DL_SO_QUY); } catch { return []; } }

export default async function PlTuanPage({ searchParams }: PageProps) {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_pnl')) return <NoPermission role={rbac.role} permission="view_pnl" />;
  const filters = await parsePageReportFilters(searchParams);
  const report = await buildDashboardReport(filters);
  const cashbookRows = filterCashbookBusiness(await readCashbookRows(), filters);
  const business = analyzeCashbookBusiness(cashbookRows);
  const status = report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu';

  return (
    <div className="space-y-2.5">
      <PageHeader title="P&L Tuần" status={status} />
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        {report.executiveKpis.slice(0, 8).map((kpi) => <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} status={kpi.status} compact />)}
      </section>
      <section className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="p-0"><div className="border-b border-lang-line px-3 py-2"><CardTitle>Bảng P&L chính</CardTitle></div><div className="p-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá']} rows={report.pnlRows} maxHeight="max-h-[300px]" /></div></Card>
        <Card><CardTitle>Quy tắc P&L</CardTitle><div className="mt-2"><ReportTable headers={['Nhóm', 'Chỉ số', 'Số tiền', 'Quy tắc', 'Trạng thái']} rows={business.pnlRows} maxHeight="max-h-[260px]" /></div></Card>
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <ChartCard title="Doanh thu theo nguồn" items={report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} />
        <Card><CardTitle>Top thất thoát P&L</CardTitle><div className="mt-2"><ReportTable headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị lệch', 'Tỷ lệ', 'Trạng thái']} rows={report.lossTop5Rows.map((row) => [row[0], row[1], row[2], row[3], row[4], row[7]])} maxHeight="max-h-[220px]" /></div></Card>
      </section>
    </div>
  );
}
