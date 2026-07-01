'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationGroups, navigationItems } from './navigation';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, Menu, SquareStack } from 'lucide-react';

export function Sidebar({ collapsed, onToggle, role, onNavigate }: { collapsed: boolean; onToggle: () => void; role: import('@/lib/report-types').Role; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={clsx('fixed inset-y-0 left-0 z-30 hidden h-screen flex-col overflow-hidden border-r border-lang-line bg-white text-lang-ink transition-[width] duration-200 lg:flex', collapsed ? 'w-[72px]' : 'w-60')}>
      <div className={clsx('flex h-[56px] shrink-0 items-center border-b border-lang-line', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lang-red text-white shadow-sm"><SquareStack className="h-4 w-4" /></span>
          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight text-lang-ink">ERP Mini</h1>
              <p className="truncate text-xs font-medium text-lang-muted">Kế Toán Cơm Tấm Làng</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? <button type="button" onClick={onToggle} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lang-muted hover:bg-lang-redSoft hover:text-lang-red" aria-label="Thu gọn sidebar"><ChevronLeft className="h-4 w-4" /></button> : null}
      </div>

      {collapsed ? <button type="button" onClick={onToggle} className="mx-auto mt-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-lang-muted hover:bg-lang-redSoft hover:text-lang-red" aria-label="Mở rộng sidebar"><ChevronRight className="h-4 w-4" /></button> : null}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sidebar-scroll" aria-label="Điều hướng chính">
        {navigationGroups.map((group) => {
          const items = navigationItems.filter((item) => item.group === group && item.allowedRoles.includes(role));
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              {!collapsed ? <p className="mb-1.5 px-2 text-xs font-bold text-lang-redDark">{group}</p> : <div className="mb-2 h-px bg-lang-line" />}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined} className={clsx('group flex items-center rounded-lg text-sm font-semibold transition', collapsed ? 'justify-center px-2 py-3' : 'gap-2.5 px-3 py-2.5', active ? 'bg-lang-redSoft text-lang-red shadow-sm' : 'text-lang-ink hover:bg-gray-50 hover:text-lang-red')}>
                      <Icon className={clsx('h-4 w-4 shrink-0', active ? 'text-lang-red' : 'text-gray-500 group-hover:text-lang-red')} />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="sidebar-foot shrink-0 border-t border-lang-line px-4 py-3 text-xs font-medium text-lang-muted">V4.9 RBAC · Production</div>
      ) : <Menu className="mx-auto mb-4 h-4 w-4 shrink-0 text-gray-400" />}
    </aside>
  );
}
