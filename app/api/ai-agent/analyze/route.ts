import { NextRequest, NextResponse } from 'next/server';
import { analyzeReportWithAi } from '@/lib/ai/agent';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_agents');
  if (!rbac.ok) return rbac.response;
  const data = await analyzeReportWithAi();
  return NextResponse.json(appendRbacMeta({ ok: true, data }, rbac.context));
}

export async function POST(request: NextRequest) {
  return GET(request);
}
