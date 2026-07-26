import React, { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircle2, AlertTriangle, Info, X, Bell } from 'lucide-react';
import { NotificationItem } from '../types';

interface ToastNotificationProps {
  toast: NotificationItem | null;
  onDismiss: () => void;
  onOpenCenter: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
  onOpenCenter
}) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <Transition
        show={!!toast}
        as={Fragment}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-4 opacity-0 scale-95"
        enterTo="translate-y-0 opacity-100 scale-100"
        leave="transition ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-2xl p-4 backdrop-blur-md flex items-start space-x-3 text-slate-100 border-l-4 border-l-emerald-500">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'alert' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-100 truncate">{toast.title}</h4>
              <button
                onClick={onOpenCenter}
                className="text-[10px] text-emerald-400 hover:underline font-semibold ml-2 shrink-0 flex items-center space-x-0.5"
              >
                <Bell className="w-3 h-3" />
                <span>Lihat</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">{toast.message}</p>
            {toast.nomorPerkara && (
              <span className="inline-block mt-1.5 text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                {toast.nomorPerkara}
              </span>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </div>
  );
};
