import React, { useState, useEffect } from 'react';
import { CaseRecord, JenisPerkara, KategoriPerkara, StatusPerkara } from '../types';
import { X, Save, Scale, AlertTriangle, Calculator } from 'lucide-react';

interface CaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Partial<CaseRecord>) => void;
  recordToEdit?: CaseRecord;
  totalCasesCount: number;
}

export const CaseFormModal: React.FC<CaseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recordToEdit,
  totalCasesCount
}) => {
  const [nomorPerkara, setNomorPerkara] = useState<string>('');
  const [namaPihak, setNamaPihak] = useState<string>('');
  const [jenisPerkara, setJenisPerkara] = useState<JenisPerkara>('Cerai Gugat');
  const [kategoriPerkara, setKategoriPerkara] = useState<KategoriPerkara>('Gugatan');
  const [panjarAwal, setPanjarAwal] = useState<number>(1000000);
  const [pengeluaran, setPengeluaran] = useState<number>(1000000);
  const [saldoPerkara, setSaldoPerkara] = useState<number>(0);
  const [tanggalRegister, setTanggalRegister] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tanggalPutus, setTanggalPutus] = useState<string>('');
  const [status, setStatus] = useState<StatusPerkara>('Diperiksa');
  const [hakimKetua, setHakimKetua] = useState<string>('Drs. H. Ahmad Fauzi, M.H.');
  const [panitera, setPanitera] = useState<string>('Siti Rahmah, S.H.');
  const [ruangSidang, setRuangSidang] = useState<string>('Ruang Utama Cakra');
  const [catatan, setCatatan] = useState<string>('');

  useEffect(() => {
    if (recordToEdit) {
      setNomorPerkara(recordToEdit.nomorPerkara);
      setNamaPihak(recordToEdit.namaPihak);
      setJenisPerkara(recordToEdit.jenisPerkara);
      setKategoriPerkara(recordToEdit.kategoriPerkara);
      setPanjarAwal(recordToEdit.panjarAwal || 0);
      setPengeluaran(recordToEdit.pengeluaran || 0);
      setSaldoPerkara(recordToEdit.saldoPerkara || 0);
      setTanggalRegister(recordToEdit.tanggalRegister || new Date().toISOString().split('T')[0]);
      setTanggalPutus(recordToEdit.tanggalPutus || '');
      setStatus(recordToEdit.status);
      setHakimKetua(recordToEdit.hakimKetua || 'Drs. H. Ahmad Fauzi, M.H.');
      setPanitera(recordToEdit.panitera || 'Siti Rahmah, S.H.');
      setRuangSidang(recordToEdit.ruangSidang || 'Ruang Utama Cakra');
      setCatatan(recordToEdit.catatan || '');
    } else {
      // Auto-generate new case number
      const nextNum = totalCasesCount + 1;
      const code = jenisPerkara.toLowerCase().includes('penetapan') || jenisPerkara.toLowerCase().includes('permohonan') ? 'Pdt.P' : 'Pdt.G';
      setNomorPerkara(`${nextNum}/${code}/2026/PA.Pan`);
      setNamaPihak('');
      setJenisPerkara('Cerai Gugat');
      setKategoriPerkara('Gugatan');
      setPanjarAwal(1000000);
      setPengeluaran(1000000);
      setSaldoPerkara(0);
      setTanggalRegister(new Date().toISOString().split('T')[0]);
      setTanggalPutus('');
      setStatus('Diperiksa');
      setCatatan('');
    }
  }, [recordToEdit, isOpen, totalCasesCount]);

  // Recalculate Saldo automatically whenever Panjar or Pengeluaran changes
  const handlePanjarChange = (val: number) => {
    setPanjarAwal(val);
    setSaldoPerkara(Math.max(0, val - pengeluaran));
  };

  const handlePengeluaranChange = (val: number) => {
    setPengeluaran(val);
    setSaldoPerkara(Math.max(0, panjarAwal - val));
  };

  // Adjust Kategori automatically based on Jenis Perkara
  const handleJenisChange = (newJenis: JenisPerkara) => {
    setJenisPerkara(newJenis);
    if (newJenis === 'Penetapan Ahli Waris' || newJenis === 'Dispensasi Nikah' || newJenis === 'Wali Adhal' || newJenis === 'Hibah' || newJenis === 'Wasiat') {
      setKategoriPerkara('Permohonan');
      if (!recordToEdit) {
        const nextNum = totalCasesCount + 1;
        setNomorPerkara(`${nextNum}/Pdt.P/2026/PA.Pan`);
      }
    } else {
      setKategoriPerkara('Gugatan');
      if (!recordToEdit) {
        const nextNum = totalCasesCount + 1;
        setNomorPerkara(`${nextNum}/Pdt.G/2026/PA.Pan`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorPerkara || !namaPihak) return;

    onSave({
      id: recordToEdit?.id,
      nomorPerkara,
      namaPihak,
      jenisPerkara,
      kategoriPerkara,
      panjarAwal,
      pengeluaran,
      saldoPerkara,
      tanggalRegister,
      tanggalPutus: tanggalPutus || undefined,
      status,
      hakimKetua,
      panitera,
      ruangSidang,
      catatan
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">
              {recordToEdit ? 'Edit Data Perkara' : 'Input Data Perkara Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nomor Perkara */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Perkara <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-nomor-perkara"
                type="text"
                required
                value={nomorPerkara}
                onChange={(e) => setNomorPerkara(e.target.value)}
                placeholder="Contoh: 1/Pdt.G/2026/PA.Pan"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Nama Pihak */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Pihak <span className="text-emerald-400">*</span>
              </label>
              <input
                id="input-nama-pihak"
                type="text"
                required
                value={namaPihak}
                onChange={(e) => setNamaPihak(e.target.value)}
                placeholder="Nama Penggugat/Pemohon/Para Pihak"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Jenis Perkara */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Perkara</label>
              <select
                id="select-jenis-perkara"
                value={jenisPerkara}
                onChange={(e) => handleJenisChange(e.target.value as JenisPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
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

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Perkara</label>
              <select
                id="select-kategori-perkara"
                value={kategoriPerkara}
                onChange={(e) => setKategoriPerkara(e.target.value as KategoriPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Gugatan">Gugatan (Pdt.G)</option>
                <option value="Permohonan">Permohonan (Pdt.P)</option>
              </select>
            </div>

          </div>

          {/* FINANCIAL SECTION (SALDO PANJAR PERKARA AUTOMATION) */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Calculator className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Perhitungan Biaya & Saldo Panjar</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Panjar Awal (Rp)</label>
                <input
                  id="input-panjar-awal"
                  type="number"
                  min="0"
                  step="50000"
                  value={panjarAwal}
                  onChange={(e) => handlePanjarChange(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pengeluaran Biaya (Rp)</label>
                <input
                  id="input-pengeluaran"
                  type="number"
                  min="0"
                  step="50000"
                  value={pengeluaran}
                  onChange={(e) => handlePengeluaranChange(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Saldo Perkara (Otomatis)</label>
                <div className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-xs font-bold ${
                  saldoPerkara === 0 ? 'border-rose-700 text-rose-400' : 'border-slate-700 text-emerald-400'
                }`}>
                  Rp {saldoPerkara.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {saldoPerkara === 0 && (
              <div className="flex items-center space-x-2 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Peringatan: Saldo Rp0 akan memicu notifikasi otomatis penambahan panjar perkara.</span>
              </div>
            )}
          </div>

          {/* DATES & STATUS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Register</label>
              <input
                id="input-tanggal-register"
                type="date"
                required
                value={tanggalRegister}
                onChange={(e) => setTanggalRegister(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Putus (Opsional)</label>
              <input
                id="input-tanggal-putus"
                type="date"
                value={tanggalPutus}
                onChange={(e) => setTanggalPutus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Perkara</label>
              <select
                id="select-status-perkara"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPerkara)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Pendaftaran">Pendaftaran</option>
                <option value="Diperiksa">Diperiksa (Sidang)</option>
                <option value="Putus">Putus</option>
                <option value="Minutasi">Minutasi</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* JUDICIAL DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Hakim Ketua</label>
              <input
                type="text"
                value={hakimKetua}
                onChange={(e) => setHakimKetua(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Panitera Pengganti</label>
              <input
                type="text"
                value={panitera}
                onChange={(e) => setPanitera(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ruang Sidang</label>
              <input
                type="text"
                value={ruangSidang}
                onChange={(e) => setRuangSidang(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan / Keterangan Perkara</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan pendaftaran, tahapan sidang, atau sisa panjar..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-900/40"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data Perkara</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
