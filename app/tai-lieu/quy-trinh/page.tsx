import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function TaiLieuQuyTrinhPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Quy trình & Checklist" description="Module Tài liệu nội bộ." status="Đang dùng" />
      <EmptyState title="Quy trình & Checklist" description="Nội dung quy trình & checklist sẽ được điền ở Bước 7." />
    </div>
  );
}
