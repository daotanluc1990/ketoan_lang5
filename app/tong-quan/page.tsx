import { PageHeader } from '@/components/layout/PageHeader';
import { AccountingOverviewCompactPage } from '@/components/dashboard/AccountingOverviewCompactPage';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TongQuanPage({ searchParams }: PageProps) {
  const filters = await parsePageReportFilters(searchParams);
  const report = await buildDashboardReport(filters);
  const status = report.hasRealData
    ? report.missingSources.length
      ? 'Cần đối chiếu'
      : 'Tốt'
    : 'Chưa đủ dữ liệu';

  return (
    <div className="space-y-2.5">
      <PageHeader title="Tổng quan kế toán" status={status} />
      <AccountingOverviewCompactPage report={report} />
    </div>
  );
}
