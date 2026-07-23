import React from 'react';
import { CacheMetadata } from '../types';
import { Database, X, RefreshCw, Trash2, CheckCircle, HardDrive } from 'lucide-react';

interface CacheManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cacheMeta: CacheMetadata;
  onClearCache: () => void;
  onForceReload: () => void;
}

export const CacheManagerModal: React.FC<CacheManagerModalProps> = ({
  isOpen,
  onClose,
  cacheMeta,
  onClearCache,
  onForceReload
}) => {
  if (!isOpen) return null;

  const formatSizeKb = (bytes: number) => {
    return (bytes / 1024).toFixed(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">Manajemen Caching & Performa JSON</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex items-center space-x-3 text-emerald-300">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-100 text-sm">Sistem Caching Aktif & Optimal</p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Data disimpan dalam memori lokal secara ringan untuk waktu muat halaman instant (&lt;100ms).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            
            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Total Cache Hits</span>
              <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{cacheMeta.cacheHitCount} hits</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Jumlah Record Tersimpan</span>
              <span className="text-xl font-bold text-white mt-0.5 block">{cacheMeta.recordCount} Perkara</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Ukuran Memori JSON</span>
              <span className="text-xl font-bold text-blue-400 mt-0.5 block">{formatSizeKb(cacheMeta.sizeBytes)} KB</span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Waktu Update Terakhir</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 block">
                {new Date(cacheMeta.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClearCache}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Cache Ke Default</span>
            </button>

            <button
              onClick={onForceReload}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Data</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
