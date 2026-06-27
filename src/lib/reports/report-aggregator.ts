import { getDataStore } from "@/lib/data-store";
import { getServerEnv } from "@/lib/env/server-env";
import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";
import type { Status } from "@/lib/report-types";
import {
  buildReportFilterOptions,
  filterRowsByReportFilters,
  hasActiveFilters,
  parseDateToUtc,
  type ReportFilterOptions,
  type ReportFilters,
} from "./report-filters";

export type Kpi = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  status?: Status;
};

export type DashboardReport = {
  dataMode: "google_sheets" | "local" | "missing_data" | "error";
  hasRealData: boolean;
  message: string;
  executiveKpis: Kpi[];
  pnlRows: string[][];
  cashflowRows: string[][];
  balanceRows: string[][];
  lossTop5Rows: string[][];
  issueRows: string[][];
  dataReadinessRows: string[][];
  cashbookTopInRows: string[][];
  cashbookTopOutRows: string[][];
  cashbookGroupRows: string[][];
  cashbookDailyRows: string[][];
  cashbookWarningRows: string[][];
  appliedFilters: ReportFilters;
  filterOptions: ReportFilterOptions;
  filterActive: boolean;
  rawSourceCounts: {
    storeRevenue: number;
    appRevenue: number;
    cashbook: number;
    inventory: number;
    lossRows: number;
    auditRows: number;
    importHistory: number;
  };
  revenueByChannel: Array<{ channel: string; revenue: string; value: number }>;
  sourceCounts: {
    storeRevenue: number;
    appRevenue: number;
    cashbook: number;
    inventory: number;
    lossRows: number;
    auditRows: number;
    importHistory: number;
  };
  totals: {
    revenue: number;
    storeSales: number;
    appNet: number;
    appGross: number;
    appFees: number;
    appCogs: number;
    cashIn: number;
    cashOut: number;
    cashEnding: number;
    cashbookRevenueIn: number;
    biggestCashOut: number;
    inventoryValue: number;
    negativeStockCount: number;
    lossValue: number;
    cogsPercent: number;
    appFeePercent: number;
  };
  missingSources: string[];
  errors?: string[];
};

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const number = Number(
    String(value ?? "")
      .replace(/,/g, "")
      .replace(/%/g, "")
      .replace(/đ/g, "")
      .trim(),
  );
  return Number.isFinite(number) ? number : 0;
}

function pickNumber(row: Record<string, unknown>, columns: string[]) {
  for (const column of columns) {
    const value = toNumber(row[column]);
    if (value !== 0) return value;
  }
  return 0;
}

