import { AlertTriangle, ArrowRight, BriefcaseBusiness, CheckCircle2, Database, Download, FileInput, RefreshCcw, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { StatusBadge } from '@/components/report/StatusBadge';
import { Card, CardTitle } from '@/components/ui/Card';
import type { DashboardReport } from '@/lib/reports/report-aggregator';

function statusRows(report: DashboardReport) {
  const canClose = report.hasRealData && report.missingSources.length === 0;
  return [
    ['1', 'Trạng thái báo cáo tuần', canClose ? 'Có thể chốt' : 'Chưa thể chốt', report.missingSources.length ? `Thiếu ${report.missingSources.length} nguồn` : 'Đủ nguồn chính', canClose ? 'Kiểm tra cuối rồi gửi CEO/Bot' : 'Bổ sung dữ liệu trước'],
    ['2', 'Cửa hàng', report.sourceCounts.storeRevenue || report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Bán hàng, tồn kho, hủy hàng', 'Kiểm nhập - xuất - tồn - bán - hủy'],
    ['3', 'Bếp Trung Tâm', report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Tồn kho/xuất cho cửa hàng cần tách riêng', 'Kiểm BTT xuất ↔ cửa hàng nhận'],
    ['4', 'Sổ quỹ & công nợ', report.sourceCounts.cashbook ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', `${report.sourceCounts.cashbook} dòng sổ quỹ`, 'Phân loại chi BTT, chi cửa hàng, trả NCC'],
    ['5', 'Thất thoát & hủy hàng', report.sourceCounts.lossRows ? 'Cảnh báo' : 'Chưa đủ dữ liệu', `${report.sourceCounts.lossRows} dòng NVL`, 'Xử lý tồn âm, lệch tồn, hủy/hư hỏng']
  ];
}

function reconciliationRows(report: DashboardReport) {
  return [
    ['BTT xuất ↔ Cửa hàng nhận', 'Cần đối chiếu', 'Mã phiếu, mã hàng, số lượng, ngày', 'Chặn chốt nếu lệch lớn'],
    ['Bán hàng ↔ Định mức', report.sourceCounts.storeRevenue || report.sourceCounts.appRevenue ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Món bán, số lượng, định mức NVL', 'Thiếu định mức thì không tính thất thoát chuẩn'],
    ['Tồn lý thuyết ↔ Tồn thực tế', report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Tồn đầu, nhập, xuất, bán, hủy, tồn cuối', 'Tồn âm là lỗi nghiêm trọng'],
    ['Sổ quỹ ↔ Công nợ', report.sourceCounts.cashbook ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', 'Trả NCC, công nợ, thu mua', 'Không tự đưa trả NCC vào P&L'],
    ['Chi BTT ↔ Chi cửa hàng', report.cashbookWarningRows.length ? 'Cảnh báo' : 'Cần đối chiếu', `${report.cashbookWarningRows.length} khoản chi lớn`, 'Không trộn chi BTT vào chi cửa hàng']
  ];
}

function issueStats(report: DashboardReport) {
  const danger = report.totals.negativeStockCount ? 1 : 0;
  const warning = report.cashbookWarningRows.length + (report.sourceCounts.lossRows ? 1 : 0);
  const needCheck = report.missingSources.length + (report.sourceCounts.inventory ? 1 : 0);
  const noData = report.missingSources.length;
  const done = Math.max(0, 5 - report.missingSources.length);
  return [
    ['Tất cả vấn đề', danger + warning + needCheck + noData, 'border-lang-red bg-white text-lang-red'],
    ['Nguy hiểm', danger, 'border-red-200 bg-red-50 text-red-700'],
    ['Cảnh báo', warning, 'border-orange-200 bg-orange-50 text-orange-700'],
    ['Cần đối chiếu', needCheck, 'border-amber-200 bg-amber-50 text-amber-700'],
    ['Chưa đủ dữ liệu', noData, 'border-gray-200 bg-gray-50 text-gray-600'],
    ['Đã xử lý', done, 'border-emerald-200 bg-emerald-50 text-emerald-700']
  ] as const;
}

function sourceRows(report: DashboardReport) {
  return [
    ['Doanh thu cửa hàng', report.sourceCounts.storeRevenue ? 'Tốt' : 'Chưa đủ dữ liệu', report.sourceCounts.storeRevenue ? `${report.sourceCounts.storeRevenue} dòng` : 'Thiếu DL_DOANH_THU_CUA_HANG', 'Dùng đối chiếu doanh thu trực tiếp'],
    ['Doanh thu app', report.sourceCounts.appRevenue ? 'Tốt' : 'Chưa đủ dữ liệu', report.sourceCounts.appRevenue ? `${report.sourceCounts.appRevenue} dòng` : 'Thiếu DL_DOANH_THU_APP', 'Dùng tính app net/phí app'],
    ['Sổ quỹ', report.sourceCounts.cashbook ? 'Tốt' : 'Chưa đủ dữ liệu', report.sourceCounts.cashbook ? `${report.sourceCounts.cashbook} dòng` : 'Thiếu DL_SO_QUY', 'Dùng kiểm tiền vào/ra'],
    ['Tồn kho', report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', report.sourceCounts.inventory ? `${report.sourceCounts.inventory} dòng` : 'Thiếu tồn kho', 'Dùng kiểm kho/BTT'],
    ['Thất thoát', report.sourceCounts.lossRows ? 'Cảnh báo' : 'Chưa đủ dữ liệu', report.sourceCounts.lossRows ? `${report.sourceCounts.lossRows} dòng` : 'Thiếu DL_THAT_THOAT_NVL', 'Dùng kiểm hao hụt']
  ];
}

function actionCards(report: DashboardReport) {
  const canClose = report.hasRealData && report.missingSources.length === 0;
  return [
    { title: canClose ? 'Preview chốt tuần' : 'Bổ sung nguồn còn thiếu', value: canClose ? 'Sẵn sàng' : `${report.missingSources.length} nguồn`, status: canClose ? 'Tốt' : 'Cần đối chiếu', href: canClose ? '/lich-su-chot-bao-cao' : '/import-nhap-lieu', icon: canClose ? ShieldCheck : FileInput },
    { title: 'Kiểm khoản chi lớn', value: `${report.cashbookWarningRows.length} khoản`, status: report.cashbookWarningRows.length ? 'Cảnh báo' : 'Tốt', href: '/dong-tien', icon: AlertTriangle },
    { title: 'Kiểm tồn kho & BTT', value: `${report.totals.negativeStockCount} tồn âm`, status: report.sourceCounts.inventory ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu', href: '/kho-bep-trung-tam', icon: Database }
  ];
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function AccountingOverviewPage({ report }: { report: DashboardReport }) {
  const canClose = report.hasRealData && report.missingSources.length === 0;
  const kpis = report.executiveKpis.slice(0, 10);
  const readinessPercent = clampPercent(Math.round(((5 - report.missingSources.length) / 5) * 100));
  const currentStatus = canClose ? 'Tốt' : report.hasRealData ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu';

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-lang-muted">
            <span>Tuần 25/2026</span><span>·</span><span>Chi nhánh: Làng NVT</span><span>·</span><span>Trạng thái:</span><StatusBadge status={currentStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/import-nhap-lieu" className="inline-flex h-10 items-center gap-2 rounded-lg border border-lang-line bg-white px-4 text-[13px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><FileInput className="h-4 w-4" />Import dữ liệu</Link>
          <Link href="/cai-dat-bot" className="inline-flex h-10 items-center gap-2 rounded-lg border border-lang-line bg-white px-4 text-[13px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><Send className="h-4 w-4" />Gửi CEO/Bot</Link>
          <Link href="/lich-su-chot-bao-cao" className="inline-flex h-10 items-center gap-2 rounded-lg bg-lang-red px-4 text-[13px] font-bold text-white shadow-sm hover:bg-lang-redDark"><ShieldCheck className="h-4 w-4" />Chốt báo cáo</Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-6">
        {kpis.map((kpi) => <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} trend={kpi.trend} status={kpi.status} compact />)}
      </section>

      <section className="grid overflow-hidden rounded-xl border border-orange-200 bg-white shadow-soft md:grid-cols-6">
        {issueStats(report).map(([label, value, className], index) => (
          <div key={label} className={`flex min-h-[72px] items-center gap-3 border-orange-100 px-4 py-3 ${index ? 'md:border-l' : ''} ${className}`}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/70"><BriefcaseBusiness className="h-4 w-4" /></span>
            <div>
              <p className="text-[12px] font-semibold text-lang-ink/80">{label}</p>
              <p className="number text-2xl font-black leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lang-line px-4 py-3">
            <div>
              <CardTitle>Việc kế toán cần xử lý</CardTitle>
              <p className="mt-0.5 text-[12px] font-medium text-lang-muted">Danh sách ưu tiên trước khi chốt báo cáo.</p>
            </div>
            <StatusBadge status={currentStatus} />
          </div>
          <div className="p-3"><ReportTable headers={['Ưu tiên', 'Mảng', 'Trạng thái', 'Bằng chứng', 'Hành động']} rows={statusRows(report)} maxHeight="max-h-[380px]" /></div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Top vấn đề cần rà</CardTitle>
            <div className="mt-3 space-y-2">
              {actionCards(report).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href} className="flex items-center justify-between gap-3 rounded-lg border border-lang-line p-3 hover:bg-gray-50">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lang-redSoft text-lang-red"><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0"><p className="truncate text-[13px] font-bold text-lang-ink">{item.title}</p><p className="text-[12px] text-lang-muted">{item.value}</p></div>
                    </div>
                    <StatusBadge status={item.status} />
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><CardTitle>Độ đủ dữ liệu</CardTitle><span className="text-[12px] font-bold text-lang-red">Chi tiết</span></div>
            <div className="mt-3 flex items-center gap-3">
              <div className="number text-3xl font-black text-lang-ink">{readinessPercent}</div><span className="text-sm font-bold text-lang-muted">/100</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-lang-red" style={{ width: `${readinessPercent}%` }} /></div>
            </div>
            <div className="mt-3"><ReportTable headers={['Mảng', 'Trạng thái', 'Bằng chứng', 'Cách dùng']} rows={sourceRows(report)} maxHeight="max-h-[240px]" /></div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardTitle>Đối chiếu ERP bắt buộc</CardTitle>
          <div className="mt-3"><ReportTable headers={['Đối chiếu', 'Trạng thái', 'Kiểm tra', 'Quy tắc']} rows={reconciliationRows(report)} maxHeight="max-h-[320px]" /></div>
        </Card>
        <Card>
          <CardTitle>Cảnh báo kế toán nổi bật</CardTitle>
          <div className="mt-3"><ReportTable headers={['STT', 'Vấn đề', 'Bằng chứng', 'Hành động']} rows={report.issueRows.length ? report.issueRows.map((row) => [row[0] ?? '', row[1] ?? '', row[2] ?? '', row[4] ?? '']) : [['1', 'Chưa có cảnh báo nổi bật', 'Tốt', 'Tiếp tục theo dõi']]} maxHeight="max-h-[320px]" /></div>
        </Card>
      </section>

      <section className="fixed bottom-5 left-4 right-4 z-20 mx-auto hidden max-w-[1220px] items-center justify-between gap-3 rounded-2xl border border-lang-line bg-white px-4 py-3 shadow-card lg:flex">
        <div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-lang-red text-white"><BriefcaseBusiness className="h-5 w-5" /></span><div><p className="text-sm font-black text-lang-ink">Tuần 25/2026</p><p className="text-[12px] text-lang-muted">01/06 – 07/06/2026</p></div><StatusBadge status={currentStatus} /></div>
        <div className="flex gap-2">
          <Link href="/ban-lam-viec-ke-toan" className="inline-flex h-10 items-center gap-2 rounded-lg bg-lang-red px-5 text-[13px] font-bold text-white hover:bg-lang-redDark"><BriefcaseBusiness className="h-4 w-4" />Xem bàn làm việc</Link>
          <Link href="/doi-chieu-btt-cua-hang" className="inline-flex h-10 items-center gap-2 rounded-lg border border-lang-red bg-white px-5 text-[13px] font-bold text-lang-red hover:bg-lang-redSoft"><RefreshCcw className="h-4 w-4" />Đối chiếu dữ liệu</Link>
          <Link href="/lich-su-chot-bao-cao" className="inline-flex h-10 items-center gap-2 rounded-lg border border-lang-red bg-white px-5 text-[13px] font-bold text-lang-red hover:bg-lang-redSoft"><Download className="h-4 w-4" />Xuất báo cáo</Link>
          <Link href="/that-thoat-ton-kho" className="inline-flex h-10 items-center gap-2 rounded-lg bg-lang-red px-5 text-[13px] font-bold text-white hover:bg-lang-redDark"><AlertTriangle className="h-4 w-4" />Cảnh báo</Link>
        </div>
      </section>

      <section className="rounded-xl border border-lang-line bg-white p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></span>
          <div><p className="text-[12px] font-black uppercase tracking-wide text-lang-red">Production rule</p><p className="mt-1 text-sm font-semibold text-lang-muted">Không dùng số mẫu · Không kết luận khi thiếu nguồn · Dashboard chỉ phản ánh dữ liệu thật đã import.</p></div>
        </div>
      </section>
    </div>
  );
}
