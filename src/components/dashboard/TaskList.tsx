'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { KeToanTask, MucDo } from '@/lib/task/task-engine';

type ApiResponse = {
  tasks: KeToanTask[];
  total: number;
  counts: Record<MucDo, number>;
};

export function TaskList({ statusFilter }: { statusFilter: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tasks?status=${encodeURIComponent(statusFilter)}`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setData(j.data); else setError(j.error?.message || 'Lỗi'); })
      .catch(() => setError('Không kết nối được.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <div className="py-8 text-center text-sm font-semibold text-lang-muted">Đang sinh task từ dữ liệu...</div>;
  if (error) return <EmptyState title="Lỗi tải task" description={error} />;
  if (!data || !data.tasks.length) return <EmptyState title="Không có task" description="Tất cả việc đã xử lý hoặc chưa phát hiện vấn đề." />;

  const rows = data.tasks.map((t) => [
    t.noiDung,
    t.module,
    t.nguoiPT,
    t.deadline,
    t.trangThai,
    t.mucDo,
  ]);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Tổng task" value={String(data.total)} status="neutral" compact />
        <MetricCard label="Task mức đỏ" value={String(data.counts['Đỏ'] || 0)} status={data.counts['Đỏ'] ? 'danger' : 'good'} compact />
        <MetricCard label="Task mức cam" value={String(data.counts['Cam'] || 0)} status={data.counts['Cam'] ? 'warning' : 'good'} compact />
        <MetricCard label="Task mức vàng" value={String(data.counts['Vàng'] || 0)} status="neutral" compact />
      </section>
      <Card>
        <CardTitle>Danh sách nhiệm vụ ({data.tasks.length})</CardTitle>
        <div className="mt-3">
          <ReportTable headers={['Việc cần làm', 'Module', 'Người phụ trách', 'Deadline', 'Trạng thái', 'Mức độ']} rows={rows} maxHeight="max-h-[500px]" />
        </div>
      </Card>
    </div>
  );
}
