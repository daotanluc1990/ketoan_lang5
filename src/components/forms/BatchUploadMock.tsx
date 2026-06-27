'use client';

import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ReportTable } from '@/components/report/ReportTable';

const IMPORT_UI_VERSION = 'IMPORT_UI_V8_2_20260626';

type ImportPreviewSummary = {
  dongMoi: number;
  duLieuTrung: number;
  duLieuLech: number;
  dongLoi: number;
};

type ImportPreview = {
  maLanImport: string;
  loaiDuLieu: string;
  chiNhanh: string;
  tenFile: string;
  summary: ImportPreviewSummary;
};

type BatchPreviewFile = {
  tenFile: string;
  loaiDuLieu: string;
  chiNhanh: string;
  warnings: string[];
  preview: ImportPreview;
};

type BatchPreview = {
  maBatch: string;
  files: BatchPreviewFile[];
  summary: {
    soFile: number;
    dongMoi: number;
    duLieuTrung: number;
    duLieuLech: number;
    dongLoi: number;
    soFileKhongNhanDien: number;
  };
};

function statusFromFile(file: BatchPreviewFile) {
  if (file.preview.summary.dongLoi > 0) return 'Có lỗi';
  if (file.preview.summary.duLieuLech > 0) return 'Cần đối chiếu';
  if (file.warnings.length || file.loaiDuLieu === 'Không nhận diện được') return 'Cảnh báo';
  return 'Đạt';
}

function nextActionFromFile(file: BatchPreviewFile) {
  const status = statusFromFile(file);
  if (status === 'Có lỗi') return file.warnings[0] || 'Sửa dòng lỗi trước khi import';
  if (status === 'Cần đối chiếu') return 'Đối chiếu dữ liệu lệch';
  if (status === 'Cảnh báo') return file.warnings[0] || 'Kiểm tra loại file/chi nhánh';
  return 'Có thể import';
}

function payloadErrorMessage(payload: { message?: string; error?: { message?: string } }, fallback: string) {
  return payload.error?.message ?? payload.message ?? fallback;
}

async function readImportResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text().catch(() => '');
  return {
    ok: false,
    message: text.trim()
      ? `Server trả phản hồi không đúng dạng JSON: ${text.trim().slice(0, 160)}`
      : 'Server không trả dữ liệu preview. Hãy kiểm tra đăng nhập, cache trình duyệt và cấu hình API.'
  };
}

