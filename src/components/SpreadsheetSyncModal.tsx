import React, { useState } from 'react';
import { SyncSettings, CaseRecord } from '../types';
import { SyncService } from '../services/syncService';
import { 
  FileSpreadsheet, 
  X, 
  RefreshCw, 
  Link as LinkIcon, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SpreadsheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncSettings: SyncSettings;
  onSaveSyncSettings: (settings: SyncSettings) => void;
  onImportCases: (importedCases: CaseRecord[]) => void;
  theme?: 'light' | 'dark';
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({
  isOpen,
  onClose,
  syncSettings,
  onSaveSyncSettings,
  onImportCases,
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(syncSettings.googleSheetUrl || '');
  const [webhookUrl, setWebhookUrl] = useState<string>(syncSettings.googleSheetWebhookUrl || '');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const appScriptCode = `// PASTE KODE INI DI GOOGLE SHEETS: Extensions > Apps Script
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action === 'add_case') {
    sheet.appendRow([
      data.record.nomorPerkara,
      data.record.namaPihak,
      data.record.jenisPerkara,
      data.record.saldoPerkara,
      data.record.tanggalRegister,
      data.record.status
    ]);
  } else if (data.action === 'add_biaya_proses') {
    sheet.appendRow([
      data.record.tanggal,
      data.record.nomorPerkara,
      data.record.uraian,
      data.record.penerimaan,
      data.record.pengeluaran,
      data.record.keterangan
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Handle direct Google Sheet URL fetch
  const handleSyncFromGoogleSheets = async () => {
    if (!googleSheetUrl) {
      setSyncMessage({ type: 'error', text: 'Silakan masukkan URL Google Sheets publik terlebih dahulu.' });
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const records = await SyncService.fetchGoogleSheetCsv(googleSheetUrl);
      if (records.length === 0) {
        throw new Error('Spreadsheet kosong atau format kolom tidak dikenali.');
      }

      onImportCases(records);
      onSaveSyncSettings({
        ...syncSettings,
        googleSheetUrl,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'success'
      });

      setSyncMessage({
        type: 'success',
        text: `Berhasil sinkronisasi ${records.length} data perkara dari Google Sheets!`
      });
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Gagal terhubung dengan Google Sheets. Pastikan spreadsheet dipublikasikan ke web (File > Bagikan > Publikasikan ke web).'
      });
      onSaveSyncSettings({
        ...syncSettings,
        syncStatus: 'error',
        errorMessage: err.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle manual CSV text paste or file load
  const handleParseCsvText = () => {
    if (!csvRawText.trim()) {
      setSyncMessage({ type: 'error', text: 'Teks CSV atau data spreadsheet masih kosong.' });
      return;
    }

    try {
      const records = SyncService.parseCsv(csvRawText);
      if (records.length === 0) {
        throw new Error('Format CSV tidak valid atau kolom utama tidak ditemukan.');
      }

      onImportCases(records);
      setSyncMessage({
        type: 'success',
        text: `Berhasil mengimpor ${records.length} data perkara dari CSV!`
      });
      setCsvRawText('');
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Gagal menguraikan data CSV.'
      });
    }
  };

  // Load sample snippet provided in user request
  const handleLoadUserSample = () => {
    const sample = `Nomor Perkara,Nama Pihak,Jenis Perkara,Saldo Perkara (Rp)
1/Pdt.G/2026/PA.Pan,Muhammad Zakaria,Cerai Talak,Rp0
2/Pdt.G/2026/PA.Pan,Siti Nurhaliza vs Andi Wijaya,Cerai Gugat,Rp125000
3/Pdt.P/2026/PA.Pan,H. Abdul Rahman & Hj. Maryam,Penetapan Ahli Waris,Rp350000`;
    setCsvRawText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
        }`}>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className={`font-extrabold text-base ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Integrasi & Sinkronisasi Google Sheets
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Answer Banner */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs leading-relaxed ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
          }`}>
            <Sparkles className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-800">
                Apakah data yang di-input bisa langsung terecord ke Google Sheets?
              </p>
              <p className="mt-1">
                <strong>BISA BANGET!</strong> Anda bisa memilih 3 cara integrasi dengan Google Sheets:
              </p>
              <ul className="list-disc list-inside mt-1.5 space-y-1 font-medium">
                <li><strong>Cara 1 (Otomatis)</strong>: Memasang <em>Google Apps Script Webhook</em> agar setiap kali input data di aplikasi, data langsung terkirim otomatis ke baris Google Sheets Anda.</li>
                <li><strong>Cara 2 (Tarik Data)</strong>: Menghubungkan tautan Google Sheets publik agar aplikasi membaca data terbaru dari spreadsheet.</li>
                <li><strong>Cara 3 (Ekspor File)</strong>: Mengunduh file CSV / JSON dari aplikasi dan langsung di-import ke Google Sheets.</li>
              </ul>
            </div>
          </div>

          {/* Status Alert Banner */}
          {syncMessage && (
            <div className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
              syncMessage.type === 'success'
                ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              )}
              <div>
                <p className="font-semibold">{syncMessage.type === 'success' ? 'Berhasil' : 'Gagal'}</p>
                <p className="mt-0.5 leading-relaxed">{syncMessage.text}</p>
              </div>
            </div>
          )}

          {/* OPSI 1: GOOGLE APPS SCRIPT WEB-HOOK AUTO WRITE */}
          <div className={`border rounded-xl p-4 space-y-3 ${
            isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-800/60 border-slate-700/70'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-amber-900' : 'text-slate-100'}`}>
                  Cara 1: Google Apps Script Webhook (Auto-Record Real-time)
                </h4>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                Rekomendasi Utama
              </span>
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Salin skrip di bawah ke Google Sheets Anda (<strong>Ekstensi &gt; Apps Script</strong>) lalu terbitkan sebagai Web App. Setiap kali ada perkara / transaksi baru, data akan langsung otomatis tercatat di baris spreadsheet Anda!
            </p>

            <div className="relative">
              <pre className={`p-3 rounded-lg text-[11px] font-mono overflow-x-auto border max-h-36 ${
                isLight ? 'bg-slate-900 text-amber-300 border-slate-800' : 'bg-slate-950 text-amber-300 border-slate-800'
              }`}>
                {appScriptCode}
              </pre>
              <button
                onClick={handleCopyScript}
                className="absolute top-2 right-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold flex items-center space-x-1 shadow"
              >
                {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Tersalin!' : 'Salin Skrip'}</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              <label className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                URL Web App Google Apps Script Anda (Opsional):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                />
                <button
                  onClick={() => {
                    onSaveSyncSettings({
                      ...syncSettings,
                      googleSheetWebhookUrl: webhookUrl
                    });
                    setSyncMessage({ type: 'success', text: 'URL Webhook Google Apps Script berhasil disimpan!' });
                  }}
                  className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Simpan Webhook
                </button>
              </div>
            </div>
          </div>

          {/* OPSI 2: REAL-TIME GOOGLE SHEETS READ (CSV URL) */}
          <div className={`border rounded-xl p-4 space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/70'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-emerald-600" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Cara 2: Tarik Data dari Tautan Google Sheets (CSV URL)
                </h4>
              </div>
              {syncSettings.lastSyncedAt && (
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Terakhir sinkron: {new Date(syncSettings.lastSyncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Masukkan tautan Google Sheets publik (File &gt; Bagikan &gt; Publikasikan ke Web &gt; CSV). Aplikasi akan menarik data perkara dari sheet.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                id="input-google-sheets-url"
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              />
              <button
                onClick={handleSyncFromGoogleSheets}
                disabled={isSyncing}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menghubungkan...' : 'Tarik Data'}</span>
              </button>
            </div>
          </div>

          {/* OPSI 3: MANUAL CSV PASTE OR SAMPLE */}
          <div className={`border rounded-xl p-4 space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/70'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Cara 3: Impor Manual CSV / Spreadsheet Text
                </h4>
              </div>
              <button
                onClick={handleLoadUserSample}
                className="text-[11px] text-emerald-600 hover:underline font-bold flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Contoh Data</span>
              </button>
            </div>

            <textarea
              id="input-csv-textarea"
              rows={4}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder={`Nomor Perkara,Nama Pihak,Jenis Perkara,Saldo Perkara (Rp)
1/Pdt.G/2026/PA.Pan,Muhammad Zakaria,Cerai Talak,Rp0`}
              className={`w-full border rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            />

            <div className="flex items-center justify-between">
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Kolom minimum: <code className="text-emerald-700 font-mono">Nomor Perkara</code>, <code className="text-emerald-700 font-mono">Nama Pihak</code>, <code className="text-emerald-700 font-mono">Jenis Perkara</code>, <code className="text-emerald-700 font-mono">Saldo Perkara (Rp)</code>
              </p>
              <button
                onClick={handleParseCsvText}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <span>Impor Teks CSV</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
