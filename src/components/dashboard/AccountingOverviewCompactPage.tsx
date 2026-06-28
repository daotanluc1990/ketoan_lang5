import { AlertTriangle, Database, FileInput, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ReportTable } from '@/components/report/ReportTable';
import { StatusBadge } from '@/components/report/StatusBadge';
import { Card, CardTitle } from '@/components/ui/Card';
import type { DashboardReport } from '@/lib/reports/report-aggregator';

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function kpiList(report: DashboardReport) {
  return report.executiveKpis.slice(0, 10).map((kpi) => ({ label: kpi.label, value: kpi.value, status: kpi.status, trend: kpi.trend }));
}

function issueStats(report: DashboardReport) {
  const danger = report.totals.negativeStockCount ? 1 : 0;
  const warning = report.cashbookWarningRows.length + (report.sourceCounts.lossRows ? 1 : 0);
  const needCheck = report.missingSources.length + (report.sourceCounts.inventory ? 1 : 0);
  const noData = report.missingSources.length;
  const done = Math.max(0, 5 - report.missingSources.length);
  return [
    ['Tất cả', danger + warning + needCheck + noData, 'text-lang-red bg-white'],
    ['Nguy hiểm', danger, 'text-red-700 bg-red-50'],
    ['Cảnh báo', warning, 'text-orange-700 bg-orange-50'],
    ['Đối chiếu', needCheck, 'text-amber-700 bg-amber-50'],
    ['Thiếu dữ liệu', noData, 'text-gray-600 bg-gray-50'],
    ['Đã xử lý', done, 'text-emerald-700 bg-emerald-50']
  ] as const;
}

