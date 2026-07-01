import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { tamUngMock } from '@/lib/mock/luong-data';

export const dynamic = 'force-dynamic';

export default function TamUngPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Tạm ứng / thưởng phạt" description="Module Lương & Nhân sự (V1: mock data). Sẽ thay bằng import thật ở V2." status="Chưa đủ dữ liệu" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng số nhân viên" value={String(tamUngMock.length)} status="neutral" compact />
        <MetricCard label="Tổng công" value={tamUngMock.reduce((s, r) => s + Number(r[4] || r[2] || 0), 0) + ''} status="good" compact />
        <MetricCard label="Đi trễ" value={tamUngMock.reduce((s, r) => s + Number(r[6] || 0), 0) + ''} status="warning" compact />
        <MetricCard label="Nghỉ" value={tamUngMock.reduce((s, r) => s + Number(r[7] || 0), 0) + ''} status="neutral" compact />
      </section>
      <Card>
        <CardTitle>Bảng tạm ứng / thưởng phạt</CardTitle>
        <div className="mt-3"><ReportTable headers={["Mã NV", "Tên", "Số tiền", "Ghi chú", "Trạng thái"]} rows={tamUngMock} maxHeight="max-h-[400px]" /></div>
      </Card>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-semibold text-yellow-800">
        ⚠ Dữ liệu mẫu (mock). V2 sẽ thay bằng import file lương/nhân sự thật.
      </div>
    </div>
  );
}