function sum(rows: Record<string, unknown>[], columns: string[]) {
  return rows.reduce((total, row) => total + pickNumber(row, columns), 0);
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")}tr`;
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function statusFromRatio(
  value: number,
  warning: number,
  danger: number,
): Status {
  if (!Number.isFinite(value) || value <= 0) return "neutral";
  if (value >= danger) return "danger";
  if (value >= warning) return "warning";
  return "good";
}

function validImportRows(rows: Record<string, unknown>[]) {
  return rows.filter(
    (row) =>
      String(row["Mã dòng dữ liệu"] ?? "").trim() ||
      String(row["Mã lần import"] ?? "").trim() ||
      String(row["Tên file nguồn"] ?? "").trim(),
  );
}

function cashbookAmount(row: Record<string, unknown>) {
  return pickNumber(row, ["Số tiền", "Giá trị"]);
}

function cashbookType(row: Record<string, unknown>) {
  const amount = cashbookAmount(row);
  const raw = String(row["Loại giao dịch"] ?? "")
    .trim()
    .toLowerCase();
  if (raw.includes("thu")) return "Thu";
  if (raw.includes("chi")) return "Chi";
  return amount >= 0 ? "Thu" : "Chi";
}

function cashbookGroup(row: Record<string, unknown>) {
  return String(row["Nhóm thu/chi"] ?? "Khác").trim() || "Khác";
}

function cashbookDescription(row: Record<string, unknown>) {
  return (
    String(
      row["Diễn giải"] ?? row["Ghi chú"] ?? row["Nội dung"] ?? "",
    ).trim() || "Chưa có diễn giải"
  );
}

function cashbookBranch(row: Record<string, unknown>) {
  return String(row["Chi nhánh"] ?? "").trim() || "Chưa rõ";
}

function cashbookDateLabel(row: Record<string, unknown>) {
  const utc = parseDateToUtc(row["Ngày"] ?? row["Ngày import"]);
  if (utc === null) return String(row["Ngày"] ?? "Không rõ ngày");
  const date = new Date(utc);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

function statusLabel(status: Status) {
  if (status === "good") return "Tốt";
  if (status === "danger") return "Nguy hiểm";
  if (status === "warning") return "Cảnh báo";
  return "Chưa đủ dữ liệu";
}

function aggregateCashbook(cashbook: Record<string, unknown>[]) {
  const normalized = cashbook
    .map((row) => ({
      row,
      amount: cashbookAmount(row),
      type: cashbookType(row),
      group: cashbookGroup(row),
      date: cashbookDateLabel(row),
      description: cashbookDescription(row),
      branch: cashbookBranch(row),
    }))
    .filter((item) => item.amount !== 0);
  const cashInRows = normalized.filter(
    (item) => item.amount > 0 || item.type === "Thu",
  );
  const cashOutRows = normalized.filter(
    (item) => item.amount < 0 || item.type === "Chi",
  );
  const cashIn = cashInRows.reduce(
    (total, item) => total + Math.abs(item.amount),
    0,
  );
  const cashOut = cashOutRows.reduce(
    (total, item) => total + Math.abs(item.amount),
    0,
  );
  const cashbookRevenueIn = cashInRows
    .filter((item) => normalizeCashbookGroup(item.group).includes("doanh-thu"))
    .reduce((total, item) => total + Math.abs(item.amount), 0);
  const largeExpenseThreshold = Math.max(5_000_000, cashOut * 0.08);

  const topIn = [...cashInRows]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 8);
  const topOut = [...cashOutRows]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 10);
  const warnings = topOut
    .filter((item) => Math.abs(item.amount) >= largeExpenseThreshold)
    .slice(0, 8);

  const byGroup = new Map<
    string,
    { group: string; count: number; cashIn: number; cashOut: number }
  >();
  for (const item of normalized) {
    const current = byGroup.get(item.group) ?? {
      group: item.group,
      count: 0,
      cashIn: 0,
      cashOut: 0,
    };
    current.count += 1;
    if (item.amount >= 0 || item.type === "Thu")
      current.cashIn += Math.abs(item.amount);
    else current.cashOut += Math.abs(item.amount);
    byGroup.set(item.group, current);
  }

  const byDate = new Map<
    string,
    { date: string; count: number; cashIn: number; cashOut: number }
  >();
  for (const item of normalized) {
    const current = byDate.get(item.date) ?? {
      date: item.date,
      count: 0,
      cashIn: 0,
      cashOut: 0,
    };
    current.count += 1;
    if (item.amount >= 0 || item.type === "Thu")
      current.cashIn += Math.abs(item.amount);
    else current.cashOut += Math.abs(item.amount);
    byDate.set(item.date, current);
  }

  const topInRows = topIn.map((item) => [
    item.date,
    item.group,
    item.description,
    formatMoney(Math.abs(item.amount)),
    item.branch,
    "Tốt",
  ]);
  const topOutRows = topOut.map((item) => [
    item.date,
    item.group,
    item.description,
    formatMoney(Math.abs(item.amount)),
    item.branch,
    Math.abs(item.amount) >= largeExpenseThreshold ? "Cần đối chiếu" : "Tốt",
  ]);
  const groupRows = Array.from(byGroup.values())
    .sort((a, b) => b.cashOut + b.cashIn - (a.cashOut + a.cashIn))
    .map((item) => [
      item.group,
      String(item.count),
      formatMoney(item.cashIn),
      formatMoney(item.cashOut),
      formatMoney(item.cashIn - item.cashOut),
      item.cashOut > item.cashIn ? "Cần kiểm" : "Tốt",
      "Tổng hợp từ DL_SO_QUY",
    ]);
  const dailyRows = Array.from(byDate.values())
    .sort((a, b) => parseDateToUtc(a.date)! - parseDateToUtc(b.date)!)
    .map((item) => [
      item.date,
      String(item.count),
      formatMoney(item.cashIn),
      formatMoney(item.cashOut),
      formatMoney(item.cashIn - item.cashOut),
      item.cashOut > item.cashIn ? "Cảnh báo" : "Tốt",
    ]);
  const warningRows = warnings.map((item, index) => [
    String(index + 1),
    item.date,
    item.group,
    item.description,
    formatMoney(Math.abs(item.amount)),
    "Chi lớn hơn ngưỡng cảnh báo theo sổ quỹ",
    "Kế toán đối chiếu chứng từ/NCC và ghi chú lý do",
  ]);

  return {
    cashIn,
    cashOut,
    cashEnding: cashIn - cashOut,
    cashbookRevenueIn,
    biggestCashOut: topOut[0] ? Math.abs(topOut[0].amount) : 0,
    topInRows,
    topOutRows,
    groupRows,
    dailyRows,
    warningRows,
    largeExpenseThreshold,
  };
}

