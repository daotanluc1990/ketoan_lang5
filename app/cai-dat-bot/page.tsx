import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { PermissionMatrix } from '@/components/report/PermissionMatrix';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getConfiguredAiProvider, getEnvChecklist, hasAiProviderEnv, hasGeminiEnv, hasGoogleSheetsEnv, hasOpenAiEnv, hasTelegramEnv } from '@/lib/env/server-env';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { parsePageReportFilters } from '@/lib/reports/report-filters';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

const thresholdRows = [['COGS%', '<= 43%', '43–47%', '> 47%'], ['Labor%', '<= 18%', '18–22%', '> 22%'], ['Tiền app', '<= 20tr', '20–50tr', '> 50tr'], ['Thất thoát', '<= 1tr', '1–3tr', '> 3tr'], ['Data Quality', '>= 90%', '70–89%', '< 70%']];

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function CaiDatBotPage({ searchParams }: PageProps) {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_settings')) return <NoPermission role={rbac.role} permission="view_settings" />;
  const filters = await parsePageReportFilters(searchParams);
  const report = await buildDashboardReport(filters);
  const aiProvider = getConfiguredAiProvider();
  const envRows = getEnvChecklist().map((item) => [item.name, item.configured ? 'Đạt' : 'Chưa đủ dữ liệu', item.requiredFor]);
  const botPreviewRows = [['Tổng quan', report.message], ['Kinh doanh', report.hasRealData ? 'Dữ liệu thật' : 'Chưa đủ dữ liệu'], ['Dòng tiền', report.sourceCounts.cashbook ? 'Có sổ quỹ' : 'Thiếu'], ['Dự toán', report.hasRealData ? 'Có thể lập' : 'Thiếu dữ liệu'], ['CEO duyệt', report.missingSources.length ? `Thiếu ${report.missingSources.length}` : 'Kiểm cuối']];
  return (
    <div className="space-y-2.5">
      <PageHeader title="Cài đặt & Bot" status={hasGoogleSheetsEnv() ? 'Cần đối chiếu' : 'Chưa đủ dữ liệu'} />
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Google Sheet" value={hasGoogleSheetsEnv() ? 'Đã cấu hình' : 'Thiếu'} status={hasGoogleSheetsEnv() ? 'good' : 'warning'} compact />
        <MetricCard label="AI Agent" value={hasAiProviderEnv() ? (aiProvider === 'gemini' ? 'Gemini' : 'OpenAI') : 'Thiếu'} status={hasAiProviderEnv() ? 'good' : 'warning'} compact />
        <MetricCard label="Telegram" value={hasTelegramEnv() ? 'Đã cấu hình' : 'Thiếu'} status={hasTelegramEnv() ? 'good' : 'warning'} compact />
        <MetricCard label="RBAC" value="Basic Auth" status="warning" compact />
      </section>
      <section className="grid gap-2 xl:grid-cols-2">
        <Card><CardTitle>Ngưỡng KPI</CardTitle><div className="mt-2"><ReportTable headers={['Chỉ số', 'Tốt', 'Cảnh báo', 'Nguy hiểm']} rows={thresholdRows} maxHeight="max-h-[220px]" /></div></Card>
        <Card><CardTitle>Cấu hình</CardTitle><div className="mt-2"><ReportTable headers={['Mục', 'Trạng thái', 'Dùng cho']} rows={envRows} maxHeight="max-h-[220px]" /></div></Card>
      </section>
      <section className="grid gap-2 xl:grid-cols-[1.1fr_0.9fr]">
        <Card><CardTitle>Preview bot</CardTitle><div className="mt-2"><ReportTable headers={['Phần', 'Nội dung']} rows={botPreviewRows} maxHeight="max-h-[220px]" /></div></Card>
        <Card><CardTitle>Gửi báo cáo</CardTitle><div className="mt-2 grid gap-2 text-[12px]"><label className="grid gap-1"><span className="font-semibold text-lang-ink">Kênh gửi</span><select className="rounded-lg border border-lang-line bg-white px-2 py-1.5"><option>Telegram</option><option>Zalo sau</option></select></label><label className="grid gap-1"><span className="font-semibold text-lang-ink">Giờ gửi</span><input className="rounded-lg border border-lang-line bg-white px-2 py-1.5" defaultValue="Thứ 2, 09:00" /></label><div className="flex flex-wrap gap-2 pt-1"><Button>Gửi test</Button><Button variant="secondary">Lưu</Button></div></div></Card>
      </section>
      <PermissionMatrix />
    </div>
  );
}
