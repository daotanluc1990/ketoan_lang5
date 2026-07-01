import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function HeThongCuaHangPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Cửa hàng" description="Module Hệ thống." status="Ổn định" />
      <EmptyState title="Cửa hàng" description="Quản lý cửa hàng — sẽ triển khai chi tiết ở V2." />
    </div>
  );
}
