import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { CaseRecord, BiayaProsesRecord, JurnalBiayaSkumRecord } from '../types';
import { X, Calculator, CheckCircle2, FileText, ArrowRight, ShieldCheck, Printer, AlertTriangle, CheckSquare, Square, Info } from 'lucide-react';

interface JurnalBiayaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseRecord[];
  selectedCase?: CaseRecord | null;
  jurnalSkumRecords?: JurnalBiayaSkumRecord[];
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
  jurnalSkumRecords = [],
  onExecuteJurnal,
  theme = 'light'
}) => {
  const isLight = theme === 'light';
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [panjarAwalInput, setPanjarAwalInput] = useState<number>(1000000);
  const [tanggalJurnal, setTanggalJurnal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUnrecorded, setSelectedUnrecorded] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let targetCase: CaseRecord | undefined;
    if (selectedCase) {
      setActiveCaseId(selectedCase.id);
      targetCase = selectedCase;
    } else if (cases.length > 0) {
      setActiveCaseId(cases[0].id);
      targetCase = cases[0];
    }
    
    if (targetCase) {
      setPanjarAwalInput(targetCase.panjarAwal || targetCase.saldoPerkara || 1000000);
      if (targetCase.tanggalRegister) {
        setTanggalJurnal(targetCase.tanggalRegister);
      } else {
        setTanggalJurnal(new Date().toISOString().split('T')[0]);
      }
    }
    setErrorMessage(null);
    setCustomAmounts({});
  }, [selectedCase, cases, isOpen]);

  const currentCase = cases.find(c => c.id === activeCaseId) || selectedCase || cases[0];

  // Get existing SKUM logs for the selected case
  const existingCaseSkumLogs = useMemo(() => {
    if (!currentCase || !currentCase.nomorPerkara) return [];
    const normCaseNum = currentCase.nomorPerkara.trim().toLowerCase();
    return (jurnalSkumRecords || []).filter(
      r => r.nomorPerkara && r.nomorPerkara.trim().toLowerCase() === normCaseNum
    );
  }, [currentCase, jurnalSkumRecords]);

  // Check if Panjar Awal setoran has already been recorded
  const isPanjarAlreadyRecorded = useMemo(() => {
    return existingCaseSkumLogs.some(r =>
      r.kategori === 'Panjar' ||
      (r.penerimaan && r.penerimaan > 0) ||
      (r.uraian && r.uraian.toLowerCase().includes('panjar'))
    );
  }, [existingCaseSkumLogs]);

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

  const activeFees = useMemo(() => {
    const defaultFees = getFeeTable(currentCase?.jenisPerkara);
    return defaultFees.map(fee => {
      const customVal = customAmounts[fee.name];
      return {
        ...fee,
        amount: customVal !== undefined ? customVal : fee.amount
      };
    });
  }, [currentCase?.jenisPerkara, customAmounts]);

  // Check recorded status for each fee item
  const feeStatusList = useMemo(() => {
    const usedLogIds = new Set<string>();

    const isSpecificMatch = (feeName: string, r: JurnalBiayaSkumRecord) => {
      const normFeeName = feeName.toLowerCase();
      const rUraianNorm = (r.uraian || '').toLowerCase();
      const cleanUr = rUraianNorm.replace('pencatatan jurnal:', '').trim();

      // Direct name match
      if (rUraianNorm.includes(normFeeName) || normFeeName.includes(cleanUr)) {
        return true;
      }

      // Ikrar Talak
      if (normFeeName.includes('ikrar talak')) {
        if (!rUraianNorm.includes('ikrar')) return false;
        if (normFeeName.includes('pemohon') && (rUraianNorm.includes('pemohon') || rUraianNorm.includes('penggugat'))) return true;
        if (normFeeName.includes('termohon') && (rUraianNorm.includes('termohon') || rUraianNorm.includes('tergugat'))) return true;
        return rUraianNorm.includes('ikrar');
      }

      // Pemberitahuan Putusan
      if (normFeeName.includes('pemberitahuan putusan')) {
        if (normFeeName.includes('pnbp') || normFeeName.includes('relaas')) {
          return rUraianNorm.includes('pnbp') && (rUraianNorm.includes('pemberitahuan') || rUraianNorm.includes('putusan') || rUraianNorm.includes('pbt'));
        }
        return (rUraianNorm.includes('pemberitahuan') || rUraianNorm.includes('putusan') || rUraianNorm.includes('pbt')) && !rUraianNorm.includes('pnbp');
      }

      // Panggilan II
      if (normFeeName.includes('panggilan ii')) {
        return rUraianNorm.includes('panggilan ii') || rUraianNorm.includes('panggilan 2');
      }

      // Panggilan I Termohon
      if (normFeeName.includes('panggilan i termohon')) {
        if (normFeeName.includes('pnbp') || normFeeName.includes('relaas')) {
          return rUraianNorm.includes('pnbp') && rUraianNorm.includes('termohon');
        }
        return (rUraianNorm.includes('panggilan i termohon') || rUraianNorm.includes('panggilan 1 termohon')) && !rUraianNorm.includes('pnbp');
      }

      // Panggilan I Pemohon
      if (normFeeName.includes('panggilan i pemohon')) {
        if (normFeeName.includes('pnbp') || normFeeName.includes('relaas')) {
          return rUraianNorm.includes('pnbp') && rUraianNorm.includes('pemohon');
        }
        return (rUraianNorm.includes('panggilan i pemohon') || rUraianNorm.includes('panggilan 1 pemohon')) && !rUraianNorm.includes('pnbp');
      }

      // General categories
      if (normFeeName.includes('pemberkasan') || normFeeName.includes('atk')) {
        return rUraianNorm.includes('pemberkasan') || rUraianNorm.includes('atk');
      }
      if (normFeeName.includes('pendaftaran')) {
        return rUraianNorm.includes('pendaftaran');
      }
      if (normFeeName.includes('redaksi')) {
        return rUraianNorm.includes('redaksi');
      }
      if (normFeeName.includes('meterai')) {
        return rUraianNorm.includes('meterai');
      }

      return false;
    };

    return activeFees.map((fee, idx) => {
      const matchingLog = existingCaseSkumLogs.find(r => {
        if (usedLogIds.has(r.id)) return false;
        if ((r.pengeluaran || 0) <= 0 && r.kategori !== fee.kategori && r.kategori !== 'Panjar') return false;
        return isSpecificMatch(fee.name, r);
      });

      if (matchingLog) {
        usedLogIds.add(matchingLog.id);
      }

      return {
        ...fee,
        index: idx,
        isRecorded: !!matchingLog,
        isZeroFee: fee.amount === 0,
        matchingLog
      };
    });
  }, [activeFees, existingCaseSkumLogs]);

  const recordedFees = useMemo(() => feeStatusList.filter(f => f.isRecorded), [feeStatusList]);
  const unrecordedFees = useMemo(() => feeStatusList.filter(f => !f.isRecorded), [feeStatusList]);

  const totalRecordedAmount = useMemo(() => recordedFees.reduce((acc, f) => acc + f.amount, 0), [recordedFees]);
  const totalUnrecordedAmount = useMemo(() => unrecordedFees.reduce((acc, f) => acc + f.amount, 0), [unrecordedFees]);
  const totalRincian = useMemo(() => activeFees.reduce((acc, f) => acc + f.amount, 0), [activeFees]);

  // Sync selectedUnrecorded default when case or logs or active fees change
  useEffect(() => {
    const unrecordedNames = unrecordedFees.filter(f => f.amount > 0).map(f => f.name);
    setSelectedUnrecorded(unrecordedNames);
  }, [activeCaseId, existingCaseSkumLogs, customAmounts]);

  const toggleUnrecordedItem = (feeName: string) => {
    if (selectedUnrecorded.includes(feeName)) {
      setSelectedUnrecorded(selectedUnrecorded.filter(n => n !== feeName));
    } else {
      setSelectedUnrecorded([...selectedUnrecorded, feeName]);
    }
  };

  const toggleAllUnrecorded = () => {
    const unrecordedNames = unrecordedFees.map(f => f.name);
    if (selectedUnrecorded.length === unrecordedNames.length) {
      setSelectedUnrecorded([]);
    } else {
      setSelectedUnrecorded(unrecordedNames);
    }
  };

  const selectedFeesToExecute = useMemo(() => {
    return unrecordedFees.filter(f => selectedUnrecorded.includes(f.name));
  }, [unrecordedFees, selectedUnrecorded]);

  const totalSelectedAmount = useMemo(() => {
    return selectedFeesToExecute.reduce((acc, f) => acc + f.amount, 0);
  }, [selectedFeesToExecute]);

  const estimasiSisaSaldo = useMemo(() => {
    const currentSaldo = currentCase?.saldoPerkara ?? (panjarAwalInput - totalRecordedAmount);
    return Math.max(0, currentSaldo - totalSelectedAmount);
  }, [currentCase?.saldoPerkara, panjarAwalInput, totalRecordedAmount, totalSelectedAmount]);

  const handleExecute = () => {
    if (!currentCase) {
      setErrorMessage('Pilih perkara terlebih dahulu!');
      return;
    }

    const itemsToLog: { uraian: string; amount: number; kategori: 'Panjar' | 'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Sisa Panjar' | 'Lainnya' }[] = [];

    // 1. Log Panjar Awal ONLY if it hasn't been recorded yet
    if (!isPanjarAlreadyRecorded) {
      if (panjarAwalInput <= 0) {
        setErrorMessage(`❌ Eksekusi Ditolak: Nominal Panjar Awal harus lebih besar dari Rp 0.`);
        return;
      }
      itemsToLog.push({
        uraian: `Penerimaan Panjar Awal Perkara (SKUM)`,
        amount: panjarAwalInput,
        kategori: 'Panjar'
      });
    }

    // 2. Log ONLY selected unrecorded fee components
    selectedFeesToExecute.forEach(f => {
      itemsToLog.push({
        uraian: `Pencatatan Jurnal: ${f.name}`,
        amount: f.amount,
        kategori: f.kategori
      });
    });

    if (itemsToLog.length === 0) {
      setErrorMessage(`⚠️ Tidak ada komponen jurnal baru yang dipilih atau perlu dipotong. Seluruh komponen biaya jurnal untuk perkara ${currentCase.nomorPerkara} sudah tercatat sebelumnya di Jurnal SKUM.`);
      return;
    }

    setErrorMessage(null);
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
          .debet-row { background-color: #ecfdf5; font-weight: bold; }
          .total-row { background-color: #e0f2fe; font-weight: bold; font-size: 12px; }
          .sisa-row { background-color: #dcfce7; font-weight: bold; font-size: 13px; color: #15803d; }
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
          <strong>Setoran Panjar Awal:</strong> Rp ${panjarAwalInput.toLocaleString('id-ID')}<br/>
          <strong>Estimasi Sisa Saldo SKUM:</strong> Rp ${estimasiSisaSaldo.toLocaleString('id-ID')}
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 35px;">No</th>
              <th>Komponen Biaya Jurnal</th>
              <th class="text-center" style="width: 100px;">Kategori Log</th>
              <th class="text-right" style="width: 130px;">Nominal (Rp)</th>
              <th class="text-center" style="width: 120px;">Status SKUM</th>
            </tr>
          </thead>
          <tbody>
            <tr class="debet-row">
              <td class="text-center">1</td>
              <td>Penerimaan Panjar Awal Perkara (SKUM)</td>
              <td class="text-center">Panjar</td>
              <td class="text-right">+ Rp ${panjarAwalInput.toLocaleString('id-ID')}</td>
              <td class="text-center">${isPanjarAlreadyRecorded ? 'Sudah Setor' : 'Belum Catat'}</td>
            </tr>
            ${feeStatusList.map((f, i) => `
              <tr style="${f.amount === 0 ? 'opacity: 0.4;' : ''}">
                <td class="text-center">${i + 2}</td>
                <td>${f.name}</td>
                <td class="text-center">${f.kategori}</td>
                <td class="text-right">Rp ${f.amount.toLocaleString('id-ID')}</td>
                <td class="text-center">${f.isRecorded ? 'Sudah Dipotong' : (f.amount > 0 ? 'Belum Dipotong' : '-')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <th colspan="3" class="text-right">TOTAL SETORAN PANJAR (DEBET):</th>
              <th colspan="2" class="text-right">+ Rp ${panjarAwalInput.toLocaleString('id-ID')}</th>
            </tr>
            <tr class="total-row">
              <th colspan="3" class="text-right">TOTAL SUDAH DIPOTONG:</th>
              <th colspan="2" class="text-right">- Rp ${totalRecordedAmount.toLocaleString('id-ID')}</th>
            </tr>
            <tr class="total-row">
              <th colspan="3" class="text-right">TOTAL AKAN DIEKSEKUSI:</th>
              <th colspan="2" class="text-right">- Rp ${totalSelectedAmount.toLocaleString('id-ID')}</th>
            </tr>
            <tr class="sisa-row">
              <th colspan="3" class="text-right">ESTIMASI SISA SALDO SKUM PERKARA:</th>
              <th colspan="2" class="text-right">Rp ${estimasiSisaSaldo.toLocaleString('id-ID')}</th>
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
            <DialogPanel className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border ${
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
                      Otomatis mendeteksi komponen yang belum dipotong di Jurnal SKUM agar tidak terjadi pemotongan ganda
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrintJurnalSheet}
                    className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center space-x-1.5 transition-colors border border-amber-500/30 text-xs"
                    title="Cetak Rincian Jurnal SKUM"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Cetak</span>
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
                
                {/* Error Banner when balance insufficient or no items */}
                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start space-x-3 shadow-sm animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="font-semibold text-xs leading-relaxed">
                      {errorMessage}
                    </div>
                  </div>
                )}

                {/* Case Selector Dropdown, Panjar Awal Input & Date Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                      Pilih Nomor Perkara:
                    </label>
                    <select
                      value={activeCaseId}
                      onChange={(e) => {
                        const newCaseId = e.target.value;
                        setActiveCaseId(newCaseId);
                        setErrorMessage(null);
                        const selected = cases.find(c => c.id === newCaseId);
                        if (selected) {
                          setPanjarAwalInput(selected.panjarAwal || selected.saldoPerkara || 1000000);
                          if (selected.tanggalRegister) {
                            setTanggalJurnal(selected.tanggalRegister);
                          }
                        }
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
                        cases.map((c, idx) => (
                          <option key={`${c.id}-${idx}`} value={c.id}>
                            {c.nomorPerkara} — {c.namaPihak} ({c.jenisPerkara})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                      Nominal Panjar Awal (SKUM):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={panjarAwalInput}
                        disabled={isPanjarAlreadyRecorded}
                        onChange={(e) => setPanjarAwalInput(Number(e.target.value) || 0)}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border font-mono font-bold text-xs ${
                          isPanjarAlreadyRecorded 
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-300 dark:border-slate-700 cursor-not-allowed'
                            : isLight 
                            ? 'bg-slate-50 border-slate-300 text-slate-900' 
                            : 'bg-slate-800 border-slate-700 text-emerald-400'
                        }`}
                        placeholder="1000000"
                      />
                    </div>
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

                {/* Selected Case & SKUM Status Banner */}
                {currentCase && (
                  <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-4 gap-3 ${
                    isLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/60'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Nomor Perkara</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {currentCase.nomorPerkara}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Panjar Awal</span>
                      {isPanjarAlreadyRecorded ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block mt-0.5">
                          ✓ Sudah Setor Panjar
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-block mt-0.5">
                          📥 Belum Catat Panjar
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Status Komponen SKUM</span>
                      <div className="font-semibold text-xs mt-0.5 space-x-1">
                        <span className="text-emerald-600 font-bold">{recordedFees.length} Dipotong</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-amber-600 font-bold">{unrecordedFees.length} Belum Dipotong</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimasi Sisa Saldo Perkara</span>
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                        Rp {estimasiSisaSaldo.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Journal Component Breakdown Table */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                      <span>📋 Rincian Komponen Biaya Jurnal ({currentCase?.jenisPerkara || 'Gugatan'}):</span>
                    </h4>

                    {unrecordedFees.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllUnrecorded}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 flex items-center space-x-1"
                      >
                        {selectedUnrecorded.length === unrecordedFees.length ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Pilih Semua Belum Dipotong ({unrecordedFees.length})</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            <span>Pilih Semua Belum Dipotong</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className={`border rounded-xl overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className={`border-b font-bold ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                          <th className="p-2.5 text-center w-8">Pilih</th>
                          <th className="p-2.5">Komponen Biaya Jurnal</th>
                          <th className="p-2.5">Kategori</th>
                          <th className="p-2.5 text-right">Nominal (Rp)</th>
                          <th className="p-2.5 text-center">Status Pencatatan SKUM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {/* Panjar Awal Setoran Row (Debet) */}
                        <tr className={`font-extrabold ${
                          isPanjarAlreadyRecorded 
                            ? 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-500'
                            : 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          <td className="p-2.5 text-center">
                            {isPanjarAlreadyRecorded ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-emerald-600 font-bold">📥</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            Penerimaan Panjar Awal Perkara (SKUM)
                            {isPanjarAlreadyRecorded ? (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                ✓ Setoran Panjar Awal Sudah Tercatat
                              </span>
                            ) : (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                ⚡ Akan Didaftarkan
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                              Panjar
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            + Rp {panjarAwalInput.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-center">
                            {isPanjarAlreadyRecorded ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✓ Sudah Setor
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                ⚡ Belum Catat
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expense Items Rows */}
                        {feeStatusList.map((fee) => {
                          const isChecked = selectedUnrecorded.includes(fee.name);
                          
                          return (
                            <tr 
                              key={fee.index} 
                              className={`transition-colors ${
                                fee.isRecorded 
                                  ? 'bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400' 
                                  : isChecked
                                  ? 'bg-amber-50/60 dark:bg-amber-950/20 font-bold text-slate-800 dark:text-slate-100'
                                  : 'opacity-60'
                              }`}
                            >
                              <td className="p-2.5 text-center">
                                {fee.isRecorded ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleUnrecordedItem(fee.name)}
                                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                                  />
                                )}
                              </td>
                              <td className="p-2.5">
                                {fee.name}
                                {fee.kategori === 'ATK' && !fee.isRecorded && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                    ⚡ Otomatis Masuk Ke Buku Bantu ATK
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  fee.kategori === 'ATK' 
                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {fee.kategori}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold">
                                {fee.isRecorded ? (
                                  <span>Rp {fee.amount.toLocaleString('id-ID')}</span>
                                ) : (
                                  <div className="flex items-center justify-end space-x-1">
                                    <span className="text-[10px] text-slate-400">Rp</span>
                                    <input
                                      type="number"
                                      value={fee.amount}
                                      onChange={(e) => {
                                        const val = Math.max(0, Number(e.target.value) || 0);
                                        setCustomAmounts(prev => ({ ...prev, [fee.name]: val }));
                                      }}
                                      className={`w-28 px-2 py-1 text-right rounded border font-mono text-xs font-bold ${
                                        isLight 
                                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500' 
                                          : 'bg-slate-800 border-slate-700 text-amber-300 focus:border-amber-500'
                                      }`}
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-center">
                                {fee.isRecorded ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ Sudah Dipotong
                                  </span>
                                ) : isChecked ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center space-x-1 mx-auto w-max">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                    <span>⚡ Belum Dipotong (Akan Dieksekusi)</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                    Dilewati
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className={`border-t font-bold text-xs ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-800/80 text-slate-300'}`}>
                          <td colSpan={3} className="p-2.5 text-right">TOTAL PANJAR DEBET (SKUM):</td>
                          <td colSpan={2} className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                            + Rp {panjarAwalInput.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr className={`font-bold text-xs ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-800/80 text-slate-300'}`}>
                          <td colSpan={3} className="p-2.5 text-right">KOMPONEN SUDAH DIPOTONG DI JURNAL SKUM:</td>
                          <td colSpan={2} className="p-2.5 text-right font-mono text-slate-500">
                            - Rp {totalRecordedAmount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr className={`font-bold text-xs ${isLight ? 'bg-amber-50/80 text-amber-900' : 'bg-amber-950/40 text-amber-300'}`}>
                          <td colSpan={3} className="p-2.5 text-right">KOMPONEN BELUM DIPOTONG (AKAN DIEKSEKUSI SEKARANG):</td>
                          <td colSpan={2} className="p-2.5 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400">
                            - Rp {totalSelectedAmount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                        <tr className={`border-t-2 font-extrabold text-sm ${
                          isLight ? 'bg-emerald-100/80 text-emerald-950' : 'bg-emerald-950/60 text-emerald-300'
                        }`}>
                          <td colSpan={3} className="p-3 text-right">ESTIMASI SISA SALDO PERKARA SETELAH EKSEKUSI:</td>
                          <td colSpan={2} className="p-3 text-right font-mono text-base">
                            Rp {estimasiSisaSaldo.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Process Safety & Rules Note */}
                <div className={`p-3.5 rounded-xl border text-[11px] flex items-start space-x-2.5 ${
                  isLight ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}>
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Proteksi Pemotongan Jurnal SKUM & Buku Bantu ATK:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-90">
                      <li>Sistem hanya memotong komponen yang <strong>Belum Dipotong</strong> ({selectedFeesToExecute.length} komponen pilihan).</li>
                      <li>Komponen yang <strong>Sudah Dipotong</strong> ({recordedFees.length} komponen) dilindungi dan tidak akan dipotong ulang.</li>
                      <li>Potongan <strong>Biaya Pemberkasan / ATK</strong> akan otomatis masuk sebagai penerimaan di menu <strong>Buku Bantu Biaya Proses</strong> jika dipotong saat ini.</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
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
                  disabled={selectedFeesToExecute.length === 0 && isPanjarAlreadyRecorded}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    selectedFeesToExecute.length > 0 || !isPanjarAlreadyRecorded
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 active:scale-95'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedFeesToExecute.length > 0 || !isPanjarAlreadyRecorded
                      ? `Eksekusi Potong Komponen Belum Tercatat (${selectedFeesToExecute.length} Items - Rp ${totalSelectedAmount.toLocaleString('id-ID')})`
                      : '✓ Semua Komponen Sudah Dipotong (0 Baru)'}
                  </span>
                </button>
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};


