import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildWasteReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function HangHuyPage() {
  const report = await buildWasteReport();
  return <V7ReportEnginePage report={report} />;
}
