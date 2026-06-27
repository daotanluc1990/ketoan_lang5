import { NextRequest, NextResponse } from 'next/server';
import { getFinanceAgentList, inferFinanceAgentIntent, selectFinanceAgent } from '@/lib/ai/agent-map';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_agents');
  if (!rbac.ok) return rbac.response;
  const url = new URL(request.url);
  const intentText = url.searchParams.get('intent') ?? '';
  const inferredIntent = intentText ? inferFinanceAgentIntent(intentText) : 'unknown';
  const selectedAgent = selectFinanceAgent(inferredIntent);
  return NextResponse.json(appendRbacMeta({
    ok: true,
    data: {
      agents: getFinanceAgentList(),
      intent: inferredIntent,
      selectedAgent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        file: selectedAgent.file,
        skill: selectedAgent.skill,
        runtimeStatus: selectedAgent.runtimeStatus,
        primaryApi: selectedAgent.primaryApi,
        writePermission: selectedAgent.writePermission,
      },
      note: 'Read-only Agent/Skill Map. Agents do not write Google Sheet data.',
    },
  }, rbac.context));
}
