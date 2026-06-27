import { AiAgentPanel } from '@/components/dashboard/AiAgentPanel';
import { ChartCard } from '@/components/report/ChartCard';
import { MetricCard } from '@/components/report/MetricCard';
import { ReportTable } from '@/components/report/ReportTable';
import { Card, CardTitle } from '@/components/ui/Card';
import type { DashboardReport } from '@/lib/reports/report-aggregator';

function decisionRows(report: DashboardReport) {
  return [
    [
      '1',
      'Chốt báo cáo tuần',
      report.missingSources.length ? 'Chưa thể chốt' : 'Có thể chốt',
      report.missingSources.length ? `Thiếu ${report.missingSources.length} nguồn` : 'Đủ nguồn chính',
      report.missingSources.length ? 'Giao kế toán bổ sung dữ liệu' : 'CEO kiểm cảnh báo cuối rồi duyệt'
    ],
    [
      '2',
      'Độ tin cậy dữ liệu',
      report.hasRealData ? (report.missingSources.length ? 'Cần đối chiếu' : 'Tốt') : 'Chưa đủ dữ liệu',
      report.hasRealData ? report.message : 'Chưa có dữ liệu import thật',
      report.hasRealData ? 'Xem độ sẵn sàng dữ liệu' : 'Import dữ liệu thật'
    ],
    [
      '3',
      'Khoản chi lớn',
      report.cashbookWarningRows.length ? 'Cảnh báo' : 'Tốt',
      report.cashbookWarningRows.length ? `${report.cashbookWarningRows.length} khoản cần kiểm tra` : 'Chưa phát hiện khoản lớn bất thường',
      report.cashbookWarningRows.length ? 'Yêu cầu kế toán giải trình' : 'Theo dõi tiếp'
    ],
    [
      '4',
      'Thất thoát NVL',
      report.lossTop5Rows.length ? 'Cần kiểm' : 'Chưa đủ dữ liệu',
      report.lossTop5Rows[0]?.[0] ?? 'Chưa có dữ liệu thất thoát hợp lệ',
      report.lossTop5Rows.length ? 'Xử lý Top 5 NVL' : 'Import báo cáo thất thoát'
    ]
  ];
}

export function CeoCockpitPage({ report }: { report: DashboardReport }) {
  const primaryKpis = report.executiveKpis.slice(0, 8);
  return (
    <div className="space-y-3">
      <section className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-l-8 border-amber-500">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">CEO Cockpit · {report.dataMode}</p>
          <h3 className="mt-1 text-xl font-extrabold text-lang-brown">
            {report.hasRealData
              ? report.missingSources.length
                ? 'Có dữ liệu nhưng chưa nên chốt ngay'
                : 'Dữ liệu chính đã sẵn sàng để xem xét'
              : 'Chưa đủ dữ liệu để kết luận.'}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-black/60">{report.message}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className="rounded-xl bg-lang-cream px-2 py-2 text-lang-brown">Nguồn thiếu<br />{report.missingSources.length}</div>
            <div className="rounded-xl bg-lang-cream px-2 py-2 text-lang-brown">Chi lớn<br />{report.cashbookWarningRows.length}</div>
            <div className="rounded-xl bg-lang-cream px-2 py-2 text-lang-brown">Thất thoát<br />{report.lossTop5Rows.length}</div>
          </div>
        </Card>

        <Card>
          <CardTitle>Việc CEO cần xử lý ngay</CardTitle>
          <div className="mt-2">
            <ReportTable
              headers={['Ưu tiên', 'Việc', 'Kết luận', 'Bằng chứng', 'Hành động']}
              rows={decisionRows(report)}
              maxHeight="max-h-[260px]"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {primaryKpis.map((kpi) => (
          <MetricCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} trend={kpi.trend} status={kpi.status} compact />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Độ sẵn sàng dữ liệu</CardTitle>
          <div className="mt-2">
            <ReportTable headers={['Mảng', 'Trạng thái', 'Bằng chứng', 'Cách dùng']} rows={report.dataReadinessRows} maxHeight="max-h-[300px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>Cảnh báo Sổ quỹ — khoản chi lớn</CardTitle>
          <div className="mt-2">
            <ReportTable
              headers={['Hạng', 'Ngày', 'Nhóm', 'Diễn giải', 'Số tiền', 'Lý do', 'Việc cần làm']}
              rows={report.cashbookWarningRows.length ? report.cashbookWarningRows : [['—', '—', '—', 'Chưa có khoản chi vượt ngưỡng cảnh báo', '—', '—', 'Theo dõi tiếp']]}
              maxHeight="max-h-[300px]"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Doanh thu theo nguồn thật"
          description="Doanh thu chốt lấy từ app/cửa hàng. Sổ quỹ chỉ dùng để đối chiếu tiền đã về."
          items={[
            ...report.revenueByChannel.map((item) => ({ label: item.channel, value: item.value, caption: item.revenue })),
            ...(report.totals.cashbookRevenueIn > 0
              ? [{ label: 'Sổ quỹ: doanh thu đã thu', value: report.totals.cashbookRevenueIn, caption: report.executiveKpis.find((kpi) => kpi.label === 'Doanh thu thu qua sổ quỹ')?.value }]
              : [])
          ]}
        />
        <ChartCard
          title="Chất lượng dữ liệu"
          description="Số dòng đã ghi vào các sheet dữ liệu gốc. Dữ liệu trống thì không kết luận."
          items={[
            { label: 'Doanh thu app', value: report.sourceCounts.appRevenue, caption: `${report.sourceCounts.appRevenue} dòng` },
            { label: 'Doanh thu cửa hàng', value: report.sourceCounts.storeRevenue, caption: `${report.sourceCounts.storeRevenue} dòng` },
            { label: 'Sổ quỹ', value: report.sourceCounts.cashbook, caption: `${report.sourceCounts.cashbook} dòng` },
            { label: 'Tồn kho', value: report.sourceCounts.inventory, caption: `${report.sourceCounts.inventory} dòng` },
            { label: 'Thất thoát', value: report.sourceCounts.lossRows, caption: `${report.sourceCounts.lossRows} dòng` }
          ]}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Top vấn đề cần CEO chú ý</CardTitle>
          <div className="mt-2">
            <ReportTable headers={['Hạng', 'Vấn đề', 'Ảnh hưởng', 'Nguyên nhân', 'Đề xuất xử lý']} rows={report.issueRows} maxHeight="max-h-[300px]" />
          </div>
        </Card>
        <Card>
          <CardTitle>Thất thoát NVL — Top 5 cần xử lý</CardTitle>
          <div className="mt-2">
            <ReportTable headers={['NVL', 'ĐVT', 'Chênh SL', 'Giá trị', 'Tỷ lệ', 'Định mức', 'Vượt', 'Trạng thái', 'Hành động']} rows={report.lossTop5Rows} maxHeight="max-h-[300px]" />
          </div>
        </Card>
      </section>

      <AiAgentPanel report={report} />
    </div>
  );
}
