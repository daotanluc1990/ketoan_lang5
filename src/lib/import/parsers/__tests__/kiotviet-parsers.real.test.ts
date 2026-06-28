import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { isKiotVietWasteReport, isKiotVietInventoryReport, isKiotVietDebtReport, parseKiotVietWasteReport, parseKiotVietInventoryReport, parseKiotVietDebtReport } from '../kiotviet-parsers';

const DOWNLOADS = 'C:/Users/luc/Downloads';
const hasFile = (name: string) => {
  try { return fs.existsSync(path.join(DOWNLOADS, name)); } catch { return false; }
};

const readInput = (name: string) => ({ filename: name, buffer: fs.readFileSync(path.join(DOWNLOADS, name)) });

describe('KiotViet parsers — file thật', () => {
  describe('Xuất Hủy.xlsx', () => {
    it.skipIf(!hasFile('Xuất Hủy.xlsx'))('phát hiện + phân loại BTT→CH vs hủy thật', () => {
      const input = readInput('Xuất Hủy.xlsx');
      expect(isKiotVietWasteReport(input, 'ProductByDamageItem')).toBe(true);
      const result = parseKiotVietWasteReport(input);
      console.log('Xuất Hủy:', result.loaiDuLieu, result.rows.length, 'dòng');
      console.log('Warnings:', result.warnings);
      expect(result.rows.length).toBeGreaterThan(0);
      // Phải có cột Loại giao dịch
      const first = result.rows[0];
      expect(first.data['Loại giao dịch']).toBeDefined();
      // Sườn 723kg + Gạo 700kg phải là "xuat-btt-cho-ch"
      const suon = result.rows.find((r) => String(r.data['Tên hàng']).includes('Sườn'));
      if (suon) expect(suon.data['Loại giao dịch']).toBe('xuat-btt-cho-ch');
      const gao = result.rows.find((r) => String(r.data['Tên hàng']).includes('Gạo'));
      if (gao) expect(gao.data['Loại giao dịch']).toBe('xuat-btt-cho-ch');
      // Phân sheet đúng
      const btt = result.rows.filter((r) => r.data['Loại giao dịch'] === 'xuat-btt-cho-ch');
      const that = result.rows.filter((r) => r.data['Loại giao dịch'] === 'huy-that');
      console.log(`Phân loại: Xuất BTT→CH=${btt.length}, Hủy thật=${that.length}`);
    });
  });

  describe('TỒN KHO BẾP TRUNG TÂM.xlsx', () => {
    it.skipIf(!hasFile('TỒN KHO BẾP TRUNG TÂM.xlsx'))('đọc được merge cells + skip dòng tổng', () => {
      const input = readInput('TỒN KHO BẾP TRUNG TÂM.xlsx');
      expect(isKiotVietInventoryReport(input, 'ProducInOutStock')).toBe(true);
      const result = parseKiotVietInventoryReport(input);
      console.log('Tồn BTT:', result.loaiDuLieu, result.rows.length, 'dòng');
      expect(result.rows.length).toBeGreaterThan(0);
      // Phải có Mã hàng + Tồn thực tế (đọc được qua merge cells)
      const first = result.rows[0];
      expect(String(first.data['Mã hàng'] || first.data['Tên hàng']).length).toBeGreaterThan(0);
      expect(first.data['Tồn thực tế']).toBeDefined();
      // Không chứa dòng tổng "SL mặt hàng"
      const summary = result.rows.find((r) => String(r.data['Mã hàng']).toLowerCase().includes('sl mat hang'));
      expect(summary).toBeUndefined();
      console.log('Sample:', first.data['Mã hàng'], first.data['Tên hàng'], 'Tồn:', first.data['Tồn thực tế']);
    });
  });

  describe('Công nợ.xlsx', () => {
    it.skipIf(!hasFile('Công nợ.xlsx'))('map Ghi nợ/Ghi có → phát sinh tăng/giảm', () => {
      const input = readInput('Công nợ.xlsx');
      expect(isKiotVietDebtReport(input, 'BigByLiabilitiesReport')).toBe(true);
      const result = parseKiotVietDebtReport(input);
      console.log('Công nợ:', result.loaiDuLieu, result.rows.length, 'dòng');
      expect(result.rows.length).toBeGreaterThan(0);
      const first = result.rows[0];
      expect(first.data['Tên nhà cung cấp']).toBeDefined();
      expect(first.data['Nợ đầu kỳ']).toBeDefined();
      expect(first.data['Phát sinh tăng']).toBeDefined();
      expect(first.data['Nợ cuối kỳ']).toBeDefined();
      console.log('Sample:', first.data['Tên nhà cung cấp'], 'Nợ đầu:', first.data['Nợ đầu kỳ'], 'Tăng:', first.data['Phát sinh tăng']);
    });
  });
});
