import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildBttInventoryReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function KhoBepTrungTamPage() {
  const report = await buildBttInventoryReport();
  return <V7ReportEnginePage report={report} />;
}
