import { PageHeader } from '@/components/layout/PageHeader';
import { TaskList } from '@/components/dashboard/TaskList';

export const dynamic = 'force-dynamic';

export default function NhiemVuChoXacNhanPage() {
  return (
    <div className='space-y-4'>
      <PageHeader title='Việc chờ xác nhận' description='Task tự sinh từ rule engine (tồn âm, thiếu file, lệch tiền...).' status='Cần xử lý' />
      <TaskList statusFilter='Chờ xác nhận' />
    </div>
  );
}
