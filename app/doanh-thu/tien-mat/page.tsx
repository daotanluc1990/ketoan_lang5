import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const dynamic = 'force-dynamic';

function toNumber(value: unknown) {
  if (typeof value === 'number') return value;
  const text = String(value ?? '').replace(/\s/g, '').replace(/đ|vnd/gi, '').replace(/,/g, '').replace(/%/g, '');
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}
function formatMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}K`;
  return value.toLocaleString('vi-VN');
}
function asText(value: unknown) { return String(value ?? '').trim(); }
function get(row: Record<string, unknown>, keys: string[]) {
  for (const k of keys) { const v = row[k]; if (asText(v)) return v; }
  return '';
}

export default async function TienMatPage() {
  let rows: Record<string, unknown>[] = [];
  try { rows = await getDataStore().read(SHEET_NAMES.DL_SO_QUY); } catch {}

  const cashRows = rows.filter((r) => {
    const pt = asText(get(r, ['Loại sổ quỹ', 'Phương thức'])).toLowerCase();
    return pt.includes('tiền mặt') || pt.includes('tien mat') || pt.includes('cash');
  });
  const tongThu = cashRows.filter((r) => toNumber(get(r, ['Giá trị', 'Số tiền'])) > 0).reduce((s, r) => s + toNumber(get(r, ['Giá trị', 'Số tiền'])), 0);
  const tongChi = cashRows.filter((r) => toNumber(get(r, ['Giá trị', 'Số tiền'])) < 0).reduce((s, r) => s + Math.abs(toNumber(get(r, ['Giá trị', 'Số tiền']))), 0);
  const tableRows = cashRows.slice(0, 50).map((r) => [
    asText(get(r, ['Ngày', 'Thời gian'])).slice(0, 10),
    asText(get(r, ['Loại thu chi', 'Nội dung'])),
    formatMoney(toNumber(get(r, ['Giá trị', 'Số tiền']))),
    asText(get(r, ['Ghi chú', 'Diễn giải'])).slice(0, 40),
    asText(get(r, ['Trạng thái'])),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Tiền mặt" description="Doanh thu tiền mặt + đối soát lệch tiền từ DL_SO_QUY." status={cashRows.length ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng thu tiền mặt" value={formatMoney(tongThu)} status={tongThu ? 'good' : 'neutral'} compact />
        <MetricCard label="Tổng chi tiền mặt" value={formatMoney(tongChi)} status="neutral" compact />
        <MetricCard label="Dòng tiền mặt" value={formatMoney(tongThu - tongChi)} status={tongThu - tongChi > 0 ? 'good' : 'danger'} compact />
        <MetricCard label="Số giao dịch" value={String(cashRows.length)} status="neutral" compact />
      </section>
      {cashRows.length ? (
        <Card><CardTitle>Bảng giao dịch tiền mặt</CardTitle><div className="mt-3"><ReportTable headers={['Ngày', 'Nội dung', 'Số tiền', 'Ghi chú', 'Trạng thái']} rows={tableRows} maxHeight="max-h-[400px]" /></div></Card>
      ) : (
        <EmptyState title="Chưa có dữ liệu tiền mặt" description="Import file Sổ quỹ (SoQuy_KV*.xlsx) để xem giao dịch tiền mặt." />
      )}
    </div>
  );
}
