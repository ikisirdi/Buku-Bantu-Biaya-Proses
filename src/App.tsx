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
import { CaseTable } from './components/CaseTable';
import { BukuBiayaProses } from './components/BukuBiayaProses';
import { CaseFormModal } from './components/CaseFormModal';
import { SpreadsheetSyncModal } from './components/SpreadsheetSyncModal';
import { NotificationCenter } from './components/NotificationCenter';
import { GitHubWorkflowModal } from './components/GitHubWorkflowModal';
import { CacheManagerModal } from './components/CacheManagerModal';
import { CaseDetailModal } from './components/CaseDetailModal';
import { JurnalBiayaModal } from './components/JurnalBiayaModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'table' | 'buku-biaya-proses'>('buku-biaya-proses');
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
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [jurnalSelectedCase, setJurnalSelectedCase] = useState<CaseRecord | null>(null);

  // Load Initial Data from Storage / Cache & merge with fresh public data / Google Sheet
  const loadDataFromSource = useCallback(async (isForceSpreadsheetOverwrite = false) => {
    const loadedCases = StorageService.getCases();
    const loadedBiayaProses = StorageService.getBiayaProsesRecords();
    const loadedNotifs = StorageService.getNotifications();
    const currentSyncSettings = StorageService.getSyncSettings();

    setCases(loadedCases);
    setBiayaProsesRecords(loadedBiayaProses);
    setNotifications(loadedNotifs);
    setCacheMeta(StorageService.getCacheMeta());

    const applyCasesUpdate = (incomingRecords: CaseRecord[]) => {
      if (!Array.isArray(incomingRecords) || incomingRecords.length === 0) return;
      setCases(prevCases => {
        if (isForceSpreadsheetOverwrite) {
          StorageService.saveCases(incomingRecords);
          return incomingRecords;
        }
        const caseMap = new Map<string, CaseRecord>();
        incomingRecords.forEach(inc => {
          const key = inc.nomorPerkara && inc.nomorPerkara.trim() !== '' 
            ? inc.nomorPerkara.trim().toLowerCase() 
            : inc.id;
          caseMap.set(key, inc);
        });
        prevCases.forEach(local => {
          const key = local.nomorPerkara && local.nomorPerkara.trim() !== '' 
            ? local.nomorPerkara.trim().toLowerCase() 
            : local.id;
          if (!caseMap.has(key)) {
            caseMap.set(key, local);
          }
        });
        const merged = Array.from(caseMap.values());
        StorageService.saveCases(merged);
        return merged;
      });
      setCacheMeta(StorageService.getCacheMeta());
    };

    const applyBiayaProsesUpdate = (incomingLog: BiayaProsesRecord[]) => {
      if (!Array.isArray(incomingLog) || incomingLog.length === 0) return;
      setBiayaProsesRecords(prevRecords => {
        if (isForceSpreadsheetOverwrite) {
          StorageService.saveBiayaProsesRecords(incomingLog);
          return incomingLog;
        }
        const recordMap = new Map<string, BiayaProsesRecord>();
        incomingLog.forEach(inc => {
          const key = `${inc.tanggal}_${inc.nomorPerkara}_${inc.uraian}`.toLowerCase();
          recordMap.set(key, inc);
        });
        prevRecords.forEach(local => {
          const key = `${local.tanggal}_${local.nomorPerkara}_${local.uraian}`.toLowerCase();
          if (!recordMap.has(key)) {
            recordMap.set(key, local);
          }
        });
        const merged = Array.from(recordMap.values());
        StorageService.saveBiayaProsesRecords(merged);
        return merged;
      });
    };

    if (currentSyncSettings.googleSheetUrl && currentSyncSettings.googleSheetUrl.trim().length > 0) {
      try {
        const casesData = await SyncService.fetchGoogleSheetCsv(currentSyncSettings.googleSheetUrl);
        applyCasesUpdate(casesData);

        const logData = await SyncService.fetchGoogleSheetBiayaProsesCsv(currentSyncSettings.googleSheetUrl);
        if (logData && logData.length > 0) {
          applyBiayaProsesUpdate(logData);
        }
      } catch (err) {
        console.warn('Gagal auto-sync Google Sheet:', err);
      }
    } else {
      fetch('./data_perkara.json')
        .then(res => res.ok ? res.json() : null)
        .then(json => json && applyCasesUpdate(json))
        .catch(() => {});

      fetch('./data_biaya_proses.json')
        .then(res => res.ok ? res.json() : null)
        .then(json => json && applyBiayaProsesUpdate(json))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadDataFromSource(false);
  }, [loadDataFromSource]);

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

  const getWebhookUrl = (settings: SyncSettings): string | undefined => {
    if (settings.googleSheetWebhookUrl && settings.googleSheetWebhookUrl.trim().length > 0) {
      return settings.googleSheetWebhookUrl.trim();
    }
    if (settings.googleSheetUrl && settings.googleSheetUrl.trim().includes('script.google.com')) {
      return settings.googleSheetUrl.trim();
    }
    return undefined;
  };

  // Handlers for Buku Bantu Biaya Proses
  const handleAddBiayaProsesRecord = (record: Omit<BiayaProsesRecord, 'id' | 'createdAt'>) => {
    const newRecord: BiayaProsesRecord = {
      ...record,
      id: `bp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...biayaProsesRecords, newRecord];
    updateBiayaProsesState(updated);

    const webhook = getWebhookUrl(syncSettings);
    if (webhook) {
      SyncService.postToWebhook(webhook, 'add_biaya_proses', newRecord);
    }

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

    const webhook = getWebhookUrl(syncSettings);
    if (webhook) {
      SyncService.postToWebhook(webhook, 'update_biaya_proses', record);
    }

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

    const webhook = getWebhookUrl(syncSettings);
    if (webhook) {
      SyncService.postToWebhook(webhook, 'add_biaya_proses', newRecord);
    }

    addNotification(
      'Pemotongan ATK Perkara',
      `Uang sebesar Rp${amount.toLocaleString('id-ID')} dari perkara ${nomorPerkara} berhasil dipotong & masuk ke Buku Bantu Biaya Proses.`,
      'success',
      nomorPerkara
    );
  };

  // Zero Out Case Balance handler
  const handleZeroOutCaseBalance = (
    caseNumber: string,
    generatedItems: { uraian: string; amount: number; kategori: 'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Lainnya' }[]
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords: BiayaProsesRecord[] = generatedItems.map((item, idx) => ({
      id: `zero-${Date.now()}-${idx}`,
      tanggal: today,
      nomorPerkara: caseNumber,
      uraian: item.uraian,
      penerimaan: 0,
      pengeluaran: item.amount,
      keterangan: 'Auto-Zeroing Saldo Putus',
      kategori: item.kategori,
      createdAt: new Date().toISOString()
    }));

    const totalExpense = generatedItems.reduce((sum, item) => sum + item.amount, 0);

    const updatedRecords = [...biayaProsesRecords, ...newRecords];
    updateBiayaProsesState(updatedRecords);

    const webhook = getWebhookUrl(syncSettings);
    if (webhook) {
      newRecords.forEach(rec => {
        SyncService.postToWebhook(webhook, 'add_biaya_proses', rec);
      });
    }

    const updatedCases = cases.map(c => {
      if (c.nomorPerkara === caseNumber) {
        return {
          ...c,
          pengeluaran: (c.pengeluaran || 0) + totalExpense,
          saldoPerkara: 0,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    updateCasesState(updatedCases);

    addNotification(
      'Saldo Zero-Out Berhasil',
      `Sisa saldo perkara ${caseNumber} sebesar Rp ${totalExpense.toLocaleString('id-ID')} telah dialokasikan hingga saldo menjadi Rp0.`,
      'success',
      caseNumber
    );
  };

  // Handle Jurnal SKUM execution per case
  const handleExecuteJurnal = (
    caseId: string,
    nomorPerkara: string,
    journalItems: { uraian: string; amount: number; kategori: 'ATK' | 'Proses' | 'Meterai' | 'Redaksi' | 'Panggilan' | 'Lainnya' }[]
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords: BiayaProsesRecord[] = journalItems.map((item, idx) => ({
      id: `jurnal-${Date.now()}-${idx}`,
      tanggal: today,
      nomorPerkara,
      uraian: item.uraian,
      penerimaan: item.kategori === 'ATK' ? item.amount : 0,
      pengeluaran: item.kategori !== 'ATK' ? item.amount : 0,
      keterangan: 'Pencatatan Jurnal SKUM Biaya',
      kategori: item.kategori,
      createdAt: new Date().toISOString()
    }));

    const totalDeduction = journalItems.reduce((acc, item) => acc + item.amount, 0);

    // Update Biaya Proses Records
    const updatedRecords = [...biayaProsesRecords, ...newRecords];
    updateBiayaProsesState(updatedRecords);

    // Deduct case balance
    const updatedCases = cases.map(c => {
      if (c.id === caseId || c.nomorPerkara === nomorPerkara) {
        const nextSaldo = Math.max(0, (c.saldoPerkara || 0) - totalDeduction);
        return {
          ...c,
          pengeluaran: (c.pengeluaran || 0) + totalDeduction,
          saldoPerkara: nextSaldo,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });
    updateCasesState(updatedCases);

    // Webhook push
    const webhook = getWebhookUrl(syncSettings);
    if (webhook) {
      newRecords.forEach(rec => {
        SyncService.postToWebhook(webhook, 'add_biaya_proses', rec);
      });
    }

    addNotification(
      'Eksekusi Jurnal Biaya SKUM',
      `Jurnal biaya SKUM untuk perkara ${nomorPerkara} berhasil dicatat. Total potongan panjar: Rp ${totalDeduction.toLocaleString('id-ID')}. Potongan ATK otomatis masuk ke Buku Bantu Biaya Proses.`,
      'success',
      nomorPerkara
    );
  };

  // Save/Update Case Record
  const handleSaveCase = (formData: Partial<CaseRecord>) => {
    const webhook = getWebhookUrl(syncSettings);

    if (formData.id) {
      // Edit existing
      let updatedCaseRecord: CaseRecord | undefined;
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
          updatedCaseRecord = {
            ...c,
            ...formData,
            updatedAt: new Date().toISOString()
          } as CaseRecord;
          return updatedCaseRecord;
        }
        return c;
      });
      updateCasesState(updated);

      if (webhook && updatedCaseRecord) {
        SyncService.postToWebhook(webhook, 'update_case', updatedCaseRecord);
      }
    } else {
      // Create new
      const newRecord: CaseRecord = {
        id: `case-${Date.now()}`,
        nomorPerkara: formData.nomorPerkara || '1/Pdt.G/2026/PA.Pan',
        namaPihak: formData.namaPihak || 'Pihak Berperkara',
        jenisPerkara: formData.jenisPerkara || 'Cerai Gugat',
        kategoriPerkara: formData.kategoriPerkara || 'Gugatan',
        tingkatPerkara: formData.tingkatPerkara || 'Tingkat Pertama',
        saldoPerkara: formData.saldoPerkara ?? 0,
        panjarAwal: formData.panjarAwal ?? 1000000,
        pengeluaran: formData.pengeluaran ?? 1000000,
        tanggalRegister: formData.tanggalRegister || new Date().toISOString().split('T')[0],
        tanggalTerimaKasasiPk: formData.tanggalTerimaKasasiPk,
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

      if (webhook) {
        SyncService.postToWebhook(webhook, 'add_case', newRecord);
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
    loadDataFromSource(true);
    addNotification('Muat Ulang Data Terkini', 'Data telah diperbarui secara langsung dari Google Spreadsheet & JSON.', 'success');
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
        {activeTab === 'buku-biaya-proses' ? (
          <BukuBiayaProses
            records={biayaProsesRecords}
            cases={cases}
            onAddRecord={handleAddBiayaProsesRecord}
            onUpdateRecord={handleUpdateBiayaProsesRecord}
            onDeleteRecord={handleDeleteBiayaProsesRecord}
            onPotongAtkPerkara={handlePotongAtkPerkara}
            onZeroOutCaseBalance={handleZeroOutCaseBalance}
            onSyncSpreadsheet={() => loadDataFromSource(true)}
            syncSettings={syncSettings}
            theme={theme}
          />
        ) : (
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
            onOpenJurnal={(record) => {
              setJurnalSelectedCase(record || cases[0]);
              setIsJurnalModalOpen(true);
            }}
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
        onOpenJurnal={(record) => {
          setJurnalSelectedCase(record);
          setIsJurnalModalOpen(true);
        }}
      />

      <JurnalBiayaModal
        isOpen={isJurnalModalOpen}
        onClose={() => setIsJurnalModalOpen(false)}
        cases={cases}
        selectedCase={jurnalSelectedCase}
        onExecuteJurnal={handleExecuteJurnal}
        theme={theme}
      />

    </div>
  );
}
