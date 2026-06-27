import Link from 'next/link';
import { FileInput, Send, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { StatusBadge } from '@/components/report/StatusBadge';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const dynamic = 'force-dynamic';

async function readHistory() { try { return await getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU); } catch { return []; } }

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function BanLamViecKeToanPage({ searchParams }: PageProps) {
  const filters = await parsePageReportFilters(searchParams);
  const report = await buildDashboardReport(filters);
  const history = await readHistory();
  const missingCount = report.missingSources.length;
  const canClose = missingCount === 0;
  const checklistRows = [
    ['1', 'Doanh thu app', report.sourceCounts.appRevenue ? 'Đạt' : 'Chưa đủ dữ liệu', `${report.sourceCounts.appRevenue} dòng`, report.sourceCounts.appRevenue ? 'Đối chiếu' : 'Import'],
    ['2', 'Doanh thu cửa hàng', report.sourceCounts.storeRevenue ? 'Đạt' : 'Chưa đủ dữ liệu', `${report.sourceCounts.storeRevenue} dòng`, report.sourceCounts.storeRevenue ? 'Đối chiếu' : 'Import'],
    ['3', 'Sổ quỹ', report.sourceCounts.cashbook ? 'Đạt' : 'Chưa đủ dữ liệu', `${report.sourceCounts.cashbook} dòng`, report.sourceCounts.cashbook ? 'Phân loại' : 'Import'],
    ['4', 'Tồn kho', report.sourceCounts.inventory ? 'Đạt' : 'Chưa đủ dữ liệu', `${report.sourceCounts.inventory} dòng`, report.sourceCounts.inventory ? 'Kiểm tồn' : 'Import'],
    ['5', 'Thất thoát', report.sourceCounts.lossRows ? 'Đạt' : 'Chưa đủ dữ liệu', `${report.sourceCounts.lossRows} dòng`, report.sourceCounts.lossRows ? 'Kiểm định mức' : 'Import'],
    ['6', 'Chốt CEO', canClose ? 'Đạt' : 'Chưa thể chốt', missingCount ? `Thiếu ${missingCount}` : 'Đủ nguồn', canClose ? 'Gửi' : 'Xử lý']
  ];
  const taskRows = report.issueRows.length ? report.issueRows.slice(0, 6).map((row) => [row[1]?.includes('Thiếu') ? 'Cảnh báo' : 'Theo dõi', row[1] ?? '', row[2] ?? '', 'Kế toán', 'Hôm nay', row[4] ?? 'Kiểm tra']) : [['Tốt', 'Không có việc gấp', 'Ổn', 'Kế toán', 'Hôm nay', 'Theo dõi']];
  const historyRows = history.slice(-6).reverse().map((row) => [String(row['Ngày import'] ?? ''), String(row['Người import'] ?? ''), String(row['Trạng thái'] ?? ''), String(row['Ghi chú'] ?? '')]);

  return (
    <div className="space-y-2.5">
      <section className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader title="Bàn làm việc kế toán" status={canClose ? 'Tốt' : 'Chưa thể chốt'} />
        <div className="flex flex-wrap gap-2">
          <Link href="/import-nhap-lieu" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lang-line bg-white px-2.5 text-[12px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><FileInput className="h-3.5 w-3.5" />Import</Link>
          <Link href="/cai-dat-bot" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lang-line bg-white px-2.5 text-[12px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><Send className="h-3.5 w-3.5" />Bot</Link>
          <Link href="/lich-su-chot-bao-cao" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lang-red px-2.5 text-[12px] font-bold text-white shadow-sm hover:bg-lang-redDark"><ShieldCheck className="h-3.5 w-3.5" />Chốt</Link>
        </div>
      </section>
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Trạng thái" value={canClose ? 'Có thể chốt' : 'Chưa chốt'} status={canClose ? 'good' : 'warning'} compact />
        <MetricCard label="Nguồn dữ liệu" value={`${5 - missingCount}/5`} status={missingCount ? 'warning' : 'good'} compact />
        <MetricCard label="Cảnh báo" value={`${report.cashbookWarningRows.length}`} status={report.cashbookWarningRows.length ? 'warning' : 'good'} compact />
        <MetricCard label="Import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} compact />
      </section>
      <section className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="p-0"><div className="flex items-center justify-between border-b border-lang-line px-3 py-2"><CardTitle>Việc cần xử lý</CardTitle><StatusBadge status={canClose ? 'Tốt' : 'Cảnh báo'} /></div><div className="p-2"><ReportTable headers={['Mức độ', 'Vấn đề', 'Ảnh hưởng', 'Owner', 'Deadline', 'Cách kiểm']} rows={taskRows} maxHeight="max-h-[300px]" /></div></Card>
        <div className="space-y-2">
          <Card><CardTitle>Checklist</CardTitle><div className="mt-2"><ReportTable headers={['#', 'Nguồn', 'Trạng thái', 'Bằng chứng', 'Hành động']} rows={checklistRows} maxHeight="max-h-[240px]" /></div></Card>
          <Card><CardTitle>Chốt báo cáo</CardTitle><div className="mt-2 flex flex-wrap gap-2"><Button disabled={!canClose}>Chốt</Button><Button variant="secondary" disabled={!canClose}>Gửi CEO</Button><Button variant="secondary" disabled={!canClose}>Bot</Button></div></Card>
        </div>
      </section>
      <Card><CardTitle>Lịch sử thao tác</CardTitle><div className="mt-2"><ReportTable headers={['Thời gian', 'Người xử lý', 'Hành động', 'Ghi chú']} rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', '—']]} maxHeight="max-h-[180px]" /></div></Card>
    </div>
  );
}
