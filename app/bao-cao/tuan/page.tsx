import { PageHeader } from '@/components/layout/PageHeader';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { ReportCloseStatus } from '@/components/dashboard/ReportCloseStatus';
import { buildProfitLossReport, buildCashflowReport, buildBalanceReport } from '@/lib/reports/v7/report-engines';
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
        <ReportTable headers={report.primary.headers} rows={report.primary.rows} maxHeight="max-h-[300px]" />
      </div>
    </Card>
  );
}

export default async function BaoCaoTuanPage() {
  const [pnl, cashflow, balance, closePreview] = await Promise.all([
    buildProfitLossReport(),
    buildCashflowReport(),
    buildBalanceReport(),
    buildWeeklyClosePreview({ periodCode: 'week', branch: 'NVT' }).catch(() => null),
  ]);

  const checks = closePreview?.checks?.map((c) => ({ module: c.label, status: c.status, canClose: !['Cảnh báo', 'Nguy hiểm', 'Chưa đủ dữ liệu', 'Cần đối chiếu'].includes(c.status) })) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo tuần" description="P&L + Dòng tiền + Cân đối + Điều kiện chốt tuần." status={closePreview?.status ?? 'Cần đối chiếu'} />

      {/* P&L tuần */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pnl.metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-lang-line bg-white p-3 shadow-sm">
            <p className="text-xs font-bold text-lang-muted">{m.label}</p>
            <p className="mt-1 text-lg font-extrabold">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportSection title="P&L Tuần" report={pnl} />
        <ReportSection title="Dòng tiền Tuần" report={cashflow} />
      </div>
      <ReportSection title="Cân đối rút gọn" report={balance} />

      {/* Điều kiện chốt */}
      <ReportCloseStatus checks={checks} />

      {/* Top 3 vấn đề cần CEO */}
      <Card>
        <CardTitle>Top 3 vấn đề cần CEO xử lý</CardTitle>
        <div className="mt-3">
          <ReportTable
            headers={['#', 'Vấn đề', 'Nguyên nhân', 'Hành động đề xuất', 'Người phụ trách']}
            rows={closePreview?.blockingChecks?.slice(0, 3).map((c, i) => [String(i + 1), c.label, c.status, c.detail, 'Kế toán']) ?? [['1', 'Không có vấn đề lớn', '—', '—', '—']]}
            maxHeight="max-h-[200px]"
          />
        </div>
      </Card>
    </div>
  );
}
