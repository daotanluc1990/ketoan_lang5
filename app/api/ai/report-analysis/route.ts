import { NextRequest, NextResponse } from 'next/server';
import { analyzeReportWithAi } from '@/lib/ai/agent';
import { parseReportFilters } from '@/lib/reports/report-filters';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_agents');
  if (!rbac.ok) return rbac.response;
  try {
    const url = new URL(request.url);
    const data = await analyzeReportWithAi(parseReportFilters(url.searchParams));
    return NextResponse.json(appendRbacMeta({ ok: true, data }, rbac.context));
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'AI Agent không phân tích được.' } }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
