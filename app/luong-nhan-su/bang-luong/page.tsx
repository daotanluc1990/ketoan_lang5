import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function BangLuongPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Bảng lương" description="Module Lương & Nhân sự (V1: mock data)." status="Chưa đủ dữ liệu" />
      <EmptyState title="Bảng lương" description="Dữ liệu bảng lương sẽ hiển thị khi có import." />
    </div>
  );
}
