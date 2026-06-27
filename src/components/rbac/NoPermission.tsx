import { Card, CardTitle } from '@/components/ui/Card';
import type { Permission } from '@/lib/rbac/rbac';
import type { Role } from '@/lib/report-types';

export function NoPermission({ role, permission, title = 'Không có quyền truy cập' }: { role: Role | null; permission: Permission; title?: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardTitle>{title}</CardTitle>
      <div className="mt-3 space-y-2 text-sm text-lang-brown">
        <p>Vai trò hiện tại: <strong>{role ?? 'Chưa xác định'}</strong></p>
        <p>Quyền cần có: <code className="rounded bg-white px-1 py-0.5">{permission}</code></p>
        <p>Dữ liệu tài chính nhạy cảm, thao tác import/rollback và cấu hình hệ thống phải được kiểm soát theo vai trò để tránh lộ số liệu hoặc ghi sai dữ liệu.</p>
      </div>
    </Card>
  );
}
