/**
 * Nội dung module Tài liệu — lấy từ QUY_TRINH V1.1 + tình huống thực tế.
 * Mỗi tài liệu có metadata theo spec AI RAG.
 */

export type TaiLieu = {
  id: string;
  title: string;
  module: string;
  loai: 'Quy trình' | 'Checklist' | 'Tình huống' | 'Biểu mẫu' | 'Báo cáo mẫu';
  vaiTro: string[];
  moTa: string;
  noiDung: string[];
  nguoiPhuTrach: string;
  khiNaoBaoCeo: string;
};

export const quyTrinhChecklist: TaiLieu[] = [
  {
    id: 'QT001',
    title: 'Quy trình import dữ liệu hàng tuần',
    module: 'Nhập liệu',
    loai: 'Quy trình',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'Cách kế toán upload file dữ liệu vào app mỗi tuần.',
    noiDung: [
      'Bước 1: Kế toán chuẩn bị file: Doanh thu, Sổ quỹ, Tồn kho CH, Tồn kho BTT, Xuất hủy, Công nợ.',
      'Bước 2: Vào Nhập liệu & Import → Upload file.',
      'Bước 3: App kiểm tra: định dạng, cột bắt buộc, kỳ báo cáo, dữ liệu trùng/lệch.',
      'Bước 4: Xem preview: dòng hợp lệ, dòng lỗi, dòng trùng.',
      'Bước 5: Nếu đạt → Import vào Data Master. Nếu lỗi → sửa file nguồn → upload lại.',
      'Bước 6: Kiểm tra Tổng quan kế toán xem data đã đủ chưa.',
    ],
    nguoiPhuTrach: 'Kế toán',
    khiNaoBaoCeo: 'Khi file lỗi nghiêm trọng không sửa được trong ngày.',
  },
  {
    id: 'QT002',
    title: 'Quy trình chốt báo cáo tuần',
    module: 'Báo cáo quản trị',
    loai: 'Quy trình',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'Các bước từ import đến chốt và gửi báo cáo tuần cho CEO.',
    noiDung: [
      'Bước 1: Đã import đầy đủ: Doanh thu, Sổ quỹ, Kho CH, Kho BTT, Xuất BTT, Hủy, Công nợ.',
      'Bước 2: Xử lý task đỏ/vàng trên Bàn làm việc.',
      'Bước 3: Rà Tổng quan kế toán: DT, tiền, kho, thất thoát.',
      'Bước 4: Rà P&L Tuần + Dòng tiền + Cân đối.',
      'Bước 5: Nếu còn thiếu/lỗi/lệch → CHƯA chốt.',
      'Bước 6: Nếu đủ → Chốt báo cáo → Gửi CEO/Bot.',
    ],
    nguoiPhuTrach: 'Kế toán',
    khiNaoBaoCeo: 'Khi Data Quality < 80 hoặc có cảnh báo đỏ chưa xử lý.',
  },
  {
    id: 'CL001',
    title: 'Checklist kế toán hằng tuần (21 bước)',
    module: 'Báo cáo quản trị',
    loai: 'Checklist',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'Checklist đầy đủ 21 bước từ import đến gửi báo cáo.',
    noiDung: [
      '[ ] Đã import doanh thu cửa hàng',
      '[ ] Đã import doanh thu app',
      '[ ] Đã import sổ quỹ',
      '[ ] Đã import tồn kho cửa hàng',
      '[ ] Đã import tồn kho BTT',
      '[ ] Đã import xuất BTT cho cửa hàng',
      '[ ] Đã import hàng hủy cửa hàng',
      '[ ] Đã import hàng hủy BTT',
      '[ ] Đã import công nợ',
      '[ ] Đã kiểm tra chi BTT',
      '[ ] Đã xử lý chi chưa phân loại',
      '[ ] Đã kiểm tra tồn âm cửa hàng',
      '[ ] Đã kiểm tra tồn âm BTT',
      '[ ] Đã kiểm tra lệch BTT xuất và cửa hàng nhận',
      '[ ] Đã kiểm tra thất thoát lớn',
      '[ ] Đã rà P&L',
      '[ ] Đã rà dòng tiền',
      '[ ] Đã rà cân đối',
      '[ ] Đã ghi chú các điểm cần CEO biết',
      '[ ] Đã chốt báo cáo',
      '[ ] Đã gửi CEO/Bot',
    ],
    nguoiPhuTrach: 'Kế toán',
    khiNaoBaoCeo: 'Khi bất kỳ mục nào không đạt sau 2 lần rà.',
  },
  {
    id: 'QT003',
    title: 'Quy trình đối chiếu BTT → Cửa hàng',
    module: 'Kho bếp trung tâm',
    loai: 'Quy trình',
    vaiTro: ['CEO', 'Kế toán', 'Admin', 'Quản lý cửa hàng'],
    moTa: 'Cách đối chiếu hàng xuất từ Bếp Trung Tâm và cửa hàng nhận.',
    noiDung: [
      'Bước 1: BTT xuất hàng → ghi phiếu xuất (mã phiếu, SL, NVL).',
      'Bước 2: Cửa hàng nhận → xác nhận SL nhận thực tế.',
      'Bước 3: App đối chiếu: BTT xuất vs CH nhận. Nếu lệch → cảnh báo.',
      'Bước 4: Nếu lệch >0: kiểm tra giao thiếu, nhận thiếu, nhập sai, hao hụt vận chuyển.',
      'Bước 5: Yêu cầu giải trình nếu lệch lớn.',
      'Lưu ý: File "Xuất Hủy" KiotViet = Xuất BTT cho cửa hàng, KHÔNG phải hàng hủy.',
    ],
    nguoiPhuTrach: 'BTT + Cửa hàng',
    khiNaoBaoCeo: 'Khi lệch giá trị > 1.000.000đ hoặc chậm xác nhận > 2 ngày.',
  },
];

