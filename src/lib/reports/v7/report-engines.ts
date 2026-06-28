import type { DataRow } from '@/lib/data-store/store-interface';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { Status } from '@/lib/report-types';

export type V7Metric = {
  label: string;
  value: string;
  trend?: string;
  status?: Status;
};

export type V7Table = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type V7Report = {
  title: string;
  description: string;
  status: string;
  metrics: V7Metric[];
  primary: V7Table;
  secondary: V7Table;
  readiness: V7Table;
  issues: V7Table;
  emptyTitle?: string;
  emptyDescription?: string;
};

type SourceSpec = {
  sheetName: string;
  label: string;
  rows: DataRow[];
};

type Store = ReturnType<typeof getDataStore>;

const MONEY_KEYS = ['Giá trị', 'Giá trị tồn', 'Giá trị tồn thực tế', 'Giá trị lệch', 'Giá trị chênh lệch', 'Giá trị thất thoát', 'Giá trị vượt', 'Thành tiền', 'Số tiền'];
const QUANTITY_KEYS = ['Số lượng', 'Số lượng xuất', 'Số lượng nhận', 'Lệch', 'Chênh lệch', 'Thiếu', 'Dư', 'Vượt SL'];

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function get(row: DataRow, keys: string[]) {
  for (const key of keys) {
    const direct = row[key];
    if (asText(direct)) return direct;
  }
  const entries = Object.entries(row);
  for (const key of keys) {
    const normalized = key.toLowerCase();
    const found = entries.find(([entryKey, value]) => entryKey.toLowerCase().includes(normalized) && asText(value));
    if (found) return found[1];
  }
  return '';
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = asText(value)
    .replace(/\s/g, '')
    .replace(/đ|vnd/gi, '')
    .replace(/,/g, '')
    .replace(/%/g, '');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberFrom(row: DataRow, keys: string[]) {
  return toNumber(get(row, keys));
}

function sumRows(rows: DataRow[], keys: string[]) {
  return rows.reduce((total, row) => total + numberFrom(row, keys), 0);
}

function formatNumber(value: number, suffix = '') {
  return `${Math.round(value).toLocaleString('vi-VN')}${suffix}`;
}

function formatMoney(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}K`;
  return value.toLocaleString('vi-VN');
}

function statusForRows(rows: DataRow[], warningCount: number) {
  if (!rows.length) return 'Chưa đủ dữ liệu';
  if (warningCount > 0) return 'Cảnh báo';
  return 'Tốt';
}

function rowStatus(row: DataRow) {
  return asText(get(row, ['Trạng thái', 'Trạng thái dữ liệu', 'Đánh giá', 'Kết luận'])) || 'Cần kiểm';
}

function sortByAbsValue(rows: DataRow[], keys: string[]) {
  return [...rows].sort((a, b) => Math.abs(numberFrom(b, keys)) - Math.abs(numberFrom(a, keys)));
}

function sourceReadiness(sources: SourceSpec[]): V7Table {
  return {
    title: 'Độ sẵn sàng dữ liệu',
    headers: ['Nguồn', 'Sheet', 'Dòng', 'Trạng thái'],
    rows: sources.map((source) => [source.label, source.sheetName, formatNumber(source.rows.length), source.rows.length ? 'Đạt' : 'Chưa đủ dữ liệu'])
  };
}

function missingIssues(sources: SourceSpec[], extra: string[][] = []): V7Table {
  const missing = sources.filter((source) => !source.rows.length).map((source, index) => [String(index + 1), source.label, 'Chưa đủ dữ liệu', `Cần import hoặc map sheet ${source.sheetName}`]);
  return {
    title: 'Việc cần xử lý trước khi chốt',
    headers: ['Ưu tiên', 'Mảng', 'Trạng thái', 'Hành động'],
    rows: [...missing, ...extra].length ? [...missing, ...extra] : [['1', 'Dữ liệu', 'Tốt', 'Không có cảnh báo lớn trong nguồn hiện có']]
  };
}

function tableRows(rows: DataRow[], headers: string[], keysByHeader: Record<string, string[]>, limit = 12) {
  if (!rows.length) return [['—', '—', '—', '—', '—', '—', '—', 'Chưa đủ dữ liệu']];
  return rows.slice(0, limit).map((row) => headers.map((header) => asText(get(row, keysByHeader[header] ?? [header])) || '—'));
}

function topValueRows(rows: DataRow[], labelKeys: string[], valueKeys: string[], title = 'Top giá trị ảnh hưởng'): V7Table {
  const sorted = sortByAbsValue(rows, valueKeys).slice(0, 8);
  return {
    title,
    headers: ['#', 'Đối tượng', 'Giá trị', 'Trạng thái'],
    rows: sorted.length ? sorted.map((row, index) => [String(index + 1), asText(get(row, labelKeys)) || 'Chưa rõ', formatMoney(numberFrom(row, valueKeys)), rowStatus(row)]) : [['1', 'Chưa có dữ liệu', '0', 'Chưa đủ dữ liệu']]
  };
}

async function readSources(store: Store, specs: Array<{ sheetName: string; label: string }>): Promise<SourceSpec[]> {
  return Promise.all(specs.map(async (spec) => ({ ...spec, rows: await store.read(spec.sheetName) })));
}

export async function buildStoreInventoryReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [{ sheetName: SHEET_NAMES.DL_XNT_CUA_HANG, label: 'XNT cửa hàng' }]);
  const rows = sources[0]?.rows ?? [];
  const varianceValue = sumRows(rows, ['Giá trị lệch', 'Giá trị chênh lệch', 'Giá trị thất thoát']);
  const negativeCount = rows.filter((row) => numberFrom(row, ['Lệch', 'Chênh lệch', 'Thiếu']) < 0 || rowStatus(row).toLowerCase().includes('tồn âm')).length;
  const status = statusForRows(rows, negativeCount);
  const headers = ['Ngày', 'Chi nhánh', 'Kho', 'Mã hàng', 'Tên hàng', 'Tồn đầu', 'Nhập từ BTT', 'Xuất bán lý thuyết', 'Hủy', 'Tồn lý thuyết', 'Tồn thực tế', 'Lệch', 'Trạng thái'];
  const keys = Object.fromEntries(headers.map((header) => [header, [header]]));
  return {
    title: 'Kho cửa hàng',
    description: 'Engine thật đọc DL_XNT_CUA_HANG để kiểm soát xuất nhập tồn riêng từng cửa hàng.',
    status,
    metrics: [
      { label: 'Dòng XNT', value: formatNumber(rows.length), trend: 'DL_XNT_CUA_HANG', status: rows.length ? 'good' : 'neutral' },
      { label: 'Giá trị lệch', value: formatMoney(varianceValue), trend: varianceValue ? 'Cần giải trình' : 'Không phát sinh', status: varianceValue ? 'warning' : 'good' },
      { label: 'Tồn âm / thiếu', value: formatNumber(negativeCount), trend: 'Mặt hàng cần kiểm', status: negativeCount ? 'danger' : 'good' },
      { label: 'Tổng giá trị đọc được', value: formatMoney(sumRows(rows, MONEY_KEYS)), trend: 'Theo các cột giá trị hiện có', status: rows.length ? 'good' : 'neutral' }
    ],
    primary: { title: 'Bảng XNT cửa hàng', headers, rows: tableRows(rows, headers, keys) },
    secondary: topValueRows(rows, ['Tên hàng', 'Tên nguyên vật liệu', 'Mã hàng'], ['Giá trị lệch', 'Giá trị chênh lệch', 'Giá trị thất thoát'], 'Top NVL lệch lớn'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, negativeCount ? [['2', 'Kho cửa hàng', 'Cảnh báo', 'Kiểm kê lại và yêu cầu giải trình tồn âm/thiếu']] : [])
  };
}

export async function buildBttInventoryReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [{ sheetName: SHEET_NAMES.DL_XNT_BEP_TRUNG_TAM, label: 'XNT Bếp Trung Tâm' }]);
  const rows = sources[0]?.rows ?? [];
  const varianceValue = sumRows(rows, ['Giá trị lệch', 'Giá trị chênh lệch', 'Giá trị thất thoát']);
  const warningCount = rows.filter((row) => Math.abs(numberFrom(row, ['Lệch', 'Chênh lệch'])) > 0 || rowStatus(row).toLowerCase().includes('cảnh báo')).length;
  const headers = ['Ngày', 'Kho', 'Mã hàng', 'Tên hàng', 'Tồn đầu', 'Nhập NCC', 'Sản xuất/sơ chế', 'Xuất cửa hàng', 'Hủy BTT', 'Tồn lý thuyết', 'Tồn thực tế', 'Lệch', 'Trạng thái'];
  const keys = Object.fromEntries(headers.map((header) => [header, [header]]));
  return {
    title: 'Kho Bếp Trung Tâm',
    description: 'Engine thật đọc DL_XNT_BEP_TRUNG_TAM để tách BTT thành kho độc lập.',
    status: statusForRows(rows, warningCount),
    metrics: [
      { label: 'Dòng XNT BTT', value: formatNumber(rows.length), trend: 'DL_XNT_BEP_TRUNG_TAM', status: rows.length ? 'good' : 'neutral' },
      { label: 'Nhập NCC', value: formatMoney(sumRows(rows, ['Nhập NCC', 'Giá trị nhập NCC'])), status: rows.length ? 'good' : 'neutral' },
      { label: 'Xuất cửa hàng', value: formatMoney(sumRows(rows, ['Xuất cửa hàng', 'Giá trị xuất cửa hàng'])), status: rows.length ? 'good' : 'neutral' },
      { label: 'Giá trị lệch BTT', value: formatMoney(varianceValue), status: varianceValue ? 'warning' : 'good' }
    ],
    primary: { title: 'Bảng XNT BTT', headers, rows: tableRows(rows, headers, keys) },
    secondary: topValueRows(rows, ['Tên hàng', 'Tên nguyên vật liệu', 'Mã hàng'], ['Giá trị lệch', 'Giá trị chênh lệch', 'Giá trị thất thoát'], 'Top lệch BTT'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, warningCount ? [['2', 'Kho BTT', 'Cảnh báo', 'Đối chiếu nhập NCC, xuất cửa hàng và hủy BTT']] : [])
  };
}

export async function buildBttTransferReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [
    { sheetName: SHEET_NAMES.DL_XUAT_BTT_CHO_CUA_HANG, label: 'BTT xuất cho cửa hàng' },
    { sheetName: SHEET_NAMES.DL_CUA_HANG_NHAN_TU_BTT, label: 'Cửa hàng nhận từ BTT' }
  ]);
  const exportRows = sources[0]?.rows ?? [];
  const receiveRows = sources[1]?.rows ?? [];
  const totalRows = exportRows.length + receiveRows.length;
  const exportQty = sumRows(exportRows, ['Số lượng xuất', 'Số lượng']);
  const receiveQty = sumRows(receiveRows, ['Số lượng nhận', 'Số lượng']);
  const diffQty = exportQty - receiveQty;
  const headers = ['Ngày', 'Mã phiếu', 'Cửa hàng', 'Mã hàng', 'Tên hàng', 'Số lượng xuất', 'Số lượng nhận', 'Lệch', 'Trạng thái'];
  const combined = exportRows.map((row) => ({ ...row, 'Số lượng nhận': '', 'Lệch': numberFrom(row, ['Số lượng xuất', 'Số lượng']) }));
  const keys = Object.fromEntries(headers.map((header) => [header, [header, header.replace('Mã phiếu', 'Phiếu BTT')]]));
  return {
    title: 'Đối chiếu BTT - Cửa hàng',
    description: 'Engine thật đọc 2 nguồn BTT xuất và cửa hàng nhận để phát hiện phiếu lệch/chưa xác nhận.',
    status: statusForRows(sources.flatMap((source) => source.rows), diffQty ? 1 : 0),
    metrics: [
      { label: 'Phiếu BTT xuất', value: formatNumber(exportRows.length), status: exportRows.length ? 'good' : 'neutral' },
      { label: 'Dòng cửa hàng nhận', value: formatNumber(receiveRows.length), status: receiveRows.length ? 'good' : 'neutral' },
      { label: 'SL xuất', value: formatNumber(exportQty), status: exportRows.length ? 'good' : 'neutral' },
      { label: 'SL lệch tạm', value: formatNumber(diffQty), trend: 'Xuất - nhận', status: diffQty ? 'warning' : 'good' }
    ],
    primary: { title: 'Bảng đối chiếu phiếu BTT', headers, rows: tableRows(combined, headers, keys) },
    secondary: topValueRows(combined, ['Cửa hàng', 'Chi nhánh', 'Kho nhận'], ['Lệch', 'Số lượng xuất'], 'Top phiếu/cửa hàng cần kiểm'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, diffQty ? [['3', 'Đối chiếu BTT', 'Cảnh báo', 'So khớp phiếu xuất và phiếu nhận trước khi chốt']] : [])
  };
}

export async function buildWasteReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [
    { sheetName: SHEET_NAMES.DL_HUY_HANG_CUA_HANG, label: 'Hủy hàng cửa hàng' },
    { sheetName: SHEET_NAMES.DL_HUY_HANG_BTT, label: 'Hủy hàng BTT' }
  ]);
  const storeWaste = sources[0]?.rows ?? [];
  const bttWaste = sources[1]?.rows ?? [];
  const rows = sources.flatMap((source) => source.rows.map((row) => ({ ...row, 'Nguồn hủy': source.label })));
  const value = sumRows(rows, ['Giá trị', 'Giá trị hủy', 'Thành tiền']);
  const abnormal = rows.filter((row) => rowStatus(row).toLowerCase().includes('bất thường') || rowStatus(row).toLowerCase().includes('cảnh báo')).length;
  const headers = ['Ngày hủy', 'Nguồn hủy', 'Kho', 'Mã hàng', 'Tên hàng', 'Số lượng', 'ĐVT', 'Giá trị', 'Lý do', 'Trạng thái'];
  const keys = Object.fromEntries(headers.map((header) => [header, [header, header.replace('Ngày hủy', 'Ngày'), header.replace('Tên hàng', 'Tên nguyên vật liệu')]]));
  return {
    title: 'Hàng hủy',
    description: 'Engine thật tách hủy cửa hàng và hủy BTT, không gộp vào thất thoát tồn kho.',
    status: statusForRows(rows, abnormal),
    metrics: [
      { label: 'Tổng giá trị hủy', value: formatMoney(value), status: value ? 'warning' : 'good' },
      { label: 'Hủy cửa hàng', value: formatNumber(storeWaste.length), status: storeWaste.length ? 'warning' : 'neutral' },
      { label: 'Hủy BTT', value: formatNumber(bttWaste.length), status: bttWaste.length ? 'warning' : 'neutral' },
      { label: 'Hủy bất thường', value: formatNumber(abnormal), status: abnormal ? 'danger' : 'good' }
    ],
    primary: { title: 'Bảng hàng hủy', headers, rows: tableRows(rows, headers, keys) },
    secondary: topValueRows(rows, ['Lý do', 'Tên hàng', 'Tên nguyên vật liệu'], ['Giá trị', 'Giá trị hủy', 'Thành tiền'], 'Top lý do/NVL hủy'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, abnormal ? [['3', 'Hàng hủy', 'Cảnh báo', 'Yêu cầu giải trình các phiếu hủy bất thường']] : [])
  };
}

export async function buildStandardLossReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [
    { sheetName: SHEET_NAMES.KQ_HAO_HUT_CHE_BIEN, label: 'Kết quả hao hụt chế biến' },
    { sheetName: SHEET_NAMES.DL_CHE_BIEN_THUC_TE, label: 'Chế biến thực tế' },
    { sheetName: SHEET_NAMES.DM_CONG_THUC_CHE_BIEN, label: 'Công thức chế biến' },
    { sheetName: SHEET_NAMES.DM_HAO_HUT_HOP_LE, label: 'Hao hụt hợp lệ' }
  ]);
  const resultRows = sources[0]?.rows.length ? sources[0].rows : sources[1]?.rows ?? [];
  const value = sumRows(resultRows, ['Giá trị vượt', 'Giá trị hao hụt', 'Giá trị chênh lệch']);
  const warnings = resultRows.filter((row) => rowStatus(row).toLowerCase().includes('cảnh báo') || rowStatus(row).toLowerCase().includes('nguy hiểm') || numberFrom(row, ['Vượt SL', 'Mức vượt định mức']) > 0).length;
  const headers = ['Ngày', 'Món/Nhóm chế biến', 'NVL', 'Sản lượng', 'Định mức', 'Hao hụt hợp lệ', 'Được phép dùng', 'Thực tế dùng', 'Vượt SL', 'Tỷ lệ vượt', 'Giá trị vượt', 'Trạng thái'];
  const keys = Object.fromEntries(headers.map((header) => [header, [header, header.replace('Món/Nhóm chế biến', 'Món'), header.replace('NVL', 'Tên nguyên vật liệu')]]));
  return {
    title: 'Hao hụt / Vượt định mức',
    description: 'Engine thật đo món/ca/bộ phận dùng quá định mức; không kết luận mất kho ngay.',
    status: statusForRows(resultRows, warnings),
    metrics: [
      { label: 'Giá trị vượt', value: formatMoney(value), status: value ? 'warning' : 'good' },
      { label: 'Dòng kết quả', value: formatNumber(resultRows.length), status: resultRows.length ? 'good' : 'neutral' },
      { label: 'Dòng cảnh báo', value: formatNumber(warnings), status: warnings ? 'danger' : 'good' },
      { label: 'Công thức chuẩn', value: formatNumber(sources[2]?.rows.length ?? 0), trend: 'DM_CONG_THUC_CHE_BIEN', status: sources[2]?.rows.length ? 'good' : 'neutral' }
    ],
    primary: { title: 'Bảng hao hụt/vượt định mức', headers, rows: tableRows(resultRows, headers, keys) },
    secondary: topValueRows(resultRows, ['Món/Nhóm chế biến', 'Món', 'NVL', 'Tên nguyên vật liệu'], ['Giá trị vượt', 'Giá trị hao hụt', 'Giá trị chênh lệch'], 'Top món/NVL vượt định mức'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, warnings ? [['3', 'Định mức', 'Cảnh báo', 'Đào tạo lại ca/bộ phận dùng quá định mức']] : [])
  };
}

export async function buildStockLossReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [{ sheetName: SHEET_NAMES.KQ_THAT_THOAT_TON_KHO, label: 'Kết quả thất thoát tồn kho' }]);
  const rows = sources[0]?.rows ?? [];
  const lossValue = sumRows(rows, ['Giá trị thất thoát', 'Giá trị lệch', 'Giá trị chênh lệch']);
  const shortages = rows.filter((row) => numberFrom(row, ['Thiếu', 'Chênh lệch', 'Lệch']) < 0 || rowStatus(row).toLowerCase().includes('thiếu')).length;
  const headers = ['Kho', 'NVL', 'ĐVT', 'Tồn đầu', 'Nhập', 'Tiêu hao lý thuyết', 'Hủy hợp lệ', 'Tồn lý thuyết', 'Tồn thực tế', 'Thiếu', 'Dư', 'Tỷ lệ thất thoát', 'Giá trị thất thoát', 'Trạng thái'];
  const keys = Object.fromEntries(headers.map((header) => [header, [header, header.replace('NVL', 'Tên nguyên vật liệu')]]));
  return {
    title: 'Thất thoát tồn kho',
    description: 'Engine thật đo thiếu/dư giữa tồn lý thuyết và kiểm kê thực tế, tách khỏi hao hụt chế biến.',
    status: statusForRows(rows, shortages),
    metrics: [
      { label: 'Giá trị thất thoát', value: formatMoney(lossValue), status: lossValue ? 'danger' : 'good' },
      { label: 'Dòng thất thoát', value: formatNumber(rows.length), status: rows.length ? 'good' : 'neutral' },
      { label: 'Dòng thiếu kho', value: formatNumber(shortages), status: shortages ? 'danger' : 'good' },
      { label: 'Tỷ lệ TB', value: rows.length ? `${(sumRows(rows, ['Tỷ lệ thất thoát']) / rows.length).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%` : '0%', status: rows.length ? 'warning' : 'neutral' }
    ],
    primary: { title: 'Bảng thất thoát tồn kho', headers, rows: tableRows(rows, headers, keys) },
    secondary: topValueRows(rows, ['NVL', 'Tên nguyên vật liệu', 'Kho'], ['Giá trị thất thoát', 'Giá trị lệch', 'Giá trị chênh lệch'], 'Top thất thoát theo tiền'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, shortages ? [['2', 'Thất thoát tồn kho', 'Nguy hiểm', 'Yêu cầu giải trình và kiểm kê lại các dòng thiếu kho']] : [])
  };
}

// ============================================================
// ENGINES TÀI CHÍNH (GĐ-B) — tính runtime từ data thật
// ============================================================

/**
 * Phân loại dòng sổ quỹ: thu (tiền vào) hay chi (tiền ra).
 * - Loại thu chi chứa "Phiếu thu" hoặc giá trị dương → tiền vào
 * - "Phiếu chi" hoặc giá trị âm → tiền ra
 */
function classifyCashRow(row: DataRow): { isIncome: boolean; amount: number; group: string; note: string } {
  const loaiThuChi = asText(get(row, ['Loại thu chi', 'Loại', 'Nội dung'])).toLowerCase();
  const amount = numberFrom(row, ['Giá trị', 'Số tiền', 'Thành tiền']);
  const note = asText(get(row, ['Ghi chú', 'Nội dung', 'Diễn giải'])) || loaiThuChi;
  const isIncome = loaiThuChi.includes('thu') || (amount > 0 && !loaiThuChi.includes('chi'));
  // Phân nhóm chi theo nội dung
  let group = isIncome ? 'Thu' : 'Chi khác';
  const n = note.toLowerCase();
  if (!isIncome) {
    if (n.includes('lương') || n.includes('thưởng')) group = 'Lương';
    else if (n.includes('mặt bằng') || n.includes('tiền nhà') || n.includes('cho thuê')) group = 'Mặt bằng';
    else if (n.includes('nguyên vật') || n.includes('thực phẩm') || n.includes('nvl') || n.includes('thịt') || n.includes('gạo') || n.includes('ncc')) group = 'Nguyên vật liệu';
    else if (n.includes('điện') || n.includes('nước') || n.includes('internet')) group = 'Điện nước';
    else if (n.includes('marketing') || n.includes('quảng cáo') || n.includes('ads')) group = 'Marketing';
    else if (n.includes('bao bì') || n.includes('hộp') || n.includes('ly') || n.includes('túi')) group = 'Bao bì';
  }
  return { isIncome, amount: Math.abs(amount), group, note };
}

/**
 * P&L Tuần — tính từ doanh thu + giá vốn (XNT) + chi phí (sổ quỹ) + thất thoát.
 */
export async function buildProfitLossReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [
    { sheetName: SHEET_NAMES.DL_DOANH_THU_CUA_HANG, label: 'Doanh thu cửa hàng' },
    { sheetName: SHEET_NAMES.DL_DOANH_THU_APP, label: 'Doanh thu app' },
    { sheetName: SHEET_NAMES.DL_SO_QUY, label: 'Sổ quỹ' },
    { sheetName: SHEET_NAMES.KQ_THAT_THOAT_TON_KHO, label: 'Thất thoát tồn kho' }
  ]);
  const [storeRev, appRev, cashbook, loss] = sources;
  // Doanh thu
  const doanhThu = sumRows(storeRev.rows, ['Doanh thu', 'Thành tiền', 'Tổng doanh thu']) + sumRows(appRev.rows, ['Doanh thu', 'Thành tiền', 'Doanh thu net']);
  // Giá vốn ước tính từ XNT (giá trị xuất)
  const giaVon = sumRows(cashbook.rows.filter((r) => classifyCashRow(r).group === 'Nguyên vật liệu'), ['Giá trị', 'Số tiền']);
  // Chi phí vận hành = tổng chi trừ NVL
  const chiPhi = sumRows(cashbook.rows.filter((r) => !classifyCashRow(r).isIncome && classifyCashRow(r).group !== 'Nguyên vật liệu'), ['Giá trị', 'Số tiền']);
  const thatThoat = sumRows(loss.rows, ['Giá trị thất thoát', 'Giá trị lệch']);
  const loiNhuanGop = doanhThu - giaVon;
  const loiNhuanTruocTT = loiNhuanGop - chiPhi;
  const loiNhuanTam = loiNhuanTruocTT - thatThoat;
  const cogsPct = doanhThu ? (giaVon / doanhThu) * 100 : 0;
  const netPct = doanhThu ? (loiNhuanTam / doanhThu) * 100 : 0;

  const headers = ['Chỉ tiêu', 'Giá trị', '% DT', 'Ghi chú'];
  const pnlData: string[][] = [
    ['1. Doanh thu thuần', formatMoney(doanhThu), '100%', ''],
    ['2. Giá vốn hàng bán', `(${formatMoney(giaVon)})`, `${cogsPct.toFixed(1)}%`, ''],
    ['3. Lợi nhuận gộp', formatMoney(loiNhuanGop), `${((loiNhuanGop / (doanhThu || 1)) * 100).toFixed(1)}%`, ''],
    ['4. Chi phí vận hành', `(${formatMoney(chiPhi)})`, `${((chiPhi / (doanhThu || 1)) * 100).toFixed(1)}%`, ''],
    ['5. LN trước thất thoát', formatMoney(loiNhuanTruocTT), `${((loiNhuanTruocTT / (doanhThu || 1)) * 100).toFixed(1)}%`, ''],
    ['6. Thất thoát', `(${formatMoney(thatThoat)})`, `${((thatThoat / (doanhThu || 1)) * 100).toFixed(1)}%`, ''],
    ['7. Lợi nhuận tạm', formatMoney(loiNhuanTam), `${netPct.toFixed(1)}%`, netPct > 15 ? 'Đạt' : 'Cảnh báo']
  ];

  const missingSources = sources.filter((s) => !s.rows.length);
  return {
    title: 'P&L Tuần',
    description: 'Engine tính runtime từ doanh thu + sổ quỹ + thất thoát. Không lưu tĩnh.',
    status: missingSources.length ? 'Chưa đủ dữ liệu' : loiNhuanTam > 0 ? 'Tốt' : 'Cảnh báo',
    metrics: [
      { label: 'Doanh thu', value: formatMoney(doanhThu), status: doanhThu ? 'good' : 'neutral' },
      { label: 'COGS%', value: `${cogsPct.toFixed(1)}%`, status: cogsPct > 50 ? 'danger' : cogsPct > 45 ? 'warning' : 'good' },
      { label: 'Lợi nhuận tạm', value: formatMoney(loiNhuanTam), status: loiNhuanTam > 0 ? 'good' : 'danger' },
      { label: 'Net%', value: `${netPct.toFixed(1)}%`, status: netPct > 15 ? 'good' : 'warning' }
    ],
    primary: { title: 'Báo cáo P&L (tính runtime)', headers, rows: pnlData },
    secondary: topValueRows(cashbook.rows.filter((r) => !classifyCashRow(r).isIncome), ['Ghi chú', 'Nội dung'], ['Giá trị', 'Số tiền'], 'Top khoản chi'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, thatThoat > 0 ? [['3', 'Thất thoát', 'Cảnh báo', `Thất thoát ${formatMoney(thatThoat)} ảnh hưởng P&L`]] : [])
  };
}

/**
 * Dòng tiền Tuần — tính từ sổ quỹ runtime.
 */
export async function buildCashflowReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [{ sheetName: SHEET_NAMES.DL_SO_QUY, label: 'Sổ quỹ' }]);
  const cashbook = sources[0].rows;
  let tienVao = 0;
  let tienRa = 0;
  const byGroup: Record<string, number> = {};
  const unclassified: DataRow[] = [];
  for (const row of cashbook) {
    const { isIncome, amount, group, note } = classifyCashRow(row);
    if (isIncome) tienVao += amount;
    else {
      tienRa += amount;
      byGroup[group] = (byGroup[group] ?? 0) + amount;
      if (group === 'Chi khác') unclassified.push(row);
    }
  }
  const dongTien = tienVao - tienRa;
  const chiChuaPL = byGroup['Chi khác'] ?? 0;

  const groupHeaders = ['Nhóm chi', 'Tiền ra', 'Tỷ trọng'];
  const groupRows = Object.entries(byGroup)
    .sort((a, b) => b[1] - a[1])
    .map(([group, value]) => [group, formatMoney(value), `${((value / (tienRa || 1)) * 100).toFixed(1)}%`]);

  return {
    title: 'Dòng tiền Tuần',
    description: 'Engine tính runtime từ sổ quỹ. Phân nhóm chi tự động.',
    status: !cashbook.length ? 'Chưa đủ dữ liệu' : chiChuaPL > tienRa * 0.1 ? 'Cảnh báo' : 'Tốt',
    metrics: [
      { label: 'Tiền vào', value: formatMoney(tienVao), status: 'good' },
      { label: 'Tiền ra', value: formatMoney(tienRa), status: 'neutral' },
      { label: 'Dòng tiền tạm', value: formatMoney(dongTien), status: dongTien > 0 ? 'good' : 'danger' },
      { label: 'Chi chưa PL', value: formatMoney(chiChuaPL), status: chiChuaPL > 0 ? 'warning' : 'good' }
    ],
    primary: { title: 'Chi theo nhóm (runtime)', headers: groupHeaders, rows: groupRows.length ? groupRows : [['—', '0', '0%']] },
    secondary: topValueRows(unclassified, ['Ghi chú', 'Nội dung'], ['Giá trị', 'Số tiền'], 'Chi chưa phân loại cần kiểm'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, chiChuaPL > 0 ? [['2', 'Chi chưa phân loại', 'Cảnh báo', `${formatMoney(chiChuaPL)} cần kế toán phân nhóm`]] : [])
  };
}

/**
 * Cân đối rút gọn — tính runtime từ sổ quỹ + tồn kho + công nợ.
 */
export async function buildBalanceReport(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [
    { sheetName: SHEET_NAMES.DL_SO_QUY, label: 'Sổ quỹ' },
    { sheetName: SHEET_NAMES.DL_XNT_CUA_HANG, label: 'Tồn kho cửa hàng' },
    { sheetName: SHEET_NAMES.DL_XNT_BEP_TRUNG_TAM, label: 'Tồn kho BTT' },
    { sheetName: SHEET_NAMES.DL_CONG_NO, label: 'Công nợ' }
  ]);
  const [cashbook, storeInv, bttInv, debt] = sources;
  const tienMat = sumRows(cashbook.rows.filter((r) => classifyCashRow(r).isIncome), ['Giá trị', 'Số tiền']) - sumRows(cashbook.rows.filter((r) => !classifyCashRow(r).isIncome), ['Giá trị', 'Số tiền']);
  const tonKho = sumRows(storeInv.rows, ['Giá trị tồn thực tế', 'Giá trị tồn']) + sumRows(bttInv.rows, ['Giá trị tồn thực tế', 'Giá trị tồn']);
  const noPhaiTra = sumRows(debt.rows, ['Nợ cuối kỳ', 'Nợ còn lại', 'Dư cuối kỳ']);
  const noPhaiThu = 0; // chưa có sheet phải thu
  const tongTS = tienMat + tonKho + noPhaiThu;
  const tongNo = noPhaiTra;
  const chenhLech = tongTS - tongNo;

  const headers = ['Hạng mục', 'Tài sản', 'Nợ phải trả'];
  const rows: string[][] = [
    ['Tiền mặt', formatMoney(tienMat), '—'],
    ['Tồn kho', formatMoney(tonKho), '—'],
    ['Phải thu khách hàng', formatMoney(noPhaiThu), '—'],
    ['Phải trả NCC', '—', formatMoney(noPhaiTra)],
    ['Tổng cộng', formatMoney(tongTS), formatMoney(tongNo)],
    ['Chênh lệch ròng', formatMoney(chenhLech), chenhLech >= 0 ? 'Dư' : 'Thiếu']
  ];

  return {
    title: 'Cân đối rút gọn',
    description: 'Engine tính runtime: tiền + hàng + công nợ.',
    status: !sources.some((s) => s.rows.length) ? 'Chưa đủ dữ liệu' : chenhLech >= 0 ? 'Tốt' : 'Cảnh báo',
    metrics: [
      { label: 'Tiền mặt', value: formatMoney(tienMat), status: tienMat > 0 ? 'good' : 'danger' },
      { label: 'Tồn kho', value: formatMoney(tonKho), status: 'neutral' },
      { label: 'Phải trả NCC', value: formatMoney(noPhaiTra), status: noPhaiTra > 0 ? 'warning' : 'good' },
      { label: 'Chênh lệch ròng', value: formatMoney(chenhLech), status: chenhLech >= 0 ? 'good' : 'danger' }
    ],
    primary: { title: 'Cân đối rút gọn (runtime)', headers, rows },
    secondary: topValueRows(debt.rows, ['Tên nhà cung cấp', 'NCC'], ['Nợ cuối kỳ', 'Nợ còn lại'], 'Top NCC dư nợ'),
    readiness: sourceReadiness(sources),
    issues: missingIssues(sources, noPhaiTra > tongTS * 0.5 ? [['2', 'Công nợ cao', 'Cảnh báo', `Phải trả ${formatMoney(noPhaiTra)} > 50% tổng tài sản`]] : [])
  };
}

/**
 * Tổng quan kế toán — tổng hợp nhanh từ tất cả nguồn.
 */
export async function buildAccountingOverview(): Promise<V7Report> {
  const store = getDataStore();
  const sources = await readSources(store, [
    { sheetName: SHEET_NAMES.DL_DOANH_THU_CUA_HANG, label: 'Doanh thu CH' },
    { sheetName: SHEET_NAMES.DL_DOANH_THU_APP, label: 'Doanh thu app' },
    { sheetName: SHEET_NAMES.DL_SO_QUY, label: 'Sổ quỹ' },
    { sheetName: SHEET_NAMES.DL_XNT_CUA_HANG, label: 'Kho cửa hàng' },
    { sheetName: SHEET_NAMES.DL_XNT_BEP_TRUNG_TAM, label: 'Kho BTT' },
    { sheetName: SHEET_NAMES.KQ_THAT_THOAT_TON_KHO, label: 'Thất thoát' },
    { sheetName: SHEET_NAMES.DL_CONG_NO, label: 'Công nợ' }
  ]);
  const doanhThu = sumRows(sources[0].rows, ['Doanh thu', 'Thành tiền']) + sumRows(sources[1].rows, ['Doanh thu', 'Thành tiền']);
  const tienVao = sumRows(sources[2].rows.filter((r) => classifyCashRow(r).isIncome), ['Giá trị', 'Số tiền']);
  const tienRa = sumRows(sources[2].rows.filter((r) => !classifyCashRow(r).isIncome), ['Giá trị', 'Số tiền']);
  const dongTien = tienVao - tienRa;
  const tonKho = sumRows(sources[3].rows, ['Giá trị tồn thực tế']) + sumRows(sources[4].rows, ['Giá trị tồn thực tế']);
  const thatThoat = sumRows(sources[5].rows, ['Giá trị thất thoát']);
  const noPhaiTra = sumRows(sources[6].rows, ['Nợ cuối kỳ']);
  const chiChuaPL = sumRows(sources[2].rows.filter((r) => !classifyCashRow(r).isIncome && classifyCashRow(r).group === 'Chi khác'), ['Giá trị']);
  const missingSources = sources.filter((s) => !s.rows.length);
  const dataScore = Math.max(0, 100 - missingSources.length * 12 - (chiChuaPL > 0 ? 8 : 0));

  const headers = ['Mức độ', 'Nội dung', 'Trạng thái', 'Hành động'];
  const issues: string[][] = [];
  if (chiChuaPL > 0) issues.push(['1', `Chi chưa phân loại ${formatMoney(chiChuaPL)}`, 'Cảnh báo', 'Kế toán phân nhóm']);
  if (thatThoat > 0) issues.push(['2', `Thất thoát ${formatMoney(thatThoat)}`, 'Cảnh báo', 'Yêu cầu giải trình']);
  if (noPhaiTra > 0) issues.push(['3', `Công nợ phải trả ${formatMoney(noPhaiTra)}`, 'Cần đối chiếu', 'Đối chiếu NCC']);
  missingSources.forEach((s, i) => issues.push([String(i + 4), `Thiếu ${s.label}`, 'Chưa đủ dữ liệu', `Import sheet ${s.sheetName}`]));

  return {
    title: 'Tổng quan kế toán',
    description: 'Engine tổng hợp runtime từ tất cả nguồn data. Kế toán nhìn nhanh trước khi chốt.',
    status: missingSources.length > 2 ? 'Chưa đủ dữ liệu' : issues.length > 2 ? 'Cảnh báo' : 'Tốt',
    metrics: [
      { label: 'Data Quality', value: `${dataScore}/100`, status: dataScore >= 80 ? 'good' : dataScore >= 60 ? 'warning' : 'danger' },
      { label: 'Tổng doanh thu', value: formatMoney(doanhThu), status: doanhThu ? 'good' : 'neutral' },
      { label: 'Dòng tiền tạm', value: formatMoney(dongTien), status: dongTien > 0 ? 'good' : 'danger' },
      { label: 'Thất thoát', value: formatMoney(thatThoat), status: thatThoat > 0 ? 'warning' : 'good' }
    ],
    primary: { title: 'Việc kế toán cần xử lý', headers, rows: issues.length ? issues : [['1', 'Không có vấn đề lớn', 'Tốt', 'Rà lần cuối và chốt']] },
    secondary: sourceReadiness(sources),
    readiness: sourceReadiness(sources),
    issues: { title: 'Top vấn đề cần rà', headers: ['#', 'Vấn đề', 'Giá trị'], rows: issues.slice(0, 5).map((r) => [r[0], r[1], r[2]]) }
  };
}
