import { clsx } from 'clsx';

const variants = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-orange-200 bg-orange-50 text-orange-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-gray-200 bg-gray-50 text-gray-600'
};

export function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: keyof typeof variants }) {
  return <span className={clsx('inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold leading-4', variants[variant])}>{children}</span>;
}
