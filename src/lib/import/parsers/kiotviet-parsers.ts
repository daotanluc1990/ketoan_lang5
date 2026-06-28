import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { createRecordKey } from '@/lib/import/record-key';
import { createRowHash } from '@/lib/import/row-hash';
import type { ImportRow } from '@/lib/import/import-types';
import type { ExcelFileInput, ParsedExcelImport } from './import-parser-types';
import { readWorkbook, rowsAsMatrix, sheetToRows, toDateString, toNumber, getYear, getMonth, getWeekCode, inferBranch } from './excel-utils';

/**
 * Parsers chuyên dụng cho báo cáo KiotViet export.
 *
 * KiotViet thường xuất Excel có:
 * - Dòng tiêu đề report ở R0-R2
 * - Merge cells "Từ ngày ... đến ngày ..." ở R3-R5
 * - "Chi nhánh: ..." ở R5-R6
 * - Header cột thực ở R6-R9 (không cố định)
 * - Dòng tổng "SL mặt hàng: N" xen giữa data
 *
 * Các parser chuẩn (v7-parsers, excel-parsers) chỉ đọc header ở R0 nên bỏ lỡ
 * cấu trúc này. Module này tìm header thật bằng cách scan các dòng đầu.
 */

function normalize(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function makeImportRow(sheetDich: string, keyParts: Array<string | number | undefined | null>, data: Record<string, unknown>, errors: string[] = []): ImportRow {
  return { maDongDuLieu: createRecordKey([sheetDich, ...keyParts]), dauVetDong: createRowHash(data), sheetDich, data, errors };
}

function withSource(data: Record<string, unknown>, filename: string, rowIndex: number): Record<string, unknown> {
  return { ...data, 'Tên file nguồn': filename, 'Dấu vết dòng': `${filename}#${rowIndex}`, 'Trạng thái dữ liệu': 'Preview', 'Ngày import': new Date().toISOString() };
}

/**
 * Scan 12 dòng đầu để tìm dòng chứa header thật.
 * Trả về index dòng header có nhiều cột match nhất với expectedHeaders.
 */
function findHeaderRow(matrix: unknown[][], expectedHeaders: string[]): number {
  let best = { index: 0, score: 0 };
  matrix.slice(0, 14).forEach((row, index) => {
    const normalizedRow = row.map((cell) => normalize(cell));
    const score = expectedHeaders.reduce((acc, expected) => {
      const target = normalize(expected);
      return acc + (normalizedRow.some((cell) => cell.includes(target) || target.includes(cell)) ? 1 : 0);
    }, 0);
    // Header dòng phải có nhiều cột có giá trị (không phải dòng metadata)
    const nonEmptyCells = row.filter((cell) => String(cell ?? '').trim()).length;
    if (score >= 2 && score > best.score && nonEmptyCells >= 3) best = { index, score };
  });
  return best.score >= 2 ? best.index : -1;
}

/**
 * Bỏ dòng tổng "SL mặt hàng: N" / "Tổng cộng" / "SL NCC: N".
 */
function isSummaryRow(row: Record<string, unknown>): boolean {
  const code = normalize(row['Mã hàng'] ?? row['Mã nhà cung cấp'] ?? row['Mã NVL'] ?? '');
  const name = normalize(row['Tên hàng'] ?? row['Tên nhà cung cấp'] ?? row['Tên NVL'] ?? '');
  return (
    code.includes('sl mat hang') ||
    code.includes('tong cong') ||
    code.includes('tong ') ||
    code.includes('sl ncc') ||
    name.includes('tong cong') ||
    name.includes('tong ')
  );
}

/**
 * Trích ngày từ các dòng metadata phía trên header.
 * Ví dụ: "Từ ngày 01/06/2026 đến ngày 07/06/2026" hoặc "Ngày lập 25/06/2026".
 */
function extractDateRange(matrix: unknown[][]): { tuNgay: string; denNgay: string } {
  let tuNgay = '';
  let denNgay = '';
  for (const row of matrix.slice(0, 12)) {
    for (const cell of row) {
      const text = String(cell ?? '');
      const rangeMatch = text.match(/từ\s+ngày\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})\s+(?:đến\s+ngày\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{4})?/i);
      if (rangeMatch) {
        tuNgay = toDateString(rangeMatch[1]);
        if (rangeMatch[2]) denNgay = toDateString(rangeMatch[2]);
      }
      const ngayLapMatch = text.match(/ngày lập\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i);
      if (ngayLapMatch && !denNgay) denNgay = toDateString(ngayLapMatch[1]);
    }
  }
  return { tuNgay, denNgay };
}

