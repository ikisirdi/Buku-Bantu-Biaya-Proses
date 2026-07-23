import React, { useMemo, useState } from 'react';
import { 
  CaseRecord, 
  FilterState, 
  JenisPerkara, 
  KategoriPerkara, 
  StatusPerkara 
} from '../types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Filter, 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wallet, 
  PieChart as PieIcon, 
  BarChart3, 
  RotateCcw,
  Calendar
} from 'lucide-react';

interface AnalyticsDashboardProps {
  cases: CaseRecord[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onSelectCase: (record: CaseRecord) => void;
  onOpenForm: () => void;
}

const COLORS = [
  '#059669', // Emerald 600
  '#2563eb', // Blue 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#e11d48', // Rose 600
  '#0891b2', // Cyan 600
  '#4d7c0f', // Lime 700
  '#c026d3'  // Fuchsia 600
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  cases,
  filters,
  setFilters,
  onSelectCase,
  onOpenForm
}) => {
  // Filtered dataset
  const filteredCases = useMemo(() => {
    return cases.filter(item => {
      // Search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchNomor = item.nomorPerkara.toLowerCase().includes(q);
        const matchNama = item.namaPihak.toLowerCase().includes(q);
        const matchJenis = item.jenisPerkara.toLowerCase().includes(q);
        if (!matchNomor && !matchNama && !matchJenis) return false;
      }
      // Jenis Perkara
      if (filters.jenisPerkara !== 'ALL' && item.jenisPerkara !== filters.jenisPerkara) {
        return false;
      }
      // Kategori
      if (filters.kategoriPerkara !== 'ALL' && item.kategoriPerkara !== filters.kategoriPerkara) {
        return false;
      }
      // Status
      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false;
      }
      // Tahun
      if (filters.tahun !== 'ALL') {
        const year = item.tanggalRegister ? item.tanggalRegister.split('-')[0] : '';
        if (year !== filters.tahun) return false;
      }
      return true;
    });
  }, [cases, filters]);

  // Key KPI Metrics
  const totalPerkara = filteredCases.length;
  const perkaraAktif = filteredCases.filter(c => c.status === 'Pendaftaran' || c.status === 'Diperiksa').length;
  const perkaraSelesai = filteredCases.filter(c => c.status === 'Putus' || c.status === 'Minutasi' || c.status === 'Selesai' || c.status === 'Arsip').length;
  const totalSaldoPanjar = filteredCases.reduce((acc, c) => acc + (c.saldoPerkara || 0), 0);
  const saldoZeroCount = filteredCases.filter(c => c.saldoPerkara === 0).length;

  // Monthly Trend Data Generation
  const monthlyTrendData = useMemo(() => {
    const monthsMap: Record<string, { monthName: string; pendaftaran: number; penyelesaian: number; saldoTotal: number }> = {
      '2026-01': { monthName: 'Jan 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 },
      '2026-02': { monthName: 'Feb 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 },
      '2026-03': { monthName: 'Mar 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 },
      '2026-04': { monthName: 'Apr 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 },
      '2026-05': { monthName: 'Mei 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 },
      '2026-06': { monthName: 'Jun 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 },
      '2026-07': { monthName: 'Jul 2026', pendaftaran: 0, penyelesaian: 0, saldoTotal: 0 }
    };

    filteredCases.forEach(c => {
      if (c.tanggalRegister) {
        const monthKey = c.tanggalRegister.substring(0, 7);
        if (monthsMap[monthKey]) {
          monthsMap[monthKey].pendaftaran += 1;
          monthsMap[monthKey].saldoTotal += c.saldoPerkara || 0;
        }
      }
      if (c.tanggalPutus) {
        const putusKey = c.tanggalPutus.substring(0, 7);
        if (monthsMap[putusKey]) {
          monthsMap[putusKey].penyelesaian += 1;
        }
      } else if (c.status === 'Putus' || c.status === 'Selesai' || c.status === 'Minutasi') {
        if (c.tanggalRegister) {
          const mKey = c.tanggalRegister.substring(0, 7);
          if (monthsMap[mKey]) monthsMap[mKey].penyelesaian += 1;
        }
      }
    });

    return Object.values(monthsMap);
  }, [filteredCases]);

  // Case Type Distribution Data
  const jenisDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCases.forEach(c => {
      counts[c.jenisPerkara] = (counts[c.jenisPerkara] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredCases]);

  // Status Breakdown Data
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCases.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredCases]);

  // Format IDR Currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleResetFilter = () => {
    setFilters({
      searchQuery: '',
      jenisPerkara: 'ALL',
      kategoriPerkara: 'ALL',
      status: 'ALL',
      tahun: 'ALL'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* FILTER & CONTROL PANEL */}
      <div id="analytics-filter-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">Filter Analitik & Kinerja Perkara</h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {filteredCases.length} Perkara Terfilter
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetFilter}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Filter Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          
          {/* Kategori Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Kategori Perkara</label>
            <select
              id="filter-kategori-select"
              value={filters.kategoriPerkara}
              onChange={(e) => setFilters(prev => ({ ...prev, kategoriPerkara: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Kategori (Gugatan & Permohonan)</option>
              <option value="Gugatan">Gugatan (Pdt.G)</option>
              <option value="Permohonan">Permohonan (Pdt.P)</option>
            </select>
          </div>

          {/* Jenis Perkara Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Jenis Perkara</label>
            <select
              id="filter-jenis-select"
              value={filters.jenisPerkara}
              onChange={(e) => setFilters(prev => ({ ...prev, jenisPerkara: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Jenis Perkara</option>
              <option value="Cerai Talak">Cerai Talak</option>
              <option value="Cerai Gugat">Cerai Gugat</option>
              <option value="Penetapan Ahli Waris">Penetapan Ahli Waris</option>
              <option value="Harta Bersama">Harta Bersama</option>
              <option value="Hibah">Hibah</option>
              <option value="Wasiat">Wasiat</option>
              <option value="Hak Asuh Anak">Hak Asuh Anak</option>
              <option value="Nafkah Anak">Nafkah Anak</option>
              <option value="Dispensasi Nikah">Dispensasi Nikah</option>
              <option value="Wali Adhal">Wali Adhal</option>
            </select>
          </div>

          {/* Status Perkara Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status Perkara</label>
            <select
              id="filter-status-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Pendaftaran">Pendaftaran</option>
              <option value="Diperiksa">Diperiksa (Proses Sidang)</option>
              <option value="Putus">Putus</option>
              <option value="Minutasi">Minutasi</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Tahun Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tahun Register</label>
            <select
              id="filter-tahun-select"
              value={filters.tahun}
              onChange={(e) => setFilters(prev => ({ ...prev, tahun: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Perkara */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Perkara</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalPerkara}</h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">Tercatat di sistem</p>
          </div>
          <div className="w-11 h-11 bg-emerald-950/80 border border-emerald-800/60 rounded-xl flex items-center justify-center text-emerald-400">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Perkara Aktif */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Dalam Proses</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{perkaraAktif}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sedang diperiksa</p>
          </div>
          <div className="w-11 h-11 bg-amber-950/80 border border-amber-800/60 rounded-xl flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Perkara Selesai */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Putus / Selesai</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{perkaraSelesai}</h3>
            <p className="text-[11px] text-blue-400 mt-0.5">
              {totalPerkara > 0 ? `${Math.round((perkaraSelesai / totalPerkara) * 100)}% Penyelesaian` : '0%'}
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-950/80 border border-blue-800/60 rounded-xl flex items-center justify-center text-blue-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Saldo Panjar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Saldo Panjar</p>
            <h3 className="text-lg font-bold text-emerald-300 mt-1 tracking-tight">{formatRupiah(totalSaldoPanjar)}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sisa sirkulasi biaya</p>
          </div>
          <div className="w-11 h-11 bg-emerald-950/80 border border-emerald-800/60 rounded-xl flex items-center justify-center text-emerald-300">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Rp0 Alert */}
        <div className={`border rounded-2xl p-4 shadow-lg flex items-center justify-between transition-all ${
          saldoZeroCount > 0 ? 'bg-rose-950/30 border-rose-800/60' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <p className="text-xs text-slate-400 font-medium">Saldo Panjar Rp0</p>
            <h3 className={`text-2xl font-bold mt-1 ${saldoZeroCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {saldoZeroCount}
            </h3>
            <p className="text-[11px] text-rose-400 mt-0.5">
              {saldoZeroCount > 0 ? 'Butuh Penambahan Panjar' : 'Semua aman'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            saldoZeroCount > 0 ? 'bg-rose-900/60 border border-rose-700 text-rose-300' : 'bg-slate-800 text-slate-500'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* MONTHLY TREND CHART (MAIN VISUALIZATION) */}
      <div id="chart-monthly-trend" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 mb-4 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Grafik Tren Bulanan Pendaftaran & Penyelesaian</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Visualisasi kinerja masuknya perkara vs penyelesaian perkara per bulan</p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Pendaftaran Baru</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-slate-300">Penyelesaian (Putus/Selesai)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="pendaftaran" 
                name="Perkara Masuk" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#10b981' }} 
                activeDot={{ r: 7 }} 
              />
              <Line 
                type="monotone" 
                dataKey="penyelesaian" 
                name="Perkara Putus/Selesai" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#3b82f6' }} 
                activeDot={{ r: 7 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TWO COLUMN CHARTS: CATEGORY DISTRIBUTION & STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Case Type Bar Chart */}
        <div id="chart-jenis-perkara" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Distribusi Berdasarkan Jenis Perkara</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jenisDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  interval={0} 
                  angle={-20} 
                  textAnchor="end" 
                />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    color: '#f8fafc',
                    fontSize: '12px'
                  }} 
                />
                <Bar dataKey="value" name="Jumlah Perkara" radius={[6, 6, 0, 0]}>
                  {jenisDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie Chart */}
        <div id="chart-status-perkara" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
            <PieIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Proporsi Status Penyelesaian Perkara</h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {statusDistributionData.map((_, index) => (
                    <Cell key={`status-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '0.75rem', 
                    color: '#f8fafc',
                    fontSize: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RECENT CASE SPOTLIGHT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Ringkasan Perkara Terbaru</h3>
          </div>
          <button
            onClick={onOpenForm}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
          >
            + Tambah Perkara Baru
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Nomor Perkara</th>
                <th className="px-3 py-2 font-semibold">Nama Pihak</th>
                <th className="px-3 py-2 font-semibold">Jenis Perkara</th>
                <th className="px-3 py-2 font-semibold">Saldo Perkara (Rp)</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCases.slice(0, 5).map(item => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-medium text-emerald-400">{item.nomorPerkara}</td>
                  <td className="px-3 py-2.5 text-slate-200 font-medium">{item.namaPihak}</td>
                  <td className="px-3 py-2.5 text-slate-300">{item.jenisPerkara}</td>
                  <td className="px-3 py-2.5 font-semibold">
                    <span className={item.saldoPerkara === 0 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {formatRupiah(item.saldoPerkara)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.status === 'Putus' || item.status === 'Selesai' 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                        : item.status === 'Diperiksa' 
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-blue-950 text-blue-400 border-blue-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => onSelectCase(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-medium transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