function workRows(report: DashboardReport) {
  const canClose = report.hasRealData && report.missingSources.length === 0;
  return [
    ['1', 'Báo cáo tuần', canClose ? 'Có thể chốt' : 'Chưa thể chốt', report.missingSources.length ? `Thiếu ${report.missingSources.length} nguồn` : 'Đủ nguồn', canClose ? 'Preview' : 'Import'],
    ['2', 'Cửa hàng', report.sourceCounts.storeRevenue || report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Bán hàng / tồn kho', 'Kiểm kho'],
    ['3', 'Bếp Trung Tâm', report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Tồn / xuất BTT', 'Đối chiếu'],
    ['4', 'Sổ quỹ', report.sourceCounts.cashbook ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', `${report.sourceCounts.cashbook} dòng`, 'Phân loại'],
    ['5', 'Thất thoát', report.sourceCounts.lossRows ? 'Cảnh báo' : 'Chưa đủ dữ liệu', `${report.sourceCounts.lossRows} dòng`, 'Kiểm tra']
  ];
}

function sourceRows(report: DashboardReport) {
  return [
    ['Doanh thu CH', report.sourceCounts.storeRevenue ? 'Tốt' : 'Chưa đủ dữ liệu', report.sourceCounts.storeRevenue ? `${report.sourceCounts.storeRevenue} dòng` : 'Thiếu'],
    ['Doanh thu app', report.sourceCounts.appRevenue ? 'Tốt' : 'Chưa đủ dữ liệu', report.sourceCounts.appRevenue ? `${report.sourceCounts.appRevenue} dòng` : 'Thiếu'],
    ['Sổ quỹ', report.sourceCounts.cashbook ? 'Tốt' : 'Chưa đủ dữ liệu', report.sourceCounts.cashbook ? `${report.sourceCounts.cashbook} dòng` : 'Thiếu'],
    ['Tồn kho', report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', report.sourceCounts.inventory ? `${report.sourceCounts.inventory} dòng` : 'Thiếu'],
    ['Thất thoát', report.sourceCounts.lossRows ? 'Cảnh báo' : 'Chưa đủ dữ liệu', report.sourceCounts.lossRows ? `${report.sourceCounts.lossRows} dòng` : 'Thiếu']
  ];
}

function topIssues(report: DashboardReport, canClose: boolean) {
  return [
    { title: canClose ? 'Preview chốt tuần' : 'Bổ sung nguồn', value: canClose ? 'Sẵn sàng' : `${report.missingSources.length} nguồn`, status: canClose ? 'Tốt' : 'Cần đối chiếu', href: canClose ? '/lich-su-chot-bao-cao' : '/import-nhap-lieu', icon: canClose ? ShieldCheck : FileInput },
    { title: 'Chi lớn', value: `${report.cashbookWarningRows.length} khoản`, status: report.cashbookWarningRows.length ? 'Cảnh báo' : 'Tốt', href: '/dong-tien', icon: AlertTriangle },
    { title: 'Kho & BTT', value: `${report.totals.negativeStockCount} tồn âm`, status: report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', href: '/kho-bep-trung-tam', icon: Database }
  ];
}

function MiniKpi({ label, value, status, trend }: { label: string; value: string; status: string; trend?: string }) {
  return (
    <div className="rounded-lg border border-lang-line bg-white p-2.5 shadow-soft">
      <div className="flex items-start justify-between gap-2"><p className="truncate text-[12px] font-semibold text-lang-ink">{label}</p><StatusBadge status={status} /></div>
      <p className="number mt-1 text-xl font-black leading-none text-lang-ink">{value}</p>
      {trend ? <p className="mt-1 truncate text-[11px] font-semibold text-lang-muted">{trend}</p> : null}
    </div>
  );
}

export function AccountingOverviewCompactPage({ report }: { report: DashboardReport }) {
  const canClose = report.hasRealData && report.missingSources.length === 0;
  const status = canClose ? 'Tốt' : report.hasRealData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';
  const readiness = clamp(Math.round(((5 - report.missingSources.length) / 5) * 100));

  return (
    <div className="space-y-2.5">
      <section className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-lang-muted"><span>Tuần 25/2026</span><span>·</span><span>Làng NVT</span><span>·</span><StatusBadge status={status} /></div>
        <div className="flex flex-wrap gap-2">
          <Link href="/import-nhap-lieu" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lang-line bg-white px-2.5 text-[12px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><FileInput className="h-3.5 w-3.5" />Import</Link>
          <Link href="/cai-dat-bot" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lang-line bg-white px-2.5 text-[12px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><Send className="h-3.5 w-3.5" />CEO/Bot</Link>
          <Link href="/lich-su-chot-bao-cao" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lang-red px-2.5 text-[12px] font-bold text-white shadow-sm hover:bg-lang-redDark"><ShieldCheck className="h-3.5 w-3.5" />Chốt</Link>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{kpiList(report).map((kpi) => <MiniKpi key={kpi.label} label={kpi.label} value={kpi.value} status={kpi.status ?? 'neutral'} trend={kpi.trend} />)}</section>

      <section className="grid overflow-hidden rounded-lg border border-lang-line bg-white md:grid-cols-6">{issueStats(report).map(([label, value, tone], index) => <div key={label} className={`flex min-h-[46px] items-center justify-between border-lang-line px-3 py-2 ${index ? 'md:border-l' : ''} ${tone}`}><span className="text-[12px] font-semibold">{label}</span><span className="number text-lg font-black">{value}</span></div>)}</section>

      <section className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_310px]">
        <Card className="p-0"><div className="flex items-center justify-between border-b border-lang-line px-3 py-2"><CardTitle>Việc kế toán cần xử lý</CardTitle><StatusBadge status={status} /></div><div className="p-2"><ReportTable headers={['Ưu tiên', 'Mảng', 'Trạng thái', 'Bằng chứng', 'Hành động']} rows={workRows(report)} maxHeight="max-h-[230px]" /></div></Card>
        <div className="space-y-2">
          <Card><CardTitle>Top vấn đề</CardTitle><div className="mt-2 space-y-1.5">{topIssues(report, canClose).map((item) => { const Icon = item.icon; return <Link key={item.title} href={item.href} className="flex items-center justify-between gap-2 rounded-lg border border-lang-line p-2 hover:bg-gray-50"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-lang-red" /><div><p className="text-[12px] font-bold text-lang-ink">{item.title}</p><p className="text-[11px] text-lang-muted">{item.value}</p></div></div><StatusBadge status={item.status} /></Link>; })}</div></Card>
          <Card><div className="flex items-center justify-between"><CardTitle>Độ đủ dữ liệu</CardTitle><span className="number text-base font-black text-lang-ink">{readiness}/100</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-lang-red" style={{ width: `${readiness}%` }} /></div><div className="mt-2"><ReportTable headers={['Mảng', 'Trạng thái', 'Bằng chứng']} rows={sourceRows(report)} maxHeight="max-h-[160px]" /></div></Card>
        </div>
      </section>
    </div>
  );
}
