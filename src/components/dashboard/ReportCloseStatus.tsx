import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/report/StatusBadge';

type CloseCheck = {
  module: string;
  status: string;
  canClose: boolean;
};

/**
 * Box "Điều kiện chốt báo cáo" — reuse weekly-close-engine logic.
 * Hiển thị ĐƯỢC CHỐT / CHƯA ĐỦ ĐIỀU KIỆN + lý do chặn từng module.
 */
export function ReportCloseStatus({ checks }: { checks: CloseCheck[] }) {
  const allCanClose = checks.every((c) => c.canClose);
  const blocking = checks.filter((c) => !c.canClose);

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        {allCanClose ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-lang-red" />}
        <CardTitle>Điều kiện chốt báo cáo</CardTitle>
        <StatusBadge status={allCanClose ? 'Tốt' : 'Nguy hiểm'} />
      </div>

      {allCanClose ? (
        <div className="flex items-center gap-2 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Đủ điều kiện chốt báo cáo. Tất cả module đạt.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-lang-red/20 bg-lang-redSoft px-3 py-2 text-sm font-bold text-lang-red">
            ⛔ CHƯA ĐỦ ĐIỀU KIỆN CHỐT — {blocking.length} module chặn:
          </div>
          <div className="space-y-1">
            {blocking.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-lang-redSoft/50 px-3 py-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-lang-red" />
                <span className="font-semibold text-lang-ink">{c.module}</span>
                <span className="text-lang-muted">— {c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <ReportTable
          headers={['Module', 'Trạng thái', 'Được chốt']}
          rows={checks.map((c) => [c.module, c.status, c.canClose ? '✓ Đạt' : '✗ Chặn'])}
          maxHeight="max-h-[200px]"
        />
      </div>
    </Card>
  );
}
