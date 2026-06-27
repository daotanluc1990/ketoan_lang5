import { filterRowsByReportFilters, normalizeText, type ReportFilters } from './report-filters';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

type Summary = {
  revenue: number;
  otherIn: number;
  storeCost: number;
  bttCost: number;
  supplierPay: number;
  capex: number;
  unknown: number;
};

function n(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/,/g, '').replace(/đ/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function amount(row: Record<string, unknown>) {
  return Math.abs(n(row['Số tiền']) || n(row['Giá trị']));
}

function text(row: Record<string, unknown>) {
  return normalizeText([
    row['Loại giao dịch'], row['Nhóm thu/chi'], row['Phân loại P&L'],
    row['Khu vực'], row['Chi nhánh'], row['Diễn giải'], row['Ghi chú'], row['Nội dung']
  ].join(' '));
}

function isOut(row: Record<string, unknown>) {
  const raw = normalizeText(row['Loại giao dịch']);
  if (raw.includes('chi')) return true;
  if (raw.includes('thu')) return false;
  return (n(row['Số tiền']) || n(row['Giá trị'])) < 0;
}

function group(row: Record<string, unknown>) {
  const t = text(row);
  if (!isOut(row)) return t.includes('doanh-thu') || t.includes('ban-hang') || t.includes('grab') || t.includes('shopee') || t.includes('momo') ? 'revenue' : 'otherIn';
  if (t.includes('bep-trung-tam') || t.includes('btt') || t.includes('kho-bep')) return 'bttCost';
  if (t.includes('ncc') || t.includes('nha-cung-cap') || t.includes('cong-no') || t.includes('tra-no')) return 'supplierPay';
  if (t.includes('capex') || t.includes('tai-san') || t.includes('thiet-bi') || t.includes('may-moc')) return 'capex';
  if (!t || t.includes('khac') || t.includes('chua-phan-loai')) return 'unknown';
  return 'storeCost';
}

export function analyzeCashbookBusiness(rows: Record<string, unknown>[]) {
  const s: Summary = { revenue: 0, otherIn: 0, storeCost: 0, bttCost: 0, supplierPay: 0, capex: 0, unknown: 0 };
  for (const row of rows) {
    const key = group(row) as keyof Summary;
    s[key] += amount(row);
  }
  const cashIn = s.revenue + s.otherIn;
  const cashOut = s.storeCost + s.bttCost + s.supplierPay + s.capex + s.unknown;
  const cashRows = [
    ['Tiền vào', 'Doanh thu bán hàng', money(s.revenue), 'Đối chiếu doanh thu', 'Không thay doanh thu chốt P&L', s.revenue ? 'Tốt' : 'Chưa đủ dữ liệu'],
    ['Tiền vào', 'Thu khác', money(s.otherIn), 'Thu ngoài bán hàng', 'Không tính là doanh thu bán hàng', s.otherIn ? 'Cần kiểm' : 'Tốt'],
    ['Tiền ra', 'Chi vận hành cửa hàng', money(s.storeCost), 'Chi cửa hàng', 'Có thể xét vào chi phí vận hành', s.storeCost ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'],
    ['Tiền ra', 'Chi Bếp Trung Tâm', money(s.bttCost), 'Theo dõi riêng BTT', 'Không trộn vào chi Làng NVT', s.bttCost ? 'Cần đối chiếu' : 'Tốt'],
    ['Tiền ra', 'Trả NCC / công nợ', money(s.supplierPay), 'Dòng tiền trả nợ', 'Không tự đưa vào P&L', s.supplierPay ? 'Cần đối chiếu' : 'Tốt'],
    ['Tiền ra', 'Capex / tài sản', money(s.capex), 'Đầu tư tài sản', 'Không tính chi phí vận hành tuần', s.capex ? 'Cần kiểm' : 'Tốt'],
    ['Tiền ra', 'Chi cần phân loại', money(s.unknown), 'Chưa rõ bản chất', 'Phân loại trước khi chốt', s.unknown ? 'Cảnh báo' : 'Tốt'],
    ['Dòng tiền', 'Dòng tiền thuần', money(cashIn - cashOut), 'Tổng thu - tổng chi', 'Xem tiền thật, không thay P&L', cashIn - cashOut < 0 ? 'Nguy hiểm' : 'Tốt']
  ];
  const pnlRows = [
    ['Đối chiếu', 'Doanh thu từ sổ quỹ', money(s.revenue), 'Không thay doanh thu app/cửa hàng', s.revenue ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'],
    ['P&L tạm', 'Chi vận hành cửa hàng', money(s.storeCost), 'Có thể xét vào chi phí vận hành', s.storeCost ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'],
    ['Theo dõi riêng', 'Chi Bếp Trung Tâm', money(s.bttCost), 'Không trộn vào chi phí Làng NVT', s.bttCost ? 'Cần đối chiếu' : 'Tốt'],
    ['Theo dõi riêng', 'Trả NCC / công nợ', money(s.supplierPay), 'Chỉ vào P&L khi đối chiếu thu mua/công nợ', s.supplierPay ? 'Cần đối chiếu' : 'Tốt'],
    ['Theo dõi riêng', 'Capex / tài sản', money(s.capex), 'Không tính chi phí vận hành tuần', s.capex ? 'Cần kiểm' : 'Tốt'],
    ['Chặn chốt', 'Chi cần phân loại', money(s.unknown), 'Phân loại trước khi chốt', s.unknown ? 'Cảnh báo' : 'Tốt']
  ];
  return { summary: s, cashRows, pnlRows };
}

export function filterCashbookBusiness(rows: Record<string, unknown>[], filters: ReportFilters) {
  return filterRowsByReportFilters(rows, SHEET_NAMES.DL_SO_QUY, filters);
}
