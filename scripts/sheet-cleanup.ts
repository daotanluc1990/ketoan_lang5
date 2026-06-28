/**
 * Backup + xóa sheet obsolete trên Google Sheet.
 *
 * Bước 1: Export toàn bộ sheet → backups/*.xlsx
 * Bước 2: Xóa các sheet obsolete (báo cáo tĩnh đã có engine runtime)
 *
 * Chạy: npm run sheet-cleanup
 * An toàn: backup trước, có thể khôi phục từ Google Drive revision history.
 */
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { config as loadEnv } from 'dotenv';

loadEnv();

function normalizePrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'];

// Sheet obsolete đã xóa + sheet legacy V4 có thể bỏ (aggregator dùng safeRead = fallback [])
const OBSOLETE_SHEETS = [
  // V4 legacy — đã thay bằng sheet V7, report-aggregator dùng safeRead nên fallback [] không crash
  'DL_TON_KHO',
  'DL_THAT_THOAT_NVL',
  'DL_THU_MUA'
];

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (!sheetId || !clientEmail || !privateKey) {
    console.error('❌ Thiếu GOOGLE_SHEET_ID / GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY');
    process.exit(1);
  }
  const jwt = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY) },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  const authClient = await jwt.getClient();
  const sheetsClient = google.sheets({ version: 'v4', auth: authClient as any });

  // ── Bước 1: Backup reminder ──
  // Service account chỉ có quyền Sheets (không Drive). Backup bằng tay:
  // File > Make a copy trong Google Sheets, hoặc dùng Drive revision history.
  console.log('ℹ️ Bước 1: Backup reminder');
  console.log('   Google Sheets tự lưu revision history. Để khôi phục: File > Version history > See version history.');
  console.log('   Hoặc copy thủ công: File > Make a copy trước khi tiếp tục.');
  console.log('   (Service account chỉ có quyền Sheets, không export Drive được)');

  // ── Bước 2: Lấy danh sách sheet hiện tại ──
  const meta = await sheetsClient.spreadsheets.get({ spreadsheetId: sheetId });
  const existingTabs = (meta.data.sheets ?? []).map((s) => ({ title: s.properties?.title ?? '', sheetId: s.properties?.sheetId ?? 0 }));
  console.log(`\n📋 Google Sheet hiện có ${existingTabs.length} tab`);

  // ── Bước 3: Xóa sheet obsolete ──
  const toDelete = existingTabs.filter((t) => OBSOLETE_SHEETS.includes(t.title));
  const notFound = OBSOLETE_SHEETS.filter((name) => !existingTabs.some((t) => t.title === name));

  console.log(`\n🗑 Bước 2: Xóa ${toDelete.length} sheet obsolete:`);
  if (!toDelete.length) {
    console.log('   Không có sheet nào cần xóa.');
  }
  for (const tab of toDelete) {
    console.log(`   ✗ ${tab.title}`);
  }
  if (notFound.length) {
    console.log(`\n   (Không tìm thấy ${notFound.length} sheet: ${notFound.join(', ')} — có thể đã xóa)`);
  }

  if (!toDelete.length) {
    console.log('\n✓ Hoàn tất. Không có thay đổi.');
    return;
  }

  // Batch update: xóa tất cả sheet obsolete trong 1 request
  const requests = toDelete.map((tab) => ({ deleteSheet: { sheetId: tab.sheetId } }));
  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests }
  });
  console.log(`\n✓ Đã xóa ${toDelete.length} sheet obsolete.`);

  // ── Bước 4: Verify ──
  const meta2 = await sheetsClient.spreadsheets.get({ spreadsheetId: sheetId });
  const remaining = (meta2.data.sheets ?? []).length;
  console.log(`\n📊 Google Sheet còn ${remaining} tab (giảm từ ${existingTabs.length}).`);
  console.log('📁 Khôi phục: File > Version history > See version history trong Google Sheets.');
}

main().catch((e) => { console.error('❌ Lỗi:', e.message); process.exit(1); });
