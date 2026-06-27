import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parseReportFilters } from '@/lib/reports/report-filters';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_cashflow');
  if (!rbac.ok) return rbac.response;
  try {
    const url = new URL(request.url);
    const report = await buildDashboardReport(parseReportFilters(url.searchParams));
    return NextResponse.json(appendRbacMeta({
      ok: true,
      dataMode: report.dataMode,
      hasRealData: report.hasRealData,
      message: report.message,
      rows: report.cashflowRows,
      topInRows: report.cashbookTopInRows,
      topOutRows: report.cashbookTopOutRows,
      groupRows: report.cashbookGroupRows,
      dailyRows: report.cashbookDailyRows,
      warningRows: report.cashbookWarningRows,
      dataReadinessRows: report.dataReadinessRows,
      totals: report.totals,
      sourceCounts: report.sourceCounts,
      missingSources: report.missingSources,
      appliedFilters: report.appliedFilters,
      filterActive: report.filterActive,
      filterOptions: report.filterOptions,
      rawSourceCounts: report.rawSourceCounts
    }, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'DATA_SOURCE_ERROR', message: error instanceof Error ? error.message : 'Không đọc được dòng tiền.' } }, { status: 500 });
  }
}
