import React, { useState, useEffect, useCallback } from 'react';
import { 
  CaseRecord, 
  FilterState, 
  NotificationItem, 
  SyncSettings, 
  CacheMetadata,
  BiayaProsesRecord
} from './types';
import { StorageService } from './services/storage';
import { SyncService } from './services/syncService';
import { Navbar } from './components/Navbar';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CaseTable } from './components/CaseTable';
import { BukuBiayaProses } from './components/BukuBiayaProses';
import { CaseFormModal } from './components/CaseFormModal';
import { SpreadsheetSyncModal } from './components/SpreadsheetSyncModal';
import { NotificationCenter } from './components/NotificationCenter';
import { GitHubWorkflowModal } from './components/GitHubWorkflowModal';
import { CacheManagerModal } from './components/CacheManagerModal';
import { CaseDetailModal } from './components/CaseDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'buku-biaya-proses'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('pa_perkara_theme_v1') as 'light' | 'dark') || 'light';
  });
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [biayaProsesRecords, setBiayaProsesRecords] = useState<BiayaProsesRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(StorageService.getSyncSettings());
  const [cacheMeta, setCacheMeta] = useState<CacheMetadata>(StorageService.getCacheMeta());

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('pa_perkara_theme_v1', nextTheme);
  };

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    jenisPerkara: 'ALL',
    kategoriPerkara: 'ALL',
    status: 'ALL',
    tahun: 'ALL'
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CaseRecord | undefined>(undefined);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseRecord | null>(null);

  // Load Initial Data from Storage / Cache
  useEffect(() => {
    const loadedCases = StorageService.getCases();
    const loadedBiayaProses = StorageService.getBiayaProsesRecords();
    const loadedNotifs = StorageService.getNotifications();
    setCases(loadedCases);
    setBiayaProsesRecords(loadedBiayaProses);
    setNotifications(loadedNotifs);
    setCacheMeta(StorageService.getCacheMeta());
  }, []);

  // Sync state changes to storage
  const updateCasesState = useCallback((newCases: CaseRecord[]) => {
    setCases(newCases);
    StorageService.saveCases(newCases);
    setCacheMeta(StorageService.getCacheMeta());
  }, []);

  const updateBiayaProsesState = useCallback((newRecords: BiayaProsesRecord[]) => {
    setBiayaProsesRecords(newRecords);
    StorageService.saveBiayaProsesRecords(newRecords);
  }, []);

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert', nomorPerkara?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      nomorPerkara
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      StorageService.saveNotifications(updated);
      return updated;
    });
  }, []);

  // Handlers for Buku Bantu Biaya Proses
  const handleAddBiayaProsesRecord = (record: Omit<BiayaProsesRecord, 'id' | 'createdAt'>) => {
    const newRecord: BiayaProsesRecord = {
      ...record,
      id: `bp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...biayaProsesRecords, newRecord];
    updateBiayaProsesState(updated);
    addNotification(
      'Transaksi Log Biaya Proses',
      `Berhasil mencatat log transaksi: ${newRecord.uraian} (${newRecord.penerimaan > 0 ? `Penerimaan Rp${newRecord.penerimaan.toLocaleString('id-ID')}` : `Pengeluaran Rp${newRecord.pengeluaran.toLocaleString('id-ID')}`}).`,
      'success',
      newRecord.nomorPerkara !== '-' ? newRecord.nomorPerkara : undefined
    );
  };

  const handleUpdateBiayaProsesRecord = (record: BiayaProsesRecord) => {
    const updated = biayaProsesRecords.map(r => r.id === record.id ? record : r);
    updateBiayaProsesState(updated);
    addNotification('Log Transaksi Diperbarui', `Log transaksi ${record.uraian} berhasil diperbarui.`, 'info');
  };

  const handleDeleteBiayaProsesRecord = (id: string) => {
    const updated = biayaProsesRecords.filter(r => r.id !== id);
    updateBiayaProsesState(updated);
    addNotification('Log Transaksi Dihapus', 'Satu log transaksi telah dihapus dari Buku Bantu Biaya Proses.', 'warning');
  };

  const handlePotongAtkPerkara = (nomorPerkara: string, amount: number, uraian: string, tanggal: string) => {
    const newRecord: BiayaProsesRecord = {
      id: `bp-atk-${Date.now()}`,
      tanggal,
      nomorPerkara,
      uraian,
      penerimaan: amount,
      pengeluaran: 0,
      keterangan: 'Penerimaan Pemotongan ATK Perkara',
      kategori: 'ATK',
      createdAt: new Date().toISOString()
    };
    const updated = [...biayaProsesRecords, newRecord];
    updateBiayaProsesState(updated);
    addNotification(
      'Pemotongan ATK Perkara',
      `Uang sebesar Rp${amount.toLocaleString('id-ID')} dari perkara ${nomorPerkara} berhasil dipotong & masuk ke Buku Bantu Biaya Proses.`,
      'success',
      nomorPerkara
    );
  };

  // Save/Update Case Record
  const handleSaveCase = (formData: Partial<CaseRecord>) => {
    if (formData.id) {
      // Edit existing
      const updated = cases.map(c => {
        if (c.id === formData.id) {
          const isSaldoZero = formData.saldoPerkara === 0;
          if (isSaldoZero && c.saldoPerkara !== 0) {
            addNotification(
              'Peringatan Saldo Rp0',
              `Perkara ${formData.nomorPerkara} (${formData.namaPihak}) kini memiliki saldo Rp0. Memerlukan konfirmasi penambahan panjar.`,
              'alert',
              formData.nomorPerkara
            );
          } else if (c.status !== formData.status) {
            addNotification(
              'Pembaruan Status Perkara',
              `Perkara ${formData.nomorPerkara} telah berubah status menjadi ${formData.status}.`,
              'info',
              formData.nomorPerkara
            );
          }
          return {
            ...c,
            ...formData,
            updatedAt: new Date().toISOString()
          } as CaseRecord;
        }
        return c;
      });
      updateCasesState(updated);
    } else {
      // Create new
      const newRecord: CaseRecord = {
        id: `case-${Date.now()}`,
        nomorPerkara: formData.nomorPerkara || '1/Pdt.G/2026/PA.Pan',
        namaPihak: formData.namaPihak || 'Pihak Berperkara',
        jenisPerkara: formData.jenisPerkara || 'Cerai Gugat',
        kategoriPerkara: formData.kategoriPerkara || 'Gugatan',
        saldoPerkara: formData.saldoPerkara ?? 0,
        panjarAwal: formData.panjarAwal ?? 1000000,
        pengeluaran: formData.pengeluaran ?? 1000000,
        tanggalRegister: formData.tanggalRegister || new Date().toISOString().split('T')[0],
        tanggalPutus: formData.tanggalPutus,
        status: formData.status || 'Pendaftaran',
        hakimKetua: formData.hakimKetua,
        panitera: formData.panitera,
        ruangSidang: formData.ruangSidang,
        catatan: formData.catatan,
        updatedAt: new Date().toISOString()
      };

      const updated = [newRecord, ...cases];
      updateCasesState(updated);

      if (syncSettings.googleSheetWebhookUrl) {
        SyncService.postToWebhook(syncSettings.googleSheetWebhookUrl, 'add_case', newRecord);
      }

      addNotification(
        'Perkara Baru Terdaftar',
        `Perkara nomor ${newRecord.nomorPerkara} (${newRecord.namaPihak}) berhasil diinput secara otomatis.`,
        'success',
        newRecord.nomorPerkara
      );

      if (newRecord.saldoPerkara === 0) {
        addNotification(
          'Peringatan Saldo Rp0',
          `Perkara ${newRecord.nomorPerkara} terdaftar dengan saldo Rp0.`,
          'alert',
          newRecord.nomorPerkara
        );
      }
    }
  };

  // Delete Case
  const handleDeleteCase = (id: string) => {
    const target = cases.find(c => c.id === id);
    const updated = cases.filter(c => c.id !== id);
    updateCasesState(updated);

    if (target) {
      addNotification(
        'Perkara Dihapus',
        `Data perkara ${target.nomorPerkara} telah dihapus dari basis data JSON lokal.`,
        'warning'
      );
    }
  };

  // Bulk Import Cases from Spreadsheet
  const handleImportCases = (importedCases: CaseRecord[]) => {
    // Merge or Replace strategy (here replace/prepend unique)
    const existingNumbers = new Set(cases.map(c => c.nomorPerkara));
    const newItems = importedCases.filter(c => !existingNumbers.has(c.nomorPerkara));
    
    const combined = [...newItems, ...cases];
    updateCasesState(combined);

    addNotification(
      'Sinkronisasi Spreadsheet',
      `Berhasil mengimpor ${newItems.length} data perkara baru dari spreadsheet. Total data: ${combined.length}.`,
      'success'
    );
  };

  // Notification actions
  const handleMarkAllNotifsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    StorageService.saveNotifications([]);
  };

  const handleSelectNotification = (notif: NotificationItem) => {
    if (notif.nomorPerkara) {
      const match = cases.find(c => c.nomorPerkara === notif.nomorPerkara);
      if (match) {
        setSelectedCaseDetail(match);
      }
    }
    // Mark this notif as read
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  // Cache reset
  const handleClearCache = () => {
    StorageService.resetToDefault();
    const defaultCases = StorageService.getCases();
    setCases(defaultCases);
    setCacheMeta(StorageService.getCacheMeta());
    addNotification('Cache Direset', 'Basis data JSON lokal direset ke keadaan awal.', 'info');
  };

  const handleForceReload = () => {
    const fresh = StorageService.getCases();
    setCases(fresh);
    setCacheMeta(StorageService.getCacheMeta());
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
      isLight 
        ? 'bg-slate-100 text-slate-800 selection:bg-emerald-500 selection:text-white' 
        : 'bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white'
    }`}>
      
      {/* Navigation Header */}
      <Navbar
        onOpenForm={() => {
          setEditingRecord(undefined);
          setIsFormOpen(true);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenGithubModal={() => setIsGithubModalOpen(true)}
        onOpenCacheModal={() => setIsCacheModalOpen(true)}
        onToggleNotifPopover={() => setIsNotifOpen(prev => !prev)}
        unreadNotifCount={unreadNotifCount}
        syncSettings={syncSettings}
        cacheMeta={cacheMeta}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container - Responsive layout adapting to full width */}
      <main className="flex-1 max-w-[100%] xl:max-w-[1700px] 2xl:max-w-[1920px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Dynamic View rendering */}
        {activeTab === 'dashboard' ? (
          <AnalyticsDashboard
            cases={cases}
            filters={filters}
            setFilters={setFilters}
            onSelectCase={(record) => setSelectedCaseDetail(record)}
            onOpenForm={() => {
              setEditingRecord(undefined);
              setIsFormOpen(true);
            }}
          />
        ) : activeTab === 'table' ? (
          <CaseTable
            cases={cases}
            filters={filters}
            setFilters={setFilters}
            onOpenForm={(recordToEdit) => {
              setEditingRecord(recordToEdit);
              setIsFormOpen(true);
            }}
            onSelectCase={(record) => setSelectedCaseDetail(record)}
            onDeleteCase={handleDeleteCase}
            theme={theme}
          />
        ) : (
          <BukuBiayaProses
            records={biayaProsesRecords}
            cases={cases}
            onAddRecord={handleAddBiayaProsesRecord}
            onUpdateRecord={handleUpdateBiayaProsesRecord}
            onDeleteRecord={handleDeleteBiayaProsesRecord}
            onPotongAtkPerkara={handlePotongAtkPerkara}
            theme={theme}
          />
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs w-full transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-500'
      }`}>
        <div className="max-w-[100%] xl:max-w-[1700px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Sistem Manajemen Perkara & Buku Bantu Biaya Proses (PA PANIAI). Real-time Sync & Export Ready.</p>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsGithubModalOpen(true)} className={`${isLight ? 'text-slate-600 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'} underline`}>
              GitHub Workflow & Storage Info
            </button>
            <button onClick={() => setIsCacheModalOpen(true)} className={`${isLight ? 'text-slate-600 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'} underline`}>
              System Cache ({cacheMeta.cacheHitCount} hits)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Popovers */}
      <CaseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveCase}
        recordToEdit={editingRecord}
        totalCasesCount={cases.length}
      />

      <SpreadsheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncSettings={syncSettings}
        onSaveSyncSettings={(newSettings) => {
          setSyncSettings(newSettings);
          StorageService.saveSyncSettings(newSettings);
        }}
        onImportCases={handleImportCases}
        theme={theme}
      />

      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
        onSelectNotification={handleSelectNotification}
      />

      <GitHubWorkflowModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      <CacheManagerModal
        isOpen={isCacheModalOpen}
        onClose={() => setIsCacheModalOpen(false)}
        cacheMeta={cacheMeta}
        onClearCache={handleClearCache}
        onForceReload={handleForceReload}
      />

      <CaseDetailModal
        record={selectedCaseDetail}
        onClose={() => setSelectedCaseDetail(null)}
        onEdit={(record) => {
          setEditingRecord(record);
          setIsFormOpen(true);
        }}
      />

    </div>
  );
}
