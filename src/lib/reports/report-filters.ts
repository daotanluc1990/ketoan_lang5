export type ReportFilters = {
  fromDate?: string;
  toDate?: string;
  weekCode?: string;
  branch?: string;
  channel?: string;
  source?: string;
  dataStatus?: string;
  alertStatus?: string;
  costGroup?: string;
  importedBy?: string;
};

export type FilterOption = { label: string; value: string; count?: number };

export type ReportFilterOptions = {
  branches: FilterOption[];
  weeks: FilterOption[];
  channels: FilterOption[];
  sources: FilterOption[];
  dataStatuses: FilterOption[];
  alertStatuses: FilterOption[];
  costGroups: FilterOption[];
  importedBy: FilterOption[];
};

export type RowGroup = { sheetName: string; label: string; rows: Record<string, unknown>[] };

type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined> | undefined | null;

const ALL_VALUES = new Set([
  '',
  'all',
  'tat-ca',
  'tất cả',
  'toan-bo',
  'toàn bộ',
  'tat-ca-nguon',
  'tất cả nguồn',
  'tat-ca-kenh',
  'tất cả kênh',
  'tat-ca-nhom',
  'tất cả nhóm'
]);

const SOURCE_LABELS: Record<string, string> = {
  DL_DOANH_THU_APP: 'Doanh thu app',
  DL_DOANH_THU_CUA_HANG: 'Doanh thu cửa hàng',
  DL_SO_QUY: 'Sổ quỹ',
  DL_TON_KHO: 'Tồn kho',
  DL_THAT_THOAT_NVL: 'Thất thoát NVL',
  DL_CONG_NO: 'Công nợ',
  DL_THU_MUA: 'Thu mua'
};

export function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isAllFilter(value: unknown) {
  return ALL_VALUES.has(normalizeText(value));
}

function firstParam(params: SearchParamsInput, key: string) {
  if (!params) return undefined;
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function cleanParam(value: string | undefined) {
  const trimmed = String(value ?? '').trim();
  return trimmed && !isAllFilter(trimmed) ? trimmed : undefined;
}

export function parseReportFilters(params?: SearchParamsInput): ReportFilters {
  return {
    fromDate: cleanParam(firstParam(params, 'fromDate') ?? firstParam(params, 'from')),
    toDate: cleanParam(firstParam(params, 'toDate') ?? firstParam(params, 'to')),
    weekCode: cleanParam(firstParam(params, 'weekCode') ?? firstParam(params, 'week')),
    branch: cleanParam(firstParam(params, 'branch')),
    channel: cleanParam(firstParam(params, 'channel')),
    source: cleanParam(firstParam(params, 'source')),
    dataStatus: cleanParam(firstParam(params, 'dataStatus') ?? firstParam(params, 'status')),
    alertStatus: cleanParam(firstParam(params, 'alertStatus') ?? firstParam(params, 'alert')),
    costGroup: cleanParam(firstParam(params, 'costGroup')),
    importedBy: cleanParam(firstParam(params, 'importedBy'))
  };
}

export async function parsePageReportFilters(searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>) {
  return parseReportFilters(await searchParams);
}

function ddmmyyyy(day: number, month: number, year: number) {
  return Date.UTC(year, month - 1, day);
}

export function parseDateToUtc(value: unknown): number | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date, roughly valid for modern business dates.
    if (value > 30000 && value < 60000) return Date.UTC(1899, 11, 30 + Math.floor(value));
    return null;
  }
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return ddmmyyyy(Number(iso[3]), Number(iso[2]), Number(iso[1]));
  const vn = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (vn) {
    const year = Number(vn[3].length === 2 ? `20${vn[3]}` : vn[3]);
    return ddmmyyyy(Number(vn[1]), Number(vn[2]), year);
  }
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  return null;
}

function rowDateValue(row: Record<string, unknown>) {
  return row['Ngày'] ?? row['Ngày kiểm kê'] ?? row['Tuần bắt đầu'] ?? row['Thời gian'] ?? row['Ngày import'];
}

function rowMatchesDate(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.fromDate && !filters.toDate) return true;
  const rowTime = parseDateToUtc(rowDateValue(row));
  if (rowTime === null) return false;
  const fromTime = filters.fromDate ? parseDateToUtc(filters.fromDate) : null;
  const toTime = filters.toDate ? parseDateToUtc(filters.toDate) : null;
  if (fromTime !== null && rowTime < fromTime) return false;
  if (toTime !== null && rowTime > toTime) return false;
  return true;
}

function rowMatchesWeek(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.weekCode) return true;
  const expected = normalizeText(filters.weekCode);
  const values = [row['Mã tuần'], row['Tuần'], row['Tuần bắt đầu'], row['Tuần kết thúc']].map(normalizeText).filter(Boolean);
  return values.some((value) => value === expected || value.includes(expected) || expected.includes(value));
}

function rowMatchesBranch(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.branch) return true;
  const expected = normalizeText(filters.branch);
  const actual = normalizeText(row['Chi nhánh'] ?? row['Tên CH'] ?? row['Cửa hàng']);
  return actual === expected || actual.includes(expected) || expected.includes(actual);
}

