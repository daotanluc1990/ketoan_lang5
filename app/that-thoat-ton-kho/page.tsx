import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildStockLossReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function ThatThoatTonKhoPage() {
  const report = await buildStockLossReport();
  return <V7ReportEnginePage report={report} />;
}
