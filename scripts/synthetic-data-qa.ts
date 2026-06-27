import { buildDashboardReport } from '../src/lib/reports/report-aggregator';
import { SHEET_NAMES } from '../src/lib/google-sheets/sheet-names';
import { localJsonStore } from '../src/lib/data-store/local-json-store';
import { GOOGLE_SHEETS_SCHEMA } from '../src/lib/google-sheets/schema';

process.env.DATA_STORE = 'local';

const IMPORT_ID = 'QA-SYNTHETIC-V4-8';
const now = new Date().toISOString();

function withBase(sheetName: string, row: Record<string, unknown>) {
  return {
    'Mã dòng dữ liệu': `${sheetName}|${IMPORT_ID}|${Math.random().toString(36).slice(2)}`,
    'Mã lần import': IMPORT_ID,
    'Trạng thái dữ liệu': 'Đã xác nhận',
    'Ngày import': now,
    'Người import': 'synthetic-qa',
    ...row
  };
}

const fixtures: Record<string, Record<string, unknown>[]> = {
  [SHEET_NAMES.DL_SO_QUY]: [
    withBase(SHEET_NAMES.DL_SO_QUY, { Ngày: '2026-06-10', Năm: 2026, Tháng: 6, Tuần: 24, 'Mã tuần': '2026-W24', 'Chi nhánh': 'NVT', 'Loại giao dịch': 'Thu', 'Nhóm thu/chi': 'Doanh thu', 'Diễn giải': 'Phiếu thu Doanh thu tiền mặt', 'Số tiền': 10000000, 'Tên file nguồn': 'synthetic-cashbook.xlsx' }),
    withBase(SHEET_NAMES.DL_SO_QUY, { Ngày: '2026-06-10', Năm: 2026, Tháng: 6, Tuần: 24, 'Mã tuần': '2026-W24', 'Chi nhánh': 'NVT', 'Loại giao dịch': 'Chi', 'Nhóm thu/chi': 'Khác', 'Diễn giải': 'Phiếu chi Tiền trả NCC bất thường', 'Số tiền': -15000000, 'Tên file nguồn': 'synthetic-cashbook.xlsx' })
  ],
  [SHEET_NAMES.DL_DOANH_THU_CUA_HANG]: [
    withBase(SHEET_NAMES.DL_DOANH_THU_CUA_HANG, { Ngày: '2026-06-10', Năm: 2026, Tháng: 6, Tuần: 24, 'Mã tuần': '2026-W24', 'Chi nhánh': 'NVT', 'Ca bán': 'Ca sáng', 'Tổng phần': 200, 'Tiền mặt': 6000000, 'MoMo/chuyển khoản': 4000000, 'Chi tiền mặt': 500000, 'Doanh thu bán hàng thực': 10000000, 'Tên file nguồn': 'synthetic-store.xlsx' })
  ],
  [SHEET_NAMES.DL_DOANH_THU_APP]: [
    withBase(SHEET_NAMES.DL_DOANH_THU_APP, { Ngày: '2026-06-10', Năm: 2026, Tháng: 6, Tuần: 24, 'Mã tuần': '2026-W24', 'Chi nhánh': 'NVT', 'Kênh bán': 'Grab', 'Doanh thu gộp': 12000000, 'Tổng khấu trừ/phí': 3600000, 'Doanh thu ròng': 8400000, 'Số đơn': 180, 'Giá vốn': 4200000, 'Tên file nguồn': 'synthetic-app.xlsx' })
  ],
  [SHEET_NAMES.DL_TON_KHO]: [
    withBase(SHEET_NAMES.DL_TON_KHO, { 'Ngày kiểm kê': '2026-06-10', 'Chi nhánh': 'NVT', 'Mã hàng': 'NVL001', 'Tên hàng': 'Sườn cốt lết', 'Nhóm hàng': 'Nguyên liệu chính', 'Đơn vị tính': 'kg', 'Tồn kho': -2, 'Giá trị tồn': -200000, 'Trạng thái tồn âm': 'Tồn âm', 'Tên file nguồn': 'synthetic-stock.xlsx' })
  ],
  [SHEET_NAMES.DL_THAT_THOAT_NVL]: [
    withBase(SHEET_NAMES.DL_THAT_THOAT_NVL, { 'Chi nhánh': 'NVT', Năm: 2026, Tuần: 24, 'Mã tuần': '2026-W24', 'Tên nguyên vật liệu': 'Sườn cốt lết', 'Đơn vị tính': 'kg', 'Chênh lệch số lượng': 5, 'Đơn giá': 100000, 'Giá trị chênh lệch': 500000, 'Tỷ lệ thất thoát': 0.06, 'Trạng thái': 'Cảnh báo', 'Tên file nguồn': 'synthetic-loss.xlsx' })
  ],
  [SHEET_NAMES.DL_CONG_NO]: [
    withBase(SHEET_NAMES.DL_CONG_NO, { Ngày: '2026-06-10', Năm: 2026, Tháng: 6, Tuần: 24, 'Mã tuần': '2026-W24', 'Chi nhánh': 'NVT', 'Nhà cung cấp/Đối tượng': 'Công ty SiBa Food', 'Nhóm công nợ': 'Phải trả NCC', 'Phải trả': 12000000, 'Đã trả': 5000000, 'Còn phải trả': 7000000, 'Cần CEO duyệt': 'Không' })
  ],
  [SHEET_NAMES.DL_THU_MUA]: [
    withBase(SHEET_NAMES.DL_THU_MUA, { Ngày: '2026-06-10', Năm: 2026, Tháng: 6, Tuần: 24, 'Mã tuần': '2026-W24', 'Chi nhánh': 'NVT', 'Mặt hàng': 'Sườn cốt lết', NCC: 'Công ty Vĩnh Tân', 'Giá tuần trước': 92000, 'Giá tuần này': 98000, 'Chênh lệch giá': 6000, 'Số lượng mua': 50, 'Tác động tiền': 300000, 'Đánh giá': 'Tốt' })
  ],
  [SHEET_NAMES.IMPORT_LICH_SU]: [
    { 'Mã lần import': IMPORT_ID, 'Ngày import': now, 'Người import': 'synthetic-qa', 'Chi nhánh': 'NVT', Tuần: '2026-W24', 'Số file': 7, 'Tổng dòng mới': 8, 'Tổng dòng trùng': 0, 'Tổng dòng lệch': 0, 'Tổng dòng lỗi': 0, 'Trạng thái': 'Đã xác nhận', 'Ghi chú': 'Synthetic QA only' }
  ],
  [SHEET_NAMES.AUDIT_LOG]: []
};

