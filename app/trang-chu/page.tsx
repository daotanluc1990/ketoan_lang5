import { PageHeader } from '@/components/layout/PageHeader';
import { AccountingOverviewCompactPage } from '@/components/dashboard/AccountingOverviewCompactPage';
import { buildAccountingOverview } from '@/lib/reports/v7/report-engines';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrangChuPage({ searchParams }: PageProps) {
  const filters = await parsePageReportFilters(searchParams);
  const v7Report = await buildAccountingOverview();
  const report = await buildDashboardReport(filters);

  return (
    <div className="space-y-4">
      <PageHeader title="Trang chủ" description="Dashboard điều hành — tiền, hàng, cảnh báo, việc cần làm, báo cáo đến hạn." status={v7Report.status} />
      <V7ReportEnginePage report={v7Report} />
      {report.hasRealData ? (
        <details className="rounded-lg border border-lang-line bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-lang-ink">Xem chi tiết dashboard cũ (legacy)</summary>
          <div className="border-t border-lang-line p-3">
            <AccountingOverviewCompactPage report={report} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
