import fs from 'node:fs/promises';
import path from 'node:path';
import type { DataRow, DataStore } from './store-interface';

const DATA_DIR = path.join(process.cwd(), '.data');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(sheetName: string) {
  return path.join(DATA_DIR, `${sheetName}.json`);
}

export const localJsonStore: DataStore = {
  async read(sheetName: string): Promise<DataRow[]> {
    await ensureDir();
    try {
      const raw = await fs.readFile(filePath(sheetName), 'utf-8');
      return JSON.parse(raw) as DataRow[];
    } catch {
      return [];
    }
  },
  async append(sheetName: string, rows: DataRow[]) {
    const current = await this.read(sheetName);
    await this.replace(sheetName, [...current, ...rows]);
  },
  async replace(sheetName: string, rows: DataRow[]) {
    await ensureDir();
    await fs.writeFile(filePath(sheetName), JSON.stringify(rows, null, 2), 'utf-8');
  },
  async markRowsByImportId({ sheetName, maLanImport, actor, reason }) {
    const current = await this.read(sheetName);
    let matchedRows = 0;
    let updatedRows = 0;
    const next = current.map((row) => {
      if (String(row['Mã lần import'] ?? '') !== maLanImport) return row;
      matchedRows += 1;
      if (String(row['Trạng thái dữ liệu'] ?? '') === 'Đã hoàn tác') return row;
      updatedRows += 1;
      return {
        ...row,
        'Trạng thái dữ liệu': 'Đã hoàn tác',
        'Ghi chú hoàn tác': reason,
        'Ngày hoàn tác': new Date().toISOString(),
        'Người hoàn tác': actor
      };
    });
    if (updatedRows > 0) await this.replace(sheetName, next);
    return { sheetName, matchedRows, updatedRows };
  }
};
