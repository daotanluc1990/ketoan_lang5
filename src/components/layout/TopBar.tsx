'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Role } from '@/lib/report-types';
import { navigationItems } from './navigation';
import { Bell, HelpCircle, Menu, Moon, Search, Send, Sun, UserRound } from 'lucide-react';

const roles: Role[] = ['CEO', 'Kế toán', 'Admin', 'Quản lý cửa hàng'];

export function TopBar({ role, onRoleChange, onMobileMenu }: { role: Role; onRoleChange: (role: Role) => void; onMobileMenu?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Dark mode toggle
  const [dark, setDark] = useState(false);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      try { localStorage.setItem('erp-dark', next ? '1' : '0'); } catch {}
    }
  };
  // Restore dark mode on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('erp-dark') === '1';
        if (saved) { setDark(true); document.documentElement.classList.add('dark'); }
      } catch {}
    }
    return null;
  });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return navigationItems
      .filter((item) => item.allowedRoles.includes(role))
      .filter((item) => item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, role]);

  return (
    <header className="sticky top-0 z-20 h-[56px] border-b border-lang-redDeep bg-lang-redDark text-white shadow-md">
      <div className="flex h-full w-full items-center justify-between gap-3 px-4 lg:px-6">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <button type="button" onClick={onMobileMenu} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/95 hover:bg-white/15 lg:hidden" aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
          <div className="hidden min-w-0 sm:block">
            <p className="text-sm font-bold leading-tight">ERP Mini</p>
            <p className="text-xs font-medium leading-tight text-white/90">Kế Toán Cơm Tấm Làng</p>
          </div>
        </div>

        {/* Center: global search */}
        <div className="relative mx-2 flex-1 max-w-xs">
          <div className="flex h-10 items-center gap-2 rounded-lg bg-white/10 px-3 ring-1 ring-white/25 focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-white/40">
            <Search className="h-4 w-4 shrink-0 text-white/90" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { router.push(matches[0].href); setQuery(''); } if (e.key === 'Escape') setQuery(''); }}
              placeholder="Tìm trang..."
              aria-label="Tìm kiếm trang"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-white placeholder:text-white/80 outline-none"
            />
          </div>
          {matches.length > 0 ? (
            <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-lg border border-lang-line bg-white text-lang-ink shadow-lg" role="listbox">
              {matches.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.href}
                    onClick={() => { router.push(item.href); setQuery(''); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold hover:bg-lang-redSoft hover:text-lang-red"
                    role="option"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-lang-muted" />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-xs font-normal text-lang-muted">{item.group}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Link href="/import-nhap-lieu" className="hidden h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-lang-red shadow-sm hover:bg-gray-50 md:inline-flex">Import</Link>
          <Link href="/cai-dat-bot" className="hidden h-10 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/20 md:inline-flex"><Send className="h-4 w-4" />CEO/Bot</Link>
          <button onClick={toggleDark} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/15" aria-label={dark ? 'Chuyển sáng' : 'Chuyển tối'}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/15" aria-label="Thông báo"><Bell className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-lang-red">3</span></button>
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/15" aria-label="Trợ giúp"><HelpCircle className="h-4 w-4" /></button>
          <div className="ml-1 flex items-center gap-2 border-l border-white/20 pl-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><UserRound className="h-4 w-4" /></span>
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold leading-tight">Người dùng</p>
              <p className="text-xs font-medium leading-tight text-white/90">{role}</p>
            </div>
            <select value={role} onChange={(event: ChangeEvent<HTMLSelectElement>) => onRoleChange(event.target.value as Role)} className="h-9 max-w-[132px] rounded-lg border border-white/25 bg-white/15 px-2 text-xs font-bold text-white outline-none" aria-label="Chọn vai trò">
              {roles.map((item) => <option className="text-lang-ink" key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
