import { PageHeader } from "@/components/layout/PageHeader";
import { V7ReportEnginePage } from "@/components/dashboard/V7ReportEnginePage";
import { buildCashflowReport } from "@/lib/reports/v7/report-engines";

export const dynamic = "force-dynamic";

export default async function DongTienPage() {
  // V7 engine: dòng tiền tính runtime từ sổ quỹ + tự phân nhóm chi
  const v7Report = await buildCashflowReport();

  return (
    <div className="space-y-4">
      <PageHeader title="Dòng tiền Tuần" description="Tính runtime từ sổ quỹ. Phân nhóm chi tự động (NVL/lương/mặt bằng/marketing...)." status={v7Report.status} />
      <V7ReportEnginePage report={v7Report} />
    </div>
  );
}
