'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Role } from '@/lib/report-types';
import { navigationItems } from './navigation';
import { Bell, HelpCircle, Menu, Search, Send, UserRound } from 'lucide-react';

const roles: Role[] = ['CEO', 'Kế toán', 'Admin', 'Quản lý cửa hàng'];

export function TopBar({ role, onRoleChange, onMobileMenu }: { role: Role; onRoleChange: (role: Role) => void; onMobileMenu?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return navigationItems
      .filter((item) => item.allowedRoles.includes(role))
      .filter((item) => item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, role]);

  return (
    <header className="sticky top-0 z-20 h-[52px] border-b border-lang-redDark bg-gradient-to-r from-lang-redDark to-lang-red text-white shadow-sm">
      <div className="flex h-full w-full items-center justify-between gap-2 px-3 lg:px-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onMobileMenu} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/85 hover:bg-white/10 lg:hidden" aria-label="Mở menu"><Menu className="h-4 w-4" /></button>
          <button type="button" className="hidden h-8 w-8 items-center justify-center rounded-lg text-white/85 hover:bg-white/10 lg:inline-flex" aria-label="Menu"><Menu className="h-4 w-4" /></button>
          <div className="hidden min-w-0 sm:block">
            <p className="text-[13px] font-black leading-tight">ERP Mini</p>
            <p className="text-[10px] font-semibold leading-tight text-white/70">Kế Toán Cơm Tấm Làng</p>
          </div>
        </div>

        {/* Global search */}
        <div className="relative mx-2 flex-1 max-w-xs">
          <div className="flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 ring-1 ring-white/20 focus-within:bg-white/15">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && matches[0]) { router.push(matches[0].href); setQuery(''); } }}
              placeholder="Tìm trang..."
              aria-label="Tìm kiếm trang"
              className="min-w-0 flex-1 border-0 bg-transparent text-[12px] font-medium text-white placeholder:text-white/60 outline-none"
            />
          </div>
          {matches.length > 0 ? (
            <div className="absolute left-0 right-0 top-9 z-30 overflow-hidden rounded-lg border border-lang-line bg-white text-lang-ink shadow-lg">
              {matches.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.href}
                    onClick={() => { router.push(item.href); setQuery(''); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-semibold hover:bg-lang-redSoft hover:text-lang-red"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-lang-muted" />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto text-[10px] font-normal text-lang-muted">{item.group}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <Link href="/import-nhap-lieu" className="hidden h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[12px] font-bold text-lang-red shadow-sm hover:bg-gray-50 md:inline-flex">Import</Link>
          <Link href="/cai-dat-bot" className="hidden h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-[12px] font-bold text-white ring-1 ring-white/20 hover:bg-white/15 md:inline-flex"><Send className="h-3.5 w-3.5" />CEO/Bot</Link>
          <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/10" aria-label="Thông báo"><Bell className="h-3.5 w-3.5" /><span className="absolute right-1 top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-lang-red">3</span></button>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/10" aria-label="Trợ giúp"><HelpCircle className="h-3.5 w-3.5" /></button>
          <div className="ml-1 flex items-center gap-1.5 border-l border-white/15 pl-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/18"><UserRound className="h-4 w-4" /></span>
            <div className="hidden text-right md:block">
              <p className="text-[11px] font-black leading-tight">Người dùng</p>
              <p className="text-[10px] font-semibold leading-tight text-white/70">{role}</p>
            </div>
            <select value={role} onChange={(event: ChangeEvent<HTMLSelectElement>) => onRoleChange(event.target.value as Role)} className="h-7 max-w-[132px] rounded-lg border border-white/20 bg-white/10 px-2 text-[10px] font-bold text-white outline-none" aria-label="Chọn vai trò">
              {roles.map((item) => <option className="text-lang-ink" key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
