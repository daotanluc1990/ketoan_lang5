import { Card, CardTitle } from '@/components/ui/Card';

export function ChartCard({ title, items }: { title: string; description?: string; items: Array<{ label: string; value: number; caption?: string }>; type?: 'bar' | 'line' | 'status' }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-2 text-[12px]"><span className="truncate font-semibold text-lang-ink">{item.label}</span><span className="number shrink-0 text-lang-muted">{item.caption ?? item.value}</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-lang-red" style={{ width: `${Math.max(8, Math.round((item.value / max) * 100))}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
