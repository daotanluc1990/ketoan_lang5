import Link from 'next/link';
import { FileInput, Send, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { StatusBadge } from '@/components/report/StatusBadge';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDataStore } from '@/lib/data-store';

type SheetSpec = { name: string; label: string };

type V7ModulePageProps = {
  title: string;
  description: string;
  statusWhenData?: 'Tốt' | 'Cần đối chiếu' | 'Cảnh báo';
  sheets: SheetSpec[];
  primaryHeaders?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  notes?: string[][];
};

function cell(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && String(value ?? '').trim()) return String(value ?? '');
  }
  return '—';
}

function previewRows(rows: Record<string, unknown>[], headers: string[]) {
  return rows.slice(0, 10).map((row) => headers.map((header) => cell(row, [header])));
}

function ActionLinks({ status }: { status: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/import-nhap-lieu" className="inline-flex h-9 items-center gap-2 rounded-lg border border-lang-line bg-white px-3 text-[13px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><FileInput className="h-4 w-4" />Import</Link>
      <Link href="/cai-dat-bot" className="inline-flex h-9 items-center gap-2 rounded-lg border border-lang-line bg-white px-3 text-[13px] font-bold text-lang-ink shadow-sm hover:bg-gray-50"><Send className="h-4 w-4" />Bot</Link>
      <Link href="/lich-su-chot-bao-cao" className="inline-flex h-9 items-center gap-2 rounded-lg bg-lang-red px-3 text-[13px] font-bold text-white shadow-sm hover:bg-lang-redDark"><ShieldCheck className="h-4 w-4" />Chốt</Link>
      <StatusBadge status={status} />
    </div>
  );
}

export async function V7ModulePage({
  title,
  description,
  statusWhenData = 'Cần đối chiếu',
  sheets,
  primaryHeaders = ['Ngày', 'Chi nhánh', 'Kho', 'Mã hàng', 'Tên hàng', 'Số lượng', 'Giá trị', 'Trạng thái'],
  emptyTitle = 'Chưa đủ dữ liệu để kết luận',
  emptyDescription = 'Data Master V7 đã có cấu trúc sheet, nhưng kỳ này chưa có dòng dữ liệu hợp lệ cho màn hình này.',
  notes = []
}: V7ModulePageProps) {
  const store = getDataStore();
  const loaded = await Promise.all(sheets.map(async (sheet) => ({ sheet, rows: await store.read(sheet.name) })));
  const totalRows = loaded.reduce((total, item) => total + item.rows.length, 0);
  const status = totalRows > 0 ? statusWhenData : 'Chưa đủ dữ liệu';
  const primary = loaded.find((item) => item.rows.length > 0) ?? loaded[0];

  const readinessRows = loaded.map((item) => [item.sheet.label, item.sheet.name, String(item.rows.length), item.rows.length > 0 ? 'Có dữ liệu' : 'Chưa đủ dữ liệu']);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader title={title} description={description} status={status} />
        <ActionLinks status={status} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng dòng dữ liệu" value={`${totalRows}`} status={totalRows > 0 ? 'good' : 'neutral'} trend="Data Master V7" compact />
        <MetricCard label="Nguồn sheet" value={`${sheets.length}`} status="good" trend="Đã khai báo" compact />
        <MetricCard label="Sheet chính" value={primary?.sheet.label ?? '—'} status={primary?.rows.length ? 'good' : 'neutral'} trend={primary?.sheet.name ?? '—'} compact />
        <MetricCard label="Trạng thái" value={status} status={totalRows > 0 ? 'warning' : 'neutral'} trend="Không dùng số mẫu" compact />
      </section>

      {totalRows === 0 ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lang-line px-4 py-3"><CardTitle>{primary?.sheet.label ?? 'Dữ liệu chính'}</CardTitle><StatusBadge status={status} /></div>
          <div className="p-3"><ReportTable headers={primaryHeaders} rows={primary?.rows.length ? previewRows(primary.rows, primaryHeaders) : [['—', '—', '—', '—', '—', '—', '—', 'Chưa đủ dữ liệu']]} maxHeight="max-h-[420px]" /></div>
        </Card>
        <div className="space-y-4">
          <Card><CardTitle>Độ sẵn sàng dữ liệu</CardTitle><div className="mt-3"><ReportTable headers={['Nguồn', 'Sheet', 'Dòng', 'Trạng thái']} rows={readinessRows} maxHeight="max-h-[240px]" /></div></Card>
          <Card><CardTitle>Ghi chú kiểm tra</CardTitle><div className="mt-3"><ReportTable headers={['Việc cần kiểm', 'Ý nghĩa', 'Trạng thái']} rows={notes.length ? notes : [['Schema', 'Đã map tên sheet V7', 'Đạt'], ['Dữ liệu', 'Chưa đủ thì không kết luận', 'Cần kiểm']]} maxHeight="max-h-[220px]" /></div></Card>
        </div>
      </section>
    </div>
  );
}
