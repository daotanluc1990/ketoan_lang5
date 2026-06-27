import { clsx } from 'clsx';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx('rounded-xl border border-lang-line bg-white p-4 shadow-soft', className)}>{children}</section>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-black tracking-tight text-lang-ink">{children}</h3>;
}
