import { NextRequest, NextResponse } from 'next/server';
import { getImportHistory } from '@/lib/import/import-history';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_import');
  if (!rbac.ok) return rbac.response;
  const history = await getImportHistory();
  return NextResponse.json(appendRbacMeta({ ok: true, data: history }, rbac.context));
}
