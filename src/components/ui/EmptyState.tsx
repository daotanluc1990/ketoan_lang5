export function EmptyState({ title }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-lang-line bg-white px-3 py-2 text-center shadow-soft">
      <h3 className="text-[13px] font-bold text-lang-muted">{title}</h3>
    </div>
  );
}
