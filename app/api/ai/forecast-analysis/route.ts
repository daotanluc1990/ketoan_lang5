import { NextRequest, NextResponse } from 'next/server';
import { analyzeForecastWithAi } from '@/lib/forecast/forecast-engine';
import { parseReportFilters } from '@/lib/reports/report-filters';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_forecast');
  if (!rbac.ok) return rbac.response;
  try {
    const url = new URL(request.url);
    const result = await analyzeForecastWithAi(parseReportFilters(url.searchParams));
    return NextResponse.json(appendRbacMeta({ ok: true, data: result }, rbac.context));
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'FORECAST_AI_ERROR',
          message: error instanceof Error ? error.message : 'Không gọi được Forecast Agent.'
        }
      },
      { status: 500 }
    );
  }
}
