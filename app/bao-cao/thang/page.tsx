import { PageHeader } from '@/components/layout/PageHeader';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { ReportCloseStatus } from '@/components/dashboard/ReportCloseStatus';
import { buildProfitLossReport, buildCashflowReport, buildBalanceReport, buildStockLossReport } from '@/lib/reports/v7/report-engines';
import { buildWeeklyClosePreview } from '@/lib/reports/v7/weekly-close-engine';
import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from '@/components/report/ReportTable';
import type { V7Report } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

function ReportSection({ title, report }: { title: string; report: V7Report }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-3">
        <ReportTable headers={report.primary.headers} rows={report.primary.rows} maxHeight="max-h-[280px]" />
      </div>
    </Card>
  );
}

export default async function BaoCaoThangPage() {
  const [pnl, cashflow, balance, stockLoss, closePreview] = await Promise.all([
    buildProfitLossReport(),
    buildCashflowReport(),
    buildBalanceReport(),
    buildStockLossReport(),
    buildWeeklyClosePreview({ periodCode: 'month', branch: 'NVT' }).catch(() => null),
  ]);

  const checks = closePreview?.checks?.map((c) => ({ module: c.label, status: c.status, canClose: !['Cảnh báo', 'Nguy hiểm', 'Chưa đủ dữ liệu', 'Cần đối chiếu'].includes(c.status) })) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo tháng" description="KQKD + Dòng tiền + Kho/TT + Cân đối + Điều kiện chốt tháng." status={closePreview?.status ?? 'Cần đối chiếu'} />

      {/* KPI tổng quan tháng */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pnl.metrics.slice(0, 4).map((m) => (
          <div key={m.label} className="rounded-lg border border-lang-line bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-lang-muted">{m.label}</p>
            <p className="mt-1 text-lg font-extrabold">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportSection title="P&L (Kết quả kinh doanh)" report={pnl} />
        <ReportSection title="Dòng tiền" report={cashflow} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ReportSection title="Thất thoát tồn kho" report={stockLoss} />
        <ReportSection title="Cân đối rút gọn" report={balance} />
      </div>

      {/* Điều kiện chốt */}
      <ReportCloseStatus checks={checks} />
    </div>
  );
}
