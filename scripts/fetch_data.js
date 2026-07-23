// scripts/fetch_data.js
// Script otomatisasi GitHub Actions untuk mengambil data spreadsheet terbaru
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL;

async function syncSpreadsheetData() {
  if (!GOOGLE_SHEET_CSV_URL) {
    console.log('ℹ️ Secrets GOOGLE_SHEET_CSV_URL tidak diatur. Menggunakan data JSON existing.');
    return;
  }

  try {
    console.log('🔄 Mengambil data spreadsheet terbaru dari Google Sheets...');
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    
    const csvText = await response.text();
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    // Simpan file CSV & JSON ringan di direktori public
    fs.writeFileSync(path.join(publicDir, 'data_perkara.csv'), csvText, 'utf-8');
    console.log('✅ Success: public/data_perkara.csv telah diperbarui.');
  } catch (err) {
    console.error('❌ Gagal sinkronisasi data:', err.message);
  }
}

syncSpreadsheetData();
