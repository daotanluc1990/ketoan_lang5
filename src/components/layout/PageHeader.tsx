import { StatusBadge } from '@/components/report/StatusBadge';

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  status?: string;
  /** Chuỗi điều hướng. Nếu không truyền, tự sinh "ERP Mini / [title]". */
  breadcrumbs?: Crumb[];
  /** Nút hành động bên phải (import, gửi bot, v.v). */
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, status, breadcrumbs, actions }: PageHeaderProps) {
  const crumbs: Crumb[] = breadcrumbs ?? [{ label: 'ERP Mini' }, { label: title, href: undefined }];

  return (
    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
      <div className="min-w-0">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="Đường dẫn">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <span key={`${crumb.label}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className={isLast ? 'crumb-current' : undefined}>{crumb.label}</span>
                {!isLast ? <span className="crumb-sep">/</span> : null}
              </span>
            );
          })}
        </nav>

        <h2 className="text-2xl font-black tracking-tight text-lang-ink md:text-[28px]">{title}</h2>

        {description ? (
          <p className="mt-1 text-sm font-medium text-lang-muted">{description}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  );
}
