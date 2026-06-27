import Link from 'next/link';
import { Download, FileInput, Send, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { StatusBadge } from '@/components/report/StatusBadge';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { V7Report } from '@/lib/reports/v7/report-engines';

type Props = { report: V7Report };

function ActionLinks({ status }: { status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/import-nhap-lieu" className="inline-flex h-9 items-center gap-2 rounded-lg border border-lang-line bg-white px-3 text-[13px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><FileInput className="h-4 w-4" />Import</Link>
      <Link href="/cai-dat-bot" className="inline-flex h-9 items-center gap-2 rounded-lg border border-lang-line bg-white px-3 text-[13px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><Send className="h-4 w-4" />Gửi CEO/Bot</Link>
      <Link href="/lich-su-chot-bao-cao" className="inline-flex h-9 items-center gap-2 rounded-lg bg-lang-red px-3 text-[13px] font-bold text-white shadow-sm hover:bg-lang-redDark"><ShieldCheck className="h-4 w-4" />Chốt</Link>
      <span className="inline-flex h-9 items-center gap-1 rounded-lg border border-lang-line bg-gray-50 px-3 text-[12px] font-bold text-lang-muted"><Download className="h-3.5 w-3.5" />Xuất</span>
      <StatusBadge status={status} />
    </div>
  );
}

export function V7ReportEnginePage({ report }: Props) {
  const hasRows = report.primary.rows.some((row) => row.some((cell) => cell !== '—' && cell !== 'Chưa đủ dữ liệu'));
  const visibleMetrics = report.metrics.slice(0, 8);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader title={report.title} description={report.description} status={report.status} />
        <ActionLinks status={report.status} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {visibleMetrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} trend={metric.trend} status={metric.status ?? 'neutral'} compact showSparkline sparkSeed={metric.status === 'good' ? 'up' : metric.status === 'danger' ? 'down' : 'flat'} />)}
      </section>

      {!hasRows ? <EmptyState title={report.emptyTitle ?? 'Chưa đủ dữ liệu để kết luận'} description={report.emptyDescription ?? 'Engine đã sẵn sàng đọc Data Master V7. Khi có dữ liệu thật, màn hình này sẽ tự tính chỉ số, cảnh báo và bảng chi tiết.'} /> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lang-line px-4 py-3"><CardTitle>{report.primary.title}</CardTitle><StatusBadge status={report.status} /></div>
          <div className="p-3"><ReportTable headers={report.primary.headers} rows={report.primary.rows} maxHeight="max-h-[420px]" /></div>
        </Card>
        <div className="space-y-4">
          <Card><CardTitle>{report.secondary.title}</CardTitle><div className="mt-3"><ReportTable headers={report.secondary.headers} rows={report.secondary.rows} maxHeight="max-h-[210px]" /></div></Card>
          <Card><CardTitle>{report.issues.title}</CardTitle><div className="mt-3"><ReportTable headers={report.issues.headers} rows={report.issues.rows} maxHeight="max-h-[210px]" /></div></Card>
        </div>
      </section>

      <Card><CardTitle>{report.readiness.title}</CardTitle><div className="mt-3"><ReportTable headers={report.readiness.headers} rows={report.readiness.rows} maxHeight="max-h-[220px]" /></div></Card>
    </div>
  );
}
