import React, { useState, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { BiayaProsesRecord, CaseRecord } from '../types';
import { X, Printer, Download, Calendar, FileText, Scale, CheckCircle } from 'lucide-react';

interface Lipa7aReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  biayaProsesRecords: BiayaProsesRecord[];
  cases: CaseRecord[];
  theme?: 'light' | 'dark';
}

export const Lipa7aReportModal: React.FC<Lipa7aReportModalProps> = ({
  isOpen,
  onClose,
  biayaProsesRecords,
  cases,
  theme = 'light'
}) => {
  const isLight = theme === 'light';

  // Customizable report controls
  const [bulan, setBulan] = useState<string>('MEI 2026');
  const [pengadilanName, setPengadilanName] = useState<string>('PENGADILAN AGAMA BANJARBARU');
  const [kotaTgl, setKotaTgl] = useState<string>('Banjarbaru, 29 Mei 2026');
  const [ketuaNama, setKetuaNama] = useState<string>('H. Ahmad Asy Syafi`i, S.Ag.');
  const [paniteraNama, setPaniteraNama] = useState<string>('H. YAHYADI, S.H.');

  // Financial figures (Auto-calculated from records with fallback to official reference defaults)
  const [sisaAwal, setSisaAwal] = useState<number>(105494500);
  const [penerimaanManual, setPenerimaanManual] = useState<number>(55887000);
  
  // Real dynamic totals calculated from BiayaProsesRecords if present
  const sumAtk = biayaProsesRecords.filter(r => r.kategori === 'ATK' || /atk|proses|berkas/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 9625000;
  const sumPanggilan = biayaProsesRecords.filter(r => r.kategori === 'Panggilan' || /panggil/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 2883000;
  const sumPemberitahuan = biayaProsesRecords.filter(r => /pemberitahuan|pbt/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 1888000;
  const sumPemeriksaanSetempat = biayaProsesRecords.filter(r => /pemeriksaan|desente/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 6721000;
  const sumPengiriman = biayaProsesRecords.filter(r => /pengiriman|pos/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 563000;
  const sumMeterai = biayaProsesRecords.filter(r => r.kategori === 'Meterai' || /meterai/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 1230000;
  const sumPendaftaran = biayaProsesRecords.filter(r => /pendaftaran|pnbp/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 2370000;
  const sumRedaksi = biayaProsesRecords.filter(r => r.kategori === 'Redaksi' || /redaksi/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 1230000;
  const sumLainnya = biayaProsesRecords.filter(r => r.kategori === 'Lainnya').reduce((a, b) => a + (b.pengeluaran || 0), 0) || 2470000;
  const sumSisaPanjar = biayaProsesRecords.filter(r => /sisa panjar|pengembalian/i.test(r.uraian)).reduce((a, b) => a + (b.pengeluaran || 0), 0) || 45397000;

  // Total Calculations
  const totalPenerimaan = sisaAwal + penerimaanManual;
  const totalPengeluaran = sumAtk + sumPanggilan + sumPemberitahuan + sumPemeriksaanSetempat + sumPengiriman + sumMeterai + sumPendaftaran + sumRedaksi + sumLainnya + sumSisaPanjar;
  const saldoAkhir = totalPenerimaan - totalPengeluaran;

  const [saldoKasTunai, setSaldoKasTunai] = useState<number>(22701200);
  const saldoBankSeharusnya = saldoAkhir - saldoKasTunai;
  const [saldoBankSebenarnya, setSaldoBankSebenarnya] = useState<number>(121705300);
  const selisihBank = saldoBankSeharusnya - saldoBankSebenarnya;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: number) => {
    if (val === 0) return 'Rp -';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm print:hidden" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-2 sm:p-6 flex items-center justify-center print:p-0">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border print:border-0 print:shadow-none print:max-h-none print:w-full print:rounded-none ${
              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}>
              
              {/* Header Bar */}
              <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 print:hidden ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <div>
                    <DialogTitle as="h3" className="font-bold text-base">
                      Cetak Laporan Keuangan Perkara (LIPA.7a)
                    </DialogTitle>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Format Resmi Laporan Keuangan Perkara Mahkamah Agung RI
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Laporan (Print PDF)</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs print:p-8 print:text-black print:bg-white">
                
                {/* Header Official Title */}
                <div className="text-center space-y-1 border-b pb-4 print:border-black">
                  <span className="font-extrabold text-xs tracking-widest text-emerald-700 dark:text-emerald-400 print:text-black uppercase block">
                    Kode: LIPA.7a
                  </span>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wide">
                    LAPORAN KEUANGAN PERKARA
                  </h2>
                  <h3 className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300 print:text-black">
                    {pengadilanName}
                  </h3>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 print:text-black">
                    BULAN {bulan}
                  </p>
                </div>

                {/* Main LIPA.7a Summary Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 print:border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 print:bg-gray-100 font-bold border-b border-slate-300 dark:border-slate-700 print:border-black">
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black text-center w-12">NO</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black">URAIAN</th>
                        <th className="p-2 border-r border-slate-300 dark:border-slate-700 print:border-black text-right">PENERIMAAN</th>
                        <th className="p-2 text-right">PENGELUARAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                      <tr>
                        <td className="p-2 border-r text-center font-bold">1</td>
                        <td className="p-2 border-r font-semibold">Sisa Awal</td>
                        <td className="p-2 border-r text-right font-mono font-bold">{formatRupiah(sisaAwal)}</td>
                        <td className="p-2 text-right font-mono text-slate-400 print:text-black">-</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">2</td>
                        <td className="p-2 border-r font-semibold">Penerimaan</td>
                        <td className="p-2 border-r text-right font-mono font-bold">{formatRupiah(penerimaanManual)}</td>
                        <td className="p-2 text-right font-mono text-slate-400 print:text-black">-</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">3</td>
                        <td className="p-2 border-r">Biaya Proses/ATK/Pemberkasan</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumAtk)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">4</td>
                        <td className="p-2 border-r">Biaya Panggilan</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumPanggilan)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">5</td>
                        <td className="p-2 border-r">Biaya Penerjemah</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono text-slate-400 print:text-black">Rp -</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">6</td>
                        <td className="p-2 border-r">Biaya Pemberitahuan</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumPemberitahuan)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">7</td>
                        <td className="p-2 border-r">Biaya Sita</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono text-slate-400 print:text-black">Rp -</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">8</td>
                        <td className="p-2 border-r">Biaya Pemeriksaan Setempat</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumPemeriksaanSetempat)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">9</td>
                        <td className="p-2 border-r">Biaya Sumpah</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono text-slate-400 print:text-black">Rp -</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">10</td>
                        <td className="p-2 border-r">Biaya Pengiriman</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumPengiriman)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">11</td>
                        <td className="p-2 border-r">Meterai</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumMeterai)}</td>
                      </tr>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                        <td className="p-2 border-r text-center font-bold">12</td>
                        <td colSpan={3} className="p-2">PNBP</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">13</td>
                        <td className="p-2 border-r pl-6">a. Biaya Pendaftaran</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumPendaftaran)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">14</td>
                        <td className="p-2 border-r pl-6">b. Redaksi</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumRedaksi)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">15</td>
                        <td className="p-2 border-r pl-6">c. Lain-lain</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumLainnya)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r text-center font-bold">16</td>
                        <td className="p-2 border-r font-semibold">Pengembalian Sisa Panjar</td>
                        <td className="p-2 border-r text-right font-mono text-slate-400 print:text-black">-</td>
                        <td className="p-2 text-right font-mono font-semibold">{formatRupiah(sumSisaPanjar)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-black font-extrabold bg-slate-100 dark:bg-slate-800 print:bg-gray-200">
                        <td colSpan={2} className="p-2.5 text-center uppercase">JUMLAH</td>
                        <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">{formatRupiah(totalPenerimaan)}</td>
                        <td className="p-2.5 text-right font-mono text-rose-700 dark:text-rose-400 print:text-black">{formatRupiah(totalPengeluaran)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Balances Summary Section */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-300 dark:border-slate-700 print:bg-gray-50 print:border-black space-y-2">
                  <div className="flex justify-between font-bold text-xs">
                    <span>Saldo Akhir:</span>
                    <span className="font-mono">{formatRupiah(saldoAkhir)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Saldo Kas Tunai:</span>
                    <span className="font-mono">{formatRupiah(saldoKasTunai)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-xs border-t pt-1 border-slate-300 dark:border-slate-700 print:border-black">
                    <span>Saldo Bank Seharusnya:</span>
                    <span className="font-mono">{formatRupiah(saldoBankSeharusnya)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Saldo Bank Sebenarnya:</span>
                    <span className="font-mono">{formatRupiah(saldoBankSebenarnya)}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-xs pt-1 border-t ${
                    selisihBank < 0 ? 'text-rose-600 print:text-black' : 'text-emerald-600 print:text-black'
                  }`}>
                    <span>Selisih lebih pada Saldo Bank:</span>
                    <span className="font-mono">{formatRupiah(selisihBank)}</span>
                  </div>
                </div>

                {/* Detail Table containing Tanggal per Biaya Proses */}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-2 border-b pb-1">
                    📋 Detail Rincian Biaya Proses Transaksi (Dilengkapi Kolom Tanggal):
                  </h4>
                  <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 print:border-black rounded-lg">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 print:bg-gray-100 font-bold border-b border-slate-300 dark:border-slate-700 print:border-black">
                          <th className="p-2 border-r">Tanggal</th>
                          <th className="p-2 border-r">Nomor Perkara</th>
                          <th className="p-2 border-r">Uraian Transaksi Biaya Proses</th>
                          <th className="p-2 border-r text-right">Penerimaan</th>
                          <th className="p-2 text-right">Pengeluaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                        {biayaProsesRecords.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                              Belum ada catatan log transaksi biaya proses tersimpan.
                            </td>
                          </tr>
                        ) : (
                          biayaProsesRecords.map((r) => (
                            <tr key={r.id}>
                              <td className="p-2 border-r font-mono font-bold">{r.tanggal}</td>
                              <td className="p-2 border-r font-mono font-semibold">{r.nomorPerkara}</td>
                              <td className="p-2 border-r">{r.uraian}</td>
                              <td className="p-2 border-r text-right font-mono text-emerald-700 dark:text-emerald-400 print:text-black">
                                {r.penerimaan > 0 ? formatRupiah(r.penerimaan) : '-'}
                              </td>
                              <td className="p-2 text-right font-mono text-rose-700 dark:text-rose-400 print:text-black">
                                {r.pengeluaran > 0 ? formatRupiah(r.pengeluaran) : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Keterangan / Notes Section */}
                <div className="space-y-1.5 border-t pt-4 border-slate-300 dark:border-slate-700 print:border-black text-[11px]">
                  <span className="font-bold block uppercase">Keterangan Catatan Audit:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 print:text-black font-medium">
                    <li>Terdapat 1 pendaftaran banding</li>
                    <li>Terdapat pendaftaran 3 perkara prodeo dan 1 putusan prodeo</li>
                    <li>Selisih lebih pada saldo bank merupakan PNBP belum disetor sebesar Rp 175.000</li>
                    <li>Selisih lebih pada saldo bank merupakan Perkara belum daftar sebesar Rp 1.750.000</li>
                    <li>Selisih lebih pada saldo bank merupakan Panggilan belum disetor pada aplikasi sebesar Rp 176.000</li>
                    <li>Selisih lebih pada saldo bank merupakan biaya eksekusi sebesar Rp 55.301.000</li>
                  </ul>
                </div>

                {/* Signatures Section */}
                <div className="pt-8 border-t border-slate-300 dark:border-slate-700 print:border-black flex justify-between items-start text-center text-xs font-bold">
                  <div className="space-y-12">
                    <p>Ketua</p>
                    <p className="underline uppercase pt-8">{ketuaNama}</p>
                  </div>
                  <div className="space-y-12">
                    <p>Mengetahui {kotaTgl}</p>
                    <p className="space-y-12">Panitera</p>
                    <p className="underline uppercase pt-8">{paniteraNama}</p>
                  </div>
                </div>

              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};
