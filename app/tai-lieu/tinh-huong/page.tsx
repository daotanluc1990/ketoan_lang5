import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default function TaiLieuTinhHuongPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Tình huống phát sinh" description="Module Tài liệu nội bộ." status="Đang dùng" />
      <EmptyState title="Tình huống phát sinh" description="Nội dung tình huống phát sinh sẽ được điền ở Bước 7." />
    </div>
  );
}
