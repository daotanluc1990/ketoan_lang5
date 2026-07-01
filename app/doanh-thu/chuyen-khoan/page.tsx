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
  const n = Number(text); return Number.isFinite(n) ? n : 0;
}
function formatMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}K`;
  return value.toLocaleString('vi-VN');
}
function asText(value: unknown) { return String(value ?? '').trim(); }
function get(row: Record<string, unknown>, keys: string[]) {
  for (const k of keys) { const v = row[k]; if (asText(v)) return v; } return '';
}

export default async function ChuyenKhoanPage() {
  let rows: Record<string, unknown>[] = [];
  try { rows = await getDataStore().read(SHEET_NAMES.DL_SO_QUY); } catch {}

  const ckRows = rows.filter((r) => {
    const pt = asText(get(r, ['Loại sổ quỹ', 'Phương thức'])).toLowerCase();
    return pt.includes('chuyển khoản') || pt.includes('chuyen khoan') || pt.includes('transfer') || pt.includes('banking');
  });
  const tongThu = ckRows.filter((r) => toNumber(get(r, ['Giá trị', 'Số tiền'])) > 0).reduce((s, r) => s + toNumber(get(r, ['Giá trị', 'Số tiền'])), 0);
  const tongChi = ckRows.filter((r) => toNumber(get(r, ['Giá trị', 'Số tiền'])) < 0).reduce((s, r) => s + Math.abs(toNumber(get(r, ['Giá trị', 'Số tiền']))), 0);
  const tableRows = ckRows.slice(0, 50).map((r) => [
    asText(get(r, ['Ngày', 'Thời gian'])).slice(0, 10),
    asText(get(r, ['Loại thu chi', 'Nội dung'])),
    formatMoney(toNumber(get(r, ['Giá trị', 'Số tiền']))),
    asText(get(r, ['Số tài khoản'])),
    asText(get(r, ['Trạng thái'])),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Chuyển khoản" description="Doanh thu chuyển khoản + giao dịch chưa xác định từ DL_SO_QUY." status={ckRows.length ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng thu CK" value={formatMoney(tongThu)} status={tongThu ? 'good' : 'neutral'} compact />
        <MetricCard label="Tổng chi CK" value={formatMoney(tongChi)} status="neutral" compact />
        <MetricCard label="Dòng tiền CK" value={formatMoney(tongThu - tongChi)} status={tongThu - tongChi > 0 ? 'good' : 'danger'} compact />
        <MetricCard label="Số giao dịch" value={String(ckRows.length)} status="neutral" compact />
      </section>
      {ckRows.length ? (
        <Card><CardTitle>Bảng giao dịch chuyển khoản</CardTitle><div className="mt-3"><ReportTable headers={['Ngày', 'Nội dung', 'Số tiền', 'Số TK', 'Trạng thái']} rows={tableRows} maxHeight="max-h-[400px]" /></div></Card>
      ) : (
        <EmptyState title="Chưa có dữ liệu chuyển khoản" description="Import file Sổ quỹ để xem giao dịch chuyển khoản." />
      )}
    </div>
  );
}
