import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getDataStore } from '@/lib/data-store';
import { getConfiguredAiProvider, getServerEnv } from '@/lib/env/server-env';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { filterRowsByReportFilters, normalizeText, parseDateToUtc, type ReportFilters } from '@/lib/reports/report-filters';

export type ForecastScenarioId = 'than_trong' | 'co_so' | 'tang_truong';
export type ForecastStatus = 'du_du_lieu' | 'can_doi_chieu' | 'chua_du_du_lieu';

export type WeeklyForecastInput = {
  weekCode: string;
  label: string;
  rowCount: number;
  revenue: number;
  directRevenue: number;
  cashbookRevenue: number;
  cashIn: number;
  cashOut: number;
  netCashflow: number;
  lossValue: number;
  inventoryValue: number;
  evidence: string[];
};

export type ForecastScenario = {
  id: ForecastScenarioId;
  name: string;
  revenue: number;
  cashOut: number;
  netCashflow: number;
  rangeLow: number;
  rangeHigh: number;
  assumptions: string[];
  needsCeoApproval: boolean;
};

export type ForecastReport = {
  ok: boolean;
  status: ForecastStatus;
  canForecast: boolean;
  message: string;
  minimumHistoryWeeks: number;
  historyWeekCount: number;
  historyWeeks: WeeklyForecastInput[];
  baseline: {
    revenue: number;
    cashOut: number;
    netCashflow: number;
    revenueSource: 'direct_revenue' | 'cashbook_revenue_proxy' | 'mixed' | 'missing';
    weightedFormula: string;
    trendPercent: number;
  };
  scenarios: ForecastScenario[];
  dataQuality: {
    score: number;
    label: string;
    notes: string[];
    missingSources: string[];
  };
  calculationFormula: string[];
  approval: {
    requiredBeforeWrite: boolean;
    canWriteToSheet: false;
    targetSheet: 'DU_TOAN_TUAN_TOI';
    note: string;
  };
  appliedFilters: ReportFilters;
  rows: {
    scenarioRows: string[][];
    historyRows: string[][];
    evidenceRows: string[][];
    actionRows: string[][];
  };
};

export type ForecastAgentAnalysis = {
  mode: 'real_openai' | 'real_gemini' | 'rule_based_missing_env' | 'rule_based_not_enough_data';
  provider: 'openai' | 'gemini' | 'missing';
  agentSource: 'file' | 'fallback';
  overall_status: 'tot' | 'canh_bao' | 'nguy_hiem' | 'chua_du_du_lieu';
  can_forecast: boolean;
  summary_for_ceo: string;
  scenario_explanation: string[];
  risks: string[];
  actions: Array<{ action: string; owner: string; deadline: string }>;
  missing_data: string[];
  confidence: number;
  raw?: string;
};

const MIN_HISTORY_WEEKS = 4;
const FORECAST_AGENT_FALLBACK = `# AI_FORECAST_AGENT — Safe fallback\n\nKhông bịa số. Không tự tạo số dự toán. Nếu thiếu lịch sử dưới 4 tuần, trả: Chưa đủ dữ liệu để lập dự toán.`;

const FORECAST_JSON_SCHEMA = {
  type: 'object',
  properties: {
    overall_status: { type: 'string', enum: ['tot', 'canh_bao', 'nguy_hiem', 'chua_du_du_lieu'] },
    can_forecast: { type: 'boolean' },
    summary_for_ceo: { type: 'string' },
    scenario_explanation: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          owner: { type: 'string' },
          deadline: { type: 'string' }
        },
        required: ['action', 'owner', 'deadline']
      }
    },
    missing_data: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' }
  },
  required: ['overall_status', 'can_forecast', 'summary_for_ceo', 'scenario_explanation', 'risks', 'actions', 'missing_data', 'confidence']
} as const;

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const number = Number(String(value ?? '').replace(/,/g, '').replace(/%/g, '').replace(/đ/g, '').trim());
  return Number.isFinite(number) ? number : 0;
}

