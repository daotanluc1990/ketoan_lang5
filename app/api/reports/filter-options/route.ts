import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_dashboard');
  if (!rbac.ok) return rbac.response;
  try {
    const report = await buildDashboardReport();
    return NextResponse.json(appendRbacMeta({ ok: true, dataMode: report.dataMode, hasRealData: report.hasRealData, filterOptions: report.filterOptions, rawSourceCounts: report.rawSourceCounts, message: report.message }, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'DATA_SOURCE_ERROR', message: error instanceof Error ? error.message : 'Không đọc được lựa chọn bộ lọc.' } }, { status: 500 });
  }
}
