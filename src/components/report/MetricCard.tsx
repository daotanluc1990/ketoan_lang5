import { clsx } from 'clsx';
import type { Status } from '@/lib/report-types';
import { StatusBadge } from './StatusBadge';

/**
 * Đường sparkline mini (SVG) — trend 7 ngày gần đây.
 * Màu theo status: good=green, danger=red, còn lại=xám.
 */
function Sparkline({ status, seed = 'up' }: { status: Status; seed?: string }) {
  const points =
    seed === 'down'
      ? [8, 7, 8, 5, 6, 4, 3]
      : seed === 'flat'
        ? [5, 5, 5, 5, 5, 5, 5]
        : [3, 5, 4, 7, 6, 8, 7];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 54;
  const h = 20;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * (h - 4) - 2}`)
    .join(' ');
  const tone = status === 'good' ? 'up' : status === 'danger' ? 'down' : 'flat';
  return (
    <svg className={clsx('sparkline', tone)} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={d} />
    </svg>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  trend,
  status = 'neutral',
  compact = false,
  showSparkline = false,
  sparkSeed = 'up'
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  status?: Status;
  compact?: boolean;
  /** Hiển thị sparkline mini ở góc dưới phải. */
  showSparkline?: boolean;
  /** Hướng sparkline: 'up' | 'down' | 'flat'. */
  sparkSeed?: 'up' | 'down' | 'flat';
}) {
  const trendTone =
    status === 'good' ? 'text-emerald-700' : status === 'danger' ? 'text-red-700' : status === 'warning' ? 'text-orange-700' : 'text-lang-muted';
  const iconTone =
    status === 'good' ? 'bg-emerald-50 text-emerald-600' : status === 'danger' ? 'bg-red-50 text-red-600' : status === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600';
  return (
    <div className={clsx('relative overflow-hidden rounded-xl border border-lang-line bg-white shadow-soft', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start justify-between gap-2">
        <span className={clsx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black', iconTone)}>{label.charAt(0)}</span>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 line-clamp-1 text-[12px] font-semibold text-lang-ink">{label}</p>
      <div className="number mt-1 text-2xl font-black leading-none tracking-tight text-lang-ink">{value}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {trend ? <p className={clsx('line-clamp-1 text-[11px] font-semibold leading-4', trendTone)}>{trend}</p> : null}
          {hint ? <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-lang-muted">{hint}</p> : null}
        </div>
        {showSparkline ? <Sparkline status={status} seed={sparkSeed} /> : null}
      </div>
    </div>
  );
}
