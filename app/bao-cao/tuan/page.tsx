import { PageHeader } from '@/components/layout/PageHeader';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildProfitLossReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function BaoCaoTuanPage() {
  const report = await buildProfitLossReport();
  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo tuần" description="Tổng hợp từ V7 engines (runtime, không lưu tĩnh)." status={report.status} />
      <V7ReportEnginePage report={report} />
    </div>
  );
}
