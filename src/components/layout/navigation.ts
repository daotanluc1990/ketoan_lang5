import { BarChart3, Bot, BriefcaseBusiness, ClipboardList, DollarSign, FileInput, Home, Scale, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permission } from '@/lib/rbac/rbac';
import type { Role } from '@/lib/report-types';

export type NavigationGroup =
  | 'Tổng quan & xử lý'
  | 'Báo cáo tài chính quản trị'
  | 'Kho & vận hành hàng hóa'
  | 'Thất thoát & định mức'
  | 'Hệ thống';

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: NavigationGroup;
  permission: Permission;
  allowedRoles: Role[];
};

const FULL_FINANCE_ROLES: Role[] = ['CEO', 'Kế toán', 'Admin'];
const OPERATION_ROLES: Role[] = ['CEO', 'Kế toán', 'Admin', 'Quản lý cửa hàng'];

export const navigationItems: NavigationItem[] = [
  { href: '/tong-quan', label: 'Tổng quan kế toán', icon: Home, group: 'Tổng quan & xử lý', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },
  { href: '/ban-lam-viec-ke-toan', label: 'Bàn làm việc kế toán', icon: BriefcaseBusiness, group: 'Tổng quan & xử lý', permission: 'view_workbench', allowedRoles: OPERATION_ROLES },
  { href: '/import-nhap-lieu', label: 'Nhập liệu & Import', icon: FileInput, group: 'Tổng quan & xử lý', permission: 'view_import', allowedRoles: FULL_FINANCE_ROLES },

  { href: '/pl-tuan', label: 'P&L Tuần', icon: BarChart3, group: 'Báo cáo tài chính quản trị', permission: 'view_pnl', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/dong-tien', label: 'Dòng tiền Tuần', icon: DollarSign, group: 'Báo cáo tài chính quản trị', permission: 'view_cashflow', allowedRoles: OPERATION_ROLES },
  { href: '/can-doi', label: 'Cân đối rút gọn', icon: Scale, group: 'Báo cáo tài chính quản trị', permission: 'view_balance', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/du-toan', label: 'Dự toán tuần tới', icon: ClipboardList, group: 'Báo cáo tài chính quản trị', permission: 'view_forecast', allowedRoles: FULL_FINANCE_ROLES },

  { href: '/kho-cua-hang', label: 'Kho cửa hàng', icon: ClipboardList, group: 'Kho & vận hành hàng hóa', permission: 'view_inventory', allowedRoles: OPERATION_ROLES },
  { href: '/kho-bep-trung-tam', label: 'Kho Bếp Trung Tâm', icon: ClipboardList, group: 'Kho & vận hành hàng hóa', permission: 'view_btt_inventory', allowedRoles: OPERATION_ROLES },
  { href: '/doi-chieu-btt-cua-hang', label: 'Đối chiếu BTT - Cửa hàng', icon: Scale, group: 'Kho & vận hành hàng hóa', permission: 'view_transfer', allowedRoles: OPERATION_ROLES },
  { href: '/hang-huy', label: 'Hàng hủy', icon: ShieldAlert, group: 'Kho & vận hành hàng hóa', permission: 'view_waste', allowedRoles: OPERATION_ROLES },

  { href: '/hao-hut-vuot-dinh-muc', label: 'Hao hụt / Vượt định mức', icon: BarChart3, group: 'Thất thoát & định mức', permission: 'view_standard_loss', allowedRoles: OPERATION_ROLES },
  { href: '/that-thoat-ton-kho', label: 'Thất thoát tồn kho', icon: ShieldAlert, group: 'Thất thoát & định mức', permission: 'view_stock_loss', allowedRoles: OPERATION_ROLES },
  { href: '/dinh-muc-mon-ban', label: 'Định mức món bán', icon: ClipboardList, group: 'Thất thoát & định mức', permission: 'view_master_data', allowedRoles: FULL_FINANCE_ROLES },

  { href: '/cong-no', label: 'Công nợ', icon: DollarSign, group: 'Hệ thống', permission: 'view_debt', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/cai-dat-bot', label: 'Cài đặt & Bot báo cáo', icon: Bot, group: 'Hệ thống', permission: 'view_settings', allowedRoles: ['CEO', 'Admin'] },
  { href: '/lich-su-chot-bao-cao', label: 'Lịch sử chốt báo cáo', icon: ClipboardList, group: 'Hệ thống', permission: 'view_close_history', allowedRoles: FULL_FINANCE_ROLES }
];

export const navigationGroups: NavigationGroup[] = [
  'Tổng quan & xử lý',
  'Báo cáo tài chính quản trị',
  'Kho & vận hành hàng hóa',
  'Thất thoát & định mức',
  'Hệ thống'
];