function normalizeCashbookGroup(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-");
}

async function safeRead(sheetName: string) {
  try {
    return await getDataStore().read(sheetName);
  } catch (error) {
    console.error(
      `[report-aggregator] Cannot read ${sheetName}:`,
      error instanceof Error ? error.message : error,
    );
    return [] as Record<string, unknown>[];
  }
}

function emptyReport(
  filters: ReportFilters = {},
  filterOptions: ReportFilterOptions = {
    branches: [],
    weeks: [],
    channels: [],
    sources: [],
    dataStatuses: [],
    alertStatuses: [],
    costGroups: [],
    importedBy: [],
  },
  rawSourceCounts = {
    storeRevenue: 0,
    appRevenue: 0,
    cashbook: 0,
    inventory: 0,
    lossRows: 0,
    auditRows: 0,
    importHistory: 0,
  },
  errors: string[] = [],
): DashboardReport {
  const env = getServerEnv();
  return {
    dataMode:
      env.dataStore === "google_sheets" ? "google_sheets" : "missing_data",
    hasRealData: false,
    message:
      "Chưa đủ dữ liệu để kết luận. Vui lòng import dữ liệu thật rồi xác nhận ghi Google Sheet.",
    executiveKpis: [
      {
        label: "Tổng doanh thu",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu import thật",
        hint: "Không dùng dữ liệu mẫu",
      },
      {
        label: "Doanh thu cửa hàng",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import doanh thu cửa hàng",
      },
      {
        label: "Doanh thu app net",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import doanh thu app",
      },
      {
        label: "Dòng tiền",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import sổ quỹ",
      },
      {
        label: "Tồn kho",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import tồn kho",
      },
      {
        label: "Thất thoát NVL",
        value: "—",
        status: "neutral",
        trend: "Chưa có dữ liệu",
        hint: "Cần import thất thoát",
      },
    ],
    pnlRows: [
      [
        "Dữ liệu",
        "P&L Tuần",
        "Chưa đủ dữ liệu",
        "—",
        "—",
        "—",
        "Không kết luận",
      ],
    ],
    cashflowRows: [
      [
        "Dữ liệu",
        "Dòng tiền Tuần",
        "Chưa đủ dữ liệu",
        "—",
        "—",
        "Chưa đối chiếu",
        "Cần import sổ quỹ",
      ],
    ],
    balanceRows: [
      [
        "Dữ liệu",
        "Cân đối rút gọn",
        "Chưa đủ dữ liệu",
        "—",
        "—",
        "Chưa đủ dữ liệu",
        "Cần import sổ quỹ/tồn kho/công nợ",
      ],
    ],
    lossTop5Rows: [],
    dataReadinessRows: [
      ["Dòng tiền", "Chưa đủ dữ liệu", "Thiếu DL_SO_QUY", "Cần import sổ quỹ"],
      [
        "P&L đầy đủ",
        "Chưa đủ dữ liệu",
        "Thiếu doanh thu/app/tồn kho/thất thoát",
        "Không được kết luận lợi nhuận",
      ],
      ["Tồn kho", "Chưa đủ dữ liệu", "Thiếu DL_TON_KHO", "Cần import tồn kho"],
      [
        "Thất thoát",
        "Chưa đủ dữ liệu",
        "Thiếu DL_THAT_THOAT_NVL",
        "Cần import thất thoát",
      ],
    ],
    cashbookTopInRows: [],
    cashbookTopOutRows: [],
    cashbookGroupRows: [],
    cashbookDailyRows: [],
    cashbookWarningRows: [],
    issueRows: [
      [
        "1",
        "Chưa đủ dữ liệu để kết luận",
        "Không hiển thị số mẫu",
        hasActiveFilters(filters)
          ? "Bộ lọc hiện tại không có dữ liệu hợp lệ"
          : "Google Sheet chưa có dữ liệu import thật",
        "Import đủ file, kiểm tra bộ lọc và xác nhận ghi Google Sheet",
      ],
    ],
    appliedFilters: filters,
    filterOptions,
    filterActive: hasActiveFilters(filters),
    rawSourceCounts,
    revenueByChannel: [],
    sourceCounts: {
      storeRevenue: 0,
      appRevenue: 0,
      cashbook: 0,
      inventory: 0,
      lossRows: 0,
      auditRows: 0,
      importHistory: 0,
    },
    totals: {
      revenue: 0,
      storeSales: 0,
      appNet: 0,
      appGross: 0,
      appFees: 0,
      appCogs: 0,
      cashIn: 0,
      cashOut: 0,
      cashEnding: 0,
      cashbookRevenueIn: 0,
      biggestCashOut: 0,
      inventoryValue: 0,
      negativeStockCount: 0,
      lossValue: 0,
      cogsPercent: 0,
      appFeePercent: 0,
    },
    missingSources: [
      "DL_DOANH_THU_APP",
      "DL_DOANH_THU_CUA_HANG",
      "DL_SO_QUY",
      "DL_TON_KHO",
      "DL_THAT_THOAT_NVL",
    ],
    errors,
  };
}

