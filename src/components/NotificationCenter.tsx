import React, { Fragment, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild, TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { NotificationItem } from '../types';
import { Bell, Check, Trash2, AlertTriangle, Info, CheckCircle2, X, Filter } from 'lucide-react';

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
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'alerts'>('all');

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'alerts') return n.type === 'alert' || n.type === 'warning';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden p-3 sm:p-4 pt-16 flex items-start justify-end">
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-y-2 opacity-0 scale-95"
            enterTo="translate-y-0 opacity-100 scale-100"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-y-0 opacity-100 scale-100"
            leaveTo="translate-y-2 opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100 border-emerald-500/30">
              
              {/* Header */}
              <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/70 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <DialogTitle as="h3" className="font-bold text-slate-100 text-sm">
                      Notifikasi & Log System
                    </DialogTitle>
                    <p className="text-[11px] text-slate-400">Pembaruan & Status Data Real-time</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Headless UI Tab Filters & Quick Actions */}
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        filterType === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Semua ({notifications.length})
                    </button>
                    <button
                      onClick={() => setFilterType('unread')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        filterType === 'unread'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Belum Dibaca ({unreadCount})
                    </button>
                    <button
                      onClick={() => setFilterType('alerts')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        filterType === 'alerts'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Peringatan
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onMarkAllAsRead}
                      title="Tandai semua sebagai telah dibaca"
                      className="text-emerald-400 hover:bg-emerald-950/50 p-1 rounded-md transition-colors flex items-center space-x-1 text-[11px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={onClearAll}
                      title="Hapus semua notifikasi"
                      className="text-rose-400 hover:bg-rose-950/50 p-1 rounded-md transition-colors flex items-center space-x-1 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="p-3 overflow-y-auto flex-1 space-y-2">
                {filteredNotifs.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                    <Bell className="w-8 h-8 text-slate-700 mx-auto opacity-50" />
                    <p>Tidak ada notifikasi dalam kategori ini.</p>
                  </div>
                ) : (
                  filteredNotifs.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => onSelectNotification(item)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        !item.read
                          ? 'bg-slate-800/90 border-emerald-600/60 shadow-sm hover:border-emerald-500'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
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
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                            {item.message}
                          </p>
                          {item.nomorPerkara && (
                            <span className="inline-block mt-1.5 font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/90 border border-emerald-800 px-2 py-0.5 rounded-md">
                              {item.nomorPerkara}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center text-[10px] text-slate-400 shrink-0">
                Klik notifikasi untuk melihat detail / memicu tindakan otomatis.
              </div>

            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

