import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { ChartCard } from '@/components/report/ChartCard';
import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from '@/components/report/ReportTable';
import { buildProfitLossReport } from '@/lib/reports/v7/report-engines';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function PlTuanPage({ searchParams }: PageProps) {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_pnl')) return <NoPermission role={rbac.role} permission="view_pnl" />;
  const filters = await parsePageReportFilters(searchParams);
  // V7 engine: P&L tính runtime từ doanh thu + sổ quỹ + thất thoát
  const v7Report = await buildProfitLossReport();
  // Legacy: lấy revenueByChannel cho ChartCard
  const legacy = await buildDashboardReport(filters);

  return (
    <div className="space-y-4">
      <PageHeader title="P&L Tuần" description="Tính runtime từ doanh thu + sổ quỹ + thất thoát (không lưu tĩnh)." status={v7Report.status} />
      <V7ReportEnginePage report={v7Report} />
      {/* ChartCard doanh thu theo kênh (từ legacy, có visual hay) */}
      {legacy.revenueByChannel.length ? (
        <Card><CardTitle>Doanh thu theo kênh</CardTitle><div className="mt-3"><ChartCard title="Doanh thu theo nguồn" items={legacy.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue }))} /></div></Card>
      ) : null}
    </div>
  );
}
