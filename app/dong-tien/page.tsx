import { PageHeader } from "@/components/layout/PageHeader";
import { ChartCard } from "@/components/report/ChartCard";
import { MetricCard } from "@/components/report/MetricCard";
import { ReportTable } from "@/components/report/ReportTable";
import { Card, CardTitle } from "@/components/ui/Card";
import { buildDashboardReport } from "@/lib/reports/report-aggregator";
import { parsePageReportFilters } from "@/lib/reports/report-filters";
import { getDataStore } from "@/lib/data-store";
import { SHEET_NAMES } from "@/lib/google-sheets/sheet-names";
import { analyzeCashbookBusiness, filterCashbookBusiness } from "@/lib/reports/cashbook-business";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function readCashbookRows() {
  try {
    return await getDataStore().read(SHEET_NAMES.DL_SO_QUY);
  } catch {
    return [];
  }
}

export default async function DongTienPage({ searchParams }: PageProps) {
  const filters = await parsePageReportFilters(searchParams);
  const report = await buildDashboardReport(filters);
  const cashbookRows = filterCashbookBusiness(await readCashbookRows(), filters);
  const business = analyzeCashbookBusiness(cashbookRows);
  const hasCashbook = cashbookRows.length > 0;

  return (
    <div className="space-y-2.5">
      <PageHeader title="Dòng tiền Tuần" status={hasCashbook ? "Tốt" : "Chưa đủ dữ liệu"} />

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        <MetricCard label="Doanh thu sổ quỹ" value={business.cashRows[0]?.[2] ?? "—"} status={business.summary.revenue ? "good" : "neutral"} compact />
        <MetricCard label="Chi cửa hàng" value={business.cashRows[2]?.[2] ?? "—"} status={business.summary.storeCost ? "warning" : "neutral"} compact />
        <MetricCard label="Chi BTT" value={business.cashRows[3]?.[2] ?? "—"} status={business.summary.bttCost ? "warning" : "good"} compact />
        <MetricCard label="Trả NCC" value={business.cashRows[4]?.[2] ?? "—"} status={business.summary.supplierPay ? "warning" : "good"} compact />
        <MetricCard label="Chưa phân loại" value={business.cashRows[6]?.[2] ?? "—"} status={business.summary.unknown ? "warning" : "good"} compact />
        <MetricCard label="Dòng tiền thuần" value={business.cashRows[7]?.[2] ?? "—"} status={report.totals.cashEnding < 0 ? "danger" : hasCashbook ? "good" : "neutral"} compact />
      </section>

      <section className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card>
          <CardTitle>Bảng dòng tiền</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Nhóm", "Chỉ số", "Số tiền", "Quy tắc", "Trạng thái"]} rows={business.cashRows.map((row) => [row[0], row[1], row[2], row[4], row[5]])} maxHeight="max-h-[280px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>Nguồn dữ liệu</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Nguồn", "Số dòng"]} rows={[["Sổ quỹ", String(cashbookRows.length)], ["Lịch sử import", String(report.sourceCounts.importHistory)]]} maxHeight="max-h-[140px]" />
          </div>
        </Card>
      </section>

      <section className="grid gap-2 xl:grid-cols-2">
        <ChartCard title="Thu - chi" items={[{ label: "Tiền vào", value: report.totals.cashIn, caption: report.executiveKpis.find((kpi) => kpi.label === "Tiền vào")?.value }, { label: "Tiền ra", value: report.totals.cashOut, caption: report.executiveKpis.find((kpi) => kpi.label === "Tiền ra")?.value }]} />
        <Card>
          <CardTitle>Khoản chi lớn</CardTitle>
          <div className="mt-2">
            <ReportTable headers={["Ngày", "Nhóm", "Diễn giải", "Số tiền", "Trạng thái"]} rows={report.cashbookTopOutRows.map((row) => [row[0], row[1], row[2], row[3], row[5]])} maxHeight="max-h-[240px]" />
          </div>
        </Card>
      </section>
    </div>
  );
}
