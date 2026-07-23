// scripts/fetch_data.js
// Script otomatisasi GitHub Actions untuk mengambil data spreadsheet terbaru
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL;

function parseCsvToJson(csvText) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Determine delimiter (comma or semicolon)
  const delimiter = lines[0].includes(';') ? ';' : ',';

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase());

  const getIdx = (...possibleNames) => {
    for (const name of possibleNames) {
      const idx = headers.findIndex(h => h.includes(name.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const nomorIdx = getIdx('nomor perkara', 'nomor', 'no perkara', 'no');
  const namaIdx = getIdx('nama pihak', 'pihak', 'nama', 'pemohon', 'penggugat');
  const jenisIdx = getIdx('jenis perkara', 'jenis', 'perkara');
  const saldoIdx = getIdx('saldo perkara', 'saldo', 'sisa panjar');
  const panjarIdx = getIdx('panjar awal', 'panjar', 'penerimaan');
  const pengeluaranIdx = getIdx('pengeluaran', 'biaya', 'pakai');
  const tglRegIdx = getIdx('tanggal register', 'tgl register', 'tanggal', 'tgl reg');
  const statusIdx = getIdx('status perkara', 'status');
  const hakimIdx = getIdx('hakim ketua', 'hakim');
  const paniteraIdx = getIdx('panitera');
  const catatanIdx = getIdx('catatan', 'keterangan');

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;

    const nomorPerkara = nomorIdx !== -1 && cols[nomorIdx] ? cols[nomorIdx] : `PERKARA-${i}`;
    const namaPihak = namaIdx !== -1 && cols[namaIdx] ? cols[namaIdx] : 'Pihak Berperkara';
    const jenisRaw = jenisIdx !== -1 && cols[jenisIdx] ? cols[jenisIdx] : 'Gugatan';

    const cleanMoney = (val) => {
      if (!val) return 0;
      const cleaned = val.replace(/[^0-9]/g, '');
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : num;
    };

    const saldoPerkara = saldoIdx !== -1 ? cleanMoney(cols[saldoIdx]) : 0;
    const panjarAwal = panjarIdx !== -1 ? cleanMoney(cols[panjarIdx]) : 1000000;
    const pengeluaran = pengeluaranIdx !== -1 ? cleanMoney(cols[pengeluaranIdx]) : (panjarAwal - saldoPerkara);

    const record = {
      id: `sheet-${i}`,
      nomorPerkara,
      namaPihak,
      jenisPerkara: jenisRaw,
      kategoriPerkara: nomorPerkara.includes('/Pdt.P/') ? 'Permohonan' : 'Gugatan',
      saldoPerkara,
      panjarAwal,
      pengeluaran,
      tanggalRegister: tglRegIdx !== -1 && cols[tglRegIdx] ? cols[tglRegIdx] : new Date().toISOString().split('T')[0],
      status: statusIdx !== -1 && cols[statusIdx] ? cols[statusIdx] : 'Pendaftaran',
      hakimKetua: hakimIdx !== -1 ? cols[hakimIdx] : undefined,
      panitera: paniteraIdx !== -1 ? cols[paniteraIdx] : undefined,
      catatan: catatanIdx !== -1 ? cols[catatanIdx] : undefined,
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
