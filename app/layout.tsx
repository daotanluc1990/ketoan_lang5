import '@/styles/globals.css';
import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Cơm Tấm Làng — ERP Mini Kế Toán',
  description: 'ERP mini báo cáo kế toán quản trị cho Cơm Tấm Làng'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
