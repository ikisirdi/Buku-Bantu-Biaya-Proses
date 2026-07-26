import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { CaseRecord } from '../types';
import { X, Printer, Scale, Calendar, Wallet, CheckCircle, User, FileText } from 'lucide-react';

interface CaseDetailModalProps {
  record: CaseRecord | null;
  onClose: () => void;
  onEdit: (record: CaseRecord) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ record, onClose, onEdit }) => {
  if (!record) return null;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Transition show={!!record} as={Fragment}>
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

        <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6 flex items-center justify-center print:p-0">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 print:border-0 print:shadow-none print:bg-white print:text-black">
              
              {/* Header */}
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0 print:hidden">
                <div className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <DialogTitle as="h3" className="font-bold text-slate-100 text-base">
                    Kartu Kontrol Detail Perkara
                  </DialogTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center space-x-1 text-xs px-2.5 font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Kartu</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Card Body */}
              <div className="p-6 space-y-6 overflow-y-auto text-xs print:p-8">
                
                {/* Card Title Header */}
                <div className="text-center pb-4 border-b border-slate-800 print:border-black">
                  <h2 className="text-lg font-bold font-mono text-emerald-400 print:text-black">
                    PERKARA NO. {record.nomorPerkara}
                  </h2>
                  <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                    {record.kategoriPerkara.toUpperCase()} - {record.jenisPerkara.toUpperCase()}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border bg-slate-800 border-slate-700 text-slate-200 print:bg-gray-100 print:text-black">
                    Status: {record.status}
                  </span>
                </div>

                {/* Core Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
                    <span className="text-slate-400 print:text-gray-500 block text-[10px] uppercase font-bold">Nama Pihak / Para Pihak</span>
                    <span className="text-sm font-semibold text-slate-100 print:text-black mt-1 block">
                      {record.namaPihak}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
                    <span className="text-slate-400 print:text-gray-500 block text-[10px] uppercase font-bold">Tanggal Register</span>
                    <span className="text-sm font-semibold text-slate-100 print:text-black mt-1 block">
                      {record.tanggalRegister}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
                    <span className="text-slate-400 print:text-gray-500 block text-[10px] uppercase font-bold">Panjar Awal</span>
                    <span className="text-sm font-semibold text-slate-200 print:text-black mt-1 block">
                      {formatRupiah(record.panjarAwal || 0)}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
                    <span className="text-slate-400 print:text-gray-500 block text-[10px] uppercase font-bold">Saldo Panjar Perkara (Rp)</span>
                    <span className={`text-sm font-bold mt-1 block ${
                      record.saldoPerkara === 0 ? 'text-rose-400 print:text-red-600' : 'text-emerald-400 print:text-green-700'
                    }`}>
                      {formatRupiah(record.saldoPerkara)}
                    </span>
                  </div>

                </div>

                {/* Judicial Officers */}
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2 print:border-gray-300 print:bg-gray-50">
                  <h4 className="font-bold text-slate-200 print:text-black text-xs uppercase tracking-wider">Aparat Persidangan</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 print:text-black text-xs">
                    <div><span className="text-slate-400">Hakim Ketua:</span> {record.hakimKetua || '-'}</div>
                    <div><span className="text-slate-400">Panitera:</span> {record.panitera || '-'}</div>
                    <div><span className="text-slate-400">Ruang Sidang:</span> {record.ruangSidang || '-'}</div>
                    <div><span className="text-slate-400">Tanggal Putus:</span> {record.tanggalPutus || 'Belum Putus'}</div>
                  </div>
                </div>

                {/* Notes */}
                {record.catatan && (
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
                    <h4 className="font-bold text-slate-200 print:text-black text-xs uppercase tracking-wider mb-1">Catatan Perkara</h4>
                    <p className="text-slate-300 print:text-gray-800 leading-relaxed italic">{record.catatan}</p>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex justify-between shrink-0 print:hidden">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(record);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  Edit Data
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