export const tinhHuong: TaiLieu[] = [
  {
    id: 'TH001',
    title: 'Tồn âm sườn tại cửa hàng',
    module: 'Kho cửa hàng',
    loai: 'Tình huống',
    vaiTro: ['CEO', 'Kế toán', 'Admin', 'Quản lý cửa hàng'],
    moTa: 'Khi kiểm kê phát hiện tồn âm (số âm) nguyên vật liệu.',
    noiDung: [
      '1. Kiểm tra nhập từ BTT có đủ không.',
      '2. Kiểm tra số lượng bán theo định mức.',
      '3. Kiểm tra hàng hủy có ghi nhận không.',
      '4. Kiểm tra kiểm kê thực tế.',
      '5. Nếu vẫn lệch → yêu cầu trưởng ca giải trình.',
      '6. Ghi chú lệch tồn vào báo cáo.',
    ],
    nguoiPhuTrach: 'Kế toán kho + Trưởng ca',
    khiNaoBaoCeo: 'Khi giá trị lệch > 1.500.000đ.',
  },
  {
    id: 'TH002',
    title: 'Chi phí chưa phân loại',
    module: 'Tài chính',
    loai: 'Tình huống',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'Khi có khoản chi trong sổ quỹ chưa rõ nhóm chi phí.',
    noiDung: [
      '1. Xem ghi chú/diễn giải khoản chi.',
      '2. Phân nhóm: NVL, Lương, Mặt bằng, Điện nước, Marketing, Bao bì, Khác.',
      '3. Nếu không rõ → hỏi người chi.',
      '4. Cập nhật nhóm vào ghi chú.',
      '5. Theo dõi tỷ lệ "Chi chưa phân loại" trên dashboard.',
    ],
    nguoiPhuTrach: 'Kế toán tài chính',
    khiNaoBaoCeo: 'Khi chi chưa PL > 10% tổng chi.',
  },
  {
    id: 'TH003',
    title: 'App giao hàng chưa về tiền',
    module: 'Doanh thu',
    loai: 'Tình huống',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'Khi tiền app (Grab/ShopeeFood/BeFood) chưa chuyển về tài khoản.',
    noiDung: [
      '1. Kiểm tra kỳ chuyển tiền của từng app (Grab: tuần, ShopeeFood: 2 lần/tuần).',
      '2. Đối soát doanh thu app vs tiền thực về trong sổ quỹ.',
      '3. Nếu quá hạn > 7 ngày → liên hệ đối tác app.',
      '4. Ghi nhận "Tiền app chưa về" trên dashboard.',
    ],
    nguoiPhuTrach: 'Kế toán doanh thu',
    khiNaoBaoCeo: 'Khi tiền app chưa về > 30.000.000đ hoặc quá hạn > 14 ngày.',
  },
  {
    id: 'TH004',
    title: 'File "Xuất Hủy" thực chất là xuất BTT',
    module: 'Kho bếp trung tâm',
    loai: 'Tình huống',
    vaiTro: ['CEO', 'Kế toán', 'Admin', 'Quản lý cửa hàng'],
    moTa: 'KiotViet ghi "Xuất Hủy" nhưng bản chất là xuất hàng nội bộ BTT → cửa hàng.',
    noiDung: [
      '1. App TỰ PHÂN LOẠI: nếu SL lớn hoặc NVL thô (gạo, sườn, thịt) → "Xuất BTT → CH".',
      '2. Nếu SL nhỏ + có lý do hư/cháy → "Hủy thật".',
      '3. Kế toán XÁC NHẬN phân loại khi xem preview.',
      '4. KHÔNG tính "Xuất BTT → CH" là hàng hủy trong P&L.',
    ],
    nguoiPhuTrach: 'Kế toán kho',
    khiNaoBaoCeo: 'Khi phát hiện phân loại sai ảnh hưởng P&L.',
  },
];

