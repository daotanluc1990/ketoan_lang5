import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function HeThongPhanQuyenPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Phân quyền" description="Module Hệ thống." status="Ổn định" />
      <EmptyState title="Phân quyền" description="Quản lý phân quyền — sẽ triển khai chi tiết ở V2." />
    </div>
  );
}
