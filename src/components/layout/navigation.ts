import { BarChart3, BookOpen, Bot, BriefcaseBusiness, Building2, ClipboardList, DollarSign, FileInput, Home, Scale, ShieldAlert, Users, Wallet, ChefHat, Package, Trash2, TrendingUp, CalendarDays, FileText, AlertTriangle, FileSpreadsheet, Settings, Store, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permission } from '@/lib/rbac/rbac';
import type { Role } from '@/lib/report-types';

export type NavigationGroup =
  | 'Trang chủ'
  | 'Doanh thu'
  | 'Kho cửa hàng'
  | 'Kho bếp trung tâm'
  | 'Tài chính'
  | 'Lương & nhân sự'
  | 'Báo cáo quản trị'
  | 'Tài liệu'
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
  // TRANG CHỦ
  { href: '/trang-chu', label: 'Trang chủ', icon: Home, group: 'Trang chủ', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },

  // DOANH THU
  { href: '/doanh-thu/tien-mat', label: 'Tiền mặt', icon: Wallet, group: 'Doanh thu', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },
  { href: '/doanh-thu/chuyen-khoan', label: 'Chuyển khoản', icon: DollarSign, group: 'Doanh thu', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },
  { href: '/doanh-thu/app', label: 'App giao hàng', icon: TrendingUp, group: 'Doanh thu', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },

  // KHO CỬA HÀNG
  { href: '/kho-cua-hang', label: 'Tồn kho', icon: Package, group: 'Kho cửa hàng', permission: 'view_inventory', allowedRoles: OPERATION_ROLES },
  { href: '/hang-huy', label: 'Hàng hủy / hư', icon: Trash2, group: 'Kho cửa hàng', permission: 'view_waste', allowedRoles: OPERATION_ROLES },
  { href: '/hao-hut-vuot-dinh-muc', label: 'Hao hụt / định mức', icon: BarChart3, group: 'Kho cửa hàng', permission: 'view_standard_loss', allowedRoles: OPERATION_ROLES },

  // KHO BẾP TRUNG TÂM
  { href: '/kho-bep-trung-tam', label: 'Nhập NCC', icon: FileInput, group: 'Kho bếp trung tâm', permission: 'view_btt_inventory', allowedRoles: OPERATION_ROLES },
  { href: '/kho-bep-trung-tam', label: 'Tồn kho & hao hụt', icon: ChefHat, group: 'Kho bếp trung tâm', permission: 'view_btt_inventory', allowedRoles: OPERATION_ROLES },
  { href: '/doi-chieu-btt-cua-hang', label: 'Xuất BTT → CH', icon: Scale, group: 'Kho bếp trung tâm', permission: 'view_transfer', allowedRoles: OPERATION_ROLES },

  // TÀI CHÍNH
  { href: '/tong-quan', label: 'Tổng quan', icon: BarChart3, group: 'Tài chính', permission: 'view_dashboard', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/dong-tien', label: 'Dòng tiền', icon: DollarSign, group: 'Tài chính', permission: 'view_cashflow', allowedRoles: OPERATION_ROLES },
  { href: '/can-doi', label: 'Cân đối', icon: Scale, group: 'Tài chính', permission: 'view_balance', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/du-toan', label: 'Dự toán', icon: ClipboardList, group: 'Tài chính', permission: 'view_forecast', allowedRoles: FULL_FINANCE_ROLES },

  // LƯƠNG & NHÂN SỰ
  { href: '/luong-nhan-su/cham-cong', label: 'Chấm công', icon: CalendarDays, group: 'Lương & nhân sự', permission: 'view_dashboard', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/luong-nhan-su/tam-ung', label: 'Tạm ứng / thưởng phạt', icon: Wallet, group: 'Lương & nhân sự', permission: 'view_dashboard', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/luong-nhan-su/bang-luong', label: 'Bảng lương', icon: FileText, group: 'Lương & nhân sự', permission: 'view_dashboard', allowedRoles: FULL_FINANCE_ROLES },

  // BÁO CÁO QUẢN TRỊ
  { href: '/bao-cao/ngay', label: 'Báo cáo ngày', icon: FileText, group: 'Báo cáo quản trị', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },
  { href: '/bao-cao/tuan', label: 'Báo cáo tuần', icon: CalendarDays, group: 'Báo cáo quản trị', permission: 'view_pnl', allowedRoles: FULL_FINANCE_ROLES },
  { href: '/bao-cao/thang', label: 'Báo cáo tháng', icon: BarChart3, group: 'Báo cáo quản trị', permission: 'view_pnl', allowedRoles: FULL_FINANCE_ROLES },

  // TÀI LIỆU
  { href: '/tai-lieu/quy-trinh', label: 'Quy trình & Checklist', icon: BookOpen, group: 'Tài liệu', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },
  { href: '/tai-lieu/tinh-huong', label: 'Tình huống phát sinh', icon: AlertTriangle, group: 'Tài liệu', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },
  { href: '/tai-lieu/bieu-mau', label: 'Biểu mẫu & Báo cáo mẫu', icon: FileSpreadsheet, group: 'Tài liệu', permission: 'view_dashboard', allowedRoles: OPERATION_ROLES },

  // HỆ THỐNG
  { href: '/he-thong/nguoi-dung', label: 'Người dùng', icon: Users, group: 'Hệ thống', permission: 'view_settings', allowedRoles: ['CEO', 'Admin'] },
  { href: '/he-thong/cua-hang', label: 'Cửa hàng', icon: Store, group: 'Hệ thống', permission: 'view_settings', allowedRoles: ['CEO', 'Admin'] },
  { href: '/he-thong/phan-quyen', label: 'Phân quyền', icon: Lock, group: 'Hệ thống', permission: 'view_settings', allowedRoles: ['CEO', 'Admin'] },
];

export const navigationGroups: NavigationGroup[] = [
  'Trang chủ',
  'Doanh thu',
  'Kho cửa hàng',
  'Kho bếp trung tâm',
  'Tài chính',
  'Lương & nhân sự',
  'Báo cáo quản trị',
  'Tài liệu',
  'Hệ thống'
];