export const bieuMau: TaiLieu[] = [
  {
    id: 'BM001',
    title: 'Template Doanh thu cửa hàng',
    module: 'Doanh thu',
    loai: 'Biểu mẫu',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'File mẫu import doanh thu cửa hàng.',
    noiDung: [
      'Cột: Ngày, Chi nhánh, Kênh bán, Mã đơn, Mã món, Tên món, Nhóm món, Số lượng, Đơn giá, Thành tiền, Ca bán.',
      'File: TEMPLATE_DoanhThuCuaHang.xlsx (trong thư mục Downloads).',
      'Sheet đích: DL_DOANH_THU_CUA_HANG.',
    ],
    nguoiPhuTrach: 'Kế toán doanh thu',
    khiNaoBaoCeo: 'N/A',
  },
  {
    id: 'BM002',
    title: 'Template Định mức món bán',
    module: 'Kho cửa hàng',
    loai: 'Biểu mẫu',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'File mẫu công thức chế biến / định mức NVL.',
    noiDung: [
      'Cột: Mã món, Tên món, Mã NVL, Tên NVL, Định mức, ĐVT, Hao hụt hợp lệ (%), Kho áp dụng.',
      'File: TEMPLATE_DinhMucMonBan.xlsx.',
      'Sheet đích: DM_CONG_THUC_CHE_BIEN.',
    ],
    nguoiPhuTrach: 'Kế toán kho',
    khiNaoBaoCeo: 'N/A',
  },
  {
    id: 'BM003',
    title: 'Template Hao hụt hợp lệ',
    module: 'Kho cửa hàng',
    loai: 'Biểu mẫu',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'File mẫu tỷ lệ hao hụt hợp lệ theo NVL.',
    noiDung: [
      'Cột: Mã NVL, Tên NVL, Nhóm, ĐVT, Tỷ lệ hao hụt hợp lệ (%), Lý do, Người duyệt.',
      'File: TEMPLATE_HaoHutHopLe.xlsx.',
      'Sheet đích: DM_HAO_HUT_HOP_LE.',
    ],
    nguoiPhuTrach: 'CEO duyệt',
    khiNaoBaoCeo: 'Khi thay đổi tỷ lệ hao hụt > 5%.',
  },
  {
    id: 'BC001',
    title: 'Mẫu báo cáo tuần CEO',
    module: 'Báo cáo quản trị',
    loai: 'Báo cáo mẫu',
    vaiTro: ['CEO', 'Kế toán', 'Admin'],
    moTa: 'Mẫu nội dung báo cáo tuần gửi CEO qua Telegram bot.',
    noiDung: [
      '📊 Báo cáo P&L Tuần (XX/2026)',
      '• Doanh thu: XXXM ▲ X.X%',
      '• Giá vốn: XXXM ▲ X.X%',
      '• Lợi nhuận: XXXM ▲ X.X%',
      '• Dòng tiền: +XXXM',
      '• Thất thoát: XXXM',
      'Xem chi tiết tại ERP Mini',
    ],
    nguoiPhuTrach: 'Kế toán tổng hợp',
    khiNaoBaoCeo: 'Gửi mỗi thứ 2.',
  },
];

export const allTaiLieu = [...quyTrinhChecklist, ...tinhHuong, ...bieuMau];
