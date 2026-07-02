import { PageHeader } from '@/components/layout/PageHeader';
import { TaskList } from '@/components/dashboard/TaskList';

export const dynamic = 'force-dynamic';

export default function NhiemVuKeToanPage() {
  return (
    <div className='space-y-4'>
      <PageHeader title='Việc hôm nay' description='Task tự sinh từ rule engine (tồn âm, thiếu file, lệch tiền...).' status='Cần xử lý' />
      <TaskList statusFilter='Hôm nay' />
    </div>
  );
}
