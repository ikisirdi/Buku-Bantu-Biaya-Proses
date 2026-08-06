import React, { useState, useMemo } from 'react';
import { JurnalBiayaSkumRecord, CaseRecord } from '../types';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  Printer, 
  Trash2, 
  Edit3,
  Filter, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calculator,
  FileText
} from 'lucide-react';

interface JurnalBiayaSkumViewProps {
  records: JurnalBiayaSkumRecord[];
  cases: CaseRecord[];
  onAddRecord: (record: Omit<JurnalBiayaSkumRecord, 'id' | 'createdAt'>) => void;
  onUpdateRecord: (record: JurnalBiayaSkumRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenJurnalModal: () => void;
  theme?: 'light' | 'dark';
}

export const JurnalBiayaSkumView: React.FC<JurnalBiayaSkumViewProps> = ({
  records,
  cases,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onOpenJurnalModal,
  theme = 'light'
}) => {
  const isLight = theme === 'light';

  // Local Filter & Form States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNomorPerkara, setFilterNomorPerkara] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterBulan, setFilterBulan] = useState<string>('ALL');
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());

  // Available unique case numbers for dropdown filter
  const availableNomorPerkara = useMemo(() => {
    const setPerkara = new Set<string>();
    records.forEach(r => {
      if (r.nomorPerkara && r.nomorPerkara.trim()) {
        setPerkara.add(r.nomorPerkara.trim());
      }
    });
    cases.forEach(c => {
      if (c.nomorPerkara && c.nomorPerkara.trim()) {
        setPerkara.add(c.nomorPerkara.trim());
      }
    });
    return Array.from(setPerkara).sort();
  }, [records, cases]);

