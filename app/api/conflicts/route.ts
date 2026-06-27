import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { appendRbacMeta, requireApiPermission } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbac = requireApiPermission(request, 'view_data_control');
  if (!rbac.ok) return rbac.response;
  const rows = await getDataStore().read(SHEET_NAMES.IMPORT_DU_LIEU_LECH);
  return NextResponse.json(appendRbacMeta({ ok: true, data: rows }, rbac.context));
}
