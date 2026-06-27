import { NextRequest, NextResponse } from 'next/server';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parseReportFilters } from '@/lib/reports/report-filters';
import { appendRbacMeta, maskDashboardReportForRole, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_dashboard');
  if (!rbac.ok) return rbac.response;
  try {
    const url = new URL(request.url);
    const report = await buildDashboardReport(parseReportFilters(url.searchParams));
    const data = maskDashboardReportForRole(report, rbac.context.role);
    return NextResponse.json(appendRbacMeta({ ok: true, data }, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'DATA_SOURCE_ERROR', message: error instanceof Error ? error.message : 'Không đọc được báo cáo dashboard.' } }, { status: 500 });
  }
}