export async function buildDashboardReport(
  filters: ReportFilters = {},
): Promise<DashboardReport> {
  const env = getServerEnv();
  const activeFilters = hasActiveFilters(filters);
  const [
    storeRevenueRaw,
    appRevenueRaw,
    cashbookRaw,
    inventoryRaw,
    lossRowsRaw,
    auditRows,
    importHistory,
  ] = await Promise.all([
    safeRead(SHEET_NAMES.DL_DOANH_THU_CUA_HANG),
    safeRead(SHEET_NAMES.DL_DOANH_THU_APP),
    safeRead(SHEET_NAMES.DL_SO_QUY),
    safeRead(SHEET_NAMES.DL_TON_KHO),
    safeRead(SHEET_NAMES.DL_THAT_THOAT_NVL),
    safeRead(SHEET_NAMES.AUDIT_LOG),
    safeRead(SHEET_NAMES.IMPORT_LICH_SU),
  ]);

  const storeRevenueAll = validImportRows(storeRevenueRaw);
  const appRevenueAll = validImportRows(appRevenueRaw);
  const cashbookAll = validImportRows(cashbookRaw);
  const inventoryAll = validImportRows(inventoryRaw);
  const lossRowsAll = validImportRows(lossRowsRaw);

  const rawGroups = [
    {
      sheetName: SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
      label: "Doanh thu cửa hàng",
      rows: storeRevenueAll,
    },
    {
      sheetName: SHEET_NAMES.DL_DOANH_THU_APP,
      label: "Doanh thu app",
      rows: appRevenueAll,
    },
    { sheetName: SHEET_NAMES.DL_SO_QUY, label: "Sổ quỹ", rows: cashbookAll },
    { sheetName: SHEET_NAMES.DL_TON_KHO, label: "Tồn kho", rows: inventoryAll },
    {
      sheetName: SHEET_NAMES.DL_THAT_THOAT_NVL,
      label: "Thất thoát NVL",
      rows: lossRowsAll,
    },
    { sheetName: SHEET_NAMES.AUDIT_LOG, label: "Audit log", rows: auditRows },
    {
      sheetName: SHEET_NAMES.IMPORT_LICH_SU,
      label: "Lịch sử import",
      rows: importHistory,
    },
  ];
  const filterOptions = buildReportFilterOptions(rawGroups);
  const rawSourceCounts = {
    storeRevenue: storeRevenueAll.length,
    appRevenue: appRevenueAll.length,
    cashbook: cashbookAll.length,
    inventory: inventoryAll.length,
    lossRows: lossRowsAll.length,
    auditRows: auditRows.length,
    importHistory: importHistory.length,
  };

  const storeRevenue = filterRowsByReportFilters(
    storeRevenueAll,
    SHEET_NAMES.DL_DOANH_THU_CUA_HANG,
    filters,
  );
  const appRevenue = filterRowsByReportFilters(
    appRevenueAll,
    SHEET_NAMES.DL_DOANH_THU_APP,
    filters,
  );
  const cashbook = filterRowsByReportFilters(
    cashbookAll,
    SHEET_NAMES.DL_SO_QUY,
    filters,
  );
  const inventory = filterRowsByReportFilters(
    inventoryAll,
    SHEET_NAMES.DL_TON_KHO,
    filters,
  );
  const lossRows = filterRowsByReportFilters(
    lossRowsAll,
    SHEET_NAMES.DL_THAT_THOAT_NVL,
    filters,
  );

  const sourceCounts = {
    storeRevenue: storeRevenue.length,
    appRevenue: appRevenue.length,
    cashbook: cashbook.length,
    inventory: inventory.length,
    lossRows: lossRows.length,
    auditRows: auditRows.length,
    importHistory: importHistory.length,
  };
  const hasRealData = Object.values(sourceCounts)
    .slice(0, 5)
    .some((count) => count > 0);
  if (!hasRealData) return emptyReport(filters, filterOptions, rawSourceCounts);

  const storeSales = sum(storeRevenue, ["Doanh thu bán hàng thực"]);
  const appNet = sum(appRevenue, ["Doanh thu ròng"]);
  const appGross = sum(appRevenue, ["Doanh thu gộp"]);
  const appFees = sum(appRevenue, ["Tổng khấu trừ/phí"]);
  const appCogs = sum(appRevenue, ["Giá vốn"]);
  const cashbookInsights = aggregateCashbook(cashbook);
  const { cashIn, cashOut, cashEnding, cashbookRevenueIn, biggestCashOut } =
    cashbookInsights;
  const inventoryValue = sum(inventory, ["Giá trị tồn", "Giá trị tồn kho"]);
  const negativeStockCount = inventory.filter(
    (row) => pickNumber(row, ["Tồn kho", "Tồn kho hiện tại"]) < 0,
  ).length;
  const lossValue = lossRows.reduce(
    (total, row) => total + Math.abs(pickNumber(row, ["Giá trị chênh lệch"])),
    0,
  );
  const revenue = storeSales + appNet;
  const cogsPercent = revenue ? (appCogs + lossValue) / revenue : 0;
  const appFeePercent = appGross ? appFees / appGross : 0;

  const missingSources = [
    storeRevenue.length ? "" : "DL_DOANH_THU_CUA_HANG",
    appRevenue.length ? "" : "DL_DOANH_THU_APP",
    cashbook.length ? "" : "DL_SO_QUY",
    inventory.length ? "" : "DL_TON_KHO",
    lossRows.length ? "" : "DL_THAT_THOAT_NVL",
  ].filter(Boolean);

  const topLossRows = lossRows
    .map((row) => ({
      row,
      value: Math.abs(pickNumber(row, ["Giá trị chênh lệch"])),
      ratio: pickNumber(row, ["Tỷ lệ thất thoát"]),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(({ row, value, ratio }) => [
      String(row["Tên nguyên vật liệu"] ?? ""),
      String(row["Đơn vị tính"] ?? ""),
      String(row["Chênh lệch số lượng"] ?? ""),
      formatMoney(value),
      formatPercent(Math.abs(ratio) > 1 ? ratio / 100 : ratio),
      String(row["Định mức cho phép"] ?? "Chưa có"),
      String(row["Mức vượt định mức"] ?? "Chưa tính"),
      String(row["Trạng thái"] ?? (ratio > 0.05 ? "Cảnh báo" : "Tốt")),
      String(row["Hành động đề xuất"] ?? "Kiểm tra lại"),
    ]);

  const revenueByChannel = [
    {
      channel: "Cửa hàng",
      revenue: formatMoney(storeSales),
      value: storeSales,
    },
    { channel: "App net", revenue: formatMoney(appNet), value: appNet },
  ].filter((item) => item.value > 0);

  const executiveKpis: Kpi[] = [
    {
      label: "Tổng doanh thu",
      value: revenue > 0 ? formatMoney(revenue) : "—",
      hint: "Chỉ chốt khi có doanh thu cửa hàng/app",
      trend:
        revenue > 0
          ? activeFilters
            ? "Đã áp dụng bộ lọc"
            : "Đọc từ Google Sheet/data store"
          : "Sổ quỹ có doanh thu đã thu nhưng chưa đủ nguồn chốt P&L",
      status:
        revenue > 0 ? "good" : cashbookRevenueIn > 0 ? "warning" : "neutral",
    },
    {
      label: "Doanh thu thu qua sổ quỹ",
      value: formatMoney(cashbookRevenueIn),
      hint: "Các phiếu thu nhóm Doanh thu trong DL_SO_QUY",
      trend:
        cashbookRevenueIn > 0
          ? "Có thể đối chiếu với doanh thu app/cửa hàng"
          : "Chưa có phiếu thu doanh thu",
      status: cashbookRevenueIn > 0 ? "good" : "neutral",
    },
    {
      label: "Doanh thu cửa hàng",
      value: storeRevenue.length ? formatMoney(storeSales) : "—",
      hint: "Tiền mặt + MoMo/chuyển khoản",
      trend: `${storeRevenue.length} dòng`,
      status: storeSales > 0 ? "good" : "warning",
    },
    {
      label: "Doanh thu app net",
      value: appRevenue.length ? formatMoney(appNet) : "—",
      hint: "Sau phí app",
      trend: appRevenue.length
        ? `App fee ${formatPercent(appFeePercent)}`
        : "Cần import doanh thu app",
      status: appRevenue.length
        ? statusFromRatio(appFeePercent, 0.35, 0.45)
        : "warning",
    },
    {
      label: "Tiền vào",
      value: formatMoney(cashIn),
      hint: "Sổ quỹ phiếu thu",
      trend: `${cashbook.length} dòng sổ quỹ`,
      status: cashIn > 0 ? "good" : "warning",
    },
    {
      label: "Tiền ra",
      value: formatMoney(cashOut),
      hint: "Sổ quỹ phiếu chi",
      trend:
        biggestCashOut > 0
          ? `Khoản chi lớn nhất ${formatMoney(biggestCashOut)}`
          : "Chưa đủ dữ liệu",
      status:
        cashOut > cashIn
          ? "danger"
          : cashbookInsights.warningRows.length
            ? "warning"
            : "good",
    },
    {
      label: "Dòng tiền tạm",
      value: formatMoney(cashEnding),
      hint: "Thu - chi từ sổ quỹ",
      trend: cashEnding < 0 ? "Âm dòng tiền" : "Dương dòng tiền",
      status: cashEnding < 0 ? "danger" : "good",
    },
    {
      label: "Tồn kho",
      value: formatMoney(inventoryValue),
      hint: `${negativeStockCount} mặt hàng tồn âm`,
      trend: negativeStockCount ? "Cần kiểm tồn âm" : "Ổn",
      status: inventory.length
        ? negativeStockCount
          ? "warning"
          : "good"
        : "neutral",
    },
    {
      label: "Thất thoát quy tiền",
      value: formatMoney(lossValue),
      hint: "Tổng trị tuyệt đối chênh lệch",
      trend: lossRows.length ? `${lossRows.length} NVL` : "Chưa có dữ liệu",
      status: lossValue > 0 ? "warning" : "neutral",
    },
  ];

  const pnlRows = [
    [
      "Doanh thu",
      "Doanh thu cửa hàng",
      formatMoney(storeSales),
      "—",
      "—",
      "—",
      storeRevenue.length ? "Tốt" : "Chưa đủ dữ liệu",
    ],
    [
      "Doanh thu",
      "Doanh thu app net",
      formatMoney(appNet),
      "—",
      "—",
      "—",
      appRevenue.length ? "Tốt" : "Chưa đủ dữ liệu",
    ],
    [
      "Giá vốn",
      "Giá vốn app",
      formatMoney(appCogs),
      "—",
      "—",
      formatPercent(revenue ? appCogs / revenue : 0),
      appCogs ? "Cần kiểm" : "Chưa đủ dữ liệu",
    ],
    [
      "Thất thoát",
      "Thất thoát quy tiền",
      formatMoney(lossValue),
      "—",
      "—",
      formatPercent(revenue ? lossValue / revenue : 0),
      lossValue ? "Cảnh báo" : "Chưa đủ dữ liệu",
    ],
    [
      "Tỷ lệ",
      "App fee%",
      formatPercent(appFeePercent),
      "—",
      "—",
      "—",
      appRevenue.length
        ? appFeePercent > 0.45
          ? "Nguy hiểm"
          : appFeePercent > 0.35
            ? "Cảnh báo"
            : "Tốt"
        : "Chưa đủ dữ liệu",
    ],
    [
      "Tỷ lệ",
      "COGS tạm tính",
      formatPercent(cogsPercent),
      "—",
      "—",
      "—",
      revenue
        ? cogsPercent > 0.47
          ? "Nguy hiểm"
          : cogsPercent > 0.43
            ? "Cảnh báo"
            : "Tốt"
        : "Chưa đủ dữ liệu",
    ],
  ];

  const cashflowRows = [
    [
      "Sổ quỹ",
      "Tổng tiền vào",
      formatMoney(cashIn),
      "—",
      "—",
      cashbook.length ? "Đã đối chiếu" : "Chưa đối chiếu",
      "Đọc từ DL_SO_QUY",
    ],
    [
      "Sổ quỹ",
      "Tổng tiền ra",
      formatMoney(cashOut),
      "—",
      "—",
      cashbook.length ? "Đã đối chiếu" : "Chưa đối chiếu",
      "Đọc từ DL_SO_QUY",
    ],
    [
      "Sổ quỹ",
      "Dòng tiền tạm",
      formatMoney(cashEnding),
      "—",
      "—",
      cashbook.length ? "Đã đối chiếu" : "Chưa đối chiếu",
      "Thu - chi",
    ],
    [
      "Sổ quỹ",
      "Doanh thu đã thu",
      formatMoney(cashbookRevenueIn),
      "—",
      "—",
      cashbookRevenueIn ? "Cần đối chiếu" : "Chưa đủ dữ liệu",
      "Đối chiếu với doanh thu app/cửa hàng",
    ],
    [
      "Sổ quỹ",
      "Khoản chi lớn nhất",
      formatMoney(biggestCashOut),
      "—",
      "—",
      biggestCashOut ? "Cần đối chiếu" : "Chưa đủ dữ liệu",
      "Xem bảng Top khoản chi",
    ],
  ];

  const balanceRows = [
    [
      "Tài sản ngắn hạn",
      "Tiền tạm tính",
      formatMoney(cashEnding),
      "—",
      "—",
      cashbook.length ? "Tốt" : "Chưa đủ dữ liệu",
      "Từ sổ quỹ",
    ],
    [
      "Tài sản ngắn hạn",
      "Tồn kho",
      formatMoney(inventoryValue),
      "—",
      "—",
      inventory.length
        ? negativeStockCount
          ? "Cảnh báo"
          : "Tốt"
        : "Chưa đủ dữ liệu",
      inventory.length
        ? `${negativeStockCount} mặt hàng tồn âm`
        : "Thiếu DL_TON_KHO",
    ],
    [
      "Rủi ro",
      "Thất thoát quy tiền",
      formatMoney(lossValue),
      "—",
      "—",
      lossValue ? "Cảnh báo" : "Chưa đủ dữ liệu",
      "Từ báo cáo thất thoát",
    ],
  ];

  const dataReadinessRows = [
    [
      "Dòng tiền",
      statusLabel(cashbook.length ? "good" : "neutral"),
      cashbook.length ? `${cashbook.length} dòng sổ quỹ` : "Thiếu DL_SO_QUY",
      cashbook.length
        ? "Đủ để xem thu/chi và chi bất thường"
        : "Cần import sổ quỹ",
    ],
    [
      "P&L đầy đủ",
      statusLabel(
        storeRevenue.length && appRevenue.length ? "warning" : "neutral",
      ),
      storeRevenue.length || appRevenue.length
        ? "Có một phần doanh thu"
        : "Thiếu doanh thu app/cửa hàng",
      "Không chốt lợi nhuận nếu thiếu giá vốn/tồn kho/thất thoát",
    ],
    [
      "Tồn kho",
      statusLabel(inventory.length ? "good" : "neutral"),
      inventory.length
        ? `${inventory.length} dòng tồn kho`
        : "Thiếu DL_TON_KHO",
      "Cần để tính tồn và đối chiếu giá vốn",
    ],
    [
      "Thất thoát NVL",
      statusLabel(lossRows.length ? "warning" : "neutral"),
      lossRows.length
        ? `${lossRows.length} dòng thất thoát`
        : "Thiếu DL_THAT_THOAT_NVL",
      "Cần để cảnh báo hao hụt/vượt định mức",
    ],
  ];

  const cashbookIssueRows = cashbookInsights.warningRows.map((row) => [
    row[0],
    `Chi lớn: ${row[3]}`,
    row[4],
    row[5],
    row[6],
  ]);
  const missingIssueRows = missingSources
    .filter((source) => source !== "DL_SO_QUY" || !cashbook.length)
    .map((source, index) => [
      String(cashbookIssueRows.length + index + 1),
      `Thiếu dữ liệu ${source}`,
      "Không đủ dữ liệu kết luận toàn bộ",
      "Chưa import hoặc chưa xác nhận ghi",
      "Import file tương ứng và kiểm tra Google Sheet",
    ]);
  const issueRows = [...cashbookIssueRows, ...missingIssueRows].length
    ? [...cashbookIssueRows, ...missingIssueRows]
    : [
        [
          "1",
          negativeStockCount ? "Có tồn kho âm" : "Dữ liệu đủ để xem báo cáo",
          negativeStockCount
            ? `${negativeStockCount} mặt hàng`
            : "Không có thiếu nguồn chính",
          negativeStockCount
            ? "Có thể do kiểm kê/nhập xuất lệch"
            : "Đã có dữ liệu import",
          negativeStockCount ? "Kế toán đối chiếu tồn kho" : "Theo dõi tiếp",
        ],
      ];

  return {
    dataMode: env.dataStore === "google_sheets" ? "google_sheets" : "local",
    hasRealData,
    message:
      cashbook.length && missingSources.length
        ? `${activeFilters ? "Đã áp dụng bộ lọc. " : ""}Đã có dữ liệu Sổ quỹ (${cashbook.length} dòng): có thể phân tích dòng tiền, top thu/chi và chi bất thường. Chưa đủ dữ liệu để chốt toàn bộ vì còn thiếu: ${missingSources.filter((source) => source !== "DL_SO_QUY").join(", ") || "các nguồn phụ trợ"}.`
        : missingSources.length
          ? `${activeFilters ? "Đã áp dụng bộ lọc. " : ""}Đã có dữ liệu nhưng còn thiếu: ${missingSources.join(", ")}.`
          : `${activeFilters ? "Đã áp dụng bộ lọc. " : ""}Đã đọc dữ liệu thật từ Google Sheet/data store.`,
    executiveKpis,
    pnlRows,
    cashflowRows,
    balanceRows,
    lossTop5Rows: topLossRows,
    dataReadinessRows,
    cashbookTopInRows: cashbookInsights.topInRows,
    cashbookTopOutRows: cashbookInsights.topOutRows,
    cashbookGroupRows: cashbookInsights.groupRows,
    cashbookDailyRows: cashbookInsights.dailyRows,
    cashbookWarningRows: cashbookInsights.warningRows,
    issueRows,
    appliedFilters: filters,
    filterOptions,
    filterActive: hasActiveFilters(filters),
    rawSourceCounts,
    revenueByChannel,
    sourceCounts,
    totals: {
      revenue,
      storeSales,
      appNet,
      appGross,
      appFees,
      appCogs,
      cashIn,
      cashOut,
      cashEnding,
      cashbookRevenueIn,
      biggestCashOut,
      inventoryValue,
      negativeStockCount,
      lossValue,
      cogsPercent,
      appFeePercent,
    },
    missingSources,
  };
}
