import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import type { ImportPreviewResult } from '@/lib/import/import-types';

export type ClosedPeriodMatch = {
  periodCode: string;
  branch: string;
  closeId: string;
  closedAt: string;
  status: string;
};

function text(value: unknown) {
  return String(value ?? '').trim();
}

function key(value: unknown) {
  return text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isActiveCloseRow(row: Record<string, unknown>) {
  const status = key(row['Trạng thái dữ liệu'] ?? row['Trạng thái']);
  if (status.includes('hoan tac')) return false;
  return Boolean(text(row['Mã chốt']) || text(row['Snapshot JSON']) || text(row['Thời gian chốt']));
}

function sameBranch(left: string, right: string) {
  const a = key(left || 'Toàn hệ thống');
  const b = key(right || 'Toàn hệ thống');
  return a === b || a === 'toan he thong' || b === 'toan he thong';
}

export function getPreviewPeriodCodes(preview: ImportPreviewResult) {
  const periods = new Set<string>();
  for (const row of preview.rows) {
    const period = text(row.data['Mã tuần'] ?? row.data['Tuần'] ?? row.data['Kỳ báo cáo']);
    if (period) periods.add(period);
  }
  return [...periods];
}

export async function findClosedPeriodMatches(preview: ImportPreviewResult): Promise<ClosedPeriodMatch[]> {
  const periods = getPreviewPeriodCodes(preview);
  if (!periods.length) return [];
  const branch = preview.chiNhanh || 'Toàn hệ thống';
  const rows = await getDataStore().read(SHEET_NAMES.LICH_SU_CHOT_BAO_CAO);
  const matches: ClosedPeriodMatch[] = [];
  for (const row of rows) {
    const periodCode = text(row['Kỳ báo cáo'] ?? row['Mã tuần'] ?? row['Tuần']);
    if (!periodCode || !periods.includes(periodCode)) continue;
    const closeBranch = text(row['Chi nhánh'] ?? 'Toàn hệ thống');
    if (!sameBranch(closeBranch, branch)) continue;
    if (!isActiveCloseRow(row)) continue;
    matches.push({
      periodCode,
      branch: closeBranch || 'Toàn hệ thống',
      closeId: text(row['Mã chốt']),
      closedAt: text(row['Thời gian chốt']),
      status: text(row['Trạng thái dữ liệu'] ?? row['Trạng thái'])
    });
  }
  return matches;
}

export function describeClosedPeriodMatches(matches: ClosedPeriodMatch[]) {
  return matches.map((match) => `${match.periodCode} · ${match.branch} · ${match.closeId || 'đã chốt'}`).join('; ');
}
