import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function BaoCaoTuanPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Báo cáo tuần" description="Báo cáo quản trị tổng hợp." status="Cần đối chiếu" />
      <EmptyState title="Báo cáo tuần" description="Báo cáo sẽ tổng hợp từ V7 engines theo kỳ (tuần)." />
    </div>
  );
}
