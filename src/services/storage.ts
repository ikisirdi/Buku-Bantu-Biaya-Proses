import { CaseRecord, NotificationItem, SyncSettings, CacheMetadata, BiayaProsesRecord } from '../types';
import { INITIAL_CASE_RECORDS } from '../data/initialData';

const STORAGE_KEYS = {
  CASES: 'pa_perkara_data_v1',
  NOTIFICATIONS: 'pa_perkara_notifications_v1',
  SYNC_SETTINGS: 'pa_perkara_sync_settings_v1',
  CACHE_META: 'pa_perkara_cache_meta_v1',
  BIAYA_PROSES: 'pa_perkara_biaya_proses_v1',
};

export const INITIAL_BIAYA_PROSES_RECORDS: BiayaProsesRecord[] = [
  {
    id: 'bp-001',
    tanggal: '2026-01-05',
    nomorPerkara: '1/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-01-05T08:30:00.000Z'
  },
  {
    id: 'bp-002',
    tanggal: '2026-01-08',
    nomorPerkara: '2/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-01-08T09:00:00.000Z'
  },
  {
    id: 'bp-003',
    tanggal: '2026-01-15',
    nomorPerkara: '3/Pdt.P/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Permohonan',
    kategori: 'ATK',
    createdAt: '2026-01-15T09:30:00.000Z'
  },
  {
    id: 'bp-004',
    tanggal: '2026-01-28',
    nomorPerkara: '-',
    uraian: 'Pembelian Kertas HVS A4 & Map Berkas Perkara',
    penerimaan: 0,
    pengeluaran: 150000,
    keterangan: 'Pengeluaran ATK Kantor Panitera',
    kategori: 'ATK',
    createdAt: '2026-01-28T14:00:00.000Z'
  },
  {
    id: 'bp-005',
    tanggal: '2026-02-02',
    nomorPerkara: '4/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-02-02T09:00:00.000Z'
  },
  {
    id: 'bp-006',
    tanggal: '2026-02-14',
    nomorPerkara: '5/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-02-14T09:00:00.000Z'
  },
  {
    id: 'bp-007',
    tanggal: '2026-02-25',
    nomorPerkara: '1/Pdt.G/2026/PA.Pan',
    uraian: 'Penggandaan Berkas Sidang & Sampul Minutasi',
    penerimaan: 0,
    pengeluaran: 75000,
    keterangan: 'Minutasi Berkas',
    kategori: 'Proses',
    createdAt: '2026-02-25T11:00:00.000Z'
  },
  {
    id: 'bp-008',
    tanggal: '2026-03-01',
    nomorPerkara: '6/Pdt.P/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Permohonan',
    kategori: 'ATK',
    createdAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'bp-009',
    tanggal: '2026-03-18',
    nomorPerkara: '7/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-03-18T11:00:00.000Z'
  },
  {
    id: 'bp-010',
    tanggal: '2026-04-05',
    nomorPerkara: '8/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-04-05T09:00:00.000Z'
  },
  {
    id: 'bp-011',
    tanggal: '2026-04-20',
    nomorPerkara: '9/Pdt.P/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Permohonan',
    kategori: 'ATK',
    createdAt: '2026-04-20T10:00:00.000Z'
  },
  {
    id: 'bp-012',
    tanggal: '2026-05-02',
    nomorPerkara: '10/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-05-02T10:00:00.000Z'
  },
  {
    id: 'bp-013',
    tanggal: '2026-05-18',
    nomorPerkara: '11/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-05-18T11:00:00.000Z'
  },
  {
    id: 'bp-014',
    tanggal: '2026-06-01',
    nomorPerkara: '12/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'bp-015',
    tanggal: '2026-06-12',
    nomorPerkara: '13/Pdt.P/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Permohonan',
    kategori: 'ATK',
    createdAt: '2026-06-12T10:30:00.000Z'
  },
  {
    id: 'bp-016',
    tanggal: '2026-07-01',
    nomorPerkara: '14/Pdt.G/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Pendaftaran',
    kategori: 'ATK',
    createdAt: '2026-07-01T09:00:00.000Z'
  },
  {
    id: 'bp-017',
    tanggal: '2026-07-15',
    nomorPerkara: '15/Pdt.P/2026/PA.Pan',
    uraian: 'Pemotongan ATK Pendaftaran Perkara',
    penerimaan: 100000,
    pengeluaran: 0,
    keterangan: 'Penerimaan Panjar ATK Permohonan',
    kategori: 'ATK',
    createdAt: '2026-07-15T14:00:00.000Z'
  },
  {
    id: 'bp-018',
    tanggal: '2026-07-20',
    nomorPerkara: '-',
    uraian: 'Pengadaan Tinta Printer & Tonner Berkas Perkara',
    penerimaan: 0,
    pengeluaran: 200000,
    keterangan: 'Pengeluaran Biaya Proses Perkara',
    kategori: 'Proses',
    createdAt: '2026-07-20T10:00:00.000Z'
  }
];


export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSyncEnabled: true,
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbx_N2FEFTTruxZzyR5BzVRted8jpgE-qTSABwivhx0_s7v8aDR1VIpIsxhlABbY6jQs/exec',
  syncIntervalMinutes: 15,
  syncStatus: 'idle',
};

