import { Card, CardTitle } from '@/components/ui/Card';

export function InsightListCard({ title, items }: { title: string; items: Array<{ label: string; value: string; note?: string }> }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-lang-cream/70 px-3 py-2">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-black/45">{item.label}</p>
            <p className="number mt-1 text-lg font-extrabold leading-none text-lang-brown">{item.value}</p>
            {item.note ? <p className="mt-1 line-clamp-1 text-[11px] text-black/55">{item.note}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
