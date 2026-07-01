import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function BaoCaoNgayPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo ngày" description="Báo cáo quản trị tổng hợp." status="Cần đối chiếu" />
      <EmptyState title="Báo cáo ngày" description="Báo cáo sẽ tổng hợp từ V7 engines theo kỳ (ngày)." />
    </div>
  );
}
