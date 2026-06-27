'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ReportTable } from '@/components/report/ReportTable';

type RollbackResponse = {
  ok: boolean;
  mode?: string;
  affectedRows?: number;
  updatedRows?: number;
  message?: string;
  sheets?: Array<{ sheetName: string; matchedRows?: number; activeRows?: number; updatedRows?: number }>;
  error?: { message?: string };
};

async function readJson(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  return { ok: false, error: { message: await response.text().catch(() => 'Server không trả JSON.') } };
}

export function ImportRollbackPanel() {
  const [maLanImport, setMaLanImport] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RollbackResponse | null>(null);
  const [message, setMessage] = useState('Nhập Mã lần import để preview hoàn tác trước. Confirm chỉ dành cho CEO/Admin.');

  const rows = result?.sheets?.length
    ? result.sheets.map((sheet) => [sheet.sheetName, String(sheet.matchedRows ?? '—'), String(sheet.activeRows ?? '—'), String(sheet.updatedRows ?? '—')])
    : [['Chưa preview', '—', '—', '—']];

  async function callRollback(confirm: boolean) {
    if (!maLanImport.trim() || !reason.trim()) {
      setMessage('Cần nhập Mã lần import và lý do hoàn tác.');
      return;
    }
    setLoading(true);
    setMessage(confirm ? 'Đang hoàn tác mềm...' : 'Đang preview hoàn tác...');
    try {
      const response = await fetch('/api/import/rollback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maLanImport, reason, confirm })
      });
      const payload = await readJson(response);
      setResult(payload);
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message ?? payload.message ?? 'Không hoàn tác được.');
      setMessage(payload.message ?? (confirm ? 'Đã hoàn tác mềm.' : 'Đã preview hoàn tác.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không hoàn tác được.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto_auto] md:items-end">
        <label className="text-xs font-bold text-black/55">Mã lần import
          <input value={maLanImport} onChange={(event) => setMaLanImport(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold" placeholder="IMP-..." />
        </label>
        <label className="text-xs font-bold text-black/55">Lý do hoàn tác
          <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold" placeholder="Nhập sai file / sai kỳ / sai chi nhánh" />
        </label>
        <Button onClick={() => callRollback(false)} disabled={loading}>{loading ? 'Đang xử lý...' : 'Preview'}</Button>
        <Button variant="danger" onClick={() => callRollback(true)} disabled={loading}>Confirm</Button>
      </div>
      <div className="rounded-lg bg-lang-cream px-3 py-2 text-sm font-semibold text-lang-brown">{message}</div>
      <ReportTable headers={['Sheet', 'Dòng khớp', 'Dòng còn hiệu lực', 'Dòng đã hoàn tác']} rows={rows} maxHeight="max-h-[220px]" />
    </div>
  );
}
