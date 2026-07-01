import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function AppGiaoHangPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="App giao hàng" description="Doanh thu Grab/ShopeeFood/BeFood + tiền app chưa về." status="Cần đối chiếu" />
      <EmptyState title="App giao hàng" description="Sẽ hiển thị DT theo kênh app, tiền chưa về, phí app." />
    </div>
  );
}
