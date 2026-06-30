export type SheetSchema = { sheetName: string; columns: string[]; description: string };

export const GOOGLE_SHEETS_SCHEMA: SheetSchema[] = [
  {
    sheetName: 'DL_DOANH_THU_APP',
    description: 'Dữ liệu gốc từ file tổng hợp doanh thu app.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Ngày', 'Năm', 'Tháng', 'Tuần', 'Mã tuần', 'Chi nhánh', 'Kênh bán', 'Tài khoản app', 'Doanh thu gộp', 'Tổng khấu trừ/phí', 'Doanh thu ròng', 'Số đơn', 'Giá vốn', 'Giá trị đơn trung bình', 'Tỷ lệ phí', 'Tên file nguồn', 'Dấu vết file', 'Dấu vết dòng', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'DL_DOANH_THU_CUA_HANG',
    description: 'Dữ liệu gốc từ file báo cáo doanh thu tại cửa hàng.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Ngày', 'Năm', 'Tháng', 'Tuần', 'Mã tuần', 'Chi nhánh', 'Ca bán', 'Tổng phần', 'Số hộp', 'Số dĩa', 'Tiền mặt', 'MoMo/chuyển khoản', 'Chi tiền mặt', 'Tổng doanh thu theo file', 'Doanh thu bán hàng thực', 'Tiền mặt còn lại sau chi', 'Tên file nguồn', 'Dấu vết file', 'Dấu vết dòng', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'DL_SO_QUY',
    description: 'Dữ liệu gốc từ file sổ quỹ.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Ngày', 'Năm', 'Tháng', 'Tuần', 'Mã tuần', 'Chi nhánh', 'Loại giao dịch', 'Nhóm thu/chi', 'Diễn giải', 'Số tiền', 'Phương thức', 'Số dư sau giao dịch', 'Người tạo', 'Tên file nguồn', 'Dấu vết dòng', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'DL_TON_KHO',
    description: 'Dữ liệu gốc từ file tồn kho.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Ngày kiểm kê', 'Chi nhánh', 'Mã hàng', 'Tên hàng', 'Nhóm hàng', 'Đơn vị tính', 'Tồn kho', 'Giá trị tồn', 'Trạng thái tồn âm', 'Định mức tồn tối thiểu', 'Định mức tồn tối đa', 'Tên file nguồn', 'Dấu vết dòng', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'DL_THAT_THOAT_NVL',
    description: 'Dữ liệu gốc từ file báo cáo thất thoát NVL tuần.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Chi nhánh', 'Năm', 'Tuần', 'Mã tuần', 'Tuần bắt đầu', 'Tuần kết thúc', 'Tên nguyên vật liệu', 'Loại nguyên vật liệu', 'Đơn vị tính', 'Tồn đầu kỳ', 'Nhập trong kỳ', 'Nhập từ bếp trung tâm', 'Nhập từ nhà cung cấp', 'Tiêu hao lý thuyết theo bán hàng', 'Tồn cuối kỳ lý thuyết', 'Tồn cuối kỳ thực tế', 'Tồn cuối từ sổ', 'Chênh lệch số lượng', 'Loại chênh lệch', 'Đơn giá', 'Giá trị chênh lệch', 'Tỷ lệ thất thoát', 'Định mức cho phép', 'Mức vượt định mức', 'Trạng thái', 'Ghi chú', 'Nguyên nhân AI đề xuất', 'Hành động đề xuất', 'Người phụ trách', 'Deadline xử lý', 'Tên file nguồn', 'Dấu vết dòng', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'DL_CONG_NO',
    description: 'Dữ liệu công nợ để mở rộng báo cáo cân đối.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Ngày', 'Năm', 'Tháng', 'Tuần', 'Mã tuần', 'Chi nhánh', 'Nhà cung cấp/Đối tượng', 'Nhóm công nợ', 'Phải trả', 'Đã trả', 'Còn phải trả', 'Đến hạn', 'Quá hạn', 'Cần CEO duyệt', 'Ghi chú', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'DL_THU_MUA',
    description: 'Dữ liệu thu mua để phân tích biến động giá.',
    columns: ['Mã dòng dữ liệu', 'Mã lần import', 'Ngày', 'Năm', 'Tháng', 'Tuần', 'Mã tuần', 'Chi nhánh', 'Mặt hàng', 'NCC', 'Giá tuần trước', 'Giá tuần này', 'Chênh lệch giá', 'Số lượng mua', 'Tác động tiền', 'Đánh giá', 'Ghi chú', 'Trạng thái dữ liệu', 'Ngày import', 'Người import']
  },
  {
    sheetName: 'CEO_DASHBOARD',
    description: 'Sheet báo cáo tổng quan CEO.',
    columns: ['Khu vực', 'Chỉ số', 'Giá trị', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']
  },
  {
    sheetName: 'P&L_TUAN',
    description: 'Sheet báo cáo P&L tuần.',
    columns: ['Nhóm', 'Chỉ số', 'Tuần này', 'Tuần trước', 'Chênh lệch', 'Tỷ lệ', 'Đánh giá', 'Ghi chú']
  },
  {
    sheetName: 'DONG_TIEN_TUAN',
    description: 'Sheet báo cáo dòng tiền tuần.',
    columns: ['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Đã đối chiếu chưa', 'Ghi chú']
  },
  {
    sheetName: 'CAN_DOI_RUT_GON',
    description: 'Sheet báo cáo cân đối rút gọn.',
    columns: ['Nhóm', 'Chỉ số', 'Số tiền', 'Tuần trước', 'Chênh lệch', 'Trạng thái', 'Ghi chú']
  },
  {
    sheetName: 'DU_TOAN_TUAN_TOI',
    description: 'Sheet dự toán tuần tới.',
    columns: ['Nhóm dự toán', 'Chỉ số', 'Thực tế tuần vừa rồi', 'Dự toán tuần tới', 'Tăng/giảm', 'Cần CEO duyệt không', 'Lý do/Ghi chú']
  },
  {
    sheetName: 'THAT_THOAT_CHI_TIET',
    description: 'Sheet báo cáo thất thoát chi tiết.',
    columns: ['Hạng', 'NVL', 'ĐVT', 'Chênh SL', 'Giá trị lệch', 'Tỷ lệ thất thoát', 'Định mức', 'Vượt định mức', 'Trạng thái', 'Hành động']
  },
  {
    sheetName: 'BAN_LAM_VIEC_KE_TOAN',
    description: 'Checklist công việc kế toán.',
    columns: ['Việc cần làm', 'Trạng thái', 'Người phụ trách', 'Deadline', 'File nguồn', 'Lỗi/Cảnh báo', 'Hành động']
  },
  {
    sheetName: 'IMPORT_LICH_SU',
    description: 'Lịch sử import + tracking dòng lỗi/trùng/lệch (gộp từ IMPORT_DONG_LOI/TRUNG/LECH).',
    columns: ['Loại sự kiện', 'Mã lần import', 'Ngày import', 'Người import', 'Chi nhánh', 'Tuần', 'Số file', 'Tổng dòng mới', 'Tổng dòng trùng', 'Tổng dòng lệch', 'Tổng dòng lỗi', 'Trạng thái', 'Ghi chú']
  },

  {
    sheetName: 'AUDIT_LOG',
    description: 'Audit log hành động hệ thống.',
    columns: ['ID', 'Thời gian', 'Người dùng', 'Vai trò', 'Hành động', 'Đối tượng', 'Trước', 'Sau', 'Ghi chú', 'IP/Thiết bị']
  },
  {
    sheetName: 'CAI_DAT',
    description: 'Cài đặt hệ thống: ngưỡng cảnh báo + bot báo cáo (gộp từ CAI_DAT_BOT + CAI_DAT_NGUONG).',
    columns: ['Loại cài đặt', 'Chỉ số', 'Tốt', 'Cảnh báo', 'Nguy hiểm', 'Đơn vị', 'Giá trị', 'Áp dụng cho', 'Ghi chú', 'Trạng thái']
  }
];
