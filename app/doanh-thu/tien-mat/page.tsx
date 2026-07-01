import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function TienMatPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Tiền mặt" description="Doanh thu tiền mặt + đối soát lệch tiền." status="Cần đối chiếu" />
      <EmptyState title="Tiền mặt" description="Sẽ hiển thị doanh thu tiền mặt, tiền thực nộp, lệch tiền mặt từ DL_SO_QUY." />
    </div>
  );
}
