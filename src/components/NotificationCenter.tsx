import React from 'react';
import { NotificationItem } from '../types';
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotification: (notif: NotificationItem) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:pr-8 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-emerald-500/20">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Notifikasi Otomatis Status Data</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{notifications.filter(n => !n.read).length} belum dibaca</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onMarkAllAsRead}
              className="text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <Check className="w-3 h-3" />
              <span>Tandai Semua Dibaca</span>
            </button>
            <button
              onClick={onClearAll}
              className="text-rose-400 hover:underline flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto divide-y divide-slate-800/80 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <p>Belum ada notifikasi pembaruan data.</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => onSelectNotification(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  !item.read
                    ? 'bg-slate-800/90 border-emerald-800/80 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {item.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {item.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    {item.nomorPerkara && (
                      <span className="inline-block mt-1 font-mono text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                        {item.nomorPerkara}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
