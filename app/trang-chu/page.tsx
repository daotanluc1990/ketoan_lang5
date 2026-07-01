import { PageHeader } from '@/components/layout/PageHeader';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { buildAccountingOverview } from '@/lib/reports/v7/report-engines';
import { parsePageReportFilters } from '@/lib/reports/report-filters';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrangChuPage({ searchParams }: PageProps) {
  // Trigger filter parsing (cho bộ lọc toàn cục hoạt động)
  await parsePageReportFilters(searchParams);
  // V7 engine: tính runtime từ Data Master
  const v7Report = await buildAccountingOverview();

  return (
    <div className="space-y-4">
      <PageHeader title="Trang chủ" description="Dashboard điều hành — tiền, hàng, cảnh báo, việc cần làm, báo cáo đến hạn." status={v7Report.status} />
      <ExecutiveDashboard report={v7Report} />
    </div>
  );
}
