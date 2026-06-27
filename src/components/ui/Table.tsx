export function SimpleTable({ headers, rows, maxHeight = 'max-h-[440px]' }: { headers: string[]; rows: Array<Array<React.ReactNode>>; maxHeight?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="min-w-full divide-y divide-black/5 text-sm">
          <thead className="sticky top-0 z-10 bg-lang-cream text-left text-xs uppercase tracking-wide text-black/60">
            <tr>{headers.map((h, hIdx) => <th className={`px-4 py-3 font-bold ${hIdx === 0 ? 'sticky left-0 z-20 bg-lang-cream' : ''}`} key={h}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-lang-cream/60">
                {row.map((cell, cellIdx) => <td className={`${cellIdx > 1 ? 'number ' : ''}px-4 py-3 ${cellIdx === 0 ? 'sticky left-0 z-10 bg-white' : ''} ${idx % 2 === 1 ? 'bg-lang-cream2/60' : ''}`} key={cellIdx}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
