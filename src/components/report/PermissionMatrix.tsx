import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from './ReportTable';

const permissionRows = [
  ['CEO', 'Toàn bộ dashboard, P&L, dòng tiền, cân đối, thất thoát, dự toán', 'Duyệt rollback, gửi bot, xem cấu hình', 'Không trực tiếp sửa dữ liệu nguồn ngoài quy trình audit'],
  ['Kế toán', 'Import, đối soát, dòng tiền, P&L, thất thoát, bàn làm việc', 'Preview/confirm import, xem rollback preview, xử lý lệch', 'Không được confirm rollback, không gửi bot production'],
  ['Admin', 'Toàn bộ hệ thống và cấu hình', 'Cấu hình bot/env, duyệt rollback kỹ thuật', 'Không tự ý thay số liệu kinh doanh đã chốt'],
  ['Quản lý cửa hàng', 'Dashboard vận hành, dòng tiền, thất thoát, bàn làm việc phạm vi cửa hàng', 'Giải trình chi phí/lỗi vận hành', 'Không xem P&L/cân đối toàn hệ thống, không import/rollback']
];

const apiRows = [
  ['/api/import/preview', 'CEO/Kế toán/Admin', 'Xem trước, không ghi dữ liệu'],
  ['/api/import/confirm', 'CEO/Kế toán/Admin', 'Ghi dữ liệu sau preview'],
  ['/api/import/rollback confirm=true', 'CEO/Admin', 'Hoàn tác mềm theo mã import'],
  ['/api/reports/pl-tuan, /can-doi', 'CEO/Kế toán/Admin', 'Ẩn với Quản lý cửa hàng'],
  ['/api/telegram/send-test POST', 'CEO/Admin', 'Tránh gửi bot sai quyền']
];

export function PermissionMatrix() {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <Card>
        <CardTitle>Phân quyền vận hành</CardTitle>
        <p className="mt-2 text-sm text-black/60">V4.9 đã thêm kiểm soát quyền server-side cho API ghi dữ liệu, báo cáo nhạy cảm và bot. UI role chỉ phục vụ UAT, API vẫn kiểm tra quyền riêng.</p>
        <div className="mt-3">
          <ReportTable headers={['Vai trò', 'Được xem', 'Được làm', 'Giới hạn']} rows={permissionRows} />
        </div>
      </Card>
      <Card>
        <CardTitle>API được bảo vệ</CardTitle>
        <p className="mt-2 text-sm text-black/60">Khi bật <code>APP_RBAC_ENABLED=true</code>, request không có role hợp lệ sẽ bị từ chối. Có thể dùng cookie <code>ctl_role</code>, query <code>?role=CEO</code>, hoặc header <code>x-ctl-role</code>.</p>
        <div className="mt-3">
          <ReportTable headers={['API', 'Vai trò được phép', 'Ý nghĩa']} rows={apiRows} />
        </div>
      </Card>
    </div>
  );
}
