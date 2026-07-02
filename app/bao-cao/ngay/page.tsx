import { PageHeader } from '@/components/layout/PageHeader';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { ReportCloseStatus } from '@/components/dashboard/ReportCloseStatus';
import { buildAccountingOverview, buildCashflowReport } from '@/lib/reports/v7/report-engines';
import { buildWeeklyClosePreview } from '@/lib/reports/v7/weekly-close-engine';

export const dynamic = 'force-dynamic';

export default async function BaoCaoNgayPage() {
  const [overview, cashflow, closePreview] = await Promise.all([
    buildAccountingOverview(),
    buildCashflowReport(),
    buildWeeklyClosePreview({ periodCode: 'day', branch: 'NVT' }).catch(() => null),
  ]);

  const checks = closePreview?.checks?.map((c) => ({ module: c.label, status: c.status, canClose: !['Cảnh báo', 'Nguy hiểm', 'Chưa đủ dữ liệu', 'Cần đối chiếu'].includes(c.status) })) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo ngày" description="Doanh thu + Sổ quỹ + Kho + Data Quality + Cảnh báo + Kết luận chốt ngày." status={overview.status} />
      <V7ReportEnginePage report={overview} />
      <ReportCloseStatus checks={checks} />
    </div>
  );
}
