import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildStandardLossReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function HaoHutVuotDinhMucPage() {
  const report = await buildStandardLossReport();
  return <V7ReportEnginePage report={report} />;
}