function pickNumber(row: Record<string, unknown>, columns: string[]) {
  for (const column of columns) {
    const value = toNumber(row[column]);
    if (value !== 0) return value;
  }
  return 0;
}

function validImportRows(rows: Record<string, unknown>[]) {
  return rows.filter((row) =>
    String(row['Mã dòng dữ liệu'] ?? '').trim() ||
    String(row['Mã lần import'] ?? '').trim() ||
    String(row['Tên file nguồn'] ?? '').trim()
  );
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')}tr`;
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function weekFromDate(value: unknown) {
  const time = parseDateToUtc(value);
  if (time === null) return '';
  const date = new Date(time);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function rowWeek(row: Record<string, unknown>) {
  const explicit = String(row['Mã tuần'] ?? '').trim();
  if (/^\d{4}-W\d{1,2}$/i.test(explicit)) {
    const [year, week] = explicit.toUpperCase().split('-W');
    return `${year}-W${String(Number(week)).padStart(2, '0')}`;
  }
  const week = weekFromDate(row['Ngày'] ?? row['Ngày kiểm kê'] ?? row['Tuần bắt đầu'] ?? row['Ngày import']);
  return week;
}

function cashbookAmount(row: Record<string, unknown>) {
  return pickNumber(row, ['Số tiền', 'Giá trị']);
}

function cashbookType(row: Record<string, unknown>) {
  const raw = normalizeText(row['Loại giao dịch']);
  if (raw.includes('thu')) return 'Thu';
  if (raw.includes('chi')) return 'Chi';
  return cashbookAmount(row) >= 0 ? 'Thu' : 'Chi';
}

function cashbookGroup(row: Record<string, unknown>) {
  return normalizeText(row['Nhóm thu/chi']);
}

function ensureWeek(map: Map<string, WeeklyForecastInput>, weekCode: string) {
  const existing = map.get(weekCode);
  if (existing) return existing;
  const row = {
    weekCode,
    label: weekCode,
    rowCount: 0,
    revenue: 0,
    directRevenue: 0,
    cashbookRevenue: 0,
    cashIn: 0,
    cashOut: 0,
    netCashflow: 0,
    lossValue: 0,
    inventoryValue: 0,
    evidence: []
  };
  map.set(weekCode, row);
  return row;
}

function weightedAverage(values: number[]) {
  if (!values.length) return 0;
  const recent = values.slice(-4);
  const baseWeights = [0.1, 0.2, 0.3, 0.4].slice(-recent.length);
  const weightTotal = baseWeights.reduce((total, weight) => total + weight, 0);
  return recent.reduce((total, value, index) => total + value * baseWeights[index], 0) / weightTotal;
}

function trendPercent(values: number[]) {
  const recent = values.filter((value) => value > 0).slice(-4);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  if (!first) return 0;
  const raw = (last - first) / first;
  return Math.max(-0.18, Math.min(0.18, raw));
}

async function safeRead(sheetName: string) {
  try {
    return await getDataStore().read(sheetName);
  } catch (error) {
    console.error(`[forecast-engine] Cannot read ${sheetName}:`, error instanceof Error ? error.message : error);
    return [] as Record<string, unknown>[];
  }
}

function filterForForecast(rows: Record<string, unknown>[], sheetName: string, filters: ReportFilters) {
  const { weekCode: _weekCode, ...historyFilters } = filters;
  return filterRowsByReportFilters(rows, sheetName, historyFilters);
}

export function buildForecastFromRows(input: {
  storeRevenueRows?: Record<string, unknown>[];
  appRevenueRows?: Record<string, unknown>[];
  cashbookRows?: Record<string, unknown>[];
  inventoryRows?: Record<string, unknown>[];
  lossRows?: Record<string, unknown>[];
  filters?: ReportFilters;
}): ForecastReport {
  const filters = input.filters ?? {};
  const storeRevenue = filterForForecast(validImportRows(input.storeRevenueRows ?? []), SHEET_NAMES.DL_DOANH_THU_CUA_HANG, filters);
  const appRevenue = filterForForecast(validImportRows(input.appRevenueRows ?? []), SHEET_NAMES.DL_DOANH_THU_APP, filters);
  const cashbook = filterForForecast(validImportRows(input.cashbookRows ?? []), SHEET_NAMES.DL_SO_QUY, filters);
  const inventory = filterForForecast(validImportRows(input.inventoryRows ?? []), SHEET_NAMES.DL_TON_KHO, filters);
  const lossRows = filterForForecast(validImportRows(input.lossRows ?? []), SHEET_NAMES.DL_THAT_THOAT_NVL, filters);
  const weeks = new Map<string, WeeklyForecastInput>();

  for (const row of storeRevenue) {
    const weekCode = rowWeek(row);
    if (!weekCode) continue;
    const week = ensureWeek(weeks, weekCode);
    const value = pickNumber(row, ['Doanh thu bán hàng thực', 'Tổng doanh thu theo file', 'Tiền mặt', 'MoMo/chuyển khoản']);
    week.directRevenue += Math.abs(value);
    week.rowCount += 1;
    week.evidence.push(`Doanh thu cửa hàng: ${formatMoney(Math.abs(value))}`);
  }

  for (const row of appRevenue) {
    const weekCode = rowWeek(row);
    if (!weekCode) continue;
    const week = ensureWeek(weeks, weekCode);
    const value = pickNumber(row, ['Doanh thu ròng', 'Doanh thu gộp']);
    week.directRevenue += Math.abs(value);
    week.rowCount += 1;
    week.evidence.push(`Doanh thu app: ${formatMoney(Math.abs(value))}`);
  }

  for (const row of cashbook) {
    const weekCode = rowWeek(row);
    if (!weekCode) continue;
    const week = ensureWeek(weeks, weekCode);
    const amount = cashbookAmount(row);
    const absAmount = Math.abs(amount);
    const type = cashbookType(row);
    const isIncome = amount > 0 || type === 'Thu';
    const isRevenue = isIncome && cashbookGroup(row).includes('doanh-thu');
    if (isIncome) week.cashIn += absAmount;
    else week.cashOut += absAmount;
    if (isRevenue) week.cashbookRevenue += absAmount;
    week.rowCount += 1;
  }

  for (const row of inventory) {
    const weekCode = rowWeek(row);
    if (!weekCode) continue;
    const week = ensureWeek(weeks, weekCode);
    week.inventoryValue += Math.abs(pickNumber(row, ['Giá trị tồn', 'Giá trị tồn kho']));
    week.rowCount += 1;
  }

  for (const row of lossRows) {
    const weekCode = rowWeek(row);
    if (!weekCode) continue;
    const week = ensureWeek(weeks, weekCode);
    week.lossValue += Math.abs(pickNumber(row, ['Giá trị chênh lệch']));
    week.rowCount += 1;
  }

  const historyWeeks = Array.from(weeks.values())
    .map((week) => ({
      ...week,
      revenue: week.directRevenue > 0 ? week.directRevenue : week.cashbookRevenue,
      netCashflow: week.cashIn - week.cashOut,
      evidence: Array.from(new Set(week.evidence)).slice(0, 5)
    }))
    .filter((week) => week.rowCount > 0)
    .sort((a, b) => a.weekCode.localeCompare(b.weekCode));

  const revenueValues = historyWeeks.map((week) => week.revenue).filter((value) => value > 0);
  const cashOutValues = historyWeeks.map((week) => week.cashOut).filter((value) => value > 0);
  const directRevenueWeeks = historyWeeks.filter((week) => week.directRevenue > 0).length;
  const cashbookRevenueWeeks = historyWeeks.filter((week) => week.cashbookRevenue > 0).length;
  const hasDirectRevenue = directRevenueWeeks > 0;
  const hasCashbookProxy = cashbookRevenueWeeks > 0;
  const historyWeekCount = historyWeeks.filter((week) => week.revenue > 0 || week.cashIn > 0 || week.cashOut > 0).length;
  const missingSources = [
    storeRevenue.length ? '' : 'DL_DOANH_THU_CUA_HANG',
    appRevenue.length ? '' : 'DL_DOANH_THU_APP',
    cashbook.length ? '' : 'DL_SO_QUY',
    inventory.length ? '' : 'DL_TON_KHO',
    lossRows.length ? '' : 'DL_THAT_THOAT_NVL'
  ].filter(Boolean);
  const canForecast = historyWeekCount >= MIN_HISTORY_WEEKS && revenueValues.length >= MIN_HISTORY_WEEKS;
  const revenueTrend = trendPercent(revenueValues);
  const baseRevenue = canForecast ? weightedAverage(revenueValues) * (1 + revenueTrend * 0.25) : 0;
  const baseCashOut = canForecast ? weightedAverage(cashOutValues.length ? cashOutValues : historyWeeks.map((week) => week.cashOut)) : 0;
  const revenueSource: ForecastReport['baseline']['revenueSource'] = hasDirectRevenue && hasCashbookProxy ? 'mixed' : hasDirectRevenue ? 'direct_revenue' : hasCashbookProxy ? 'cashbook_revenue_proxy' : 'missing';
  const status: ForecastStatus = canForecast ? (revenueSource === 'cashbook_revenue_proxy' || missingSources.length ? 'can_doi_chieu' : 'du_du_lieu') : 'chua_du_du_lieu';

  const scenarios: ForecastScenario[] = canForecast
    ? [
        {
          id: 'than_trong',
          name: 'Thận trọng',
          revenue: baseRevenue * 0.92,
          cashOut: baseCashOut * 1.05,
          netCashflow: baseRevenue * 0.92 - baseCashOut * 1.05,
          rangeLow: baseRevenue * 0.89,
          rangeHigh: baseRevenue * 0.95,
          assumptions: ['Doanh thu giảm nhẹ', 'Chi phí tăng do phát sinh/NCC', 'Ưu tiên giữ tiền mặt'],
          needsCeoApproval: baseRevenue * 0.92 - baseCashOut * 1.05 < 0
        },
        {
          id: 'co_so',
          name: 'Cơ sở',
          revenue: baseRevenue,
          cashOut: baseCashOut,
          netCashflow: baseRevenue - baseCashOut,
          rangeLow: baseRevenue * 0.97,
          rangeHigh: baseRevenue * 1.03,
          assumptions: ['Dựa trên trung bình động có trọng số 4 tuần gần nhất', 'Không có cú sốc chi phí lớn'],
          needsCeoApproval: baseRevenue - baseCashOut < 0 || baseCashOut > baseRevenue * 0.9
        },
        {
          id: 'tang_truong',
          name: 'Tăng trưởng',
          revenue: baseRevenue * 1.07,
          cashOut: baseCashOut * 1.03,
          netCashflow: baseRevenue * 1.07 - baseCashOut * 1.03,
          rangeLow: baseRevenue * 1.04,
          rangeHigh: baseRevenue * 1.1,
          assumptions: ['Doanh thu tăng', 'Chi phí tăng nhẹ theo sản lượng', 'Cần chuẩn bị nhân sự và NVL'],
          needsCeoApproval: false
        }
      ]
    : [];

  const notes = [
    canForecast ? `Có ${historyWeekCount} tuần lịch sử dùng được.` : `Chỉ có ${historyWeekCount}/${MIN_HISTORY_WEEKS} tuần lịch sử dùng được.`,
    revenueSource === 'cashbook_revenue_proxy' ? 'Doanh thu đang dùng proxy từ phiếu thu doanh thu trong Sổ quỹ, cần đối chiếu doanh thu app/cửa hàng.' : '',
    missingSources.length ? `Còn thiếu nguồn: ${missingSources.join(', ')}.` : 'Đủ nguồn chính để lập dự toán.'
  ].filter(Boolean);
  const score = Math.max(0, Math.min(100, (historyWeekCount / MIN_HISTORY_WEEKS) * 55 + (hasDirectRevenue ? 25 : 10) + (cashbook.length ? 10 : 0) + (inventory.length ? 5 : 0) + (lossRows.length ? 5 : 0)));
  const dataQuality = {
    score: Math.round(score),
    label: !canForecast ? 'Chưa đủ dữ liệu' : score >= 80 ? 'Tốt' : score >= 60 ? 'Cần đối chiếu' : 'Thấp',
    notes,
    missingSources
  };

  const scenarioRows = scenarios.map((scenario) => [
    scenario.name,
    formatMoney(scenario.revenue),
    formatMoney(scenario.cashOut),
    formatMoney(scenario.netCashflow),
    `${formatMoney(scenario.rangeLow)} - ${formatMoney(scenario.rangeHigh)}`,
    scenario.needsCeoApproval ? 'Cần CEO duyệt' : 'Theo dõi'
  ]);
  const historyRows = historyWeeks.slice(-8).map((week) => [
    week.weekCode,
    formatMoney(week.revenue),
    formatMoney(week.cashIn),
    formatMoney(week.cashOut),
    formatMoney(week.netCashflow),
    week.directRevenue > 0 ? 'Doanh thu trực tiếp' : week.cashbookRevenue > 0 ? 'Sổ quỹ proxy' : 'Thiếu doanh thu'
  ]);
  const evidenceRows = [
    ['Lịch sử tối thiểu', `${historyWeekCount}/${MIN_HISTORY_WEEKS} tuần`, canForecast ? 'Đạt' : 'Chưa đạt'],
    ['Nguồn doanh thu', revenueSource, revenueSource === 'cashbook_revenue_proxy' ? 'Cần đối chiếu' : 'Đạt'],
    ['Nguồn tiền ra', cashOutValues.length ? `${cashOutValues.length} tuần có chi` : 'Chưa có', cashOutValues.length ? 'Đạt' : 'Chưa đạt'],
    ['Nguồn còn thiếu', missingSources.join(', ') || 'Không', missingSources.length ? 'Cảnh báo' : 'Tốt']
  ];
  const actionRows = canForecast
    ? [
        ['Kế toán', 'Đối chiếu giả định dự toán cơ sở với file doanh thu/sổ quỹ', 'Trước khi CEO duyệt'],
        ['CEO', 'Duyệt hoặc từ chối kịch bản chốt trước khi ghi DU_TOAN_TUAN_TOI', 'Trước đầu tuần tới'],
        ['Quản lý cửa hàng', 'Chuẩn bị nhân sự/NVL theo kịch bản cơ sở, không theo kịch bản tăng trưởng nếu chưa duyệt', 'Hôm nay']
      ]
    : [
        ['Kế toán', 'Import đủ tối thiểu 4 tuần doanh thu/sổ quỹ hợp lệ', 'Trước khi lập dự toán'],
        ['Kế toán', 'Bổ sung doanh thu app/cửa hàng để không phụ thuộc proxy từ sổ quỹ', 'Trong hôm nay']
      ];

  return {
    ok: true,
    status,
    canForecast,
    message: canForecast
      ? status === 'can_doi_chieu'
        ? 'Đã tạo dự toán nháp từ calculation engine, nhưng cần đối chiếu nguồn thiếu/proxy trước khi CEO chốt.'
        : 'Đã tạo dự toán nháp từ calculation engine. Chỉ ghi bản chốt sau khi CEO duyệt.'
      : 'Chưa đủ dữ liệu để lập dự toán.',
    minimumHistoryWeeks: MIN_HISTORY_WEEKS,
    historyWeekCount,
    historyWeeks,
    baseline: {
      revenue: baseRevenue,
      cashOut: baseCashOut,
      netCashflow: baseRevenue - baseCashOut,
      revenueSource,
      weightedFormula: 'Trung bình động có trọng số 4 tuần gần nhất: 10% / 20% / 30% / 40%, có điều chỉnh 25% xu hướng gần nhất.',
      trendPercent: revenueTrend
    },
    scenarios,
    dataQuality,
    calculationFormula: [
      'Baseline doanh thu = weighted_average_4_weeks(revenue) × (1 + trend_percent × 25%).',
      'Kịch bản thận trọng = doanh thu baseline × 92%, chi baseline × 105%.',
      'Kịch bản cơ sở = doanh thu baseline, chi baseline.',
      'Kịch bản tăng trưởng = doanh thu baseline × 107%, chi baseline × 103%.',
      'Gemini/AI không được tự tạo số; AI chỉ giải thích giả định và hành động.'
    ],
    approval: {
      requiredBeforeWrite: true,
      canWriteToSheet: false,
      targetSheet: 'DU_TOAN_TUAN_TOI',
      note: 'V5.0 chỉ tạo dự toán nháp/read-only. Chưa ghi DU_TOAN_TUAN_TOI nếu chưa có module CEO duyệt.'
    },
    appliedFilters: filters,
    rows: { scenarioRows, historyRows, evidenceRows, actionRows }
  };
}

export async function buildForecastReport(filters: ReportFilters = {}): Promise<ForecastReport> {
  const [storeRevenueRows, appRevenueRows, cashbookRows, inventoryRows, lossRows] = await Promise.all([
    safeRead(SHEET_NAMES.DL_DOANH_THU_CUA_HANG),
    safeRead(SHEET_NAMES.DL_DOANH_THU_APP),
    safeRead(SHEET_NAMES.DL_SO_QUY),
    safeRead(SHEET_NAMES.DL_TON_KHO),
    safeRead(SHEET_NAMES.DL_THAT_THOAT_NVL)
  ]);
  return buildForecastFromRows({ storeRevenueRows, appRevenueRows, cashbookRows, inventoryRows, lossRows, filters });
}

let cachedForecastAgentInstructions: { content: string; source: 'file' | 'fallback' } | null = null;

export async function loadForecastAgentInstructions() {
  if (cachedForecastAgentInstructions) return cachedForecastAgentInstructions;
  const candidate = path.join(/*turbopackIgnore: true*/ process.cwd(), '.agents', 'AI_FORECAST_AGENT.md');
  try {
    const content = await readFile(candidate, 'utf8');
    if (content.includes('AI_FORECAST_AGENT') && content.includes('Không tự tạo số dự toán')) {
      cachedForecastAgentInstructions = { content, source: 'file' };
      return cachedForecastAgentInstructions;
    }
  } catch {
    // Use fallback without exposing path details.
  }
  cachedForecastAgentInstructions = { content: FORECAST_AGENT_FALLBACK, source: 'fallback' };
  return cachedForecastAgentInstructions;
}

function ruleBasedForecastAnalysis(forecast: ForecastReport, agentSource: 'file' | 'fallback', provider: 'openai' | 'gemini' | 'missing'): ForecastAgentAnalysis {
  if (!forecast.canForecast) {
    return {
      mode: 'rule_based_not_enough_data',
      provider,
      agentSource,
      overall_status: 'chua_du_du_lieu',
      can_forecast: false,
      summary_for_ceo: 'Chưa đủ dữ liệu để lập dự toán. Cần tối thiểu 4 tuần lịch sử hợp lệ và nguồn doanh thu/sổ quỹ đáng tin cậy.',
      scenario_explanation: [],
      risks: forecast.dataQuality.notes,
      actions: forecast.rows.actionRows.map((row) => ({ action: row[1] ?? '', owner: row[0] ?? 'Kế toán', deadline: row[2] ?? 'Hôm nay' })),
      missing_data: forecast.dataQuality.missingSources.length ? forecast.dataQuality.missingSources : ['Tối thiểu 4 tuần dữ liệu lịch sử'],
      confidence: 0
    };
  }
  return {
    mode: 'rule_based_missing_env',
    provider,
    agentSource,
    overall_status: forecast.status === 'du_du_lieu' ? 'tot' : 'canh_bao',
    can_forecast: true,
    summary_for_ceo: forecast.status === 'du_du_lieu'
      ? 'Đã có thể xem dự toán nháp. Số dự toán do calculation engine tính, chưa ghi vào DU_TOAN_TUAN_TOI nếu CEO chưa duyệt.'
      : 'Đã có dự toán nháp nhưng cần đối chiếu nguồn thiếu/proxy trước khi CEO chốt.',
    scenario_explanation: forecast.scenarios.map((scenario) => `${scenario.name}: doanh thu ${formatMoney(scenario.revenue)}, chi ${formatMoney(scenario.cashOut)}, dòng tiền ${formatMoney(scenario.netCashflow)}.`),
    risks: [
      ...forecast.dataQuality.notes,
      ...forecast.scenarios.filter((scenario) => scenario.needsCeoApproval).map((scenario) => `Kịch bản ${scenario.name} cần CEO duyệt vì dòng tiền hoặc chi phí có rủi ro.`)
    ],
    actions: forecast.rows.actionRows.map((row) => ({ action: row[1] ?? '', owner: row[0] ?? 'Kế toán', deadline: row[2] ?? 'Hôm nay' })),
    missing_data: forecast.dataQuality.missingSources,
    confidence: Math.round((forecast.dataQuality.score / 100) * 100) / 100
  };
}

function safeForecastJsonFromText(text: string): Omit<ForecastAgentAnalysis, 'mode' | 'provider' | 'agentSource' | 'raw'> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Omit<ForecastAgentAnalysis, 'mode' | 'provider' | 'agentSource' | 'raw'>;
    if (typeof parsed.summary_for_ceo === 'string' && Array.isArray(parsed.actions)) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function callOpenAiForecast(agentContent: string, userPrompt: string) {
  const env = getServerEnv();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiModel,
      messages: [
        { role: 'system', content: agentContent },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 200));
  const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? '';
}

async function callGeminiForecast(agentContent: string, userPrompt: string) {
  const env = getServerEnv();
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': env.geminiApiKey ?? ''
    },
    body: JSON.stringify({
      model: env.geminiModel,
      system_instruction: agentContent,
      input: userPrompt,
      generation_config: { temperature: 0.2, thinking_level: 'low' },
      response_format: { type: 'text', mime_type: 'application/json', schema: FORECAST_JSON_SCHEMA }
    })
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 200));
  const json = (await response.json()) as { output_text?: string; steps?: Array<{ output_text?: string; text?: string }> };
  return json.output_text ?? json.steps?.map((step) => step.output_text ?? step.text ?? '').join('\n') ?? '';
}

