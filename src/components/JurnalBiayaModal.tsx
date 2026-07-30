import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { CaseRecord, BiayaProsesRecord } from '../types';
import { X, Calculator, CheckCircle2, FileText, ArrowRight, ShieldCheck, Printer, AlertTriangle } from 'lucide-react';

interface JurnalBiayaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  selectedCase?: CaseRecord | null;
  onExecuteJurnal: (
    caseId: string, 
    nomorPerkara: string, 
    journalItems: { uraian: string; amount: number; kategori: 'Panjar' | 'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Sisa Panjar' | 'Lainnya' }[],
    tanggalJurnal: string
  ) => void;
  theme?: 'light' | 'dark';
}

export const JurnalBiayaModal: React.FC<JurnalBiayaModalProps> = ({
  isOpen,
  onClose,
  cases,
  selectedCase,
  onExecuteJurnal,
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [tanggalJurnal, setTanggalJurnal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCase) {
      setActiveCaseId(selectedCase.id);
    } else if (cases.length > 0) {
      setActiveCaseId(cases[0].id);
    }
    setErrorMessage(null);
  }, [selectedCase, cases, isOpen]);

  const currentCase = cases.find(c => c.id === activeCaseId) || selectedCase || cases[0];

  // Helper to determine fees based on case type
  const getFeeTable = (jenis?: string) => {
    const j = (jenis || '').toLowerCase();

    const isCeraiTalak = j.includes('talak');
    const isCeraiGugat = j.includes('gugat') && !j.includes('waris') && !j.includes('harta');
    const isDispensasi = j.includes('dispen');
    const isIsbat = j.includes('isbat');
    const isWaris = j.includes('waris') || j.includes('harta');
    const isWali = j.includes('wali') || j.includes('p3hp') || j.includes('penetapan');

    return [
      { name: 'Biaya Pendaftaran / PNBP', amount: 30000, kategori: 'Proses' as const },
      { name: 'Biaya Pemberkasan / ATK', amount: 100000, kategori: 'ATK' as const },
      { name: 'Biaya Panggilan I Pemohon / Penggugat (e-Court)', amount: 0, kategori: 'Panggilan' as const },
      { name: 'PNBP Relaas Panggilan I Pemohon / Penggugat', amount: 10000, kategori: 'Proses' as const },
      { 
        name: 'Biaya Panggilan I Termohon / Tergugat (Surat Tercatat Pos)', 
        amount: (isCeraiTalak || isCeraiGugat || isWaris) ? 95000 : 0, 
        kategori: 'Panggilan' as const 
      },
      { 
        name: 'PNBP Relaas Panggilan I Termohon / Tergugat', 
        amount: (isCeraiTalak || isCeraiGugat || isWaris) ? 10000 : 0, 
        kategori: 'Proses' as const 
      },
      { 
        name: 'Biaya Panggilan II Termohon / Tergugat (Surat Tercatat Pos)', 
        amount: (isCeraiTalak || isCeraiGugat || isWaris) ? 97400 : 0, 
        kategori: 'Panggilan' as const 
      },
      { name: 'Redaksi', amount: 10000, kategori: 'Redaksi' as const },
      { name: 'Meterai', amount: 10000, kategori: 'Meterai' as const },
      { 
        name: 'Biaya Pemberitahuan Putusan Termohon / Tergugat', 
        amount: (isCeraiTalak || isCeraiGugat || isWaris) ? 97400 : 0, 
        kategori: 'Panggilan' as const 
      },
      { 
        name: 'PNBP Relaas Pemberitahuan Putusan Termohon / Tergugat', 
        amount: (isCeraiTalak || isCeraiGugat || isWaris) ? 10000 : 0, 
        kategori: 'Proses' as const 
      },
      { name: 'Biaya Panggilan Ikrar Talak Kepada Pemohon', amount: 0, kategori: 'Panggilan' as const },
      { 
        name: 'Biaya Panggilan Ikrar Talak Kepada Termohon', 
        amount: isCeraiTalak ? 97400 : 0, 
        kategori: 'Panggilan' as const 
      },
      { name: 'Pengembalian Sisa Panjar', amount: 0, kategori: 'Lainnya' as const }
    ];
  };

  const activeFees = getFeeTable(currentCase?.jenisPerkara);
  const totalRincian = activeFees.reduce((acc, f) => acc + f.amount, 0);
  const atkFee = activeFees.find(f => f.kategori === 'ATK')?.amount || 100000;

  const handleExecute = () => {
    if (!currentCase) {
      setErrorMessage('Pilih perkara terlebih dahulu!');
      return;
    }

    const currentSaldo = currentCase.saldoPerkara || 0;

    // Balance validation requirement
    if (currentSaldo <= 0) {
      setErrorMessage(`❌ Eksekusi Ditolak: Perkara ${currentCase.nomorPerkara} tidak memiliki saldo panjar tersisa (Saldo: Rp 0). Jurnal tidak dapat dipotong.`);
      return;
    }

    if (currentSaldo < totalRincian) {
      setErrorMessage(`⚠️ Eksekusi Ditolak: Saldo perkara saat ini (Rp ${currentSaldo.toLocaleString('id-ID')}) KURANG dari total estimasi pengeluaran jurnal (Rp ${totalRincian.toLocaleString('id-ID')}). Silakan minta pihak melakukan Tambah Panjar Perkara (TBT) terlebih dahulu.`);
      return;
    }

    setErrorMessage(null);
    const itemsToLog = activeFees
      .filter(f => f.amount > 0)
      .map(f => ({
        uraian: `Pencatatan Jurnal: ${f.name}`,
        amount: f.amount,
        kategori: f.kategori
      }));

    onExecuteJurnal(currentCase.id, currentCase.nomorPerkara, itemsToLog, tanggalJurnal);
    onClose();
  };

  const handlePrintJurnalSheet = () => {
    if (!currentCase) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rincian Jurnal SKUM - ${currentCase.nomorPerkara}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 25px; color: #0f172a; font-size: 12px; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 18px; color: #0369a1; text-transform: uppercase; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #475569; }
          .meta { margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; line-height: 1.8; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { background-color: #e0f2fe; font-weight: bold; font-size: 13px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
          .signature { text-align: center; width: 220px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>PENGADILAN AGAMA</h2>
          <p>RINCIAN TABEL JURNAL BIAYA PERKARA (SKUM)</p>
        </div>
        <div class="meta">
          <strong>Nomor Perkara:</strong> ${currentCase.nomorPerkara}<br/>
          <strong>Nama Pihak:</strong> ${currentCase.namaPihak}<br/>
          <strong>Jenis Perkara:</strong> ${currentCase.jenisPerkara}<br/>
          <strong>Tanggal Pencatatan Jurnal:</strong> ${tanggalJurnal}<br/>
          <strong>Saldo Panjar Tersedia:</strong> Rp ${(currentCase.saldoPerkara || 0).toLocaleString('id-ID')}
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 35px;">No</th>
              <th>Komponen Biaya Jurnal</th>
              <th class="text-center" style="width: 100px;">Kategori Log</th>
              <th class="text-right" style="width: 130px;">Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${activeFees.map((f, i) => `
              <tr style="${f.amount === 0 ? 'opacity: 0.4;' : ''}">
                <td class="text-center">${i + 1}</td>
                <td>${f.name}</td>
                <td class="text-center">${f.kategori}</td>
                <td class="text-right">Rp ${f.amount.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <th colspan="3" class="text-right">TOTAL ESTIMASI POTONGAN JURNAL:</th>
              <th class="text-right">Rp ${totalRincian.toLocaleString('id-ID')}</th>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <div class="signature">
            Mengetahui,<br/>Panitera<br/><br/><br/><br/>
            ( _______________________ )
          </div>
          <div class="signature">
            Petugas Kasir / Jurnal,<br/><br/><br/><br/>
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

  if (!isOpen) return null;

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
            <DialogPanel className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}>
              
              {/* Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
                isLight ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-slate-800/80 border-slate-700/80 text-white'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle as="h3" className="font-bold text-base">
                      Pencatatan Jurnal Biaya SKUM Perkara
                    </DialogTitle>
                    <p className="text-[11px] opacity-80">
                      Memotong saldo SKUM dan mencatat jurnal biaya serta pengalihan ATK (Rp 100rb) ke Buku Bantu
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrintJurnalSheet}
                    className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center space-x-1.5 transition-colors border border-amber-500/30"
                    title="Cetak Rincian Jurnal SKUM"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Cetak</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                
                {/* Error Banner when balance insufficient */}
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start space-x-3 shadow-sm animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="font-semibold text-xs leading-relaxed">
                      {errorMessage}
                    </div>
                  </div>
                )}

                {/* Case Selector Dropdown & Date Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                      Pilih Nomor Perkara Terdaftar:
                    </label>
                    <select
                      value={activeCaseId}
                      onChange={(e) => {
                        setActiveCaseId(e.target.value);
                        setErrorMessage(null);
                      }}
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold text-xs ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900' 
                          : 'bg-slate-800 border-slate-700 text-emerald-400'
                      }`}
                    >
                      {cases.length === 0 ? (
                        <option value="">-- Belum ada data perkara --</option>
                      ) : (
                        cases.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nomorPerkara} — {c.namaPihak} ({c.jenisPerkara}) | Saldo: Rp {(c.saldoPerkara || 0).toLocaleString('id-ID')}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                      Tanggal Jurnal Transaksi:
                    </label>
                    <input
                      type="date"
                      value={tanggalJurnal}
                      onChange={(e) => setTanggalJurnal(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold text-xs ${
                        isLight 
                          ? 'bg-slate-50 border-slate-300 text-slate-900' 
                          : 'bg-slate-800 border-slate-700 text-emerald-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Selected Case Info Banner */}
                {currentCase && (
                  <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
                    isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/60'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Nomor Perkara</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {currentCase.nomorPerkara}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Nama Pihak & Jenis</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {currentCase.namaPihak} ({currentCase.jenisPerkara})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Saldo SKUM Saat Ini</span>
                      <span className={`font-bold text-sm ${
                        (currentCase.saldoPerkara || 0) < totalRincian 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        Rp {(currentCase.saldoPerkara || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Journal Component Breakdown Table */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                    <span>📋 Rincian Jurnal Biaya ({currentCase?.jenisPerkara || 'Gugatan'}):</span>
                    <span className="text-emerald-600 font-extrabold text-xs">
                      Est. Total: Rp {totalRincian.toLocaleString('id-ID')}
                    </span>
                  </h4>

                  <div className={`border rounded-xl overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className={`border-b font-bold ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Komponen Biaya Jurnal</th>
                          <th className="p-2.5">Kategori Log</th>
                          <th className="p-2.5 text-right">Nominal (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {activeFees.map((fee, idx) => (
                          <tr key={idx} className={fee.amount > 0 ? (fee.kategori === 'ATK' ? 'bg-amber-50/60 dark:bg-amber-950/20 font-bold' : '') : 'opacity-40'}>
                            <td className="p-2.5 text-center">{idx + 1}</td>
                            <td className="p-2.5">
                              {fee.name}
                              {fee.kategori === 'ATK' && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                  ⚡ Otomatis Masuk Ke Buku Bantu ATK
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {fee.kategori}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold">
                              Rp {fee.amount.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className={`border-t font-extrabold text-sm ${
                          isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-emerald-400'
                        }`}>
                          <td colSpan={3} className="p-3 text-right">JUMLAH ESTIMASI EXPENSE JURNAL:</td>
                          <td className="p-3 text-right font-mono">Rp {totalRincian.toLocaleString('id-ID')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Important Process Note */}
                <div className={`p-3.5 rounded-xl border text-[11px] flex items-start space-x-2.5 ${
                  isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}>
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Dampak Eksekusi Jurnal Biaya:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-90">
                      <li>Saldo Perkara <strong>{currentCase?.nomorPerkara || '-'}</strong> akan dipotong sebesar total pengeluaran jurnal.</li>
                      <li>Potongan <strong>Biaya Pemberkasan / ATK (Rp {atkFee.toLocaleString('id-ID')})</strong> otomatis menjadi saldo penerimaan di menu <strong>Buku Bantu Biaya Proses</strong> dengan label nomor perkara tersebut.</li>
                      <li>Pencatatan jurnal ini akan menggunakan tanggal transaksi: <strong>{tanggalJurnal}</strong>.</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/80 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:opacity-80 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecute}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eksekusi Catat Jurnal Biaya & Potong ATK</span>
                </button>
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

