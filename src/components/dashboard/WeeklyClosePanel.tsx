'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { ReportTable } from '@/components/report/ReportTable';

type PreviewPayload = {
  ok: boolean;
  data?: {
    status: string;
    canClose: boolean;
    blockingChecks: Array<{ code: string; label: string; status: string; detail: string }>;
    checks: Array<{ code: string; label: string; status: string; detail: string }>;
  };
  error?: { message?: string };
};

async function readJson(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text().catch(() => '');
  return { ok: false, error: { message: text || 'Server không trả JSON.' } };
}

export function WeeklyClosePanel() {
  const [periodCode, setPeriodCode] = useState('2026-W25');
  const [branch, setBranch] = useState('Toàn hệ thống');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [message, setMessage] = useState('Preview điều kiện chốt trước, chỉ Admin/CEO mới được confirm chốt.');

  const rows = preview?.data?.checks?.map((check) => [check.label, check.status, check.detail]) ?? [['Chưa preview', '—', 'Bấm Preview chốt báo cáo']];
  const canClose = Boolean(preview?.data?.canClose);

  async function previewClose() {
    setLoading(true);
    setMessage('Đang preview điều kiện chốt...');
    try {
      const response = await fetch('/api/weekly-close/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ periodCode, branch })
      });
      const payload = await readJson(response);
      setPreview(payload);
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? 'Không preview được điều kiện chốt.');
      setMessage(payload.data?.canClose ? 'Đủ điều kiện chốt. Có thể xác nhận chốt nếu đúng số liệu.' : 'Chưa đủ điều kiện chốt. Cần xử lý các lỗi chặn trước.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không preview được điều kiện chốt.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmClose(force = false) {
    setLoading(true);
    setMessage(force ? 'Đang chốt đặc biệt...' : 'Đang chốt báo cáo...');
    try {
      const response = await fetch('/api/weekly-close/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ periodCode, branch, note, force })
      });
      const payload = await readJson(response);
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? 'Không chốt báo cáo được.');
      setMessage(`Đã chốt báo cáo: ${payload.closeId ?? payload.data?.closeId ?? 'đã lưu snapshot'}. Hãy tải lại trang để xem lịch sử.`);
      await previewClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không chốt báo cáo được.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>Chốt báo cáo tuần</CardTitle>
          <p className="mt-1 text-sm text-black/55">Kiểm điều kiện chốt, khóa snapshot và ghi audit log vào Data Master.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[620px]">
          <label className="text-xs font-bold text-black/55">Kỳ báo cáo
            <input value={periodCode} onChange={(event) => setPeriodCode(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold" />
          </label>
          <label className="text-xs font-bold text-black/55">Chi nhánh
            <input value={branch} onChange={(event) => setBranch(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold" />
          </label>
          <label className="text-xs font-bold text-black/55">Ghi chú
            <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold" placeholder="Ghi chú chốt" />
          </label>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={previewClose} disabled={loading}>{loading ? 'Đang xử lý...' : 'Preview chốt'}</Button>
        <Button variant="secondary" onClick={() => confirmClose(false)} disabled={loading || !canClose}>Xác nhận chốt</Button>
        <Button variant="danger" onClick={() => confirmClose(true)} disabled={loading}>Chốt đặc biệt</Button>
      </div>
      <div className="mt-3 rounded-lg bg-lang-cream px-3 py-2 text-sm font-semibold text-lang-brown">{message}</div>
      <div className="mt-3">
        <ReportTable headers={['Hạng mục', 'Trạng thái', 'Chi tiết']} rows={rows} maxHeight="max-h-[260px]" />
      </div>
    </Card>
  );
}
