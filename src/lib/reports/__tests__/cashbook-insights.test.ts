import { describe, expect, it, vi } from "vitest";
import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";

const rowsBySheet: Record<string, Record<string, unknown>[]> = {};

vi.mock("@/lib/data-store", () => ({
  getDataStore: () => ({
    read: async (sheetName: string) => rowsBySheet[sheetName] ?? [],
    append: async () => undefined,
    replace: async () => undefined,
  }),
}));

vi.mock("@/lib/env/server-env", () => ({
  getServerEnv: () => ({ dataStore: "google_sheets" }),
}));

import { buildDashboardReport } from "../report-aggregator";

describe("cashbook dashboard visibility", () => {
  it("shows cashbook metrics and large cash-out warnings even when other sources are missing", async () => {
    rowsBySheet[SHEET_NAMES.DL_SO_QUY] = [
      {
        "Mã dòng dữ liệu": "SQ-1",
        "Mã lần import": "IMP-1",
        Ngày: "2026-06-10",
        "Mã tuần": "2026-W24",
        "Chi nhánh": "NVT",
        "Loại giao dịch": "Thu",
        "Nhóm thu/chi": "Doanh thu",
        "Diễn giải": "Phiếu thu Doanh thu Grabfood - Làng NVT",
        "Số tiền": 12000000,
        "Tên file nguồn": "SoQuy.xlsx",
        "Trạng thái dữ liệu": "Đã xác nhận",
      },
      {
        "Mã dòng dữ liệu": "SQ-2",
        "Mã lần import": "IMP-1",
        Ngày: "2026-06-10",
        "Mã tuần": "2026-W24",
        "Chi nhánh": "NVT",
        "Loại giao dịch": "Chi",
        "Nhóm thu/chi": "Khác",
        "Diễn giải": "Phiếu chi Tiền trả NCC",
        "Số tiền": -13000000,
        "Tên file nguồn": "SoQuy.xlsx",
        "Trạng thái dữ liệu": "Đã xác nhận",
      },
    ];
    rowsBySheet[SHEET_NAMES.DL_DOANH_THU_APP] = [];
    rowsBySheet[SHEET_NAMES.DL_DOANH_THU_CUA_HANG] = [];
    rowsBySheet[SHEET_NAMES.DL_TON_KHO] = [];
    rowsBySheet[SHEET_NAMES.DL_THAT_THOAT_NVL] = [];
    rowsBySheet[SHEET_NAMES.AUDIT_LOG] = [];
    rowsBySheet[SHEET_NAMES.IMPORT_LICH_SU] = [{ "Mã lần import": "IMP-1" }];

    const report = await buildDashboardReport({ weekCode: "2026-W24" });

    expect(report.hasRealData).toBe(true);
    expect(report.sourceCounts.cashbook).toBe(2);
    expect(report.totals.cashIn).toBe(12000000);
    expect(report.totals.cashOut).toBe(13000000);
    expect(report.totals.cashbookRevenueIn).toBe(12000000);
    expect(report.cashbookTopOutRows[0]?.[2]).toContain("Tiền trả NCC");
    expect(report.cashbookWarningRows.length).toBeGreaterThan(0);
    expect(report.message).toContain("Đã có dữ liệu Sổ quỹ");
    expect(report.missingSources).toContain("DL_DOANH_THU_APP");
  });
});
