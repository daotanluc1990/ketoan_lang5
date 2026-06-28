/**
 * Sheet Audit — đọc Google Sheet thật, so sánh với SHEET_NAMES,
 * đánh dấu sheet nào active vs obsolete (legacy/computed).
 *
 * Chạy: npm run sheet-audit
 */
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Sheet đang ĐƯỢC code đọc (active) — từ grep SHEET_NAMES trong src/
const ACTIVE_SHEETS = new Set([
  'DM_CHI_NHANH', 'DM_KHO_CHI_NHANH', 'DM_MON_BAN', 'DM_NGUYEN_VAT_LIEU',
  'DM_CONG_THUC_CHE_BIEN', 'DM_HAO_HUT_HOP_LE', 'DM_DON_GIA_NVL',
  'DL_DOANH_THU_CUA_HANG', 'DL_DOANH_THU_APP', 'DL_SO_QUY',
  'DL_XNT_CUA_HANG', 'DL_XNT_BEP_TRUNG_TAM',
  'DL_XUAT_BTT_CHO_CUA_HANG', 'DL_CUA_HANG_NHAN_TU_BTT',
  'DL_HUY_HANG_CUA_HANG', 'DL_HUY_HANG_BTT',
  'DL_CHE_BIEN_THUC_TE', 'DL_CONG_NO',
  'KQ_HAO_HUT_CHE_BIEN', 'KQ_THAT_THOAT_TON_KHO',
  'IMPORT_LICH_SU', 'AUDIT_LOG',
  'CAI_DAT_BOT', 'CAI_DAT_NGUONG',
  'LICH_SU_CHOT_BAO_CAO'
]);

// Sheet báo cáo tĩnh (tính runtime ở GĐ-B, có thể bỏ)
const OBSOLETE_REPORT_SHEETS = new Set([
  'CEO_DASHBOARD', 'P&L_TUAN', 'DONG_TIEN_TUAN', 'CAN_DOI_RUT_GON',
  'DU_TOAN_TUAN_TOI', 'THAT_THOAT_CHI_TIET', 'BAN_LAM_VIEC_KE_TOAN',
  'TONG_QUAN_KE_TOAN'
]);

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!sheetId || !clientEmail || !privateKey) {
    console.error('❌ Thiếu GOOGLE_SHEET_ID / GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY trong .env');
    process.exit(1);
  }
  const jwt = new google.auth.JWT(clientEmail, undefined, privateKey, SCOPES);
  const sheets = google.sheets({ version: 'v4', auth: jwt });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const tabNames = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];

  console.log(`\n📊 Google Sheet có ${tabNames.length} tab:\n`);
  console.log('═'.repeat(70));

  const active: string[] = [];
  const obsolete: string[] = [];
  const legacy: string[] = [];
  const unknown: string[] = [];

  for (const tab of tabNames) {
    if (ACTIVE_SHEETS.has(tab)) active.push(tab);
    else if (OBSOLETE_REPORT_SHEETS.has(tab)) obsolete.push(tab);
    else if (tab.includes('DL_TON_KHO') || tab.includes('DL_THAT_THOAT_NVL') || tab.includes('DL_THU_MUA')) legacy.push(tab);
    else unknown.push(tab);
  }

  console.log(`\n🟢 ACTIVE — ĐANG DÙNG (${active.length}):`);
  active.forEach((t) => console.log(`   ✓ ${t}`));

  console.log(`\n🔴 OBSOLETE — BÁO CÁO TĨNH, CÓ THỂ BỎ (${obsolete.length}):`);
  obsolete.forEach((t) => console.log(`   ✗ ${t}  → tính runtime ở GĐ-B`));

  console.log(`\n🟡 LEGACY — V4 CŨ (${legacy.length}):`);
  legacy.forEach((t) => console.log(`   ⚠ ${t}  → đã thay bằng sheet V7`));

  console.log(`\n❓ UNKNOWN — không trong danh sách (${unknown.length}):`);
  unknown.forEach((t) => console.log(`   ? ${t}`));

  console.log('\n' + '═'.repeat(70));
  console.log(`Tổng: ${tabNames.length} | Active: ${active.length} | Bỏ được: ${obsolete.length + legacy.length}`);
  console.log(`\n💡 Theo GĐ-C: có thể giảm xuống ~${active.length + 2} sheet (active + CAI_DAT gộp)`);
}

main().catch((err) => { console.error('❌ Lỗi:', err.message); process.exit(1); });
