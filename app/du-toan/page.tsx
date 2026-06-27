import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildForecastReport } from '@/lib/forecast/forecast-engine';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function money(value: number) {
  if (!Number.isFinite(value) || value === 0) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

export default async function DuToanPage({ searchParams }: PageProps) {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_forecast')) return <NoPermission role={rbac.role} permission="view_forecast" />;
  const filters = await parsePageReportFilters(searchParams);
  const forecast = await buildForecastReport(filters);
  const base = forecast.scenarios.find((scenario) => scenario.id === 'co_so');
  const chartItems = forecast.scenarios.length ? forecast.scenarios.map((scenario) => ({ label: scenario.name, value: scenario.revenue, caption: money(scenario.revenue) })) : [{ label: 'Chưa đủ dữ liệu', value: 0, caption: '—' }];
  return (
    <div className="space-y-2.5">
      <PageHeader title="Dự toán tuần tới" description="" status={forecast.canForecast ? (forecast.status === 'du_du_lieu' ? 'Tốt' : 'Cần đối chiếu') : 'Chưa đủ dữ liệu'} />
      {!forecast.canForecast ? <div className="hidden"><EmptyState title="Chưa đủ dữ liệu" description="" /></div> : null}
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Dự toán cơ sở" value={base ? money(base.revenue) : '—'} status={forecast.status === 'du_du_lieu' ? 'good' : forecast.canForecast ? 'warning' : 'neutral'} compact />
        <MetricCard label="Chi cơ sở" value={base ? money(base.cashOut) : '—'} status={base?.needsCeoApproval ? 'warning' : forecast.canForecast ? 'good' : 'neutral'} compact />
        <MetricCard label="Dòng tiền cơ sở" value={base ? money(base.netCashflow) : '—'} status={base && base.netCashflow < 0 ? 'danger' : forecast.canForecast ? 'good' : 'neutral'} compact />
        <MetricCard label="Độ tin cậy" value={`${forecast.dataQuality.score}/100`} status={forecast.dataQuality.score >= 80 ? 'good' : forecast.dataQuality.score >= 60 ? 'warning' : 'neutral'} compact />
      </section>
      <section className="grid gap-2 xl:grid-cols-[1.1fr_0.9fr]">
        <Card><CardTitle>Ba kịch bản</CardTitle><div className="mt-2"><ReportTable headers={['Kịch bản', 'Doanh thu', 'Chi', 'Dòng tiền', 'Duyệt']} rows={(forecast.rows.scenarioRows.length ? forecast.rows.scenarioRows : [['Chưa đủ dữ liệu', '—', '—', '—', '—', '—']]).map((row) => [row[0], row[1], row[2], row[3], row[5]])} maxHeight="max-h-[260px]" /></div></Card>
        <Card><CardTitle>Việc cần làm</CardTitle><div className="mt-2"><ReportTable headers={['Owner', 'Việc cần làm', 'Deadline']} rows={forecast.rows.actionRows} maxHeight="max-h-[260px]" /></div></Card>
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <ChartCard title="Kịch bản doanh thu" items={chartItems} />
        <Card><CardTitle>Lịch sử</CardTitle><div className="mt-2"><ReportTable headers={['Tuần', 'Doanh thu', 'Tiền vào', 'Tiền ra', 'Dòng tiền']} rows={(forecast.rows.historyRows.length ? forecast.rows.historyRows : [['Chưa đủ dữ liệu', '—', '—', '—', '—', '—']]).map((row) => [row[0], row[1], row[2], row[3], row[4]])} maxHeight="max-h-[220px]" /></div></Card>
      </section>
    </div>
  );
}