export class StorageService {
  private static cacheHitCount = 0;

  static getCases(): CaseRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CASES);
      if (raw) {
        this.cacheHitCount++;
        this.updateCacheMetaHit();
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading cases from storage:', e);
    }
    // Seed with initial data if empty
    this.saveCases(INITIAL_CASE_RECORDS);
    return INITIAL_CASE_RECORDS;
  }

  static saveCases(cases: CaseRecord[]): void {
    try {
      const jsonString = JSON.stringify(cases);
      localStorage.setItem(STORAGE_KEYS.CASES, jsonString);
      
      // Update Cache Metadata
      const meta: CacheMetadata = {
        lastUpdated: new Date().toISOString(),
        recordCount: cases.length,
        sizeBytes: new Blob([jsonString]).size,
        ttlMinutes: 60,
        cacheHitCount: this.cacheHitCount,
      };
      localStorage.setItem(STORAGE_KEYS.CACHE_META, JSON.stringify(meta));
    } catch (e) {
      console.error('Error saving cases to storage:', e);
    }
  }

  static getNotifications(): NotificationItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
    const defaultNotifs: NotificationItem[] = [
      {
        id: 'notif-001',
        title: 'Peringatan Saldo Rp0',
        message: 'Perkara 1/Pdt.G/2026/PA.Pan (Muhammad Zakaria) memiliki saldo Rp0. Perlu konfirmasi status panjar.',
        type: 'alert',
        timestamp: new Date().toISOString(),
        read: false,
        nomorPerkara: '1/Pdt.G/2026/PA.Pan'
      },
      {
        id: 'notif-002',
        title: 'Sistem Terhubung',
        message: 'Basis data JSON lokal siap dan cache aktif. Performa muat halaman optimal.',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: true
      }
    ];
    this.saveNotifications(defaultNotifs);
    return defaultNotifs;
  }

  static saveNotifications(notifications: NotificationItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }

  static getSyncSettings(): SyncSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SYNC_SETTINGS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading sync settings:', e);
    }
    return DEFAULT_SYNC_SETTINGS;
  }

  static saveSyncSettings(settings: SyncSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving sync settings:', e);
    }
  }

  static getCacheMeta(): CacheMetadata {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CACHE_META);
      if (raw) {
        const meta = JSON.parse(raw);
        return {
          ...meta,
          cacheHitCount: this.cacheHitCount || meta.cacheHitCount || 0
        };
      }
    } catch (e) {
      console.error('Error loading cache meta:', e);
    }
    const cases = this.getCases();
    const jsonString = JSON.stringify(cases);
    return {
      lastUpdated: new Date().toISOString(),
      recordCount: cases.length,
      sizeBytes: new Blob([jsonString]).size,
      ttlMinutes: 60,
      cacheHitCount: this.cacheHitCount,
    };
  }

  private static updateCacheMetaHit(): void {
    try {
      const meta = this.getCacheMeta();
      meta.cacheHitCount = this.cacheHitCount;
      localStorage.setItem(STORAGE_KEYS.CACHE_META, JSON.stringify(meta));
    } catch (e) {
      // ignore
    }
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.CASES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.CACHE_META);
    localStorage.removeItem(STORAGE_KEYS.BIAYA_PROSES);
    this.saveCases(INITIAL_CASE_RECORDS);
    this.saveBiayaProsesRecords(INITIAL_BIAYA_PROSES_RECORDS);
  }

  static getBiayaProsesRecords(): BiayaProsesRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BIAYA_PROSES);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading biaya proses records:', e);
    }
    this.saveBiayaProsesRecords(INITIAL_BIAYA_PROSES_RECORDS);
    return INITIAL_BIAYA_PROSES_RECORDS;
  }

  static saveBiayaProsesRecords(records: BiayaProsesRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BIAYA_PROSES, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving biaya proses records:', e);
    }
  }

  static exportAsJson(): string {
    const cases = this.getCases();
    return JSON.stringify(cases, null, 2);
  }

  static exportAsCsv(): string {
    const cases = this.getCases();
    const headers = [
      'Nomor Perkara',
      'Nama Pihak',
      'Jenis Perkara',
      'Saldo Perkara (Rp)',
      'Kategori',
      'Panjar Awal (Rp)',
      'Pengeluaran (Rp)',
      'Tanggal Register',
      'Tanggal Putus',
      'Status Perkara',
      'Hakim Ketua',
      'Panitera',
      'Ruang Sidang',
      'Catatan'
    ];

    const rows = cases.map(c => [
      `"${c.nomorPerkara || ''}"`,
      `"${c.namaPihak || ''}"`,
      `"${c.jenisPerkara || ''}"`,
      c.saldoPerkara || 0,
      `"${c.kategoriPerkara || ''}"`,
      c.panjarAwal || 0,
      c.pengeluaran || 0,
      `"${c.tanggalRegister || ''}"`,
      `"${c.tanggalPutus || ''}"`,
      `"${c.status || ''}"`,
      `"${c.hakimKetua || ''}"`,
      `"${c.panitera || ''}"`,
      `"${c.ruangSidang || ''}"`,
      `"${(c.catatan || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}
