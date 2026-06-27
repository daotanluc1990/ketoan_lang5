import { Badge } from '@/components/ui/Badge';
import type { Status } from '@/lib/report-types';

const statusMap: Record<string, { label: string; variant: Status }> = {
  good: { label: 'Tốt', variant: 'good' },
  warning: { label: 'Cảnh báo', variant: 'warning' },
  danger: { label: 'Nguy hiểm', variant: 'danger' },
  neutral: { label: 'Chờ dữ liệu', variant: 'neutral' },
  Tốt: { label: 'Tốt', variant: 'good' },
  Đạt: { label: 'Đạt', variant: 'good' },
  'Có dữ liệu': { label: 'Có dữ liệu', variant: 'good' },
  'Đủ dữ liệu': { label: 'Đủ dữ liệu', variant: 'good' },
  'Có thể chốt': { label: 'Có thể chốt', variant: 'good' },
  'Có thể gửi': { label: 'Có thể gửi', variant: 'good' },
  'Đã xong': { label: 'Đã xong', variant: 'good' },
  Ổn: { label: 'Ổn', variant: 'good' },
  'Cảnh báo': { label: 'Cảnh báo', variant: 'warning' },
  'Cần kiểm': { label: 'Cần kiểm', variant: 'warning' },
  'Cần đối chiếu': { label: 'Cần đối chiếu', variant: 'warning' },
  'Đang làm': { label: 'Đang làm', variant: 'warning' },
  'Chưa đủ dữ liệu': { label: 'Chưa đủ dữ liệu', variant: 'warning' },
  Chưa: { label: 'Chưa', variant: 'warning' },
  'Có lỗi': { label: 'Có lỗi', variant: 'danger' },
  'Nguy hiểm': { label: 'Nguy hiểm', variant: 'danger' },
  'Chưa thể chốt': { label: 'Chưa thể chốt', variant: 'danger' },
  'Không import': { label: 'Không import', variant: 'danger' },
  Không: { label: 'Không', variant: 'danger' }
};

export function StatusBadge({ status }: { status: Status | string }) {
  const item = statusMap[status] ?? { label: status, variant: 'neutral' as Status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
