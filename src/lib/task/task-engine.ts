/**
 * Task engine — sinh task kế toán tự động từ V7 engine results.
 *
 * Task không nhập tay. App tự phát hiện vấn đề (tồn âm, thiếu file,
 * lệch tiền...) và tạo task cho kế toán xử lý.
 */

export type MucDo = 'Xanh' | 'Vàng' | 'Cam' | 'Đỏ';
export type TrangThaiTask = 'Chưa xử lý' | 'Đang xử lý' | 'Chờ xác nhận' | 'Hoàn thành' | 'Quá hạn';

export type KeToanTask = {
  ma: string;
  ngayTao: string;
  module: string;
  loai: string;
  noiDung: string;
  nguonPhatSinh: string;
  mucDo: MucDo;
  nguoiPT: string;
  deadline: string;
  trangThai: TrangThaiTask;
  ghiChu?: string;
};

/**
 * Context từ V7 engines — truyền vào để sinh task.
 */
export type TaskContext = {
  missingSources: string[];
  tonAmCount: number;
  tonAmItems?: string[];
  lechTienMat?: number;
  chiChuaPL?: number;
  congNoQuaHan?: number;
  congNoQuaHanItems?: string[];
  bttChuaXacNhan?: number;
  huyBatThuong?: number;
  baoCaoTre?: number;
  dataQualityScore?: number;
  fileLoi?: number;
  thatThoatValue?: number;
  vuotDinhMucValue?: number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Sinh danh sách task từ context (V7 engine results).
 * Mỗi rule kiểm tra 1 điều kiện và tạo task tương ứng.
 */
export function generateTasks(ctx: TaskContext): KeToanTask[] {
  const tasks: KeToanTask[] = [];
  const ngay = today();
  let seq = 1;

  const add = (loai: string, noiDung: string, nguon: string, mucDo: MucDo, nguoiPT: string, deadline: string, ghiChu?: string) => {
    tasks.push({
      ma: `TASK-${ngay.replace(/-/g, '')}-${String(seq++).padStart(3, '0')}`,
      ngayTao: ngay,
      module: nguon,
      loai,
      noiDung,
      nguonPhatSinh: nguon,
      mucDo,
      nguoiPT,
      deadline,
      trangThai: 'Chưa xử lý',
      ghiChu,
    });
  };

  // Rule 1: Thiếu nguồn dữ liệu
  for (const src of ctx.missingSources ?? []) {
    add('IMPORT_THIEU', `Bổ sung file ${src}`, src, 'Đỏ', 'Kế toán', ngay, `Nguồn ${src} chưa có. Chặn chốt báo cáo.`);
  }

  // Rule 2: Tồn âm
  if ((ctx.tonAmCount ?? 0) > 0) {
    const items = ctx.tonAmItems?.length ? ` (${ctx.tonAmItems.join(', ')})` : '';
    add('TON_AM', `Kiểm kho ${ctx.tonAmCount} mặt hàng tồn âm${items}`, 'Kho cửa hàng', 'Đỏ', 'Kế toán kho + Trưởng ca', ngay, 'Kiểm nhập/xuất/bán/hủy/kiểm kê. Yêu cầu giải trình nếu vẫn lệch.');
  }

  // Rule 3: Lệch tiền mặt
  if (ctx.lechTienMat && Math.abs(ctx.lechTienMat) > 100000) {
    add('LECH_TIEN', `Đối soát lệch tiền mặt ${Math.abs(ctx.lechTienMat).toLocaleString('vi-VN')}đ`, 'Sổ quỹ', 'Cam', 'Kế toán doanh thu', ngay);
  }

  // Rule 4: Chi chưa phân loại
  if ((ctx.chiChuaPL ?? 0) > 0) {
    add('CHI_CHUA_PL', `Phân loại chi phí chưa gán nhóm (${ctx.chiChuaPL!.toLocaleString('vi-VN')}đ)`, 'Sổ quỹ', ctx.chiChuaPL! > 10000000 ? 'Cam' : 'Vàng', 'Kế toán tài chính', ngay);
  }

  // Rule 5: Công nợ quá hạn
  if ((ctx.congNoQuaHan ?? 0) > 0) {
    const ncc = ctx.congNoQuaHanItems?.length ? ` (${ctx.congNoQuaHanItems.join(', ')})` : '';
    add('CONG_NO_QUA_HAN', `Rà công nợ quá hạn ${ctx.congNoQuaHan!.toLocaleString('vi-VN')}đ${ncc}`, 'Công nợ', 'Đỏ', 'Kế toán tài chính', ngay, 'Lập kế hoạch thanh toán.');
  }

  // Rule 6: BTT xuất chưa xác nhận
  if ((ctx.bttChuaXacNhan ?? 0) > 0) {
    add('BTT_CHUA_XAC_NHAN', `Trưởng ca xác nhận ${ctx.bttChuaXacNhan} phiếu nhận hàng từ BTT`, 'Đối chiếu BTT→CH', 'Cam', 'Trưởng ca', ngay);
  }

  // Rule 7: Hủy bất thường
  if ((ctx.huyBatThuong ?? 0) > 0) {
    add('HUY_BAT_THUONG', `Giải trình ${ctx.huyBatThuong} phiếu hủy bất thường`, 'Hàng hủy', 'Cam', 'Kế toán kho', ngay, 'Bổ sung lý do/ảnh/chứng từ.');
  }

  // Rule 8: Báo cáo trễ
  if ((ctx.baoCaoTre ?? 0) > 0) {
    add('BAO_CAO_TRE', `Gửi ${ctx.baoCaoTre} báo cáo trễ hạn`, 'Báo cáo quản trị', 'Cam', 'Kế toán tổng hợp', ngay);
  }

  // Rule 9: File import lỗi
  if ((ctx.fileLoi ?? 0) > 0) {
    add('FILE_LOI', `Sửa ${ctx.fileLoi} file import lỗi`, 'Import', 'Đỏ', 'Kế toán', ngay, 'Sửa file nguồn rồi upload lại.');
  }

  // Rule 10: Data quality thấp
  if ((ctx.dataQualityScore ?? 100) < 80) {
    add('DATA_QUALITY', `Data Quality Score ${ctx.dataQualityScore}/100 — cần cải thiện`, 'Data Quality', 'Cam', 'Kế toán', ngay, 'Kiểm tra nguồn thiếu, file lỗi, cảnh báo đỏ.');
  }

  // Rule 11: Thất thoát lớn
  if ((ctx.thatThoatValue ?? 0) > 1000000) {
    add('THAT_THOAT_LON', `Giải trình thất thoát ${ctx.thatThoatValue!.toLocaleString('vi-VN')}đ`, 'Thất thoát tồn kho', 'Đỏ', 'Kế toán kho', ngay, 'Yêu cầu giải trình + kiểm kê lại.');
  }

  // Rule 12: Vượt định mức
  if ((ctx.vuotDinhMucValue ?? 0) > 500000) {
    add('VUOT_DINH_MUC', `Kiểm tra vượt định mức ${ctx.vuotDinhMucValue!.toLocaleString('vi-VN')}đ`, 'Hao hụt', 'Cam', 'Trưởng ca', ngay, 'Kiểm thao tác, công thức, người/ca làm.');
  }

  return tasks;
}

/**
 * Phân loại task theo trạng thái.
 */
export function filterByStatus(tasks: KeToanTask[], status: TrangThaiTask | 'Tất cả' | 'Hôm nay' | 'Quá hạn'): KeToanTask[] {
  const todayStr = today();
  if (status === 'Tất cả') return tasks;
  if (status === 'Hôm nay') return tasks.filter((t) => t.deadline === todayStr && t.trangThai !== 'Hoàn thành');
  if (status === 'Quá hạn') return tasks.filter((t) => t.deadline < todayStr && t.trangThai !== 'Hoàn thành' && t.trangThai !== 'Chờ xác nhận');
  return tasks.filter((t) => t.trangThai === status);
}

/**
 * Đếm task theo mức độ.
 */
export function countByMucDo(tasks: KeToanTask[]): Record<MucDo, number> {
  return tasks.reduce(
    (acc, t) => { acc[t.mucDo]++; return acc; },
    { 'Xanh': 0, 'Vàng': 0, 'Cam': 0, 'Đỏ': 0 } as Record<MucDo, number>,
  );
}
