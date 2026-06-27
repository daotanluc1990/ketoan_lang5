import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredRoutes = [
  'app/tong-quan/page.tsx', 'app/pl-tuan/page.tsx', 'app/dong-tien/page.tsx',
  'app/can-doi/page.tsx', 'app/du-toan/page.tsx', 'app/that-thoat-chi-tiet/page.tsx',
  'app/ban-lam-viec-ke-toan/page.tsx', 'app/import-nhap-lieu/page.tsx', 'app/cai-dat-bot/page.tsx'
];
const requiredFiles = [
  'src/components/layout/Sidebar.tsx', 'src/components/layout/GlobalFilterBar.tsx', 'src/components/layout/TopBar.tsx',
  'src/components/layout/PageHeader.tsx', 'src/components/forms/BatchUploadMock.tsx',
  'src/components/report/MetricCard.tsx', 'src/components/report/ReportTable.tsx', 'src/components/report/InsightListCard.tsx',
  'src/components/dashboard/AccountingOverviewPage.tsx'
];
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function assert(condition, message) { if (!condition) throw new Error(message); }

for (const file of [...requiredRoutes, ...requiredFiles]) assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);

const navigation = read('src/components/layout/navigation.ts');
assert([...navigation.matchAll(/\{ href:/g)].length === 9, 'Navigation must keep 9 tabs');
for (const text of ['Bàn làm việc kế toán', 'Báo cáo thất thoát chi tiết', 'Cài đặt & Bot báo cáo']) assert(navigation.includes(text), `Navigation missing ${text}`);

const pageHeader = read('src/components/layout/PageHeader.tsx');
assert(pageHeader.includes('line-clamp-1'), 'PageHeader description must stay one line');
assert(pageHeader.includes('p-3'), 'PageHeader must be compact');

const metric = read('src/components/report/MetricCard.tsx');
assert(metric.includes('compact'), 'MetricCard must support compact mode');
assert(metric.includes('line-clamp-1'), 'MetricCard must avoid long text blocks');

const table = read('src/components/report/ReportTable.tsx');
assert(table.includes('overflow-auto'), 'Tables must scroll internally');
assert(table.includes("max-h-[360px]"), 'Tables must keep compact default height');

const batch = read('src/components/forms/BatchUploadMock.tsx');
assert(batch.includes('multiple'), 'Batch upload input must support multiple files');
assert(batch.includes('Kiểm tra batch'), 'Batch upload must keep dry-run action');
assert(batch.includes('Tóm tắt batch'), 'Batch upload must show batch summary');

const overview = read('src/components/dashboard/AccountingOverviewPage.tsx');
for (const text of ['Tổng quan kế toán ERP', 'Cửa hàng · Nhập - xuất - tồn - bán - hủy', 'Bếp Trung Tâm', 'Đối chiếu ERP bắt buộc']) assert(overview.includes(text), `Accounting ERP overview missing ${text}`);
assert(overview.includes('2xl:grid-cols-8'), 'Accounting ERP overview KPI strip must be dense on large desktop');

const loss = read('app/that-thoat-chi-tiet/page.tsx');
for (const text of ['Tỷ lệ thất thoát', 'Định mức', 'Vượt định mức', 'Tóm tắt thất thoát']) assert(loss.includes(text), `Loss report missing ${text}`);

const workspace = read('app/ban-lam-viec-ke-toan/page.tsx');
for (const text of ['Checklist báo cáo thứ 2', 'Chốt báo cáo', 'Gửi CEO', 'PermissionMatrix']) assert(workspace.includes(text), `Accountant workspace missing ${text}`);

const allUi = [...requiredRoutes, ...requiredFiles].map(read).join('\n');
assert(!allUi.includes('rounded-2xl bg-white p-5'), 'Old large card spacing should be removed');
assert(!allUi.includes('description="V5.0'), 'Technical version notes should not appear in PageHeader');
assert(!allUi.includes('space-y-4">\n      <PageHeader'), 'Main pages should use denser spacing than old space-y-4 pattern');

console.log('Static UI QA passed: accounting ERP overview, 9 tabs, compact headers, dense KPI strips, internal-scroll tables, compact import, accountant workflow, and reduced explanation blocks.');
