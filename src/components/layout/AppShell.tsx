'use client';

import { useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { RagAssistant } from '@/components/dashboard/RagAssistant';
import { TopBar } from './TopBar';
import { GlobalFilterBar } from './GlobalFilterBar';
import type { Role } from '@/lib/report-types';

const COLLAPSE_KEY = 'ctl-ceo-sidebar-collapsed';
const ROLE_KEY = 'ctl-ceo-role';

function readStoredBool(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

function writeRoleCookie(role: Role) {
  if (typeof document === 'undefined') return;
  document.cookie = `ctl_role=${encodeURIComponent(role)}; path=/; max-age=2592000; samesite=lax`;
}

function readCookieRole(): Role | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )ctl_role=([^;]+)/);
  if (!match) return null;
  const value = decodeURIComponent(match[1]) as Role;
  if (value === 'CEO' || value === 'Kế toán' || value === 'Admin' || value === 'Quản lý cửa hàng') return value;
  return null;
}

function readStoredRole(): Role {
  if (typeof window === 'undefined') return 'Kế toán';
  try {
    const cookieRole = readCookieRole();
    if (cookieRole) return cookieRole;
    const value = window.localStorage.getItem(ROLE_KEY) as Role | null;
    if (value === 'CEO' || value === 'Kế toán' || value === 'Admin' || value === 'Quản lý cửa hàng') return value;
  } catch {}
  return 'Kế toán';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => readStoredBool(COLLAPSE_KEY, false));
  const [role, setRole] = useState<Role>(() => readStoredRole());
  // Mobile sidebar drawer (open/close)
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((current: boolean) => {
      const next = !current;
      try { window.localStorage.setItem(COLLAPSE_KEY, String(next)); } catch {}
      return next;
    });
  };

  const setSelectedRole = (nextRole: Role) => {
    setRole(nextRole);
    try { window.localStorage.setItem(ROLE_KEY, nextRole); } catch {}
    writeRoleCookie(nextRole);
  };

  // Khóa scroll body khi mobile drawer mở
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const contentPadding = useMemo(() => (collapsed ? 'lg:pl-[72px]' : 'lg:pl-60'), [collapsed]);

  return (
    <div className="app-bg min-h-screen overflow-x-hidden text-lang-ink">
      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} role={role} />

      {/* Mobile sidebar drawer + overlay */}
      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      ) : null}

      <div className={clsx('min-h-screen transition-[padding] duration-200', contentPadding)}>
        <TopBar role={role} onRoleChange={setSelectedRole} onMobileMenu={() => setMobileOpen(true)} />
        <GlobalFilterBar />
        <main className="w-full px-4 py-4 lg:px-6">
          <div className="mx-auto w-full max-w-[1480px] space-y-4 pb-24">
            {children}
          </div>
        </main>
      </div>
      <RagAssistant />
    </div>
  );
}
