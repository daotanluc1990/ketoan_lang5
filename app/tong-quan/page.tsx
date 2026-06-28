import { PageHeader } from '@/components/layout/PageHeader';
import { AccountingOverviewCompactPage } from '@/components/dashboard/AccountingOverviewCompactPage';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { buildAccountingOverview } from '@/lib/reports/v7/report-engines';
import { parsePageReportFilters } from '@/lib/reports/report-filters';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TongQuanPage({ searchParams }: PageProps) {
  const filters = await parsePageReportFilters(searchParams);
  // V7 engine: tính runtime từ Data Master (data thật)
  const v7Report = await buildAccountingOverview();
  // Legacy aggregator: vẫn dùng cho dashboard compact cũ (có nhiều visual)
  const report = await buildDashboardReport(filters);
  const status = v7Report.status;

  return (
    <div className="space-y-4">
      <PageHeader title="Tổng quan kế toán" description="Tính runtime từ Data Master V7 (doanh thu + sổ quỹ + kho + thất thoát + công nợ)." status={status} />
      {/* V7 engine: KPI runtime + việc cần xử lý + readiness */}
      <V7ReportEnginePage report={v7Report} />
      {/* Legacy compact dashboard: visual phụ (data quality bar, top vấn đề) */}
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
