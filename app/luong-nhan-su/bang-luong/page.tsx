import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { bangLuongMock } from '@/lib/mock/luong-data';

export const dynamic = 'force-dynamic';

export default function BangLuongPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Bảng lương" description="Module Lương & Nhân sự (V1: mock data). Sẽ thay bằng import thật ở V2." status="Chưa đủ dữ liệu" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng số nhân viên" value={String(bangLuongMock.length)} status="neutral" compact />
        <MetricCard label="Tổng công" value={bangLuongMock.reduce((s, r) => s + Number(r[4] || r[2] || 0), 0) + ''} status="good" compact />
        <MetricCard label="Đi trễ" value={bangLuongMock.reduce((s, r) => s + Number(r[6] || 0), 0) + ''} status="warning" compact />
        <MetricCard label="Nghỉ" value={bangLuongMock.reduce((s, r) => s + Number(r[7] || 0), 0) + ''} status="neutral" compact />
      </section>
      <Card>
        <CardTitle>Bảng bảng lương</CardTitle>
        <div className="mt-3"><ReportTable headers={["Mã NV", "Tên", "Vai trò", "Lương CB", "Phụ cấp", "Thưởng", "Khấu trừ", "Thực nhận"]} rows={bangLuongMock} maxHeight="max-h-[400px]" /></div>
      </Card>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-semibold text-yellow-800">
        ⚠ Dữ liệu mẫu (mock). V2 sẽ thay bằng import file lương/nhân sự thật.
      </div>
    </div>
  );
}