/**
 * Trích chi nhánh từ dòng metadata.
 * Ví dụ: "Chi nhánh: Bếp trung tâm" hoặc "Chi nhánh: Chi nhánh | Xuất hủy | Cửa hàng: Làng Nguyễn Văn tăng".
 */
function extractBranchAndStore(matrix: unknown[][]): { branch: string; store: string } {
  let branch = '';
  let store = '';
  for (const row of matrix.slice(0, 12)) {
    for (const cell of row) {
      const text = String(cell ?? '');
      const chiNhanhMatch = text.match(/chi nhánh:\s*([^|,\n]+)/i);
      if (chiNhanhMatch && !branch) branch = chiNhanhMatch[1].trim();
      const cuaHangMatch = text.match(/cửa hàng:\s*([^|,\n]+)/i);
      if (cuaHangMatch && !store) store = cuaHangMatch[1].trim();
    }
  }
  return { branch, store };
}

// ============================================================
// DETECTION — nhận diện loại báo cáo KiotViet
// ============================================================

/**
 * Nhận diện file "Xuất hủy" KiotViet.
 * Filename chứa "xuất hủy" / "xuat huy" HOẶC sheet name = ProductByDamageItem.
 */
export function isKiotVietWasteReport(input: ExcelFileInput, sheetName: string): boolean {
  const file = normalize(input.filename);
  const sheet = normalize(sheetName);
  return file.includes('xuat huy') || file.includes('xuat huỷ') || sheet.includes('productbydamage') || sheet.includes('damage item');
}

/**
 * Nhận diện file "Tồn kho" KiotViet (ProducInOutStock).
 */
export function isKiotVietInventoryReport(input: ExcelFileInput, sheetName: string): boolean {
  const file = normalize(input.filename);
  const sheet = normalize(sheetName);
  return file.includes('ton kho') || file.includes('xuat nhap ton') || sheet.includes('producinoutstock') || sheet.includes('inout stock');
}

/**
 * Nhận diện file "Công nợ" KiotViet (BigByLiabilitiesReport).
 */
export function isKiotVietDebtReport(input: ExcelFileInput, sheetName: string): boolean {
  const file = normalize(input.filename);
  const sheet = normalize(sheetName);
  return file.includes('cong no') || file.includes('no ncc') || sheet.includes('liabilities') || sheet.includes('bigbyliab');
}

// ============================================================
// PARSERS
// ============================================================

/**
 * Phát hiện nghiệp vụ thật của file "Xuất hủy":
 *
 * KiotViet ghi "Xuất hủy" nhưng có thể là:
 * - Hủy thật (thức ăn hư, quá hạn) — SL nhỏ, lý do rõ
 * - Xuất BTT → Cửa hàng (chuyển hàng nội bộ) — SL lớn, NVL thô
 *
 * Heuristic:
 * - Nếu tổng SL hủy > 200 HOẶC mặt hàng là NVL thô (gạo, sườn, thịt, dầu,
 *   nước mắm, bao bì...) → gần như chắc chắn là "Xuất BTT → CH"
 * - Ngược lại → hủy thật
 */
