import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function TaiLieuBieuMauPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Biểu mẫu & Báo cáo mẫu" description="Module Tài liệu nội bộ." status="Đang dùng" />
      <EmptyState title="Biểu mẫu & Báo cáo mẫu" description="Nội dung biểu mẫu & báo cáo mẫu sẽ được điền ở Bước 7." />
    </div>
  );
}