export async function analyzeForecastWithAi(filters: ReportFilters = {}): Promise<{ forecast: ForecastReport; analysis: ForecastAgentAnalysis }> {
  const forecast = await buildForecastReport(filters);
  const agent = await loadForecastAgentInstructions();
  const provider = getConfiguredAiProvider();
  if (provider === 'missing' || !forecast.canForecast) return { forecast, analysis: ruleBasedForecastAnalysis(forecast, agent.source, provider) };
  const userPrompt = `Dữ liệu dự toán JSON do calculation engine tạo:\n${JSON.stringify(forecast).slice(0, 22000)}\n\nHãy giải thích theo đúng AI_FORECAST_AGENT.md. Không tự tạo số. Trả JSON thuần, không markdown.`;
  try {
    const content = provider === 'gemini'
      ? await callGeminiForecast(agent.content, userPrompt)
      : await callOpenAiForecast(agent.content, userPrompt);
    const parsed = safeForecastJsonFromText(content);
    if (!parsed) {
      return {
        forecast,
        analysis: {
          ...ruleBasedForecastAnalysis(forecast, agent.source, provider),
          raw: content.slice(0, 500),
          summary_for_ceo: 'AI trả về format không hợp lệ, dùng rule-based forecast fallback.'
        }
      };
    }
    return {
      forecast,
      analysis: {
        mode: provider === 'gemini' ? 'real_gemini' : 'real_openai',
        provider,
        agentSource: agent.source,
        ...parsed,
        raw: content.slice(0, 500)
      }
    };
  } catch (error) {
    return {
      forecast,
      analysis: {
        ...ruleBasedForecastAnalysis(forecast, agent.source, provider),
        summary_for_ceo: `${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API lỗi, dùng rule-based forecast fallback. ${error instanceof Error ? error.message : 'Lỗi không xác định.'}`
      }
    };
  }
}
