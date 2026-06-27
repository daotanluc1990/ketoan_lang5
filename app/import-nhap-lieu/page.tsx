import { NoPermission } from '@/components/rbac/NoPermission';
import { PageHeader } from '@/components/layout/PageHeader';
import { BatchUploadMock } from '@/components/forms/BatchUploadMock';
import { ImportRollbackPanel } from '@/components/forms/ImportRollbackPanel';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { canRole, getRoleFromServerCookies } from '@/lib/rbac/rbac';

export const dynamic = 'force-dynamic';

async function readImportHistory() { try { return await getDataStore().read(SHEET_NAMES.IMPORT_LICH_SU); } catch { return []; } }

export default async function ImportNhapLieuPage() {
  const rbac = await getRoleFromServerCookies();
  if (!canRole(rbac.role, 'view_import')) return <NoPermission role={rbac.role} permission="view_import" />;
  const history = await readImportHistory();
  const historyRows = history.slice(-8).reverse().map((row) => [String(row['Ngày import'] ?? ''), String(row['Người import'] ?? ''), String(row['Trạng thái'] ?? ''), String(row['Tổng dòng mới'] ?? ''), String(row['Tổng dòng lỗi'] ?? '')]);
  const ruleRows = [['Preview', 'Chưa ghi', 'Đạt'], ['Confirm', 'Ghi Sheet', 'Đạt'], ['Lỗi/lệch', 'Chặn', 'Cảnh báo'], ['Rollback', 'Hoàn tác mềm', 'Đạt']];
  return (
    <div className="space-y-2.5">
      <PageHeader title="Nhập liệu & Import" status="Cần đối chiếu" />
      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Lịch sử import" value={`${history.length}`} status={history.length ? 'good' : 'neutral'} compact />
        <MetricCard label="Quy tắc ghi" value="Confirm" status="good" compact />
        <MetricCard label="Dòng lỗi" value="Chặn" status="warning" compact />
        <MetricCard label="Nguồn" value="Google Sheet" status="good" compact />
      </section>
      <Card><CardTitle>Batch upload</CardTitle><div className="mt-2"><BatchUploadMock /></div></Card>
      <section className="grid gap-2 xl:grid-cols-[0.8fr_1.2fr]">
        <Card><CardTitle>Hoàn tác import</CardTitle><div className="mt-2"><ImportRollbackPanel /></div></Card>
        <div className="space-y-2">
          <Card><CardTitle>Quy tắc</CardTitle><div className="mt-2"><ReportTable headers={['Quy tắc', 'Ý nghĩa', 'Trạng thái']} rows={ruleRows} maxHeight="max-h-[160px]" /></div></Card>
          <Card><CardTitle>Lịch sử gần nhất</CardTitle><div className="mt-2"><ReportTable headers={['Ngày import', 'Người import', 'Trạng thái', 'Dòng mới', 'Dòng lỗi']} rows={historyRows.length ? historyRows : [['—', '—', 'Chưa đủ dữ liệu', '0', '0']]} maxHeight="max-h-[180px]" /></div></Card>
        </div>
      </section>
    </div>
  );
}
