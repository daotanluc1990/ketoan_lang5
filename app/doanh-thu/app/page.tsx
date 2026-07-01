import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { normalizeChannel } from '@/lib/import/parsers/excel-utils';

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

export default async function AppGiaoHangPage() {
  // Đọc cả DL_SO_QUY (phiếu thu app) + DL_DOANH_THU_APP
  let soQuyRows: Record<string, unknown>[] = [];
  let appRows: Record<string, unknown>[] = [];
  try { soQuyRows = await getDataStore().read(SHEET_NAMES.DL_SO_QUY); } catch {}
  try { appRows = await getDataStore().read(SHEET_NAMES.DL_DOANH_THU_APP); } catch {}

  // Phiếu thu từ app trong sổ quỹ
  const appCashRows = soQuyRows.filter((r) => {
    const nd = asText(get(r, ['Loại thu chi', 'Nội dung', 'Ghi chú'])).toLowerCase();
    return nd.includes('grab') || nd.includes('shopee') || nd.includes('befood') || nd.includes('be food') || nd.includes('xanh') || nd.includes('app');
  });

  // Nhóm theo kênh
  const channels: Record<string, { revenue: number; count: number }> = {};
  for (const r of appCashRows) {
    const raw = asText(get(r, ['Loại thu chi', 'Nội dung', 'Ghi chú']));
    const ch = normalizeChannel(raw) || 'Khác';
    const amt = toNumber(get(r, ['Giá trị', 'Số tiền']));
    if (!channels[ch]) channels[ch] = { revenue: 0, count: 0 };
    channels[ch].revenue += amt;
    channels[ch].count++;
  }
  const tongApp = Object.values(channels).reduce((s, c) => s + c.revenue, 0);

  const tableRows = appCashRows.slice(0, 50).map((r) => [
    asText(get(r, ['Ngày', 'Thời gian'])).slice(0, 10),
    normalizeChannel(asText(get(r, ['Loại thu chi', 'Nội dung', 'Ghi chú']))) || 'Khác',
    formatMoney(toNumber(get(r, ['Giá trị', 'Số tiền']))),
    asText(get(r, ['Trạng thái'])),
  ]);

  const channelKpis = Object.entries(channels).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 4);

  return (
    <div className="space-y-4">
      <PageHeader title="App giao hàng" description="Doanh thu Grab/ShopeeFood/BeFood/Xanh + tiền app chưa về." status={appCashRows.length ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng DT app" value={formatMoney(tongApp)} status={tongApp ? 'good' : 'neutral'} compact />
        {channelKpis.map(([ch, data]) => (
          <MetricCard key={ch} label={ch} value={formatMoney(data.revenue)} status="neutral" compact />
        ))}
      </section>
      {appCashRows.length ? (
        <Card><CardTitle>Bảng giao dịch app</CardTitle><div className="mt-3"><ReportTable headers={['Ngày', 'Kênh', 'Số tiền', 'Trạng thái']} rows={tableRows} maxHeight="max-h-[400px]" /></div></Card>
      ) : (
        <EmptyState title="Chưa có dữ liệu app giao hàng" description="Import file Sổ quỹ (có phiếu thu Grab/ShopeeFood/BeFood) để xem doanh thu app." />
      )}
    </div>
  );
}