function classifyWasteTransaction(tenHang: string, soLuong: number, lyDo: string): 'xuat-btt-cho-ch' | 'huy-that' {
  const name = normalize(tenHang);
  const reason = normalize(lyDo);
  // NVL thô / bao bì thường là chuyển kho, không phải hủy
  const rawMaterialPatterns = ['gao', 'suon', 'thit', 'dau an', 'nuoc mam', 'mat ong', 'duong', 'mieng', 'hop xop', 'ly ', 'tui ', 'giay an', 'mang ep', 'thanh ly'];
  const isRawMaterial = rawMaterialPatterns.some((pattern) => name.includes(pattern));
  // Hủy thật thường có lý do rõ: hư, cháy, quá hạn, hỏng, lỗi
  const realWasteReasons = ['hu ', 'chay', 'qua han', 'hong', 'loi', 'hu/hong', 'thuc an hu', 'com hu', 'canh hu'];
  const hasRealWasteReason = realWasteReasons.some((pattern) => reason.includes(pattern));
  // Quyết định
  if (hasRealWasteReason && !(isRawMaterial && soLuong > 100)) return 'huy-that';
  if (isRawMaterial && soLuong > 100) return 'xuat-btt-cho-ch';
  if (soLuong > 500) return 'xuat-btt-cho-ch';
  return 'huy-that';
}

/**
 * Parse file Xuất hủy KiotViet.
 * Tự phân loại mỗi dòng: "Xuất BTT → CH" hoặc "Hủy thật" để tránh sai P&L.
 *
 * Cấu trúc KiotViet ProductByDamageItem:
 * R0: | Ngày lập ... |
 * R1: | | Báo cáo hàng hóa xuất hủy |
 * R2: | Từ ngày ... đến ngày ... |
 * R3: | Chi nhánh: ... |
 * R4: | Xuất hủy | | Cửa hàng | Làng NVT |
 * R5: | Mã hàng | | Tên hàng | | | | Tổng SL hủy | Tổng giá trị |  ← header (cột lệch do merge)
 * R6: | (trống) |
 * R7: | SL mặt hàng: 22 | ... | 13633.6 | 104179086 |  ← dòng tổng
 * R8+: data rows
 *
 * Đặc điểm: header có cột trống xen kẽ (merge cells), data rows dùng col 1/3/6/7.
 * Phải map theo index cột cố định thay vì theo tên header.
 */
