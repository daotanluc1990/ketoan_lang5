import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function ChamCongPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Chấm công" description="Module Lương & Nhân sự (V1: mock data)." status="Chưa đủ dữ liệu" />
      <EmptyState title="Chấm công" description="Dữ liệu chấm công sẽ hiển thị khi có import file lương/nhân sự." />
    </div>
  );
}
