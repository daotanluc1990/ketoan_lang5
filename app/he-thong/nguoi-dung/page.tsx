import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function HeThongNguoiDungPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Người dùng" description="Module Hệ thống." status="Ổn định" />
      <EmptyState title="Người dùng" description="Quản lý người dùng — sẽ triển khai chi tiết ở V2." />
    </div>
  );
}
