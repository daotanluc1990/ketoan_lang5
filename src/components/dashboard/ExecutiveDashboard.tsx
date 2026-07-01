import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, BookOpen, TrendingDown } from 'lucide-react';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { StatusBadge } from '@/components/report/StatusBadge';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { V7Report } from '@/lib/reports/v7/report-engines';

/**
 * Dashboard điều hành — 6 khối theo SPEC V1.
 * KPI + Cảnh báo đỏ + Việc cần làm + Báo cáo đến hạn + Bảng nhanh + Tài liệu liên quan.
 *
 * Data: kết hợp V7 engine (KPI + readiness) + mock cho cảnh báo/việc cần làm
 * (sẽ thay bằng real data khi có task system ở V2).
 */
export function ExecutiveDashboard({ report }: { report: V7Report }) {
  const hasData = report.primary.rows.some((row) => row.some((cell) => cell !== '—' && !cell.includes('Chưa đủ dữ liệu')));

  // Khối 1: KPI từ V7 engine (đã có metrics)
  const kpis = report.metrics.slice(0, 8);

  // Khối 2: Cảnh báo đỏ — extract từ issues table
  const redAlerts = report.issues.rows
    .filter((row) => row.some((cell) => String(cell).toLowerCase().includes('nguy hiểm') || String(cell).toLowerCase().includes('cảnh báo')))
    .slice(0, 5);

  // Khối 3: Việc cần làm — mock (V2: thay bằng task system)
  const tasks: string[][] = [
    ['Đối soát tiền mặt', 'Kế toán doanh thu', '09:00', 'Chưa xong', 'Cam'],
    ['Xác nhận hàng nhận từ BTT', 'Trưởng ca', '10:00', 'Đang chờ', 'Vàng'],
    ['Kiểm chứng từ mua hàng', 'Kế toán tài chính', '15:00', 'Chưa đủ', 'Vàng'],
    ['Gửi báo cáo ngày', 'Kế toán tổng hợp', '22:30', 'Chưa gửi', 'Đỏ'],
  ];

  // Khối 4: Báo cáo đến hạn — mock schedule
  const reports: string[][] = [
    ['Báo cáo doanh thu ngày', 'Hằng ngày', 'Kế toán doanh thu', 'Chưa gửi'],
    ['Báo cáo tồn kho', 'Ngày/tuần', 'Kế toán kho', 'Đã gửi'],
    ['Báo cáo dòng tiền', 'Tuần', 'Kế toán tài chính', 'Chưa gửi'],
    ['Báo cáo tuần CEO', 'Thứ 2', 'Kế toán tổng hợp', 'Đã gửi'],
  ];

  // Khối 6: Tài liệu liên quan — mock links
  const docs = [
    { title: 'Checklist kế toán hằng tuần', desc: '21 bước từ import → đối chiếu → chốt báo cáo', href: '/tai-lieu/quy-trinh' },
    { title: 'Tình huống: Tồn âm sườn', desc: 'Cách xử lý khi phát hiện tồn âm tại cửa hàng', href: '/tai-lieu/tinh-huong' },
    { title: 'Biểu mẫu import', desc: 'Template Doanh thu, Định mức, Hao hụt hợp lệ', href: '/tai-lieu/bieu-mau' },
  ];

  return (
    <div className="space-y-4">
      {/* KHỐI 1: KPI */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} status={kpi.status ?? 'neutral'} compact showSparkline sparkSeed={kpi.status === 'good' ? 'up' : kpi.status === 'danger' ? 'down' : 'flat'} />
        ))}
      </section>

      {!hasData ? (
        <EmptyState title={report.emptyTitle ?? 'Chưa đủ dữ liệu để kết luận'} description={report.emptyDescription ?? 'Khi có dữ liệu thật, dashboard sẽ tự tính chỉ số, cảnh báo và bảng chi tiết.'} />
      ) : null}

      {/* KHỐI 2 + 3: Cảnh báo đỏ + Việc cần làm */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-lang-red" />
            <CardTitle>Cảnh báo đỏ</CardTitle>
            <StatusBadge status={redAlerts.length ? 'Cảnh báo' : 'Tốt'} />
          </div>
          <div className="mt-3">
            {redAlerts.length ? (
              <ReportTable headers={report.issues.headers} rows={redAlerts} maxHeight="max-h-[260px]" />
            ) : (
              <div className="flex items-center gap-2 py-6 text-sm font-semibold text-lang-muted">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Không có cảnh báo đỏ chưa xử lý.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-lang-redDark" />
            <CardTitle>Việc cần làm hôm nay</CardTitle>
            <StatusBadge status="Cảnh báo" />
          </div>
          <div className="mt-3">
            <ReportTable headers={['Việc', 'Người phụ trách', 'Hạn', 'Trạng thái', 'Mức độ']} rows={tasks} maxHeight="max-h-[260px]" />
          </div>
        </Card>
      </section>

      {/* KHỐI 4: Báo cáo đến hạn */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-lang-redDark" />
          <CardTitle>Báo cáo đến hạn</CardTitle>
        </div>
        <div className="mt-3">
          <ReportTable headers={['Báo cáo', 'Tần suất', 'Người phụ trách', 'Trạng thái']} rows={reports} maxHeight="max-h-[200px]" />
        </div>
      </Card>

      {/* KHỐI 5: Bảng dữ liệu nhanh — từ V7 primary + readiness */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>{report.primary.title}</CardTitle>
          <div className="mt-3">
            <ReportTable headers={report.primary.headers} rows={report.primary.rows.slice(0, 8)} maxHeight="max-h-[280px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>{report.readiness.title}</CardTitle>
          <div className="mt-3">
            <ReportTable headers={report.readiness.headers} rows={report.readiness.rows} maxHeight="max-h-[280px]" />
          </div>
        </Card>
      </section>

      {/* KHỐI 6: Tài liệu liên quan */}
      <Card>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-lang-redDark" />
          <CardTitle>Tài liệu liên quan</CardTitle>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {docs.map((doc) => (
            <Link key={doc.title} href={doc.href} className="block rounded-lg border border-lang-line p-3 transition hover:border-lang-red hover:bg-lang-redSoft">
              <p className="text-sm font-bold text-lang-ink">{doc.title}</p>
              <p className="mt-1 text-xs text-lang-muted">{doc.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
