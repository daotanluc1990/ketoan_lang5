import { getDataStore } from '@/lib/data-store';
import { SHEET_NAMES } from '@/lib/google-sheets/sheet-names';
import { writeAuditLog } from '@/lib/audit/audit-log';
import { AUDIT_EVENTS } from '@/lib/audit/audit-events';
import { buildDashboardReport } from '@/lib/reports/report-aggregator';
import { sendCeoWeeklyCloseMessage } from '@/lib/bot/ceo-telegram';
import { buildBttInventoryReport, buildBttTransferReport, buildStandardLossReport, buildStockLossReport, buildStoreInventoryReport, buildWasteReport } from './report-engines';

type CloseStatus = 'Đủ điều kiện chốt' | 'Chưa đủ điều kiện chốt';

type CloseInput = {
  periodCode: string;
  branch?: string;
  actor: string;
  note?: string;
  force?: boolean;
};

function hasBlockingStatus(status: string) {
  return ['Cảnh báo', 'Nguy hiểm', 'Chưa đủ dữ liệu', 'Cần đối chiếu'].includes(status);
}

function metricValue(metrics: Array<{ label: string; value: string }>, label: string) {
  return metrics.find((metric) => metric.label === label)?.value ?? '—';
}

function nowIso() {
  return new Date().toISOString();
}

function closeId(periodCode: string, branch: string) {
  return `CLOSE-${periodCode}-${branch}-${Date.now()}`.replace(/\s+/g, '-');
}

export async function buildWeeklyClosePreview(input: Omit<CloseInput, 'actor'> & { actor?: string }) {
  const branch = input.branch ?? 'Toàn hệ thống';
  const dashboard = await buildDashboardReport({});
  const storeInventory = await buildStoreInventoryReport();
  const bttInventory = await buildBttInventoryReport();
  const transfer = await buildBttTransferReport();
  const waste = await buildWasteReport();
  const standardLoss = await buildStandardLossReport();
  const stockLoss = await buildStockLossReport();

  const checks = [
    { code: 'DATA_MASTER', label: 'Tổng quan kế toán', status: dashboard.hasRealData ? (dashboard.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu', detail: dashboard.missingSources.length ? `Thiếu: ${dashboard.missingSources.join(', ')}` : 'Đã đọc nguồn chính' },
    { code: 'STORE_INVENTORY', label: 'Kho cửa hàng', status: storeInventory.status, detail: metricValue(storeInventory.metrics, 'Dòng XNT') },
    { code: 'BTT_INVENTORY', label: 'Kho Bếp Trung Tâm', status: bttInventory.status, detail: metricValue(bttInventory.metrics, 'Dòng XNT BTT') },
    { code: 'BTT_TRANSFER', label: 'Đối chiếu BTT - Cửa hàng', status: transfer.status, detail: metricValue(transfer.metrics, 'SL lệch tạm') },
    { code: 'WASTE', label: 'Hàng hủy', status: waste.status, detail: metricValue(waste.metrics, 'Tổng giá trị hủy') },
    { code: 'STANDARD_LOSS', label: 'Hao hụt / Vượt định mức', status: standardLoss.status, detail: metricValue(standardLoss.metrics, 'Giá trị vượt') },
    { code: 'STOCK_LOSS', label: 'Thất thoát tồn kho', status: stockLoss.status, detail: metricValue(stockLoss.metrics, 'Giá trị thất thoát') }
  ];

  const blockingChecks = checks.filter((check) => hasBlockingStatus(check.status));
  const status: CloseStatus = blockingChecks.length ? 'Chưa đủ điều kiện chốt' : 'Đủ điều kiện chốt';
  const snapshot = {
    periodCode: input.periodCode,
    branch,
    generatedAt: nowIso(),
    status,
    totals: dashboard.totals,
    executiveKpis: dashboard.executiveKpis,
    moduleMetrics: {
      storeInventory: storeInventory.metrics,
      bttInventory: bttInventory.metrics,
      transfer: transfer.metrics,
      waste: waste.metrics,
      standardLoss: standardLoss.metrics,
      stockLoss: stockLoss.metrics
    },
    checks
  };

  return {
    ok: true,
    periodCode: input.periodCode,
    branch,
    status,
    canClose: status === 'Đủ điều kiện chốt',
    blockingChecks,
    checks,
    snapshot
  };
}

export async function confirmWeeklyClose(input: CloseInput) {
  const preview = await buildWeeklyClosePreview(input);
  if (!preview.canClose && !input.force) {
    await writeAuditLog({ eventType: AUDIT_EVENTS.WEEKLY_CLOSE_REJECTED, actor: input.actor, target: input.periodCode, after: preview, note: input.note });
    return {
      ok: false,
      error: {
        code: 'WEEKLY_CLOSE_BLOCKED',
        message: 'Chưa đủ điều kiện chốt báo cáo tuần.',
        blockingChecks: preview.blockingChecks
      },
      preview
    };
  }

  const store = getDataStore();
  const id = closeId(input.periodCode, preview.branch);
  const closedAt = nowIso();
  const botResult = await sendCeoWeeklyCloseMessage(preview.snapshot, id).catch((error) => ({ ok: false, skipped: false, message: error instanceof Error ? error.message : 'Không gửi được bot.' }));
  const row = {
    'Mã chốt': id,
    'Kỳ báo cáo': input.periodCode,
    'Chi nhánh': preview.branch,
    'Người chốt': input.actor,
    'Thời gian chốt': closedAt,
    'Trạng thái dữ liệu': preview.status,
    'Chốt cưỡng bức': !preview.canClose && input.force ? 'Có' : 'Không',
    'Số lỗi chặn': preview.blockingChecks.length,
    'Gửi CEO/Bot': botResult.ok ? 'Đã gửi' : botResult.skipped ? 'Chưa cấu hình' : 'Gửi lỗi',
    'Snapshot JSON': JSON.stringify(preview.snapshot),
    'Ghi chú': `${input.note ?? ''}${input.note ? ' · ' : ''}${botResult.message}`
  };

  await store.append(SHEET_NAMES.LICH_SU_CHOT_BAO_CAO, [row]);
  await writeAuditLog({ eventType: AUDIT_EVENTS.WEEKLY_CLOSE_CONFIRMED, actor: input.actor, target: id, after: { row, botResult }, note: input.note });

  return {
    ok: true,
    closeId: id,
    closedAt,
    row,
    botResult,
    preview
  };
}