async function clearFixtures() {
  for (const sheet of GOOGLE_SHEETS_SCHEMA) {
    await localJsonStore.replace(sheet.sheetName, []);
  }
}

async function main() {
  await clearFixtures();
  for (const [sheetName, rows] of Object.entries(fixtures)) {
    await localJsonStore.replace(sheetName, rows);
  }

  const report = await buildDashboardReport({ weekCode: '2026-W24', branch: 'NVT' });
  if (!report.hasRealData) throw new Error('Synthetic QA failed: report has no real data');
  if (report.sourceCounts.cashbook !== 2) throw new Error('Synthetic QA failed: cashbook count mismatch');
  if (report.totals.cashIn !== 10000000) throw new Error('Synthetic QA failed: cash in mismatch');
  if (report.totals.cashOut !== 15000000) throw new Error('Synthetic QA failed: cash out mismatch');
  if (!report.cashbookWarningRows.length) throw new Error('Synthetic QA failed: large expense warning missing');
  if (!report.lossTop5Rows.length) throw new Error('Synthetic QA failed: loss row missing');

  await clearFixtures();
  console.log('Synthetic QA OK: seeded all 7 source sheets locally, checked dashboard tabs, then cleared .data fixtures. Production Google Sheet was not touched.');
}

main().catch(async (error) => {
  await clearFixtures().catch(() => undefined);
  console.error(error);
  process.exit(1);
});
