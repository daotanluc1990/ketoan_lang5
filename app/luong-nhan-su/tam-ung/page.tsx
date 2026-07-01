import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function TamUngPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Tạm ứng / thưởng phạt" description="Module Lương & Nhân sự (V1: mock data)." status="Chưa đủ dữ liệu" />
      <EmptyState title="Tạm ứng / thưởng phạt" description="Dữ liệu tạm ứng/thưởng phạt sẽ hiển thị khi có import." />
    </div>
  );
}
