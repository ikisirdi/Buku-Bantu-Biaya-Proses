import React, { useState, useMemo } from 'react';
import { BiayaProsesRecord, CaseRecord } from '../types';
import { 
  Printer, 
  PlusCircle, 
  Scissors, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  FileText,
  AlertTriangle,
  Zap,
  Table,
  Download,
  Copy,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { SyncSettings } from '../types';

interface BukuBiayaProsesProps {
  records: BiayaProsesRecord[];
  cases: CaseRecord[];
  onAddRecord: (record: Omit<BiayaProsesRecord, 'id' | 'createdAt'>) => void;
  onUpdateRecord: (record: BiayaProsesRecord) => void;
  onDeleteRecord: (id: string) => void;
  onPotongAtkPerkara: (caseNumber: string, amount: number, uraian: string, tanggal: string) => void;
  onZeroOutCaseBalance?: (caseNumber: string, generatedItems: { uraian: string; amount: number; kategori: 'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Lainnya' }[]) => void;
  onSyncSpreadsheet?: () => void;
  syncSettings?: SyncSettings;
  theme?: 'light' | 'dark';
}

export const MONTH_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const STANDARD_URAIAN_OPTIONS = [
  { label: 'Pemotongan Panjar ATK Pendaftaran Perkara', jenis: 'penerimaan', kategori: 'ATK' },
  { label: 'Pemotongan Biaya Proses / Pengelolaan ATK Perkara', jenis: 'penerimaan', kategori: 'Proses' },
  { label: 'Pengadaan Kertas HVS A4/F4 Berkas Perkara', jenis: 'pengeluaran', kategori: 'ATK' },
  { label: 'Pengadaan Stopmap & Map Perkara', jenis: 'pengeluaran', kategori: 'ATK' },
  { label: 'Pengadaan Tinta Printer Berkas Perkara', jenis: 'pengeluaran', kategori: 'ATK' },
  { label: 'Pengadaan Ballpoint, Pensil & Tipe-X', jenis: 'pengeluaran', kategori: 'ATK' },
  { label: 'Pengadaan Stapler, Isi Staples & Paper Clip', jenis: 'pengeluaran', kategori: 'ATK' },
  { label: 'Biaya Panggilan / Relaas Sidang Pertama (e-Summons / Pos)', jenis: 'pengeluaran', kategori: 'Panggilan' },
  { label: 'Biaya Pemberitahuan Isi Putusan / Penetapan', jenis: 'pengeluaran', kategori: 'Panggilan' },
  { label: 'Pembelian Meterai Tempel Putusan & Penetapan', jenis: 'pengeluaran', kategori: 'Meterai' },
  { label: 'Biaya Redaksi Putusan / Penetapan Perkara', jenis: 'pengeluaran', kategori: 'Redaksi' },
  { label: 'Biaya Pengiriman Surat / Dokumen Perkara via PT Pos', jenis: 'pengeluaran', kategori: 'Proses' },
  { label: 'Pengembalian Sisa Panjar Perkara ke Pihak', jenis: 'pengeluaran', kategori: 'Proses' },
  { label: 'Setoran PNBP Biaya Pendaftaran & Redaksi ke Kas Negara', jenis: 'pengeluaran', kategori: 'Proses' },
];

export const BukuBiayaProses: React.FC<BukuBiayaProsesProps> = ({
  records,
  cases,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onPotongAtkPerkara,
  onZeroOutCaseBalance,
  onSyncSpreadsheet,
  syncSettings,
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const [selectedMonth, setSelectedMonth] = useState<string>('JULI'); // Default current month July 2026
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAtkModalOpen, setIsAtkModalOpen] = useState<boolean>(false);

  // States for Auto-Zeroing Saldo Perkara Modal
  const [isZeroingModalOpen, setIsZeroingModalOpen] = useState<boolean>(false);
  const [selectedZeroingCase, setSelectedZeroingCase] = useState<CaseRecord | null>(null);
  const [zeroingItems, setZeroingItems] = useState<{ uraian: string; amount: number; kategori: 'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Lainnya' }[]>([]);

  // States for Spreadsheet Column Structure Guide Modal
  const [isSpreadsheetGuideOpen, setIsSpreadsheetGuideOpen] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  // Form states for manual entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTanggal, setFormTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNomorPerkara, setFormNomorPerkara] = useState<string>('');
  const [formUraian, setFormUraian] = useState<string>('');
  const [formJenis, setFormJenis] = useState<'penerimaan' | 'pengeluaran'>('penerimaan');
  const [formJumlah, setFormJumlah] = useState<number>(100000);
  const [formKeterangan, setFormKeterangan] = useState<string>('-');
  const [formKategori, setFormKategori] = useState<'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Lainnya'>('ATK');

  // Form states for ATK deduction
  const [atkCaseNumber, setAtkCaseNumber] = useState<string>(cases[0]?.nomorPerkara || '14/Pdt.G/2026/PA.Pan');
  const [atkAmount, setAtkAmount] = useState<number>(100000);
  const [atkTanggal, setAtkTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [atkUraian, setAtkUraian] = useState<string>('Pemotongan Panjar ATK Pendaftaran Perkara');

  // Calculation for cases with non-zero balance & deadline check
  const pendingCasesWithBalance = useMemo(() => {
    const now = new Date();
    return cases.map(c => {
      if (!c.saldoPerkara || c.saldoPerkara <= 0) return null;
      
      const regDate = new Date(c.tanggalRegister || now);
      const isPutus = ['Putus', 'Minutasi', 'Selesai', 'Arsip'].includes(c.status);
      
      let maxMonths = 5; // Default Tingkat Pertama (5 bulan)
      let refDate = regDate;

      if (c.tingkatPerkara === 'Tingkat Banding') {
        maxMonths = 3; // Banding (3 bulan)
      } else if (c.tingkatPerkara === 'Kasasi / PK') {
        maxMonths = 3; // Kasasi / PK (3 bulan dari tanggal terima kasasi)
        if (c.tanggalTerimaKasasiPk) {
          refDate = new Date(c.tanggalTerimaKasasiPk);
        }
      }

      const monthsElapsed = (now.getFullYear() - refDate.getFullYear()) * 12 + (now.getMonth() - refDate.getMonth());
      const isOverdue = monthsElapsed >= maxMonths || isPutus;

      return {
        ...c,
        monthsElapsed,
        maxMonths,
        isOverdue,
        isPutus
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);
  }, [cases]);

  // Open Zeroing Generator Modal
  const handleOpenZeroingModal = (c: CaseRecord) => {
    setSelectedZeroingCase(c);
    const S = c.saldoPerkara;
    
    // Auto-generate realistic case needs items summing exactly to S
    if (S <= 0) return;

    if (S >= 100000) {
      const kertasAmt = 45000;
      const tintaAmt = 35000;
      const posAmt = S - kertasAmt - tintaAmt;

      setZeroingItems([
        { uraian: `Pembelian Kertas HVS A4 80gr & Stopmap Snelhecter (${c.nomorPerkara})`, amount: kertasAmt, kategori: 'ATK' },
        { uraian: `Pengadaan Tinta Printer & Alat Tulis Pemberkasan Putusan`, amount: tintaAmt, kategori: 'ATK' },
        { uraian: `Biaya Pengiriman Surat Relaas / Dokumen Putusan via PT Pos`, amount: posAmt > 0 ? posAmt : 20000, kategori: 'Proses' }
      ]);
    } else if (S >= 50000) {
      const kertasAmt = 30000;
      const posAmt = S - kertasAmt;

      setZeroingItems([
        { uraian: `Pembelian Kertas HVS F4 & Map Snelhecter Berkas Perkara`, amount: kertasAmt, kategori: 'ATK' },
        { uraian: `Biaya Pengiriman Dokumen / PBT Putusan via PT Pos`, amount: posAmt, kategori: 'Proses' }
      ]);
    } else {
      setZeroingItems([
        { uraian: `Pembelian ATK & Pembungkus Berkas Putusan (${c.nomorPerkara})`, amount: S, kategori: 'ATK' }
      ]);
    }

    setIsZeroingModalOpen(true);
  };

  // Submit Zeroing
  const handleConfirmZeroing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZeroingCase || zeroingItems.length === 0) return;

    if (onZeroOutCaseBalance) {
      onZeroOutCaseBalance(selectedZeroingCase.nomorPerkara, zeroingItems);
    } else {
      // Fallback manual records creation
      const today = new Date().toISOString().split('T')[0];
      zeroingItems.forEach(item => {
        onAddRecord({
          tanggal: today,
          nomorPerkara: selectedZeroingCase.nomorPerkara,
          uraian: item.uraian,
          penerimaan: 0,
          pengeluaran: item.amount,
          keterangan: 'Auto-Zeroing Saldo Putus',
          kategori: item.kategori
        });
      });
    }

    setIsZeroingModalOpen(false);
  };

  // Filter records by Month & Year & Search
  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      const [yr, mo] = item.tanggal.split('-');
      const monthIdx = parseInt(mo, 10) - 1;
      const monthName = MONTH_NAMES[monthIdx];

      if (selectedYear !== 'ALL' && yr !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && monthName !== selectedMonth) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNo = item.nomorPerkara.toLowerCase().includes(q);
        const matchUraian = item.uraian.toLowerCase().includes(q);
        const matchKet = (item.keterangan || '').toLowerCase().includes(q);
        if (!matchNo && !matchUraian && !matchKet) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [records, selectedMonth, selectedYear, searchQuery]);

  // Summaries
  const totalPenerimaan = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.penerimaan || 0), 0);
  }, [filteredRecords]);

  const totalPengeluaran = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.pengeluaran || 0), 0);
  }, [filteredRecords]);

  const saldoBiayaProses = totalPenerimaan - totalPengeluaran;

  // Cumulative all-time balance up to selected month
  const totalAllTimePenerimaan = useMemo(() => records.reduce((s, r) => s + (r.penerimaan || 0), 0), [records]);
  const totalAllTimePengeluaran = useMemo(() => records.reduce((s, r) => s + (r.pengeluaran || 0), 0), [records]);
  const saldoAkumulasi = totalAllTimePenerimaan - totalAllTimePengeluaran;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleOpenAddModal = (existingRecord?: BiayaProsesRecord) => {
    if (existingRecord) {
      setEditingId(existingRecord.id);
      setFormTanggal(existingRecord.tanggal);
      setFormNomorPerkara(existingRecord.nomorPerkara);
      setFormUraian(existingRecord.uraian);
      if (existingRecord.penerimaan > 0) {
        setFormJenis('penerimaan');
        setFormJumlah(existingRecord.penerimaan);
      } else {
        setFormJenis('pengeluaran');
        setFormJumlah(existingRecord.pengeluaran);
      }
      setFormKeterangan(existingRecord.keterangan || '-');
      setFormKategori(existingRecord.kategori || 'ATK');
    } else {
      setEditingId(null);
      setFormTanggal(new Date().toISOString().split('T')[0]);
      setFormNomorPerkara('');
      setFormUraian('');
      setFormJenis('penerimaan');
      setFormJumlah(100000);
      setFormKeterangan('-');
      setFormKategori('ATK');
    }
    setIsAddModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUraian) return;

    if (editingId) {
      onUpdateRecord({
        id: editingId,
        tanggal: formTanggal,
        nomorPerkara: formNomorPerkara || '-',
        uraian: formUraian,
        penerimaan: formJenis === 'penerimaan' ? formJumlah : 0,
        pengeluaran: formJenis === 'pengeluaran' ? formJumlah : 0,
        keterangan: formKeterangan,
        kategori: formKategori,
        createdAt: new Date().toISOString()
      });
    } else {
      onAddRecord({
        tanggal: formTanggal,
        nomorPerkara: formNomorPerkara || '-',
        uraian: formUraian,
        penerimaan: formJenis === 'penerimaan' ? formJumlah : 0,
        pengeluaran: formJenis === 'pengeluaran' ? formJumlah : 0,
        keterangan: formKeterangan,
        kategori: formKategori
      });
    }

    setIsAddModalOpen(false);
  };

  const handleConfirmAtkDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atkCaseNumber) return;

    onPotongAtkPerkara(
      atkCaseNumber,
      atkAmount,
      atkUraian || `Pemotongan Panjar ATK Perkara ${atkCaseNumber}`,
      atkTanggal
    );

    setIsAtkModalOpen(false);
  };

  const handlePrintTrigger = () => {
    setIsPrintModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Pad printable table rows to at least 13 rows for standard register appearance
  const printRows = useMemo(() => {
    const rows = [...filteredRecords];
    const minRows = 13;
    const missing = minRows - rows.length;
    return { rows, missingCount: missing > 0 ? missing : 0 };
  }, [filteredRecords]);

  return (
    <div className="space-y-6 w-full">
      
      {/* HEADER TITLE & QUICK TOOLS */}
      <div className={`border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-lg font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Buku Bantu Biaya Proses
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}>
                PA Paniai 2026
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Pencatatan log transaksi penerimaan pemotongan ATK perkara dan pengeluaran biaya proses serta rekap bulanan cetak resmi.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Sync / Force Reload Button */}
          {onSyncSpreadsheet && (
            <button
              id="sync-spreadsheet-buku-btn"
              onClick={onSyncSpreadsheet}
              className={`flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-800/60'
              }`}
              title="Muat ulang dan sinkronkan data langsung dari Google Spreadsheet"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Muat dari Spreadsheet</span>
            </button>
          )}

          {/* Spreadsheet Structure Guide Button */}
          <button
            id="spreadsheet-guide-btn"
            onClick={() => setIsSpreadsheetGuideOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
              isLight 
                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200' 
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-cyan-800/60'
            }`}
            title="Lihat struktur kolom CSV/Spreadsheet yang direkomendasikan"
          >
            <Table className="w-4 h-4 text-cyan-600" />
            <span className="hidden sm:inline">Struktur Spreadsheet</span>
          </button>

          {/* Deduct ATK Button */}
          <button
            id="deduct-atk-btn"
            onClick={() => setIsAtkModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            title="Potong biaya ATK dari panjar perkara masuk"
          >
            <Scissors className="w-4 h-4 text-emerald-100" />
            <span>Potong ATK Perkara</span>
          </button>

          {/* Add Manual Transaction */}
          <button
            id="add-biaya-proses-btn"
            onClick={() => handleOpenAddModal()}
            className={`flex items-center space-x-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all ${
              isLight 
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' 
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-800/60'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Transaksi</span>
          </button>

          {/* Print Button */}
          <button
            id="print-buku-bantu-btn"
            onClick={handlePrintTrigger}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Bulanan</span>
          </button>
        </div>
      </div>

      {/* SYNC STATUS BANNER */}
      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
        isLight ? 'bg-blue-50/80 border-blue-200 text-blue-900' : 'bg-slate-900/90 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center space-x-2.5">
          <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-xs">
              Mekanisme Sinkronisasi Google Sheets & Memori Aplikasi:
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              1) <strong>Membaca Data:</strong> Tombol <span className="font-bold">"Muat dari Spreadsheet"</span> akan langsung memperbarui tabel di aplikasi dari Google Sheets publik (tab LogTransaksi / CSV).
              <br />
              2) <strong>Menulis Data:</strong> Agar perubahan nilai (misal penerimaan Februari) di aplikasi otomatis terkirim kembali ke Google Sheets, pastikan <span className="font-bold">Webhook Apps Script</span> telah terpasang di menu Sinkronisasi.
            </p>
          </div>
        </div>
        {onSyncSpreadsheet && (
          <button
            onClick={onSyncSpreadsheet}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            Muat Ulang Sekarang
          </button>
        )}
      </div>

      {/* ALERT BANNER: PENGINGAT PERKARA PUTUS/KADALUARSA DENGAN SALDO SISA */}
      {pendingCasesWithBalance.length > 0 && (
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-colors ${
          isLight 
            ? 'bg-rose-50/90 border-rose-200 text-slate-800' 
            : 'bg-rose-950/40 border-rose-800/80 text-slate-100'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-rose-700 dark:text-rose-400">
                    Pengingat Saldo Mengendap ({pendingCasesWithBalance.length} Perkara)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300">
                    Aturan SE/SK MA
                  </span>
                </div>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Perkara yang sudah <strong>Putus</strong> atau berjalan melebihi batas waktu <strong>(Tingkat Pertama: 5 bulan, Banding: 3 bulan, Kasasi/PK: 3 bulan)</strong> tidak boleh menyisakan saldo biaya proses. Gunakan fitur <strong>⚡ Auto-Zeroing (Saldo Rp0)</strong> untuk langsung mengalokasikan pengeluaran resmi hingga saldo menjadi Rp0.
              </p>

              {/* Table of overdue cases with non-zero balance */}
              <div className="mt-3 overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-100/60 dark:bg-rose-950/80 font-bold text-rose-900 dark:text-rose-200 border-b border-rose-200 dark:border-rose-800">
                    <tr>
                      <th className="px-3 py-2">NOMOR PERKARA</th>
                      <th className="px-3 py-2">TINGKAT / STATUS</th>
                      <th className="px-3 py-2">REGISTER</th>
                      <th className="px-3 py-2 text-right">SISA SALDO</th>
                      <th className="px-3 py-2 text-center">AKSI HABISKAN SALDO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                    {pendingCasesWithBalance.map(c => (
                      <tr key={c.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-900/20">
                        <td className="px-3 py-2 font-mono font-bold text-rose-700 dark:text-rose-300">
                          {c.nomorPerkara}
                          <p className="text-[10px] font-normal text-slate-500">{c.namaPihak}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            {c.tingkatPerkara || 'Tingkat Pertama'}
                          </span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.isPutus ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status} ({c.monthsElapsed} Bulan)
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                          {formatShortDate(c.tanggalRegister)}
                        </td>
                        <td className="px-3 py-2 text-right font-black text-rose-600 dark:text-rose-400">
                          {formatRupiah(c.saldoPerkara)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleOpenZeroingModal(c)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg font-bold text-[11px] shadow-xs flex items-center space-x-1 mx-auto transition-transform active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Auto-Zeroing (Rp0)</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FILTER BAR & SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Penerimaan */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total Penerimaan ({selectedMonth})
            </span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{formatRupiah(totalPenerimaan)}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Total Pengeluaran ({selectedMonth})
            </span>
            <p className="text-lg font-black text-rose-600 mt-0.5">{formatRupiah(totalPengeluaran)}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-950/60 border-rose-800/80 text-rose-400'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Saldo Buku Bantu */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Saldo Kas Buku Bantu ({selectedMonth})
            </span>
            <p className="text-lg font-black text-amber-600 mt-0.5">{formatRupiah(saldoBiayaProses)}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/60 border-amber-800/80 text-amber-400'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Akumulasi Kas Tahun 2026 */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-lg'
        }`}>
          <div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Saldo Kas Akumulasi 2026
            </span>
            <p className="text-lg font-black text-cyan-600 mt-0.5">{formatRupiah(saldoAkumulasi)}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-950/60 border-cyan-800/80 text-cyan-400'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* MONTHLY REKAP SELECTOR & SEARCH BAR */}
      <div className={`border rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800 shadow-lg'
      }`}>
        
        {/* Month Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedMonth === 'ALL'
                ? 'bg-amber-600 text-white shadow-sm'
                : isLight 
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Semua Bulan
          </button>
          {MONTH_NAMES.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedMonth === m
                  ? 'bg-amber-600 text-white shadow-sm'
                  : isLight 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Cari uraian, nomor perkara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                : 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500'
            }`}
          />
        </div>

      </div>

      {/* LOG TRANSAKSI TABLE (DISPLAY VIEW) */}
      <div className={`border rounded-2xl shadow-sm overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        
        <div className={`px-5 py-3 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-800'
        }`}>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Log Transaksi Buku Bantu Biaya Proses ({selectedMonth === 'ALL' ? 'Tahun 2026' : `Bulan ${selectedMonth} 2026`})
            </h3>
          </div>
          <span className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Total {filteredRecords.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b font-extrabold uppercase tracking-wider ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}>
              <tr>
                <th className="px-3 py-3 text-center w-12">NO</th>
                <th className="px-3 py-3 w-28">TANGGAL</th>
                <th className="px-3 py-3 w-44">NOMOR PERKARA</th>
                <th className="px-4 py-3">URAIAN</th>
                <th className="px-4 py-3 text-right w-36">PENERIMAAN (RP)</th>
                <th className="px-4 py-3 text-right w-36">PENGELUARAN (RP)</th>
                <th className="px-3 py-3 w-32">KET</th>
                <th className="px-3 py-3 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800 bg-slate-900/40'}`}>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`text-center py-12 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Belum ada log transaksi untuk bulan {selectedMonth}. Gunakan tombol "+ Log Transaksi" atau "Potong ATK Perkara" untuk menambah data.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => (
                  <tr key={item.id} className={`transition-colors ${isLight ? 'hover:bg-amber-50/40' : 'hover:bg-slate-800/60'}`}>
                    <td className={`px-3 py-2.5 text-center font-bold ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{idx + 1}</td>
                    <td className={`px-3 py-2.5 font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{formatShortDate(item.tanggal)}</td>
                    <td className="px-3 py-2.5 font-mono font-extrabold text-amber-700">{item.nomorPerkara}</td>
                    <td className={`px-4 py-2.5 font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{item.uraian}</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-emerald-700">
                      {item.penerimaan > 0 ? formatRupiah(item.penerimaan) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-rose-700">
                      {item.pengeluaran > 0 ? formatRupiah(item.pengeluaran) : '-'}
                    </td>
                    <td className={`px-3 py-2.5 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.keterangan || '-'}</td>
                    <td className="px-3 py-2.5 text-center space-x-1">
                      <button
                        onClick={() => handleOpenAddModal(item)}
                        className={`p-1 rounded transition-colors ${
                          isLight ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                        }`}
                        title="Edit Log Transaksi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Hapus log transaksi ini dari Buku Bantu Biaya Proses?')) {
                            onDeleteRecord(item.id);
                          }
                        }}
                        className={`p-1 rounded transition-colors ${
                          isLight ? 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700' : 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400'
                        }`}
                        title="Hapus Log Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className={`font-bold border-t-2 ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-800/90 border-slate-700 text-slate-100'
            }`}>
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider">
                  JUMLAH TOTAL BULAN {selectedMonth}:
                </td>
                <td className="px-4 py-3 text-right text-emerald-700 font-black">{formatRupiah(totalPenerimaan)}</td>
                <td className="px-4 py-3 text-right text-rose-700 font-black">{formatRupiah(totalPengeluaran)}</td>
                <td colSpan={2} className="px-3 py-3 text-amber-700 text-center font-black">
                  SALDO: {formatRupiah(saldoBiayaProses)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      {/* MODAL 1: DEDUCT ATK FROM CASE */}
      {isAtkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-slate-900">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Scissors className="w-5 h-5" />
                <h3 className="font-bold text-slate-100 text-base">Potong Biaya ATK Masuk Buku Bantu</h3>
              </div>
              <button onClick={() => setIsAtkModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAtkDeduction} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pilih Nomor Perkara</label>
                  <select
                    value={atkCaseNumber}
                    onChange={(e) => setAtkCaseNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono font-bold"
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.nomorPerkara}>
                        {c.nomorPerkara} - {c.namaPihak} ({c.jenisPerkara})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nominal Pemotongan ATK (Rp)</label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    required
                    value={atkAmount}
                    onChange={(e) => setAtkAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={atkTanggal}
                    onChange={(e) => setAtkTanggal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pilih Uraian Standar (Atau Ketik Kustom)</label>
                  <select
                    value={STANDARD_URAIAN_OPTIONS.some(o => o.label === atkUraian) ? atkUraian : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setAtkUraian(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 mb-2 text-xs"
                  >
                    {STANDARD_URAIAN_OPTIONS.map((opt, i) => (
                      <option key={i} value={opt.label}>{opt.label}</option>
                    ))}
                    <option value="custom">-- Tulis Uraian Kustom Lainnya --</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Deskripsi uraian transaksi..."
                    value={atkUraian}
                    onChange={(e) => setAtkUraian(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div className="p-4 flex justify-end space-x-2 border-t border-slate-800 shrink-0 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAtkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md shadow-emerald-900/40 transition-colors"
                >
                  Masuk ke Buku Bantu Biaya Proses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT TRANSACTION MANUAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-slate-900">
              <div className="flex items-center space-x-2 text-amber-400">
                <PlusCircle className="w-5 h-5" />
                <h3 className="font-bold text-slate-100 text-base">
                  {editingId ? 'Edit Log Transaksi' : 'Input Log Transaksi Baru'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex flex-col flex-1 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* QUICK PRESET BUTTONS */}
                <div className="bg-slate-800/70 border border-slate-700/80 p-2.5 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    ⚡ Tombol Cepat Preset Detail ATK & Transaksi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('penerimaan');
                        setFormUraian('Pemotongan Panjar ATK Pendaftaran Perkara');
                        setFormJumlah(100000);
                        setFormKategori('ATK');
                        setFormKeterangan('Pengelolaan ATK Pendaftaran');
                      }}
                      className="px-2.5 py-1 bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded font-bold hover:bg-emerald-900 transition-colors"
                    >
                      📥 Pemasukan ATK Pendaftaran (Rp 100.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Pengadaan Kertas HVS A4/F4 Berkas Perkara');
                        setFormJumlah(45000);
                        setFormKategori('ATK');
                        setFormKeterangan('Beli Kertas HVS');
                      }}
                      className="px-2.5 py-1 bg-amber-950/80 border border-amber-700 text-amber-300 rounded font-semibold hover:bg-amber-900 transition-colors"
                    >
                      📄 Kertas HVS (Rp 45.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Pengadaan Stopmap & Map Perkara');
                        setFormJumlah(15000);
                        setFormKategori('ATK');
                        setFormKeterangan('Stopmap Berkas');
                      }}
                      className="px-2.5 py-1 bg-amber-950/80 border border-amber-700 text-amber-200 rounded font-semibold hover:bg-amber-900 transition-colors"
                    >
                      📁 Stopmap Perkara (Rp 15.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Pengadaan Tinta Printer Berkas Perkara');
                        setFormJumlah(35000);
                        setFormKategori('ATK');
                        setFormKeterangan('Tinta Printer');
                      }}
                      className="px-2.5 py-1 bg-blue-950/80 border border-blue-700 text-blue-300 rounded font-semibold hover:bg-blue-900 transition-colors"
                    >
                      🖨️ Tinta Printer (Rp 35.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Pengadaan Ballpoint, Pensil & Tipe-X');
                        setFormJumlah(15000);
                        setFormKategori('ATK');
                        setFormKeterangan('Ballpoint & Alat Tulis');
                      }}
                      className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-700 text-indigo-300 rounded font-semibold hover:bg-indigo-900 transition-colors"
                    >
                      ✏️ Ballpoint & Alat Tulis (Rp 15.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Pengadaan Stapler, Isi Staples & Paper Clip');
                        setFormJumlah(10000);
                        setFormKategori('ATK');
                        setFormKeterangan('Staples & Klip');
                      }}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-600 text-slate-200 rounded font-semibold hover:bg-slate-700 transition-colors"
                    >
                      📎 Stapler & Klip (Rp 10.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Pembelian Meterai Tempel Putusan & Penetapan');
                        setFormJumlah(10000);
                        setFormKategori('Meterai');
                        setFormKeterangan('Meterai Tempel 10000');
                      }}
                      className="px-2.5 py-1 bg-purple-950/80 border border-purple-700 text-purple-300 rounded font-semibold hover:bg-purple-900 transition-colors"
                    >
                      🏷️ Meterai (Rp 10.000)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormJenis('pengeluaran');
                        setFormUraian('Biaya Pengiriman Surat Relaas / Dokumen Putusan via PT Pos');
                        setFormJumlah(20000);
                        setFormKategori('Proses');
                        setFormKeterangan('PT Pos Indonesia');
                      }}
                      className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-700 text-cyan-300 rounded font-semibold hover:bg-cyan-900 transition-colors"
                    >
                      📮 Pos / Relaas (Rp 20.000)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tanggal Transaksi (Kolom 2)</label>
                    <input
                      type="date"
                      required
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Jenis Transaksi</label>
                    <select
                      value={formJenis}
                      onChange={(e) => setFormJenis(e.target.value as 'penerimaan' | 'pengeluaran')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold"
                    >
                      <option value="penerimaan">Penerimaan / Masuk (Kolom 5)</option>
                      <option value="pengeluaran">Pengeluaran / Beli ATK (Kolom 6)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Perkara (Kolom 3 - Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 14/Pdt.G/2026/PA.Pan atau -"
                    value={formNomorPerkara}
                    onChange={(e) => setFormNomorPerkara(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Uraian Keperluan ATK / Transaksi * (Kolom 4)</label>
                  <select
                    value={STANDARD_URAIAN_OPTIONS.some(o => o.label === formUraian) ? formUraian : 'custom'}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      if (selectedVal !== 'custom') {
                        setFormUraian(selectedVal);
                        const matched = STANDARD_URAIAN_OPTIONS.find(o => o.label === selectedVal);
                        if (matched) {
                          setFormJenis(matched.jenis as 'penerimaan' | 'pengeluaran');
                          setFormKategori(matched.kategori as any);
                        }
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 mb-2 text-xs"
                  >
                    <option value="custom">-- Pilih Template / Ketik Sendiri --</option>
                    {STANDARD_URAIAN_OPTIONS.map((opt, i) => (
                      <option key={i} value={opt.label}>
                        [{opt.jenis === 'penerimaan' ? 'PENERIMAAN' : 'PENGELUARAN'}] {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Deskripsi transaksi..."
                    value={formUraian}
                    onChange={(e) => setFormUraian(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Jumlah Nominal (Rp) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="Contoh: 100000"
                      value={formJumlah === 0 ? '' : formJumlah}
                      onChange={(e) => setFormJumlah(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kategori</label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                    >
                      <option value="ATK">Pemotongan ATK</option>
                      <option value="Proses">Biaya Proses</option>
                      <option value="Meterai">Meterai</option>
                      <option value="Redaksi">Redaksi</option>
                      <option value="Panggilan">Panggilan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keterangan / Penerima / PT Pos (Kolom 7)</label>
                  <input
                    type="text"
                    value={formKeterangan}
                    onChange={(e) => setFormKeterangan(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-4 flex justify-end space-x-2 border-t border-slate-800 shrink-0 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-md shadow-amber-900/40 transition-colors"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK / PRINT PREVIEW EXACT TO USER SPECIFICATIONS */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-black w-full max-w-4xl rounded-xl shadow-2xl p-6 sm:p-10 space-y-6 my-auto print:p-0 print:shadow-none print:w-full print:max-w-none">
            
            {/* Print Modal Header Action Bar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-300 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-800 text-sm sm:text-base">
                  Pratinjau Cetak Resmi - BUKU BANTU BIAYA PROSES
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-md transition-colors flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE DOCUMENT CONTENT (STRICT USER SPECIFICATION FORMAT) */}
            <div id="printable-buku-bantu" className="space-y-6 font-serif text-black leading-tight">
              
              {/* Document Header */}
              <div className="text-center font-bold space-y-1">
                <h1 className="text-base sm:text-lg tracking-wide uppercase">BUKU BANTU BIAYA PROSES</h1>
                <h2 className="text-sm sm:text-base tracking-wider uppercase">PENGADILAN AGAMA PANIAI</h2>
                <h3 className="text-xs sm:text-sm tracking-widest">TAHUN 2026</h3>
                <p className="text-xs sm:text-sm pt-2">
                  BULAN : <span className="border-b border-dotted border-black px-4 font-mono uppercase">{selectedMonth === 'ALL' ? '...................................' : selectedMonth}</span>
                </p>
              </div>

              {/* Document Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-black text-center">
                  <thead>
                    <tr className="font-bold uppercase bg-gray-100 border-b border-black">
                      <th className="border border-black p-2 w-8" rowSpan={2}>NO</th>
                      <th className="border border-black p-2 w-24" rowSpan={2}>TANGGAL</th>
                      <th className="border border-black p-2 w-36" rowSpan={2}>NOMOR PERKARA</th>
                      <th className="border border-black p-2" rowSpan={2}>URAIAN</th>
                      <th className="border border-black p-2" colSpan={2}>JUMLAH</th>
                      <th className="border border-black p-2 w-24" rowSpan={2}>KET</th>
                    </tr>
                    <tr className="font-bold uppercase bg-gray-100 border-b border-black">
                      <th className="border border-black p-1.5 w-28">PENERIMAAN</th>
                      <th className="border border-black p-1.5 w-28">PENGELUARAN</th>
                    </tr>
                    {/* Column index indicator row (1..7) */}
                    <tr className="bg-gray-200 font-bold border-b border-black text-[10px]">
                      <td className="border border-black py-0.5">1</td>
                      <td className="border border-black py-0.5">2</td>
                      <td className="border border-black py-0.5">3</td>
                      <td className="border border-black py-0.5">4</td>
                      <td className="border border-black py-0.5">5</td>
                      <td className="border border-black py-0.5">6</td>
                      <td className="border border-black py-0.5">7</td>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Actual Rows */}
                    {printRows.rows.map((r, i) => (
                      <tr key={r.id} className="border-b border-black text-[11px]">
                        <td className="border border-black py-1 px-1 font-bold">{i + 1}</td>
                        <td className="border border-black py-1 px-1">{formatShortDate(r.tanggal)}</td>
                        <td className="border border-black py-1 px-1 font-mono font-semibold">{r.nomorPerkara}</td>
                        <td className="border border-black py-1 px-2 text-left">{r.uraian}</td>
                        <td className="border border-black py-1 px-2 text-right">
                          {r.penerimaan > 0 ? r.penerimaan.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="border border-black py-1 px-2 text-right">
                          {r.pengeluaran > 0 ? r.pengeluaran.toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="border border-black py-1 px-1 text-left">{r.keterangan || '-'}</td>
                      </tr>
                    ))}

                    {/* Empty Padding Rows to guarantee clean register look */}
                    {Array.from({ length: printRows.missingCount }).map((_, idx) => {
                      const rowNum = printRows.rows.length + idx + 1;
                      return (
                        <tr key={`empty-${idx}`} className="border-b border-black text-[11px] h-7">
                          <td className="border border-black py-1 px-1 font-bold">{rowNum}</td>
                          <td className="border border-black py-1 px-1"></td>
                          <td className="border border-black py-1 px-1"></td>
                          <td className="border border-black py-1 px-2"></td>
                          <td className="border border-black py-1 px-2"></td>
                          <td className="border border-black py-1 px-2"></td>
                          <td className="border border-black py-1 px-1"></td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    <tr className="font-bold bg-gray-100 border-t-2 border-black text-xs">
                      <td colSpan={4} className="border border-black p-2 text-right uppercase">JUMLAH TOTAL</td>
                      <td className="border border-black p-2 text-right font-mono">
                        Rp {totalPenerimaan.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-black p-2 text-right font-mono">
                        Rp {totalPengeluaran.toLocaleString('id-ID')}
                      </td>
                      <td className="border border-black p-2"></td>
                    </tr>
                    <tr className="font-bold bg-gray-100 border-t border-black text-xs">
                      <td colSpan={4} className="border border-black p-2 text-right uppercase">SALDO KAS BUKU BANTU BIAYA PROSES</td>
                      <td colSpan={3} className="border border-black p-2 text-center font-mono font-extrabold">
                        Rp {saldoBiayaProses.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Document Signatures (Exact to user prompt template) */}
              <div className="pt-8 grid grid-cols-2 text-xs font-serif leading-relaxed">
                
                {/* Left Signature: Panitera */}
                <div className="text-left space-y-16">
                  <div>
                    <p className="font-bold">Mengetahui,</p>
                    <p>Panitera</p>
                  </div>
                  <div className="pt-12">
                    <p className="font-bold underline uppercase tracking-wide">ACHMAD HABIBUL ALIM MAPPIASSE, S.H.I., M.H.</p>
                    <p>NIP. 199210182019031003</p>
                  </div>
                </div>

                {/* Right Signature: Petugas Biaya Proses */}
                <div className="text-right space-y-16">
                  <div>
                    <p>
                      Paniai, <span className="border-b border-dotted border-black px-2">{new Date().getDate()} {selectedMonth === 'ALL' ? MONTH_NAMES[new Date().getMonth()] : selectedMonth} 2026</span>
                    </p>
                    <p>Petugas Biaya Proses</p>
                  </div>
                  <div className="pt-12">
                    <p className="font-bold underline uppercase tracking-wide">IDRIS AL BASYIR, A.Md.</p>
                    <p>NIP. 199601112025061004</p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: GENERATE AUTO-ZEROING SALDO PERKARA */}
      {isZeroingModalOpen && selectedZeroingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold text-slate-100 text-base">
                  ⚡ Auto-Zeroing Biaya Proses (Saldo Rp0)
                </h3>
              </div>
              <button onClick={() => setIsZeroingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-amber-400 text-sm">{selectedZeroingCase.nomorPerkara}</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold">
                    {selectedZeroingCase.status}
                  </span>
                </div>
                <p className="text-slate-300 font-semibold">{selectedZeroingCase.namaPihak} ({selectedZeroingCase.jenisPerkara})</p>
                <div className="flex justify-between pt-1 border-t border-slate-700 text-[11px]">
                  <span className="text-slate-400">Target Sisa Saldo yang Harus Dihabiskan:</span>
                  <span className="font-black text-rose-400 text-sm">{formatRupiah(selectedZeroingCase.saldoPerkara)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">
                    Draft Rincian Pengeluaran Keperluan Perkara (Total: {formatRupiah(zeroingItems.reduce((a, b) => a + b.amount, 0))}):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setZeroingItems([
                        ...zeroingItems,
                        { uraian: `Pengadaan Kertas & ATK Tambahan (${selectedZeroingCase.nomorPerkara})`, amount: 0, kategori: 'ATK' }
                      ]);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded px-2 py-0.5 font-bold"
                  >
                    + Tambah Baris
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {zeroingItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={item.uraian}
                          onChange={(e) => {
                            const copy = [...zeroingItems];
                            copy[idx].uraian = e.target.value;
                            setZeroingItems(copy);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs"
                        />
                        {zeroingItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setZeroingItems(zeroingItems.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 text-xs"
                            title="Hapus baris"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 pl-7">
                        <div className="flex-1 flex items-center space-x-1">
                          <span className="text-slate-400 text-[11px]">Nominal (Rp):</span>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.amount}
                            onChange={(e) => {
                              const copy = [...zeroingItems];
                              copy[idx].amount = Number(e.target.value);
                              setZeroingItems(copy);
                            }}
                            className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-100 text-xs font-bold font-mono text-right"
                          />
                        </div>
                        <select
                          value={item.kategori}
                          onChange={(e) => {
                            const copy = [...zeroingItems];
                            copy[idx].kategori = e.target.value as any;
                            setZeroingItems(copy);
                          }}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded px-2 py-0.5"
                        >
                          <option value="ATK">ATK</option>
                          <option value="Proses">Proses</option>
                          <option value="Meterai">Meterai</option>
                          <option value="Redaksi">Redaksi</option>
                          <option value="Panggilan">Panggilan</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Match indicator */}
                {zeroingItems.reduce((a, b) => a + b.amount, 0) === selectedZeroingCase.saldoPerkara ? (
                  <p className="text-[11px] text-emerald-400 font-bold mt-2 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Total pengeluaran Pas! Saldo akhir perkara akan menjadi persis Rp 0.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-400 font-bold mt-2">
                    ⚠️ Total pengeluaran ({formatRupiah(zeroingItems.reduce((a, b) => a + b.amount, 0))}) berbeda dari target saldo ({formatRupiah(selectedZeroingCase.saldoPerkara)}).
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsZeroingModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmZeroing}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg font-bold shadow-lg shadow-amber-900/50 flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Eksekusi & Habiskan Saldo (Rp0)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PANDUAN STRUKTUR KOLOM SPREADSHEET (CSV & GOOGLE SHEETS) */}
      {isSpreadsheetGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 my-auto text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Table className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-100 text-base">
                  Panduan & Format Struktur Kolom Spreadsheet (Google Sheet / CSV)
                </h3>
              </div>
              <button onClick={() => setIsSpreadsheetGuideOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Agar aplikasi dapat menyinkronkan data secara otomatis dari Google Sheets / CSV publik tanpa error, pastikan nama kolom di baris pertama (Header) dibuat sesuai dengan salah satu dari struktur di bawah ini:
              </p>

              {/* Format 1: Log Buku Bantu Biaya Proses */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wide text-xs">
                    1. Format Sheet Log Transaksi Buku Bantu Biaya Proses
                  </h4>
                  <button
                    onClick={() => {
                      const header = "tanggal,nomor_perkara,uraian,penerimaan,pengeluaran,kategori,keterangan";
                      navigator.clipboard.writeText(header);
                      setCopiedNotice(true);
                      setTimeout(() => setCopiedNotice(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded text-[11px] font-semibold flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotice ? 'Tersalin!' : 'Salin Header CSV'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
                  tanggal,nomor_perkara,uraian,penerimaan,pengeluaran,kategori,keterangan
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                  <li><strong>tanggal</strong>: Format YYYY-MM-DD atau DD/MM/YYYY (Contoh: 2026-02-15)</li>
                  <li><strong>nomor_perkara</strong>: Nomor perkara e-Court (Contoh: 14/Pdt.G/2026/PA.Pan)</li>
                  <li><strong>uraian</strong>: Deskripsi transaksi penerimaan / pengeluaran</li>
                  <li><strong>penerimaan</strong>: Nominal penerimaan (Isi 0 jika pengeluaran)</li>
                  <li><strong>pengeluaran</strong>: Nominal pengeluaran (Isi 0 jika penerimaan)</li>
                  <li><strong>kategori</strong>: ATK / Proses / Meterai / Redaksi / Panggilan / Lainnya</li>
                  <li><strong>keterangan</strong>: Catatan tambahan atau nama instansi</li>
                </ul>
              </div>

              {/* Format 2: Data Utama Perkara */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wide text-xs">
                    2. Format Sheet Master Data Perkara (Jika Menggunakan 2 Sheet)
                  </h4>
                  <button
                    onClick={() => {
                      const header = "nomor_perkara,nama_pihak,jenis_perkara,tingkat_perkara,tanggal_register,tanggal_terima_kasasi_pk,tanggal_putus,status,panjar_awal,pengeluaran,saldo_perkara";
                      navigator.clipboard.writeText(header);
                      setCopiedNotice(true);
                      setTimeout(() => setCopiedNotice(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded text-[11px] font-semibold flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Header CSV</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  nomor_perkara,nama_pihak,jenis_perkara,tingkat_perkara,tanggal_register,tanggal_terima_kasasi_pk,tanggal_putus,status,panjar_awal,pengeluaran,saldo_perkara
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                  <li><strong>tingkat_perkara</strong>: Tingkat Pertama / Tingkat Banding / Kasasi / PK</li>
                  <li><strong>tanggal_terima_kasasi_pk</strong>: Khusus perkara Kasasi/PK untuk menghitung deadline 3 bulan</li>
                  <li><strong>status</strong>: Diperiksa / Putus / Minutasi / Selesai</li>
                </ul>
              </div>

            </div>

            <div className="pt-3 flex justify-between items-center border-t border-slate-800">
              <a
                href="data:text/csv;charset=utf-8,tanggal,nomor_perkara,uraian,penerimaan,pengeluaran,kategori,keterangan%0A2026-02-10,14/Pdt.G/2026/PA.Pan,Pemotongan Panjar ATK Pendaftaran Perkara,100000,0,ATK,Kepaniteraan Hukum%0A2026-02-12,14/Pdt.G/2026/PA.Pan,Biaya Panggilan / Relaas Sidang Pertama,0,95000,Panggilan,PT Pos Paniai"
                download="template_buku_biaya_proses_PA_Paniai.csv"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Contoh File CSV Template</span>
              </a>
              <button
                type="button"
                onClick={() => setIsSpreadsheetGuideOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold"
              >
                Tutup Panduan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