export function parseKiotVietWasteReport(input: ExcelFileInput): ParsedExcelImport {
  const { workbook, firstSheet, firstSheetName } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const { tuNgay, denNgay } = extractDateRange(matrix);
  const { branch, store } = extractBranchAndStore(matrix);
  const ngay = denNgay || tuNgay || new Date().toISOString().slice(0, 10);
  const rows: ImportRow[] = [];

  // Tìm dòng header "Mã hàng" để biết data bắt đầu từ đâu.
  // Data rows: col[1]=Mã hàng, col[3]=Tên hàng, col[6]=Tổng SL hủy, col[7]=Tổng giá trị.
  let dataStartIndex = -1;
  for (let i = 0; i < Math.min(14, matrix.length); i++) {
    const row = matrix[i];
    if (normalize(row[1]).includes('ma hang') || normalize(row[1]).includes('ma hang hoa')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  if (dataStartIndex < 0) dataStartIndex = 7; // fallback: data thường bắt đầu R7-R8

  // Đọc data rows từ dataStartIndex, bỏ qua dòng tổng "SL mặt hàng"
  for (let i = dataStartIndex; i < matrix.length; i++) {
    const row = matrix[i];
    // Map theo index cột cố định (KiotViet merge cell pattern)
    const maHang = String(row[1] ?? '').trim();
    const tenHang = String(row[3] ?? '').trim();
    // SL có thể ở col 6 hoặc col 7 tùy file; thử cả hai
    const soLuong = toNumber(row[6]) || toNumber(row[7]);
    const giaTri = toNumber(row[7]) || toNumber(row[8]);
    // Bỏ dòng tổng và dòng trống
    const allText = normalize(maHang + ' ' + tenHang);
    if (!maHang && !tenHang) continue;
    if (allText.includes('sl mat hang') || allText.includes('tong cong') || allText.includes('sl ncc')) continue;
    // Đảm bảo Mã hàng thật sự là mã (SP..., không phải text tổng)
    if (allText.includes('sl mat hang')) continue;

    const lyDo = String(row[9] ?? row[10] ?? '').trim();
    const loaiGiaoDich = classifyWasteTransaction(tenHang, soLuong, lyDo);
    const sheetDich = loaiGiaoDich === 'xuat-btt-cho-ch' ? SHEET_NAMES.DL_XUAT_BTT_CHO_CUA_HANG : SHEET_NAMES.DL_HUY_HANG_CUA_HANG;
    const data = withSource(
      {
        'Ngày': ngay,
        'Năm': getYear(ngay),
        'Tháng': getMonth(ngay),
        'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
        'Mã tuần': getWeekCode(ngay),
        'Cửa hàng': inferBranch(store || branch) || 'NVT',
        'Chi nhánh': inferBranch(store || branch) || 'NVT',
        'Kho': branch && normalize(branch).includes('bep') ? 'Bếp Trung Tâm' : 'Cửa hàng',
        'Mã hàng': maHang,
        'Tên hàng': tenHang,
        'Số lượng': soLuong,
        'Số lượng xuất': soLuong,
        'Số lượng nhận': soLuong,
        'ĐVT': String(row[5] ?? row[4] ?? '').trim(),
        'Đơn giá': giaTri && soLuong ? giaTri / soLuong : 0,
        'Giá trị hủy': giaTri,
        'Lý do': lyDo || (loaiGiaoDich === 'xuat-btt-cho-ch' ? 'Chuyển hàng nội bộ (KiotViet ghi Xuất hủy)' : 'Hủy theo ghi nhận'),
        'Loại giao dịch': loaiGiaoDich,
        'Loại giao dịch (hiển thị)': loaiGiaoDich === 'xuat-btt-cho-ch' ? 'Xuất BTT → CH' : 'Hủy thật',
        'Mã phiếu': `KV-HUY-${ngay.replace(/-/g, '')}-${rows.length + 1}`,
        'Trạng thái': loaiGiaoDich === 'xuat-btt-cho-ch' ? 'Cần kế toán xác nhận' : 'Chờ duyệt'
      },
      input.filename,
      i + 1
    );
    rows.push(makeImportRow(sheetDich, [ngay, String(data['Cửa hàng'] ?? ''), maHang || tenHang], data, []));
  }

  const xuatBttCount = rows.filter((r) => r.data['Loại giao dịch'] === 'xuat-btt-cho-ch').length;
  const huyThatCount = rows.filter((r) => r.data['Loại giao dịch'] === 'huy-that').length;
  const warnings: string[] = [];
  if (xuatBttCount > 0) warnings.push(`⚠ Phát hiện ${xuatBttCount} dòng có dấu hiệu "Xuất BTT → CH" (SL lớn/NVL thô). Đã tách sang DL_XUAT_BTT_CHO_CUA_HANG. Kế toán cần xác nhận đây là chuyển hàng nội bộ, không phải hủy thật.`);
  if (huyThatCount > 0) warnings.push(`${huyThatCount} dòng phân loại là hủy thật → DL_HUY_HANG_CUA_HANG.`);
  if (!rows.length) warnings.push('Không đọc được dòng dữ liệu. Kiểm tra cấu trúc file KiotViet.');

  return {
    tenFile: input.filename,
    loaiDuLieu: rows.length ? 'KiotViet Xuất hủy (tự phân loại)' : 'KiotViet Xuất hủy (không đọc được)',
    chiNhanh: inferBranch(store || branch) || 'NVT',
    rows,
    warnings
  };
}

/**
 * Parse file Tồn kho KiotViet (ProducInOutStock).
 * Bỏ qua merge cells R0-R8, đọc header ở dòng có "Mã hàng".
 */
export function parseKiotVietInventoryReport(input: ExcelFileInput): ParsedExcelImport {
  const { workbook, firstSheet, firstSheetName } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const expectedHeaders = ['Mã hàng', 'Tên hàng', 'Tồn đầu kỳ', 'SL Nhập', 'SL Xuất', 'Tồn cuối kỳ'];
  const headerIndex = findHeaderRow(matrix, expectedHeaders);
  const { denNgay } = extractDateRange(matrix);
  const { branch } = extractBranchAndStore(matrix);
  const isBtt = normalize(branch).includes('bep') || normalize(input.filename).includes('bep trung tam') || normalize(input.filename).includes('btt');
  const ngay = denNgay || new Date().toISOString().slice(0, 10);
  const sheetDich = isBtt ? SHEET_NAMES.DL_XNT_BEP_TRUNG_TAM : SHEET_NAMES.DL_XNT_CUA_HANG;
  const rows: ImportRow[] = [];

  if (headerIndex >= 0) {
    const dataRows = sheetToRows(firstSheet, headerIndex).filter((row) => !isSummaryRow(row));
    dataRows.forEach((row, idx) => {
      const maHang = String(row['Mã hàng'] ?? '').trim();
      const tenHang = String(row['Tên hàng'] ?? row['Tên hàng hóa'] ?? row['Tên nguyên liệu'] ?? '').trim();
      if (!maHang && !tenHang) return;
      const tonDau = toNumber(row['Tồn đầu kỳ'] ?? row['Tồn đầu']);
      const giaTriDau = toNumber(row['Giá trị đầu kỳ']);
      const slNhap = toNumber(row['SL Nhập'] ?? row['Nhập'] ?? row['Nhập NCC']);
      const giaTriNhap = toNumber(row['Giá trị nhập'] ?? row['Giá trị nhập NCC']);
      const slXuat = toNumber(row['SL Xuất'] ?? row['Xuất'] ?? row['Xuất cửa hàng']);
      const giaTriXuat = toNumber(row['Giá trị xuất'] ?? row['Giá trị xuất cửa hàng']);
      const tonCuoi = toNumber(row['Tồn cuối kỳ'] ?? row['Tồn kho hiện tại'] ?? row['Tồn cuối']);
      const giaTriCuoi = toNumber(row['Giá trị cuối kỳ'] ?? row['Giá trị tồn cuối']);
      // Tồn lý thuyết = Đầu + Nhập - Xuất; Lệch = Cuối thực tế - Lý thuyết
      const tonLyThuyet = tonDau + slNhap - slXuat;
      const lech = tonCuoi - tonLyThuyet;
      const data = withSource(
        {
          'Ngày': ngay,
          'Năm': getYear(ngay),
          'Tháng': getMonth(ngay),
          'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
          'Mã tuần': getWeekCode(ngay),
          'Chi nhánh': isBtt ? 'BTT' : inferBranch(branch) || 'NVT',
          'Kho': isBtt ? 'Bếp Trung Tâm' : 'Cửa hàng',
          'Mã hàng': maHang,
          'Tên hàng': tenHang,
          'ĐVT': String(row['ĐVT'] ?? row['Đơn vị tính'] ?? '').trim(),
          'Tồn đầu': tonDau,
          'Giá trị tồn đầu': giaTriDau,
          'Nhập NCC': slNhap,
          'Giá trị nhập NCC': giaTriNhap,
          'Xuất cửa hàng': slXuat,
          'Giá trị xuất cửa hàng': giaTriXuat,
          'Tồn lý thuyết': tonLyThuyet,
          'Tồn thực tế': tonCuoi,
          'Giá trị tồn thực tế': giaTriCuoi,
          'Lệch': lech,
          'Giá trị lệch': lech < 0 ? Math.abs(lech) * (giaTriCuoi && tonCuoi ? giaTriCuoi / tonCuoi : 0) : 0,
          'Trạng thái': lech < -1 ? 'Cảnh báo' : 'Đạt'
        },
        input.filename,
        headerIndex + idx + 2
      );
      rows.push(makeImportRow(sheetDich, [ngay, String(data['Kho'] ?? ''), maHang || tenHang], data, []));
    });
  }

  return {
    tenFile: input.filename,
    loaiDuLieu: isBtt ? 'KiotViet Tồn kho BTT' : 'KiotViet Tồn kho cửa hàng',
    chiNhanh: isBtt ? 'BTT' : 'NVT',
    rows,
    warnings: rows.length ? [] : ['Không đọc được dòng dữ liệu. Kiểm tra cấu trúc file KiotViet.']
  };
}

/**
 * Parse file Công nợ KiotViet (BigByLiabilitiesReport).
 * Map "Ghi nợ" → phát sinh tăng, "Ghi có" → phát sinh giảm (trả NCC).
 */
export function parseKiotVietDebtReport(input: ExcelFileInput): ParsedExcelImport {
  const { workbook, firstSheet, firstSheetName } = readWorkbook(input.buffer);
  const matrix = rowsAsMatrix(firstSheet);
  const expectedHeaders = ['Mã nhà cung cấp', 'Tên nhà cung cấp', 'Nợ đầu kỳ', 'Ghi nợ', 'Ghi có'];
  const headerIndex = findHeaderRow(matrix, expectedHeaders);
  const { denNgay } = extractDateRange(matrix);
  const ngay = denNgay || new Date().toISOString().slice(0, 10);
  const rows: ImportRow[] = [];

  if (headerIndex >= 0) {
    const dataRows = sheetToRows(firstSheet, headerIndex).filter((row) => !isSummaryRow(row));
    dataRows.forEach((row, idx) => {
      const maNcc = String(row['Mã nhà cung cấp'] ?? row['Mã NCC'] ?? '').trim();
      const tenNcc = String(row['Tên nhà cung cấp'] ?? row['Tên NCC'] ?? '').trim();
      if (!maNcc && !tenNcc) return;
      const noDau = toNumber(row['Nợ đầu kỳ'] ?? row['Dư đầu kỳ']);
      const ghiNo = toNumber(row['Ghi nợ'] ?? row['Phát sinh tăng'] ?? row['Phát sinh no']); // NCC giao thêm hàng
      const ghiCo = toNumber(row['Ghi có'] ?? row['Phát sinh giảm'] ?? row['Phát sinh co'] ?? row['Đã trả']); // Trả NCC
      const noCuoi = toNumber(row['Nợ cuối kỳ'] ?? noDau + ghiNo - ghiCo);
      const data = withSource(
        {
          'Ngày': ngay,
          'Năm': getYear(ngay),
          'Tháng': getMonth(ngay),
          'Tuần': getWeekCode(ngay).split('-W')[1] ?? '',
          'Mã tuần': getWeekCode(ngay),
          'Mã nhà cung cấp': maNcc,
          'Tên nhà cung cấp': tenNcc,
          'Nợ đầu kỳ': noDau,
          'Phát sinh tăng': ghiNo,
          'Phát sinh giảm': -ghiCo,
          'Đã trả': ghiCo,
          'Nợ cuối kỳ': noCuoi,
          'Ngày đối chiếu': ngay,
          'Trạng thái': noCuoi > 0 ? 'Cần đối chiếu' : 'Đã thanh toán'
        },
        input.filename,
        headerIndex + idx + 2
      );
      rows.push(makeImportRow(SHEET_NAMES.DL_CONG_NO, [ngay, maNcc || tenNcc], data, []));
    });
  }

  return {
    tenFile: input.filename,
    loaiDuLieu: 'KiotViet Công nợ NCC',
    chiNhanh: 'NVT',
    rows,
    warnings: rows.length ? [] : ['Không đọc được dòng dữ liệu. Kiểm tra cấu trúc file KiotViet.']
  };
}
