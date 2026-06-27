import { StatusBadge } from './StatusBadge';

const statusWords = new Set(['Tốt', 'Đạt', 'Có thể chốt', 'Có thể gửi', 'Đã xong', 'Ổn', 'Cảnh báo', 'Cần kiểm', 'Cần đối chiếu', 'Đang làm', 'Chưa đủ dữ liệu', 'Chưa', 'Có lỗi', 'Nguy hiểm', 'Chưa thể chốt', 'Không import', 'Không', 'Cần CEO duyệt']);

export function ReportTable({ headers, rows, maxHeight = 'max-h-[360px]' }: { headers: string[]; rows: string[][]; maxHeight?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-lang-line bg-white">
      <div className={`table-scroll overflow-auto ${maxHeight}`}>
        <table className="min-w-full border-separate border-spacing-0 text-[12px]">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left uppercase tracking-wide text-lang-muted">
            <tr>{headers.map((h, hIdx) => <th className={`border-b border-lang-line px-3 py-2.5 font-black ${hIdx === 0 ? 'sticky left-0 z-20 bg-gray-50' : ''}`} key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-lang-redSoft/60">
                {row.map((cell, cellIdx) => (
                  <td
                    className={`${cellIdx > 1 ? 'number whitespace-nowrap ' : ''}border-b border-lang-line px-3 py-2.5 font-medium text-lang-ink ${cellIdx === 0 ? 'sticky left-0 z-10 bg-white' : ''} ${idx % 2 === 1 ? 'bg-lang-cream2/60' : ''}`}
                    key={`${idx}-${cellIdx}`}
                  >
                    {statusWords.has(cell) ? <StatusBadge status={cell} /> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