  // Modal Add Manual SKUM
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formNomorPerkara, setFormNomorPerkara] = useState('');
  const [formUraian, setFormUraian] = useState('');
  const [formJenisTransaksi, setFormJenisTransaksi] = useState<'DEBET' | 'KREDIT'>('KREDIT');
  const [formNominal, setFormNominal] = useState<number>(0);
  const [formKategori, setFormKategori] = useState<JurnalBiayaSkumRecord['kategori']>('Panggilan');
  const [formKeterangan, setFormKeterangan] = useState('');

  // Modal Edit SKUM
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JurnalBiayaSkumRecord | null>(null);
  const [editTanggal, setEditTanggal] = useState('');
  const [editNomorPerkara, setEditNomorPerkara] = useState('');
  const [editUraian, setEditUraian] = useState('');
  const [editJenisTransaksi, setEditJenisTransaksi] = useState<'DEBET' | 'KREDIT'>('KREDIT');
  const [editNominal, setEditNominal] = useState<number>(0);
  const [editKategori, setEditKategori] = useState<JurnalBiayaSkumRecord['kategori']>('Panggilan');
  const [editKeterangan, setEditKeterangan] = useState('');

  // SKUM Minus Analysis Modal State
  const [isSkumMinusModalOpen, setIsSkumMinusModalOpen] = useState(false);
  const [selectedSkumMonth, setSelectedSkumMonth] = useState<string | null>(null);

  const handleStartEdit = (record: JurnalBiayaSkumRecord) => {
    setEditingRecord(record);
    setEditTanggal(record.tanggal || new Date().toISOString().split('T')[0]);
    setEditNomorPerkara(record.nomorPerkara);
    setEditUraian(record.uraian);
    if ((record.penerimaan || 0) > 0) {
      setEditJenisTransaksi('DEBET');
      setEditNominal(record.penerimaan);
    } else {
      setEditJenisTransaksi('KREDIT');
      setEditNominal(record.pengeluaran || 0);
    }
    setEditKategori(record.kategori || 'Panggilan');
    setEditKeterangan(record.keterangan || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editNomorPerkara || !editUraian || editNominal <= 0) {
      alert('Mohon isi nomor perkara, uraian, dan nominal transaksi.');
      return;
    }

    onUpdateRecord({
      ...editingRecord,
      tanggal: editTanggal,
      nomorPerkara: editNomorPerkara,
      uraian: editUraian,
      penerimaan: editJenisTransaksi === 'DEBET' ? editNominal : 0,
      pengeluaran: editJenisTransaksi === 'KREDIT' ? editNominal : 0,
      kategori: editKategori,
      keterangan: editKeterangan
    });

    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  // Monthly SKUM breakdown
  const monthlySkumBreakdown = useMemo(() => {
    const months = [
      { num: '01', name: 'Januari' },
      { num: '02', name: 'Februari' },
      { num: '03', name: 'Maret' },
      { num: '04', name: 'April' },
      { num: '05', name: 'Mei' },
      { num: '06', name: 'Juni' },
      { num: '07', name: 'Juli' },
      { num: '08', name: 'Agustus' },
      { num: '09', name: 'September' },
      { num: '10', name: 'Oktober' },
      { num: '11', name: 'November' },
      { num: '12', name: 'Desember' }
    ];

    let runningCumulative = 0;
    return months.map(m => {
      const monthRecords = records.filter(r => {
        if (!r.tanggal) return false;
        const [yr, mo] = r.tanggal.split('-');
        if (filterTahun !== 'ALL' && yr !== filterTahun) return false;
        if (filterNomorPerkara !== 'ALL' && r.nomorPerkara !== filterNomorPerkara) return false;
        return mo === m.num;
      });

      const debet = monthRecords.reduce((s, r) => s + (r.penerimaan || 0), 0);
      const kredit = monthRecords.reduce((s, r) => s + (r.pengeluaran || 0), 0);
      const netMonth = debet - kredit;
      runningCumulative += netMonth;

      return {
        monthNum: m.num,
        monthName: m.name,
        debet,
        kredit,
        netMonth,
        runningCumulative,
        isMinus: netMonth < 0 || runningCumulative < 0,
        records: monthRecords
      };
    });
  }, [records, filterTahun, filterNomorPerkara]);

  // Filter logic
  const filteredRecords = records.filter(r => {
    const matchQuery = 
      r.nomorPerkara.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.uraian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.keterangan.toLowerCase().includes(searchQuery.toLowerCase());

    const matchNomorPerkara = filterNomorPerkara === 'ALL' || r.nomorPerkara === filterNomorPerkara;
    const matchCategory = filterCategory === 'ALL' || r.kategori === filterCategory;

    let matchMonthYear = true;
    if (r.tanggal) {
      const d = new Date(r.tanggal);
      if (!isNaN(d.getTime())) {
        if (filterTahun !== 'ALL' && d.getFullYear().toString() !== filterTahun) {
          matchMonthYear = false;
        }
        if (filterBulan !== 'ALL' && (d.getMonth() + 1).toString().padStart(2, '0') !== filterBulan) {
          matchMonthYear = false;
        }
      }
    }

    return matchQuery && matchNomorPerkara && matchCategory && matchMonthYear;
  });

  // Calculate totals
  const totalDebet = filteredRecords.reduce((acc, r) => acc + (r.penerimaan || 0), 0);
  const totalKredit = filteredRecords.reduce((acc, r) => acc + (r.pengeluaran || 0), 0);
  const saldoSkum = totalDebet - totalKredit;

  // Detect records with dual posting (both penerimaan > 0 AND pengeluaran > 0)
  const doublePostingRecords = useMemo(() => {
    return records.filter(r => (r.penerimaan || 0) > 0 && (r.pengeluaran || 0) > 0);
  }, [records]);

  const handleFixDoublePosting = () => {
    if (doublePostingRecords.length === 0) return;
    doublePostingRecords.forEach(r => {
      const isDebet = r.kategori === 'Panjar' || (r.uraian && r.uraian.toLowerCase().includes('panjar')) || r.penerimaan >= r.pengeluaran;
      onUpdateRecord({
        ...r,
        penerimaan: isDebet ? (r.penerimaan || r.pengeluaran) : 0,
        pengeluaran: isDebet ? 0 : (r.pengeluaran || r.penerimaan)
      });
    });
    alert(`Berhasil memperbarui ${doublePostingRecords.length} transaksi agar posting Debet dan Kredit tidak ganda/terisi bersamaan.`);
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomorPerkara || !formUraian || formNominal <= 0) {
      alert('Mohon lengkapi nomor perkara, uraian, dan nominal transaksi.');
      return;
    }

    onAddRecord({
      tanggal: formTanggal,
      nomorPerkara: formNomorPerkara,
      uraian: formUraian,
      penerimaan: formJenisTransaksi === 'DEBET' ? formNominal : 0,
      pengeluaran: formJenisTransaksi === 'KREDIT' ? formNominal : 0,
      kategori: formKategori,
      keterangan: formKeterangan || 'Log Transaksi Manual Jurnal SKUM'
    });

    setIsAddModalOpen(false);
    setFormUraian('');
    setFormNominal(0);
    setFormKeterangan('');
  };

  const handlePrintJurnalReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bulanName = filterBulan === 'ALL' ? 'Semua Bulan' : `Bulan Ke-${filterBulan}`;
    const tahunName = filterTahun === 'ALL' ? 'Semua Tahun' : filterTahun;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Jurnal Biaya SKUM Perkara</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 30px; color: #111; font-size: 11px; }
          .title { text-align: center; margin-bottom: 20px; text-transform: uppercase; }
          .title h2 { margin: 0; font-size: 16px; }
          .title h3 { margin: 4px 0 0 0; font-size: 13px; font-weight: normal; }
          .period { text-align: center; font-style: italic; margin-bottom: 20px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #333; padding: 6px 8px; font-size: 10px; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: center; text-transform: uppercase; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-box { text-align: center; width: 230px; }
        </style>
      </head>
      <body>
        <div class="title">
          <h2>BUKU JURNAL BIAYA PERKARA (SKUM)</h2>
          <h3>PENGADILAN AGAMA</h3>
        </div>
        <div class="period">
          Periode: ${bulanName} ${tahunName}
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 80px;">Tanggal</th>
              <th style="width: 140px;">Nomor Perkara</th>
              <th>Uraian Transaksi Jurnal</th>
              <th style="width: 110px;">Debet / Panjar (Rp)</th>
              <th style="width: 110px;">Kredit / Biaya (Rp)</th>
              <th style="width: 90px;">Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.length === 0 ? `
              <tr><td colspan="7" class="text-center" style="padding: 20px;">Belum ada data jurnal SKUM perkara.</td></tr>
            ` : filteredRecords.map((r, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td class="text-center">${r.tanggal || '-'}</td>
                <td class="font-bold">${r.nomorPerkara}</td>
                <td>${r.uraian}</td>
                <td class="text-right">${r.penerimaan > 0 ? 'Rp ' + r.penerimaan.toLocaleString('id-ID') : '-'}</td>
                <td class="text-right">${r.pengeluaran > 0 ? 'Rp ' + r.pengeluaran.toLocaleString('id-ID') : '-'}</td>
                <td class="text-center">${r.kategori}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9f9f9; font-weight: bold;">
              <td colspan="4" class="text-right">TOTAL (Rp):</td>
              <td class="text-right">Rp ${totalDebet.toLocaleString('id-ID')}</td>
              <td class="text-right">Rp ${totalKredit.toLocaleString('id-ID')}</td>
              <td></td>
            </tr>
            <tr style="background-color: #e0f2fe; font-weight: bold;">
              <td colspan="4" class="text-right">SALDO TERSISA SKUM PERKARA:</td>
              <td colspan="3" class="text-center" style="font-size: 11px;">Rp ${saldoSkum.toLocaleString('id-ID')}</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <div class="sig-box">
            Mengetahui,<br/>Panitera<br/><br/><br/><br/>
            ( _______________________ )
          </div>
          <div class="sig-box">
            Kasir / Pengelola SKUM,<br/><br/><br/><br/>
            ( _______________________ )
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border transition-all shadow-sm ${
        isLight ? 'bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white border-sky-700' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-sky-500/20 rounded-2xl border border-sky-400/30 text-sky-200 backdrop-blur-md">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-white">📖 Buku Jurnal Biaya SKUM Perkara</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/30 text-sky-200 border border-sky-400/30 uppercase tracking-wider">
                  Log Panjar Perkara
                </span>
              </div>
              <p className="text-xs text-sky-100/80 mt-1 max-w-2xl leading-relaxed">
                Pencatatan resmi penerimaan panjar (SKUM) & seluruh rincian komponen biaya perkara (Panggilan, Meterai, Redaksi, ATK, Sisa Panjar).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="open-autojurnal-btn"
              onClick={onOpenJurnalModal}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Pencatatan Jurnal Otomatis</span>
            </button>

            <button
              id="open-add-skum-manual-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Log SKUM Manual</span>
            </button>

            <button
              id="print-jurnal-skum-btn"
              onClick={handlePrintJurnalReport}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/20"
              title="Cetak Laporan Jurnal SKUM"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Debet (Penerimaan Panjar) */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Debet SKUM</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            Rp {totalDebet.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Penerimaan Panjar Awal & Tambahan</span>
        </div>

        {/* Total Kredit (Pengeluaran Biaya SKUM) */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kredit SKUM</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-rose-600 dark:text-rose-400">
            Rp {totalKredit.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Potongan Biaya Jurnal SKUM</span>
        </div>

        {/* Saldo SKUM Perkara */}
        <div 
          onClick={() => {
            setIsSkumMinusModalOpen(true);
            const firstMinus = monthlySkumBreakdown.find(m => m.isMinus);
            if (firstMinus) {
              setSelectedSkumMonth(firstMinus.monthNum);
            } else {
              setSelectedSkumMonth('01');
            }
          }}
          className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all hover:border-sky-500 hover:shadow-md active:scale-98 ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
          title="Klik untuk melihat rincian & analisis saldo SKUM per bulan"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Saldo Perkara SKUM</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
              saldoSkum < 0 
                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' 
                : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
            }`}>
              {saldoSkum < 0 ? '⚠️ MINUS - Klik Rincian' : '🔍 Rincian Bulanan'}
            </span>
          </div>
          <div className={`font-mono text-xl font-extrabold ${
            saldoSkum < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'
          }`}>
            Rp {saldoSkum.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Debet Ditambah Kredit Berjalan</span>
        </div>

        {/* Total Item Log */}
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Transaksi SKUM</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {filteredRecords.length} <span className="text-xs font-normal text-slate-400">Baris</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Sesuai Filter Kriteria</span>
        </div>

      </div>

      {/* Warning Banners for Discrepancies & Deficit */}
      {doublePostingRecords.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs uppercase tracking-wide flex items-center gap-1.5">
                <span>⚠️ PERINGATAN POSTING GANDA: TERDETEKSI {doublePostingRecords.length} TRANSAKSI SELISIH</span>
              </h4>
              <p className="text-xs mt-1 opacity-90 leading-relaxed">
                Terdapat data log SKUM yang terisi di kolom <strong>Debet (Penerimaan)</strong> dan <strong>Kredit (Pengeluaran)</strong> secara bersamaan. Hal ini menyebabkan total di akhir berbeda/tidak seimbang.
              </p>
            </div>
          </div>
          <button
            onClick={handleFixDoublePosting}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap shadow-sm transition-all active:scale-95"
          >
            ⚡ Perbaiki Otomatis ({doublePostingRecords.length} Data)
          </button>
        </div>
      )}

      {saldoSkum < 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-900 dark:text-rose-200 flex items-center space-x-3 shadow-md">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wide">⚠️ PERINGATAN DEFISIT SALDO JURNAL SKUM</h4>
            <p className="text-xs mt-0.5 opacity-90">
              Total pengeluaran (Rp {totalKredit.toLocaleString('id-ID')}) melebihi total penerimaan (Rp {totalDebet.toLocaleString('id-ID')}). Terdapat defisit saldo sebesar <strong className="font-black underline">Rp {Math.abs(saldoSkum).toLocaleString('id-ID')}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor perkara, uraian SKUM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Nomor Perkara Filter */}
          <select
            value={filterNomorPerkara}
            onChange={(e) => setFilterNomorPerkara(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border font-semibold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="ALL">Semua Nomor Perkara</option>
            {availableNomorPerkara.map((nomor) => (
              <option key={nomor} value={nomor}>
                {nomor}
              </option>
            ))}
          </select>

          {/* Kategori Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border font-semibold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Panjar">Panjar Awal / Tambah</option>
            <option value="Panggilan">Panggilan</option>
            <option value="Meterai">Meterai</option>
            <option value="Redaksi">Redaksi</option>
            <option value="ATK">Pemberkasan / ATK</option>
            <option value="Proses">Proses / PNBP</option>
            <option value="Sisa Panjar">Pengembalian Sisa Panjar</option>
          </select>

          {/* Bulan Filter */}
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border font-semibold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="ALL">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => {
              const monthNum = (i + 1).toString().padStart(2, '0');
              const monthName = new Date(2026, i, 1).toLocaleString('id-ID', { month: 'long' });
              return <option key={monthNum} value={monthNum}>{monthName}</option>;
            })}
          </select>

          {/* Tahun Filter */}
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border font-semibold ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <option value="ALL">Semua Tahun</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Main Journal Data Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-extrabold uppercase text-[10px] tracking-wider ${
                isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>
                <th className="p-3 text-center w-10">No</th>
                <th className="p-3 w-28">Tanggal</th>
                <th className="p-3 w-48">Nomor Perkara</th>
                <th className="p-3">Uraian Transaksi SKUM</th>
                <th className="p-3 text-right w-32">Debet (Panjar)</th>
                <th className="p-3 text-right w-32">Kredit (Pengeluaran)</th>
                <th className="p-3 text-center w-28">Kategori</th>
                <th className="p-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="font-bold text-sm text-slate-600 dark:text-slate-300">Belum Ada Data Jurnal SKUM</p>
                      <p className="text-xs text-slate-400">
                        Pilih menu "Pencatatan Jurnal Otomatis" atau "+ Log SKUM Manual" untuk menambahkan rincian.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr 
                    key={r.id} 
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      r.kategori === 'ATK' ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{r.tanggal || '-'}</td>
                    <td className="p-3 font-mono font-bold text-sky-700 dark:text-sky-400">
                      {r.nomorPerkara}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{r.uraian}</div>
                      {r.keterangan && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{r.keterangan}</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {r.penerimaan > 0 ? `Rp ${r.penerimaan.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {r.pengeluaran > 0 ? `Rp ${r.pengeluaran.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        r.kategori === 'Panjar' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : r.kategori === 'ATK'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {r.kategori}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-1">
                      <button
                        onClick={() => handleStartEdit(r)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                        title="Edit data log SKUM ini"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus baris log ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className={`border-t font-black text-xs ${
                isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-white'
              }`}>
                <td colSpan={4} className="p-3 text-right uppercase tracking-wider">TOTAL KESELURUHAN SKUM:</td>
                <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  Rp {totalDebet.toLocaleString('id-ID')}
                </td>
                <td className="p-3 text-right font-mono text-rose-600 dark:text-rose-400">
                  Rp {totalKredit.toLocaleString('id-ID')}
                </td>
                <td colSpan={2} className="p-3 text-center font-mono text-sky-600 dark:text-sky-400">
                  Saldo: Rp {saldoSkum.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Add SKUM Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-sky-50 border-sky-100 text-sky-900' : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                <BookOpen className="w-5 h-5 text-sky-600" />
                <span>+ Input Log Transaksi SKUM Manual</span>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Pilih / Ketik Nomor Perkara:</label>
                <input
                  type="text"
                  list="case-numbers-list"
                  placeholder="e.g. 1/Pdt.G/2026/PA.Pan"
                  value={formNomorPerkara}
                  onChange={(e) => setFormNomorPerkara(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                  required
                />
                <datalist id="case-numbers-list">
                  {cases.map(c => (
                    <option key={c.id} value={c.nomorPerkara}>{c.namaPihak}</option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Tanggal Transaksi:</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Jenis Transaksi SKUM:</label>
                  <select
                    value={formJenisTransaksi}
                    onChange={(e) => setFormJenisTransaksi(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <option value="KREDIT">KREDIT (Pengeluaran SKUM)</option>
                    <option value="DEBET">DEBET (Penerimaan / Panjar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Uraian Transaksi SKUM:</label>
                <input
                  type="text"
                  placeholder="e.g. Biaya Panggilan I Tergugat"
                  value={formUraian}
                  onChange={(e) => setFormUraian(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    value={formNominal || ''}
                    onChange={(e) => setFormNominal(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Kategori:</label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <option value="Panjar">Panjar Awal / Tambah</option>
                    <option value="Panggilan">Panggilan</option>
                    <option value="Meterai">Meterai</option>
                    <option value="Redaksi">Redaksi</option>
                    <option value="ATK">Pemberkasan / ATK</option>
                    <option value="Proses">Proses / PNBP</option>
                    <option value="Sisa Panjar">Sisa Panjar</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan / Catatan:</label>
                <input
                  type="text"
                  placeholder="Opsional catatan"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md"
                >
                  Simpan Log SKUM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Log SKUM */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              isLight ? 'bg-sky-50 border-sky-100 text-sky-900' : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                <Edit3 className="w-5 h-5 text-sky-600" />
                <span>Edit Data Log Transaksi SKUM</span>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Nomor Perkara:</label>
                <input
                  type="text"
                  list="edit-case-numbers-list"
                  placeholder="e.g. 1/Pdt.G/2026/PA.Pan"
                  value={editNomorPerkara}
                  onChange={(e) => setEditNomorPerkara(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                  required
                />
                <datalist id="edit-case-numbers-list">
                  {cases.map(c => (
                    <option key={c.id} value={c.nomorPerkara}>{c.namaPihak}</option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Tanggal Transaksi:</label>
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Jenis Transaksi SKUM:</label>
                  <select
                    value={editJenisTransaksi}
                    onChange={(e) => setEditJenisTransaksi(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <option value="KREDIT">KREDIT (Pengeluaran SKUM)</option>
                    <option value="DEBET">DEBET (Penerimaan / Panjar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Uraian Transaksi SKUM:</label>
                <input
                  type="text"
                  placeholder="e.g. Biaya Panggilan I Tergugat"
                  value={editUraian}
                  onChange={(e) => setEditUraian(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-semibold ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    value={editNominal || ''}
                    onChange={(e) => setEditNominal(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Kategori:</label>
                  <select
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <option value="Panjar">Panjar Awal / Tambah</option>
                    <option value="Panggilan">Panggilan</option>
                    <option value="Meterai">Meterai</option>
                    <option value="Redaksi">Redaksi</option>
                    <option value="ATK">Pemberkasan / ATK</option>
                    <option value="Proses">Proses / PNBP</option>
                    <option value="Sisa Panjar">Sisa Panjar</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan / Catatan:</label>
                <input
                  type="text"
                  placeholder="Opsional catatan"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ANALISIS PENYEBAB MINUS SALDO PERKARA SKUM */}
      {isSkumMinusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            
            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              saldoSkum < 0 ? 'bg-rose-950/80 text-rose-100 border-rose-800' : 'bg-sky-950/80 text-sky-100 border-sky-800'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${saldoSkum < 0 ? 'bg-rose-500/30 text-rose-300' : 'bg-sky-500/30 text-sky-300'}`}>
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    Analisis Breakdown & Penyebab Saldo Perkara SKUM ({filterTahun})
                  </h3>
                  <p className="text-xs opacity-80">
                    Menampilkan rincian Debet (Panjar Masuk) vs Kredit (Biaya Keluar) per bulan & daftar perkara yang kehabisan/minus panjar.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsSkumMinusModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Top Alert Banner */}
              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                saldoSkum < 0 
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
                  : 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200'
              }`}>
                <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-sm block">
                    {saldoSkum < 0 ? '⚠️ Peringatan: Saldo Total SKUM Perkara Minus!' : 'ℹ️ Ringkasan Posisi Saldo SKUM Perkara'}
                  </span>
                  <p className="mt-1 leading-relaxed">
                    Total Saldo Perkara SKUM saat ini adalah <strong className="font-mono">Rp {saldoSkum.toLocaleString('id-ID')}</strong> (Debet: Rp {totalDebet.toLocaleString('id-ID')} | Kredit: Rp {totalKredit.toLocaleString('id-ID')}). 
                    {monthlySkumBreakdown.filter(m => m.isMinus).length > 0 ? (
                      <> Terdeteksi <strong className="text-rose-600 dark:text-rose-400 font-bold">{monthlySkumBreakdown.filter(m => m.isMinus).length} bulan</strong> memiliki kredit pengeluaran biaya SKUM melebihi debet panjar masuk.</>
                    ) : (
                      <> Saldo SKUM dalam posisi aman dan tercatat dengan seimbang.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Monthly SKUM Breakdown Table */}
              <div>
                <h4 className="font-bold text-sm mb-2 text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>📊 Tabel Transaksi SKUM Per Bulan ({filterTahun}):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Klik baris bulan untuk melihat detail transaksi</span>
                </h4>

                <div className="border rounded-xl overflow-hidden shadow-xs border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b font-extrabold uppercase text-[10px] ${
                        isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}>
                        <th className="p-2.5">Bulan</th>
                        <th className="p-2.5 text-right">Debet / Panjar (Rp)</th>
                        <th className="p-2.5 text-right">Kredit / Biaya (Rp)</th>
                        <th className="p-2.5 text-right">Net Bulan Ini</th>
                        <th className="p-2.5 text-right">Saldo SKUM Akumulasi</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {monthlySkumBreakdown.map(m => {
                        const isSelected = selectedSkumMonth === m.monthNum;
                        return (
                          <tr 
                            key={m.monthNum}
                            onClick={() => setSelectedSkumMonth(m.monthNum)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-sky-50 dark:bg-sky-950/60 font-bold'
                                : m.isMinus
                                ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-2.5 font-bold flex items-center space-x-2">
                              <span>{m.monthName}</span>
                              {m.records.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                  {m.records.length} trx
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {m.debet > 0 ? `Rp ${m.debet.toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400">
                              {m.kredit > 0 ? `Rp ${m.kredit.toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className={`p-2.5 text-right font-mono font-bold ${
                              m.netMonth < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              Rp {m.netMonth.toLocaleString('id-ID')}
                            </td>
                            <td className={`p-2.5 text-right font-mono font-extrabold ${
                              m.runningCumulative < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'
                            }`}>
                              Rp {m.runningCumulative.toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-center">
                              {m.netMonth < 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                  ⚠️ MINUS (Rp {m.netMonth.toLocaleString('id-ID')})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  🟢 Positif
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSkumMonth(m.monthNum);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  isSelected 
                                    ? 'bg-sky-600 text-white' 
                                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-sky-500 hover:text-white'
                                }`}
                              >
                                {isSelected ? 'Dipilih' : 'Detail'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transactions Detail for Selected Month */}
              {selectedSkumMonth && (() => {
                const selMonthData = monthlySkumBreakdown.find(m => m.monthNum === selectedSkumMonth);
                if (!selMonthData) return null;

                return (
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-300 dark:border-slate-700">
                      <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span>🔍 Detail Transaksi SKUM Bulan {selMonthData.monthName} ({selMonthData.records.length} Transaksi)</span>
                        {selMonthData.netMonth < 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                            Penyebab SKUM Minus Bulan Ini
                          </span>
                        )}
                      </h5>
                      <span className="font-mono font-bold text-xs text-slate-600 dark:text-slate-300">
                        Net: Rp {selMonthData.netMonth.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {selMonthData.records.length === 0 ? (
                      <p className="text-slate-400 italic py-3 text-center">Tidak ada transaksi SKUM pada bulan {selMonthData.monthName}.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="font-bold border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                              <th className="p-2">Tanggal</th>
                              <th className="p-2">Nomor Perkara</th>
                              <th className="p-2">Uraian Transaksi</th>
                              <th className="p-2">Kategori</th>
                              <th className="p-2 text-right">Debet (Panjar)</th>
                              <th className="p-2 text-right">Kredit (Pengeluaran)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {selMonthData.records.map(r => (
                              <tr key={r.id} className={r.pengeluaran > 0 ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                                <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{r.tanggal}</td>
                                <td className="p-2 font-mono font-bold text-sky-700 dark:text-sky-400">{r.nomorPerkara || '-'}</td>
                                <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">
                                  {r.uraian}
                                  {r.keterangan && <span className="block text-[10px] text-slate-400 mt-0.5 font-normal">{r.keterangan}</span>}
                                </td>
                                <td className="p-2">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {r.kategori}
                                  </span>
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {r.penerimaan > 0 ? `Rp ${r.penerimaan.toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                  {r.pengeluaran > 0 ? `Rp ${r.pengeluaran.toLocaleString('id-ID')}` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Cases with zero or negative balance */}
              <div>
                <h4 className="font-bold text-sm mb-2 text-slate-800 dark:text-slate-200">
                  ⚠️ Daftar Perkara Dengan Saldo SKUM Habis / Minus ({cases.filter(c => (c.saldoPerkara || 0) <= 0).length} Perkara):
                </h4>
                {cases.filter(c => (c.saldoPerkara || 0) <= 0).length === 0 ? (
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium italic">
                    Semua perkara terdaftar memiliki saldo panjar tersisa dalam batas aman.
                  </p>
                ) : (
                  <div className="border rounded-xl overflow-hidden border-slate-300 dark:border-slate-800">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px]">
                          <th className="p-2">Nomor Perkara</th>
                          <th className="p-2">Pihak Utama</th>
                          <th className="p-2">Jenis Perkara</th>
                          <th className="p-2">Tgl Register</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Saldo Tersisa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {cases.filter(c => (c.saldoPerkara || 0) <= 0).map(c => (
                          <tr key={c.id} className="bg-rose-50/50 dark:bg-rose-950/30">
                            <td className="p-2 font-mono font-bold text-rose-700 dark:text-rose-400">{c.nomorPerkara}</td>
                            <td className="p-2 font-medium">{c.namaPihak}</td>
                            <td className="p-2">{c.jenisPerkara}</td>
                            <td className="p-2 font-mono">{c.tanggalRegister || '-'}</td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-200 text-rose-900">
                                {c.status}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                              Rp {(c.saldoPerkara || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex justify-end shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setIsSkumMinusModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Tutup Analisis
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
