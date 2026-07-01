import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function ChuyenKhoanPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Chuyển khoản" description="Doanh thu chuyển khoản + giao dịch chưa xác định." status="Cần đối chiếu" />
      <EmptyState title="Chuyển khoản" description="Sẽ hiển thị tổng CK, GD chưa xác định, GD lệch từ DL_SO_QUY." />
    </div>
  );
}
