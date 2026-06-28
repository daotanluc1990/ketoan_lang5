import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { V7ReportEnginePage } from '@/components/dashboard/V7ReportEnginePage';
import { buildBalanceReport } from '@/lib/reports/v7/report-engines';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

export default async function CanDoiPage() {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_balance')) return <NoPermission role={rbac.role} permission="view_balance" />;
  // V7 engine: cân đối tính runtime (tiền + hàng + công nợ)
  const v7Report = await buildBalanceReport();

  return (
    <div className="space-y-4">
      <PageHeader title="Cân đối rút gọn" description="Tính runtime: tiền mặt + tồn kho + công nợ. Không lưu tĩnh." status={v7Report.status} />
      <V7ReportEnginePage report={v7Report} />
    </div>
  );
}
