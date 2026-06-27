import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildBttTransferReport } from '@/lib/reports/v7/report-engines';

export const dynamic = 'force-dynamic';

export default async function DoiChieuBttCuaHangPage() {
  const report = await buildBttTransferReport();
  return <V7ReportEnginePage report={report} />;
}