function rowMatchesChannel(row: Record<string, unknown>, sheetName: string, filters: ReportFilters) {
  if (!filters.channel) return true;
  const expected = normalizeText(filters.channel);
  if (sheetName === 'DL_DOANH_THU_CUA_HANG' && ['offline', 'cua-hang', 'tai-cua-hang', 'ban-tai-cua-hang'].includes(expected)) return true;
  const values = [row['Kênh bán'], row['Tài khoản app'], row['Phương thức'], row['Ca bán']].map(normalizeText).filter(Boolean);
  return values.some((value) => value === expected || value.includes(expected) || expected.includes(value));
}

function rowMatchesSource(sheetName: string, filters: ReportFilters) {
  if (!filters.source) return true;
  const expected = normalizeText(filters.source);
  const sourceLabel = SOURCE_LABELS[sheetName] ?? sheetName;
  const values = [sheetName, sourceLabel].map(normalizeText);
  return values.some((value) => value === expected || value.includes(expected) || expected.includes(value));
}

function rowMatchesDataStatus(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.dataStatus) return true;
  const expected = normalizeText(filters.dataStatus);
  const values = [row['Trạng thái dữ liệu'], row['Trạng thái']].map(normalizeText).filter(Boolean);
  return values.some((value) => value === expected || value.includes(expected) || expected.includes(value));
}

function rowMatchesAlert(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.alertStatus) return true;
  const expected = normalizeText(filters.alertStatus);
  const values = [row['Trạng thái'], row['Đánh giá'], row['Mức độ']].map(normalizeText).filter(Boolean);
  return values.some((value) => value === expected || value.includes(expected) || expected.includes(value));
}

function rowMatchesCostGroup(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.costGroup) return true;
  const expected = normalizeText(filters.costGroup);
  const values = [row['Nhóm thu/chi'], row['Loại nguyên vật liệu'], row['Nhóm hàng'], row['Nhóm công nợ'], row['Mặt hàng']].map(normalizeText).filter(Boolean);
  return values.some((value) => value === expected || value.includes(expected) || expected.includes(value));
}

function rowMatchesImportedBy(row: Record<string, unknown>, filters: ReportFilters) {
  if (!filters.importedBy) return true;
  const expected = normalizeText(filters.importedBy);
  const actual = normalizeText(row['Người import'] ?? row['Người tạo'] ?? row['Người dùng']);
  return actual === expected || actual.includes(expected) || expected.includes(actual);
}

export function filterRowsByReportFilters(rows: Record<string, unknown>[], sheetName: string, filters: ReportFilters) {
  if (!Object.values(filters).some(Boolean)) return rows;
  if (!rowMatchesSource(sheetName, filters)) return [];
  return rows.filter((row) =>
    rowMatchesDate(row, filters) &&
    rowMatchesWeek(row, filters) &&
    rowMatchesBranch(row, filters) &&
    rowMatchesChannel(row, sheetName, filters) &&
    rowMatchesDataStatus(row, filters) &&
    rowMatchesAlert(row, filters) &&
    rowMatchesCostGroup(row, filters) &&
    rowMatchesImportedBy(row, filters)
  );
}

function addOption(map: Map<string, FilterOption>, value: unknown, labelOverride?: string) {
  const label = String(labelOverride ?? value ?? '').trim();
  if (!label) return;
  const key = normalizeText(label);
  if (!key || isAllFilter(key)) return;
  const current = map.get(key);
  if (current) current.count = (current.count ?? 0) + 1;
  else map.set(key, { label, value: label, count: 1 });
}

function sortedOptions(map: Map<string, FilterOption>) {
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

export function buildReportFilterOptions(groups: RowGroup[]): ReportFilterOptions {
  const branches = new Map<string, FilterOption>();
  const weeks = new Map<string, FilterOption>();
  const channels = new Map<string, FilterOption>();
  const sources = new Map<string, FilterOption>();
  const dataStatuses = new Map<string, FilterOption>();
  const alertStatuses = new Map<string, FilterOption>();
  const costGroups = new Map<string, FilterOption>();
  const importedBy = new Map<string, FilterOption>();

  for (const group of groups) {
    if (group.rows.length) addOption(sources, group.sheetName, SOURCE_LABELS[group.sheetName] ?? group.label);
    for (const row of group.rows) {
      addOption(branches, row['Chi nhánh'] ?? row['Tên CH'] ?? row['Cửa hàng']);
      addOption(weeks, row['Mã tuần'] ?? row['Tuần']);
      addOption(channels, row['Kênh bán'] ?? row['Tài khoản app']);
      if (group.sheetName === 'DL_DOANH_THU_CUA_HANG') addOption(channels, 'Offline');
      addOption(dataStatuses, row['Trạng thái dữ liệu']);
      addOption(alertStatuses, row['Trạng thái'] ?? row['Đánh giá'] ?? row['Mức độ']);
      addOption(costGroups, row['Nhóm thu/chi'] ?? row['Loại nguyên vật liệu'] ?? row['Nhóm hàng'] ?? row['Nhóm công nợ']);
      addOption(importedBy, row['Người import'] ?? row['Người tạo'] ?? row['Người dùng']);
    }
  }

  return {
    branches: sortedOptions(branches),
    weeks: sortedOptions(weeks),
    channels: sortedOptions(channels),
    sources: sortedOptions(sources),
    dataStatuses: sortedOptions(dataStatuses),
    alertStatuses: sortedOptions(alertStatuses),
    costGroups: sortedOptions(costGroups),
    importedBy: sortedOptions(importedBy)
  };
}

export function hasActiveFilters(filters: ReportFilters) {
  return Object.values(filters).some(Boolean);
}
