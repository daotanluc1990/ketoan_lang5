import { V7ModulePage } from '@/components/dashboard/V7ModulePage';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const dynamic = 'force-dynamic';

export default function CongNoPage() {
  return (
    <V7ModulePage
      title="Công nợ"
      description="Theo dõi công nợ nhà cung cấp, phát sinh tăng/giảm, nợ cuối kỳ và trạng thái đối chiếu."
      statusWhenData="Cần đối chiếu"
      sheets={[{ name: SHEET_NAMES.DL_CONG_NO, label: 'Công nợ NCC' }]}
      primaryHeaders={['Ngày', 'Chi nhánh', 'Nhà cung cấp/Đối tượng', 'Nhóm công nợ', 'Phải trả', 'Đã trả', 'Còn phải trả', 'Đến hạn', 'Quá hạn', 'Trạng thái', 'Ghi chú']}
      notes={[
        ['Liên kết', 'Công nợ cần đối chiếu với sổ quỹ và nhập NCC', 'Cần kiểm'],
        ['Quá hạn', 'Khoản quá hạn phải cảnh báo', 'Cần kiểm'],
        ['Dữ liệu', 'Đọc từ DL_CONG_NO', 'Đạt']
      ]}
    />
  );
}
