import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { CaseRecord, JenisPerkara, KategoriPerkara, StatusPerkara, TingkatPerkara } from '../types';
import { X, Save, Scale, AlertTriangle, Calculator, Clock } from 'lucide-react';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<CaseRecord>) => void;
  recordToEdit?: CaseRecord;
  totalCasesCount: number;
}

export const CaseFormModal: React.FC<CaseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  totalCasesCount
}) => {
  const [nomorPerkara, setNomorPerkara] = useState<string>('');
  const [namaPihak, setNamaPihak] = useState<string>('');
  const [jenisPerkara, setJenisPerkara] = useState<JenisPerkara>('Cerai Gugat');
  const [kategoriPerkara, setKategoriPerkara] = useState<KategoriPerkara>('Gugatan');
  const [panjarAwal, setPanjarAwal] = useState<number>(1000000);
  const [pengeluaran, setPengeluaran] = useState<number>(1000000);
  const [saldoPerkara, setSaldoPerkara] = useState<number>(0);
  const [tanggalRegister, setTanggalRegister] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tanggalTerimaKasasiPk, setTanggalTerimaKasasiPk] = useState<string>('');
  const [tanggalPutus, setTanggalPutus] = useState<string>('');
  const [tingkatPerkara, setTingkatPerkara] = useState<TingkatPerkara>('Tingkat Pertama');
  const [status, setStatus] = useState<StatusPerkara>('Diperiksa');
  const [hakimKetua, setHakimKetua] = useState<string>('');
  const [panitera, setPanitera] = useState<string>('');
  const [ruangSidang, setRuangSidang] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  useEffect(() => {
    if (recordToEdit) {
      setNomorPerkara(recordToEdit.nomorPerkara);
      setNamaPihak(recordToEdit.namaPihak);
      setJenisPerkara(recordToEdit.jenisPerkara);
      setKategoriPerkara(recordToEdit.kategoriPerkara);
      setPanjarAwal(recordToEdit.panjarAwal || 0);
      setPengeluaran(recordToEdit.pengeluaran || 0);
      setSaldoPerkara(recordToEdit.saldoPerkara || 0);
      setTanggalRegister(recordToEdit.tanggalRegister || new Date().toISOString().split('T')[0]);
      setTanggalTerimaKasasiPk(recordToEdit.tanggalTerimaKasasiPk || '');
      setTanggalPutus(recordToEdit.tanggalPutus || '');
      setTingkatPerkara(recordToEdit.tingkatPerkara || 'Tingkat Pertama');
      setStatus(recordToEdit.status);
      setHakimKetua(recordToEdit.hakimKetua || '');
      setPanitera(recordToEdit.panitera || '');
      setRuangSidang(recordToEdit.ruangSidang || '');
      setCatatan(recordToEdit.catatan || '');
    } else {
      // Auto-generate new case number with 2-digit padding format (e.g. 01/Pdt.G/2026/PA.Pan)
      const nextNum = totalCasesCount + 1;
      const formattedNum = String(nextNum).padStart(2, '0');
      const code = jenisPerkara.toLowerCase().includes('penetapan') || jenisPerkara.toLowerCase().includes('permohonan') || jenisPerkara.toLowerCase().includes('dispen') || jenisPerkara.toLowerCase().includes('wali') ? 'Pdt.P' : 'Pdt.G';
      setNomorPerkara(`${formattedNum}/${code}/2026/PA.Pan`);
      setNamaPihak('');
      setJenisPerkara('Cerai Gugat');
      setKategoriPerkara('Gugatan');
      setPanjarAwal(690000); // Default SKUM Cerai Gugat / Cerai Talak Rp 690.000
      setPengeluaran(0);
      setSaldoPerkara(690000);
      setTanggalRegister(new Date().toISOString().split('T')[0]);
      setTanggalTerimaKasasiPk('');
      setTanggalPutus('');
      setTingkatPerkara('Tingkat Pertama');
      setStatus('Diperiksa');
      setHakimKetua('');
      setPanitera('');
      setRuangSidang('');
      setCatatan('');
    }
  }, [recordToEdit, isOpen, totalCasesCount]);

  // Recalculate Saldo automatically whenever Panjar or Pengeluaran changes
  const handlePanjarChange = (val: number) => {
    setPanjarAwal(val);
    setSaldoPerkara(Math.max(0, val - pengeluaran));
  };

  const handlePengeluaranChange = (val: number) => {
    setPengeluaran(val);
    setSaldoPerkara(Math.max(0, panjarAwal - val));
  };

  // Adjust Kategori automatically based on Jenis Perkara & apply default SKUM
  const handleJenisChange = (newJenis: JenisPerkara) => {
    setJenisPerkara(newJenis);
    const nextNum = totalCasesCount + 1;
    const formattedNum = String(nextNum).padStart(2, '0');

    if (newJenis === 'Penetapan Ahli Waris' || newJenis === 'Dispensasi Nikah' || newJenis === 'Wali Adhal' || newJenis === 'Hibah' || newJenis === 'Wasiat') {
      setKategoriPerkara('Permohonan');
      if (!recordToEdit) {
        setNomorPerkara(`${formattedNum}/Pdt.P/2026/PA.Pan`);
        // Default SKUM Permohonan/Isbat
        const defaultSkum = newJenis === 'Dispensasi Nikah' || newJenis === 'Wali Adhal' ? 160000 : 170000;
        setPanjarAwal(defaultSkum);
        setSaldoPerkara(defaultSkum);
      }
    } else {
      setKategoriPerkara('Gugatan');
      if (!recordToEdit) {
        setNomorPerkara(`${formattedNum}/Pdt.G/2026/PA.Pan`);
        // Default SKUM Gugatan/CG/CT
        const defaultSkum = 690000;
        setPanjarAwal(defaultSkum);
        setSaldoPerkara(defaultSkum);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorPerkara || !namaPihak) return;

    onSave({
      id: recordToEdit?.id,
      nomorPerkara,
      namaPihak,
      jenisPerkara,
      kategoriPerkara,
      panjarAwal,
      pengeluaran,
      saldoPerkara,
      tanggalRegister,
      tanggalTerimaKasasiPk: tanggalTerimaKasasiPk || undefined,
      tanggalPutus: tanggalPutus || undefined,
      tingkatPerkara,
      status,
      hakimKetua,
      panitera,
      ruangSidang,
      catatan
    });

    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6 flex items-center justify-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
              
              {/* Header */}
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <div>
                    <DialogTitle as="h3" className="font-bold text-slate-100 text-base">
                      {recordToEdit ? 'Edit Data Perkara' : 'Input Data Perkara Baru'}
                    </DialogTitle>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      📊 Sinkron otomatis dengan Sheet <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">DataPerkara</code> (12 Kolom)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nomor Perkara */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Perkara <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-nomor-perkara"
                type="text"
                required
                value={nomorPerkara}
                onChange={(e) => setNomorPerkara(e.target.value)}
                placeholder="Contoh: 1/Pdt.G/2026/PA.Pan"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Nama Pihak */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Pihak <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-nama-pihak"
                type="text"
                required
                value={namaPihak}
                onChange={(e) => setNamaPihak(e.target.value)}
                placeholder="Nama Penggugat/Pemohon/Para Pihak"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Jenis Perkara */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Perkara</label>
              <select
                id="select-jenis-perkara"
                value={jenisPerkara}
                onChange={(e) => handleJenisChange(e.target.value as JenisPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cerai Talak">Cerai Talak</option>
                <option value="Cerai Gugat">Cerai Gugat</option>
                <option value="Penetapan Ahli Waris">Penetapan Ahli Waris</option>
                <option value="Harta Bersama">Harta Bersama</option>
                <option value="Hibah">Hibah</option>
                <option value="Wasiat">Wasiat</option>
                <option value="Hak Asuh Anak">Hak Asuh Anak</option>
                <option value="Nafkah Anak">Nafkah Anak</option>
                <option value="Dispensasi Nikah">Dispensasi Nikah</option>
                <option value="Wali Adhal">Wali Adhal</option>
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Perkara</label>
              <select
                id="select-kategori-perkara"
                value={kategoriPerkara}
                onChange={(e) => setKategoriPerkara(e.target.value as KategoriPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Gugatan">Gugatan (Pdt.G)</option>
                <option value="Permohonan">Permohonan (Pdt.P)</option>
              </select>
            </div>

          </div>

          {/* FINANCIAL SECTION (SALDO PANJAR PERKARA AUTOMATION) */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-emerald-400">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Perhitungan Biaya SKUM & Saldo Panjar</h4>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                Acuatan SK MA / e-Court
              </span>
            </div>

            {/* PRESET PANJAR SKMA E-COURT QUICK BUTTONS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>⚡ Quick Preset SKUM e-Court MA:</span>
                <span className="text-[10px] text-emerald-400">Klik untuk isi Panjar Awal</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    handlePanjarChange(690000);
                  }}
                  className="bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 p-1.5 rounded text-left transition-all flex flex-col"
                >
                  <span className="font-semibold text-[10px]">Cerai Talak (SKUM CG/CT)</span>
                  <span className="text-emerald-400 font-bold text-xs">Rp 690.000</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePanjarChange(690000);
                  }}
                  className="bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 p-1.5 rounded text-left transition-all flex flex-col"
                >
                  <span className="font-semibold text-[10px]">Cerai Gugat (SKUM CG/CT)</span>
                  <span className="text-emerald-400 font-bold text-xs">Rp 690.000</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePanjarChange(170000);
                  }}
                  className="bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 p-1.5 rounded text-left transition-all flex flex-col"
                >
                  <span className="font-semibold text-[10px]">Isbat Nikah</span>
                  <span className="text-emerald-400 font-bold text-xs">Rp 170.000</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePanjarChange(160000);
                  }}
                  className="bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 p-1.5 rounded text-left transition-all flex flex-col"
                >
                  <span className="font-semibold text-[10px]">Dispensasi Kawin</span>
                  <span className="text-emerald-400 font-bold text-xs">Rp 160.000</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePanjarChange(469800);
                  }}
                  className="bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 p-1.5 rounded text-left transition-all flex flex-col"
                >
                  <span className="font-semibold text-[10px]">Waris / Harta Bersama</span>
                  <span className="text-emerald-400 font-bold text-xs">Rp 469.800</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePanjarChange(160000);
                  }}
                  className="bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 p-1.5 rounded text-left transition-all flex flex-col"
                >
                  <span className="font-semibold text-[10px]">Wali Adhal / P3HP</span>
                  <span className="text-emerald-400 font-bold text-xs">Rp 160.000</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Panjar Awal (Rp)</label>
                <input
                  id="input-panjar-awal"
                  type="number"
                  min="0"
                  step="100"
                  value={panjarAwal}
                  onChange={(e) => handlePanjarChange(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-semibold"
                />
                <span className="text-[10px] text-emerald-400 block mt-1">
                  💡 Nominal Panjar SKUM e-Court
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pengeluaran Biaya (Rp)</label>
                <input
                  id="input-pengeluaran"
                  type="number"
                  min="0"
                  step="100"
                  value={pengeluaran}
                  onChange={(e) => handlePengeluaranChange(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Saldo Perkara (Otomatis)</label>
                <div className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-xs font-bold ${
                  saldoPerkara === 0 ? 'border-rose-700 text-rose-400' : 'border-slate-700 text-emerald-400'
                }`}>
                  Rp {saldoPerkara.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* TABEL RINCIAN KOMPONEN SKMA E-COURT */}
            <details className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 group text-xs text-slate-300">
              <summary className="font-semibold text-emerald-400 cursor-pointer flex items-center justify-between select-none">
                <span>📋 Lihat Rincian Komponen Biaya e-Court (SK Mahkamah Agung)</span>
                <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-1">Komponen Biaya</th>
                      <th className="py-1 text-center">CT</th>
                      <th className="py-1 text-center">CG</th>
                      <th className="py-1 text-center">Disp.</th>
                      <th className="py-1 text-center">Isbat</th>
                      <th className="py-1 text-center">Waris</th>
                      <th className="py-1 text-center">Wali/P3HP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="py-1 font-medium">Biaya Pendaftaran/PNBP</td>
                      <td className="text-center">30.000</td>
                      <td className="text-center">30.000</td>
                      <td className="text-center">30.000</td>
                      <td className="text-center">30.000</td>
                      <td className="text-center">30.000</td>
                      <td className="text-center">30.000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Biaya Pemberkasan/ATK</td>
                      <td className="text-center">100.000</td>
                      <td className="text-center">100.000</td>
                      <td className="text-center">100.000</td>
                      <td className="text-center">100.000</td>
                      <td className="text-center">100.000</td>
                      <td className="text-center">100.000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Panggilan I (e-Court)</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">PNBP Relaas Panggilan I Pemohon/Penggugat</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Panggilan I Termohon/Tergugat (Pos)</td>
                      <td className="text-center">95.000</td>
                      <td className="text-center">95.000</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">95.000</td>
                      <td className="text-center">0</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">PNBP Relaas Panggilan I Termohon/Tergugat</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">0</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Panggilan II Termohon/Tergugat (Pos)</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">0</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Redaksi</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Meterai</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">PBT Putusan Kepada Termohon/Tergugat</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">0</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">PNBP Relaas PBT Putusan</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">10.000</td>
                      <td className="text-center">0</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Panggilan Ikrar Talak Kepada Termohon</td>
                      <td className="text-center">97.400</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="font-bold text-emerald-400 border-t border-slate-700">
                      <td className="py-1.5">TOTAL ESTIMASI PANJAR SKUM</td>
                      <td className="text-center">567.200</td>
                      <td className="text-center">469.800</td>
                      <td className="text-center">160.000</td>
                      <td className="text-center">160.000</td>
                      <td className="text-center">469.800</td>
                      <td className="text-center">160.000</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </details>

            {saldoPerkara === 0 && (
              <div className="flex items-center space-x-2 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Peringatan: Saldo Rp0 akan memicu notifikasi otomatis penambahan panjar perkara.</span>
              </div>
            )}
          </div>

          {/* DATES & STATUS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tingkat Perkara *</label>
              <select
                id="select-tingkat-perkara"
                value={tingkatPerkara}
                onChange={(e) => setTingkatPerkara(e.target.value as TingkatPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Tingkat Pertama">Tingkat Pertama (Batas 5 Bln)</option>
                <option value="Tingkat Banding">Tingkat Banding (Batas 3 Bln)</option>
                <option value="Kasasi / PK">Kasasi / PK (Batas 3 Bln)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Register *</label>
              <input
                id="input-tanggal-register"
                type="date"
                required
                value={tanggalRegister}
                onChange={(e) => setTanggalRegister(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            {tingkatPerkara === 'Kasasi / PK' ? (
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">Tgl Terima (Ketua Kasasi/PK)</label>
                <input
                  id="input-tanggal-terima-kasasi"
                  type="date"
                  value={tanggalTerimaKasasiPk}
                  onChange={(e) => setTanggalTerimaKasasiPk(e.target.value)}
                  className="w-full bg-slate-800 border border-amber-600/80 rounded-lg px-3 py-2 text-xs text-amber-200"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Putus (Opsional)</label>
                <input
                  id="input-tanggal-putus"
                  type="date"
                  value={tanggalPutus}
                  onChange={(e) => setTanggalPutus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Perkara</label>
              <select
                id="select-status-perkara"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Pendaftaran">Pendaftaran</option>
                <option value="Diperiksa">Diperiksa (Sidang)</option>
                <option value="Putus">Putus</option>
                <option value="Minutasi">Minutasi</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* JUDICIAL DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hakim Ketua</label>
              <input
                type="text"
                value={hakimKetua}
                onChange={(e) => setHakimKetua(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Panitera Pengganti</label>
              <input
                type="text"
                value={panitera}
                onChange={(e) => setPanitera(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ruang Sidang</label>
              <input
                type="text"
                value={ruangSidang}
                onChange={(e) => setRuangSidang(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan / Keterangan Perkara</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan pendaftaran, tahapan sidang, atau sisa panjar..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/40"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Perkara</span>
            </button>
          </div>

        </form>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
