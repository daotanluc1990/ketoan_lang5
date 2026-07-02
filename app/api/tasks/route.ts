import { NextRequest, NextResponse } from 'next/server';
import { buildAccountingOverview, buildStoreInventoryReport, buildCashflowReport, buildBalanceReport, buildWasteReport, buildStandardLossReport, buildStockLossReport } from '@/lib/reports/v7/report-engines';
import { generateTasks, filterByStatus, countByMucDo, type TaskContext } from '@/lib/task/task-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'Tất cả';

  try {
    // Đọc V7 engines để lấy context
    const [overview, storeInv, cashflow, balance, waste, standardLoss, stockLoss] = await Promise.all([
      buildAccountingOverview(),
      buildStoreInventoryReport().catch(() => null),
      buildCashflowReport().catch(() => null),
      buildBalanceReport().catch(() => null),
      buildWasteReport().catch(() => null),
      buildStandardLossReport().catch(() => null),
      buildStockLossReport().catch(() => null),
    ]);

    // Extract context từ engine results
    const ctx: TaskContext = {
      missingSources: overview.readiness.rows
        .filter((r) => r.some((c) => String(c).includes('Chưa đủ dữ liệu')))
        .map((r) => r[0] || ''),
      tonAmCount: storeInv?.primary.rows.filter((r) => r.some((c) => String(c).includes('tồn âm') || String(c).includes('Nguy hiểm'))).length ?? 0,
      tonAmItems: storeInv?.primary.rows
        .filter((r) => r.some((c) => String(c).includes('tồn âm') || String(c).includes('Nguy hiểm')))
        .map((r) => String(r[3] || r[4] || ''))
        .slice(0, 5),
      chiChuaPL: cashflow?.metrics.find((m) => m.label.includes('chưa')) ? parseFloat(cashflow.metrics.find((m) => m.label.includes('chưa'))!.value.replace(/[^\d]/g, '')) || 0 : 0,
      congNoQuaHan: balance?.metrics.find((m) => m.label.includes('Phải trả')) ? parseFloat(balance.metrics.find((m) => m.label.includes('Phải trả'))!.value.replace(/[^\d]/g, '')) || 0 : 0,
      bttChuaXacNhan: 0, // cần buildBttTransferReport
      huyBatThuong: waste?.metrics.find((m) => m.label.includes('bất thường')) ? parseInt(waste.metrics.find((m) => m.label.includes('bất thường'))!.value) || 0 : 0,
      dataQualityScore: overview.metrics.find((m) => m.label.includes('Data Quality')) ? parseInt(overview.metrics.find((m) => m.label.includes('Data Quality'))!.value) || 100 : 100,
      thatThoatValue: stockLoss?.metrics.find((m) => m.label.includes('thất thoát')) ? parseFloat(stockLoss.metrics.find((m) => m.label.includes('thất thoát'))!.value.replace(/[^\d]/g, '')) || 0 : 0,
      vuotDinhMucValue: standardLoss?.metrics.find((m) => m.label.includes('vượt')) ? parseFloat(standardLoss.metrics.find((m) => m.label.includes('vượt'))!.value.replace(/[^\d]/g, '')) || 0 : 0,
    };

    const allTasks = generateTasks(ctx);
    const filtered = filterByStatus(allTasks, status as any);
    const counts = countByMucDo(allTasks);

    return NextResponse.json({
      ok: true,
      data: {
        tasks: filtered,
        total: allTasks.length,
        counts,
        context: { missingSources: ctx.missingSources, tonAmCount: ctx.tonAmCount, chiChuaPL: ctx.chiChuaPL },
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: { message: 'Không sinh được task: ' + (e as Error).message } }, { status: 500 });
  }
}
