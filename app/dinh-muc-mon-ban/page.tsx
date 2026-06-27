import { V7ModulePage } from '@/components/dashboard/V7ModulePage';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const dynamic = 'force-dynamic';

export default function DinhMucMonBanPage() {
  return (
    <V7ModulePage
      title="Định mức món bán"
      description="Quản lý món bán, nguyên vật liệu và công thức định mức để quy đổi món bán ra tiêu hao lý thuyết."
      statusWhenData="Cần đối chiếu"
      sheets={[
        { name: SHEET_NAMES.DM_MON_BAN, label: 'Danh mục món bán' },
        { name: SHEET_NAMES.DM_NGUYEN_VAT_LIEU, label: 'Danh mục nguyên vật liệu' },
        { name: SHEET_NAMES.DM_CONG_THUC_CHE_BIEN, label: 'Công thức chế biến' },
        { name: SHEET_NAMES.DM_DON_GIA_NVL, label: 'Đơn giá NVL' }
      ]}
      primaryHeaders={['Mã món', 'Tên món', 'Nhóm món', 'Mã NVL', 'Tên NVL', 'Định mức', 'ĐVT', 'Hao hụt hợp lệ', 'Kho áp dụng', 'Hiệu lực từ ngày', 'Trạng thái']}
      notes={[
        ['Master data', 'Mọi thay đổi định mức cần ngày hiệu lực', 'Cần kiểm'],
        ['Giá vốn', 'Đơn giá NVL dùng để quy tiền thất thoát/vượt định mức', 'Đạt'],
        ['Dữ liệu', 'Đọc từ danh mục V7', 'Đạt']
      ]}
    />
  );
}
