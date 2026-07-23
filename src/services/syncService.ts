import { CaseRecord, JenisPerkara, KategoriPerkara, StatusPerkara } from '../types';

export class SyncService {
  /**
   * Parse CSV content into CaseRecord objects.
   * Flexibly matches Indonesian header titles.
   */
  static parseCsv(csvText: string): CaseRecord[] {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Find column indexes
    const getIdx = (...possibleNames: string[]): number => {
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

    const records: CaseRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;

      const nomorPerkara = nomorIdx !== -1 && cols[nomorIdx] ? cols[nomorIdx] : `${i}/Pdt.G/2026/PA.Pan`;
      const namaPihak = namaIdx !== -1 && cols[namaIdx] ? cols[namaIdx] : 'Pihak Berperkara';
      const jenisRaw = jenisIdx !== -1 && cols[jenisIdx] ? cols[jenisIdx] : 'Cerai Gugat';
      
      const cleanMoney = (val?: string): number => {
        if (!val) return 0;
        const cleaned = val.replace(/[^0-9,-]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : Math.abs(num);
      };

      const saldoPerkara = saldoIdx !== -1 ? cleanMoney(cols[saldoIdx]) : 0;
      const panjarAwal = panjarIdx !== -1 ? cleanMoney(cols[panjarIdx]) : 1000000;
      const pengeluaran = pengeluaranIdx !== -1 ? cleanMoney(cols[pengeluaranIdx]) : (panjarAwal - saldoPerkara);

      // Infer Jenis Perkara
      let jenisPerkara: JenisPerkara = 'Cerai Gugat';
      if (/talak/i.test(jenisRaw)) jenisPerkara = 'Cerai Talak';
      else if (/waris/i.test(jenisRaw)) jenisPerkara = 'Penetapan Ahli Waris';
      else if (/harta/i.test(jenisRaw)) jenisPerkara = 'Harta Bersama';
      else if (/hibah/i.test(jenisRaw)) jenisPerkara = 'Hibah';
      else if (/wasiat/i.test(jenisRaw)) jenisPerkara = 'Wasiat';
      else if (/asuh/i.test(jenisRaw)) jenisPerkara = 'Hak Asuh Anak';
      else if (/nafkah/i.test(jenisRaw)) jenisPerkara = 'Nafkah Anak';
      else if (/dispensasi/i.test(jenisRaw)) jenisPerkara = 'Dispensasi Nikah';
      else if (/adhal/i.test(jenisRaw)) jenisPerkara = 'Wali Adhal';

      const kategoriPerkara: KategoriPerkara = nomorPerkara.includes('/Pdt.P/') || /Pdt\.P/i.test(nomorPerkara) ? 'Permohonan' : 'Gugatan';

      let status: StatusPerkara = 'Diperiksa';
      const statusRaw = statusIdx !== -1 ? cols[statusIdx] : '';
      if (/putus/i.test(statusRaw)) status = 'Putus';
      else if (/minut/i.test(statusRaw)) status = 'Minutasi';
      else if (/selesai/i.test(statusRaw)) status = 'Selesai';
      else if (/daftar/i.test(statusRaw)) status = 'Pendaftaran';

      records.push({
        id: `imported-${Date.now()}-${i}`,
        nomorPerkara,
        namaPihak,
        jenisPerkara,
        kategoriPerkara,
        saldoPerkara,
        panjarAwal,
        pengeluaran,
        tanggalRegister: tglRegIdx !== -1 && cols[tglRegIdx] ? cols[tglRegIdx] : new Date().toISOString().split('T')[0],
        status,
        hakimKetua: hakimIdx !== -1 ? cols[hakimIdx] : undefined,
        panitera: paniteraIdx !== -1 ? cols[paniteraIdx] : undefined,
        catatan: catatanIdx !== -1 ? cols[catatanIdx] : undefined,
        updatedAt: new Date().toISOString()
      });
    }

    return records;
  }

  /**
   * Fetch Google Sheet CSV data if public publish link is given
   */
  static async fetchGoogleSheetCsv(url: string): Promise<CaseRecord[]> {
    let csvUrl = url.trim();
    
    // Transform pubhtml or view URL to published CSV format
    if (csvUrl.includes('/pubhtml')) {
      csvUrl = csvUrl.replace('/pubhtml', '/pub');
      if (!csvUrl.includes('output=csv')) {
        csvUrl += (csvUrl.includes('?') ? '&' : '?') + 'output=csv';
      }
    } else if (csvUrl.includes('docs.google.com/spreadsheets/d/') && !csvUrl.includes('/pub')) {
      const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Gagal mengambil data spreadsheet (HTTP ${response.status})`);
    }

    const text = await response.text();
    return this.parseCsv(text);
  }

  /**
   * Post data payload to Google Apps Script Webhook
   */
  static async postToWebhook(webhookUrl: string, action: string, record: any): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return false;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script CORS handling
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, record, timestamp: new Date().toISOString() })
      });
      return true;
    } catch (err) {
      console.warn('Google Sheets webhook post warning:', err);
      return false;
    }
  }
}