export function BatchUploadMock() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(`Bản ${IMPORT_UI_VERSION}: chọn file Excel rồi bấm Kiểm tra batch. Preview không ghi vào Google Sheet.`);

  const rows = useMemo(() => {
    if (!preview) return selectedFiles.map((file: File) => [file.name, 'Chưa kiểm tra', '—', '—', '—', '—', '—', '—', 'Chưa đủ dữ liệu', 'Bấm Kiểm tra batch']);
    return preview.files.map((file: BatchPreviewFile) => [
      file.tenFile,
      file.loaiDuLieu,
      'Tự nhận diện',
      file.chiNhanh,
      String(file.preview.summary.dongMoi),
      String(file.preview.summary.duLieuTrung),
      String(file.preview.summary.duLieuLech),
      String(file.preview.summary.dongLoi),
      statusFromFile(file),
      nextActionFromFile(file)
    ]);
  }, [preview, selectedFiles]);

  const canConfirm = Boolean(preview && preview.summary.dongLoi === 0 && preview.summary.duLieuLech === 0 && preview.summary.soFileKhongNhanDien === 0);
  const summaryRows = preview
    ? [
        ['Số file', String(preview.summary.soFile)],
        ['Dòng mới', String(preview.summary.dongMoi)],
        ['Dòng trùng', String(preview.summary.duLieuTrung)],
        ['Dữ liệu lệch', String(preview.summary.duLieuLech)],
        ['Dòng lỗi', String(preview.summary.dongLoi)],
        ['File không nhận diện', String(preview.summary.soFileKhongNhanDien)],
        ['Kết luận', canConfirm ? 'Đạt' : 'Chưa thể import']
      ]
    : [['Trạng thái', selectedFiles.length ? 'Đã chọn file, chưa preview' : 'Chưa chọn file'], ['Bản import', IMPORT_UI_VERSION]];

  async function checkBatch() {
    if (!selectedFiles.length) {
      setMessage('Chưa có file Excel nào. Hãy chọn ít nhất 1 file.');
      return;
    }
    setLoading(true);
    setPreview(null);
    setMessage('Đang kiểm tra batch, chưa ghi Google Sheet...');
    try {
      const formData = new FormData();
      for (const file of selectedFiles) formData.append('files', file);
      formData.append('actor', 'web-ketoan');
      const response = await fetch('/api/import/preview', { method: 'POST', body: formData, cache: 'no-store' });
      const payload = await readImportResponse(response);
      if (!response.ok || !payload.ok) throw new Error(payloadErrorMessage(payload, 'Không preview được batch.'));
      if (!payload.data?.files || !Array.isArray(payload.data.files)) throw new Error('API preview trả dữ liệu không đúng dạng batch. Hãy deploy lại bản mới nhất và hard refresh trình duyệt.');
      setPreview(payload.data);
      setMessage('Đã kiểm tra batch. Chỉ bấm Import file đạt khi Lỗi = 0, Lệch = 0 và file được nhận diện đúng.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không kiểm tra được batch.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmBatch() {
    if (!preview) return;
    setConfirming(true);
    setMessage('Đang ghi dữ liệu vào Google Sheet...');
    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ batch: preview, actor: 'web-ketoan' }),
        cache: 'no-store'
      });
      const payload = await readImportResponse(response);
      if (!response.ok || !payload.ok) throw new Error(payloadErrorMessage(payload, 'Không import được batch.'));
      const writtenRows = Array.isArray(payload.results) ? payload.results.reduce((total: number, item: { writtenRows?: number }) => total + (item.writtenRows ?? 0), 0) : 0;
      setMessage(`Đã ghi Google Sheet: ${writtenRows} dòng mới. Hãy mở các sheet DL_*, DM_*, KQ_* và IMPORT_* để kiểm tra dữ liệu, lỗi/trùng/lệch.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import file đạt thất bại.');
    } finally {
      setConfirming(false);
    }
  }

  function cancelBatch() {
    setSelectedFiles([]);
    setPreview(null);
    setMessage(`Đã hủy batch trên màn hình. Chưa thay đổi Google Sheet. Bản ${IMPORT_UI_VERSION}.`);
  }

  function downloadErrorFile() {
    const errorRows = preview?.files.flatMap((file: BatchPreviewFile) => file.preview.summary.dongLoi || file.preview.summary.duLieuLech ? [{ file: file.tenFile, loaiDuLieu: file.loaiDuLieu, loi: file.preview.summary.dongLoi, lech: file.preview.summary.duLieuLech, warnings: file.warnings.join('; ') }] : []) ?? [];
    const blob = new Blob([JSON.stringify(errorRows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-loi-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <label className="block rounded-2xl border-2 border-dashed border-lang-red/30 bg-lang-cream/70 p-4 text-center transition hover:border-lang-red">
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".xlsx,.xls,.csv"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setSelectedFiles(Array.from(event.target.files ?? []));
              setPreview(null);
              setMessage(`Đã chọn file. Bấm Kiểm tra batch để preview thật. Bản ${IMPORT_UI_VERSION}.`);
            }}
          />
          <span className="text-base font-bold text-lang-brown">Kéo thả hoặc bấm để chọn nhiều file</span>
          <span className="mt-2 block text-sm text-black/60">Hỗ trợ nguồn cũ và Data Master V7: doanh thu, sổ quỹ, XNT cửa hàng, XNT BTT, tồn kho Bếp Trung Tâm, xuất/nhận BTT, hàng hủy, chế biến thực tế, định mức, công nợ.</span>
          <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-lang-brown shadow-sm">Preview trước, confirm sau · {IMPORT_UI_VERSION}</span>
        </label>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-bold uppercase tracking-wide text-black/45">Tóm tắt batch</p>
          <div className="mt-3"><ReportTable headers={['Chỉ số', 'Giá trị']} rows={summaryRows} maxHeight="max-h-[240px]" /></div>
        </div>
      </div>

      {selectedFiles.length > 0 ? (
        <div className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
          <p className="font-bold text-lang-brown">File vừa chọn trong máy:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-black/65">
            {selectedFiles.map((file: File) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl bg-white p-3 text-sm font-semibold text-black/65 shadow-sm ring-1 ring-black/5">{message}</div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={checkBatch} disabled={loading}>{loading ? 'Đang kiểm tra...' : 'Kiểm tra batch'}</Button>
        <Button variant="secondary" onClick={confirmBatch} disabled={!canConfirm || confirming}>{confirming ? 'Đang import...' : 'Import file đạt'}</Button>
        <Button variant="secondary" onClick={downloadErrorFile} disabled={!preview}>Tải file lỗi</Button>
        <Button variant="danger" onClick={cancelBatch}>Hủy batch</Button>
      </div>

      <ReportTable
        headers={['File', 'Loại dữ liệu', 'Kỳ', 'Chi nhánh', 'Dòng mới', 'Trùng', 'Lệch', 'Lỗi', 'Trạng thái', 'Việc cần làm']}
        rows={rows}
        maxHeight="max-h-[420px]"
      />
    </div>
  );
}
