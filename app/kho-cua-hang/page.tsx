import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildStoreInventoryReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function KhoCuaHangPage() {
  const report = await buildStoreInventoryReport();
  return <V7ReportEnginePage report={report} />;
}
