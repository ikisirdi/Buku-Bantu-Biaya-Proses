// scripts/fetch_data.js
// Script otomatisasi GitHub Actions untuk mengambil data spreadsheet terbaru
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL;

function parseCsvToJson(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting handling commas inside quotes
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    if (!values || values.length === 0) continue;

    const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
    
    const record = {
      id: `sheet-${i}`,
      nomorPerkara: cleanValues[0] || `PERKARA-${i}`,
      namaPihak: cleanValues[1] || 'Pihak Berperkara',
      jenisPerkara: cleanValues[2] || 'Gugatan',
      kategoriPerkara: (cleanValues[2] || '').toLowerCase().includes('permohonan') ? 'Permohonan' : 'Gugatan',
      saldoPerkara: parseInt((cleanValues[3] || '0').replace(/[^0-9]/g, '')) || 0,
      tanggalRegister: cleanValues[4] || new Date().toISOString().split('T')[0],
      status: cleanValues[5] || 'Pendaftaran',
      updatedAt: new Date().toISOString()
    };
    records.push(record);
  }
  return records;
}

async function syncSpreadsheetData() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  if (!GOOGLE_SHEET_CSV_URL) {
    console.log('ℹ️ Secrets GOOGLE_SHEET_CSV_URL tidak diatur. Menggunakan data JSON/CSV existing.');
    return;
  }

  try {
    console.log('🔄 Mengambil data spreadsheet terbaru dari Google Sheets...');
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP status ${response.status}`);
    
    const csvText = await response.text();
    
    // Simpan file CSV & JSON ringan di direktori public
    fs.writeFileSync(path.join(publicDir, 'data_perkara.csv'), csvText, 'utf-8');

    const jsonRecords = parseCsvToJson(csvText);
    if (jsonRecords.length > 0) {
      fs.writeFileSync(path.join(publicDir, 'data_perkara.json'), JSON.stringify(jsonRecords, null, 2), 'utf-8');
      console.log(`✅ Success: public/data_perkara.json (${jsonRecords.length} record) telah diperbarui.`);
    }

    console.log('✅ Success: public/data_perkara.csv telah diperbarui.');
  } catch (err) {
    console.error('❌ Gagal sinkronisasi data:', err.message);
  }
}

syncSpreadsheetData();
