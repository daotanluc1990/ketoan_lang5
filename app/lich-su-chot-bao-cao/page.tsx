import { V7ModulePage } from '@/components/dashboard/V7ModulePage';
import { WeeklyClosePanel } from '@/components/dashboard/WeeklyClosePanel';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';

export const dynamic = 'force-dynamic';

export default function LichSuChotBaoCaoPage() {
  return (
    <div className="space-y-3">
      <WeeklyClosePanel />
      <V7ModulePage
        title="Lịch sử chốt báo cáo"
        description="Lưu snapshot kỳ báo cáo đã chốt, người chốt, thời gian chốt, ghi chú và trạng thái gửi CEO/Bot."
        statusWhenData="Tốt"
        sheets={[
          { name: SHEET_NAMES.LICH_SU_CHOT_BAO_CAO, label: 'Lịch sử chốt báo cáo' },
          { name: SHEET_NAMES.TONG_QUAN_KE_TOAN, label: 'Tổng quan kế toán' },
          { name: SHEET_NAMES.IMPORT_LICH_SU, label: 'Lịch sử import' }
        ]}
        primaryHeaders={['Mã chốt', 'Kỳ báo cáo', 'Người chốt', 'Thời gian chốt', 'Trạng thái dữ liệu', 'Gửi CEO/Bot', 'Số lỗi chặn', 'Chốt đặc biệt', 'Ghi chú']}
        notes={[
          ['Khóa kỳ', 'Kỳ đã chốt nên có icon khóa và audit log', 'Cần kiểm'],
          ['Snapshot', 'Lưu số liệu tại thời điểm chốt', 'Đạt'],
          ['Dữ liệu', 'Đọc từ LICH_SU_CHOT_BAO_CAO và TONG_QUAN_KE_TOAN', 'Đạt']
        ]}
      />
    </div>
  );
}
