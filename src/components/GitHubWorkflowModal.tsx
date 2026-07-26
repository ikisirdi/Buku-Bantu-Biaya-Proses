import React, { useState, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Github, X, Copy, Check, Download, Terminal, Play, Sparkles, ExternalLink, HardDrive } from 'lucide-react';

interface GitHubWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubWorkflowModal: React.FC<GitHubWorkflowModalProps> = ({ isOpen, onClose }) => {
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const workflowYaml = `# .github/workflows/deploy.yml
name: Deploy SI-PERKARA to GitHub Pages & Auto Sync

on:
  push:
    branches: [ "main", "master" ]
  schedule:
    # Otomatisasi sync data spreadsheet & deploy setiap jam
    - cron: '0 * * * *'
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm install || npm ci

      - name: Sync Real-time Spreadsheet Data
        run: |
          if [ -f scripts/fetch_data.js ]; then
            node scripts/fetch_data.js
          else
            echo "ℹ️ scripts/fetch_data.js belum ada, melewatinya..."
          fi
        env:
          GOOGLE_SHEET_CSV_URL: \${{ secrets.GOOGLE_SHEET_CSV_URL }}

      - name: Commit Updated Data JSON (If Changed)
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add public/ || true
          git diff --quiet && git diff --staged --quiet || (git commit -m "auto: Sync latest spreadsheet data" && git push) || echo "Nothing to push or no push permission"

      - name: Build Static App for GitHub Pages
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const fetchDataJs = `// scripts/fetch_data.js
// Script otomatisasi GitHub Actions untuk mengambil data spreadsheet terbaru
import fs from 'fs';
import path from 'path';

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL;

async function syncSpreadsheetData() {
  if (!GOOGLE_SHEET_CSV_URL) {
    console.log('ℹ️ Secrets GOOGLE_SHEET_CSV_URL tidak diatur. Menggunakan data JSON existing.');
    return;
  }

  try {
    console.log('🔄 Mengambil data spreadsheet terbaru dari Google Sheets...');
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) throw new Error(\`HTTP status \${response.status}\`);
    
    const csvText = await response.text();
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    // Simpan file CSV & JSON ringan di direktori public
    fs.writeFileSync(path.join(publicDir, 'data_perkara.csv'), csvText, 'utf-8');
    console.log('✅ Success: public/data_perkara.csv telah diperbarui.');
  } catch (err) {
    console.error('❌ Gagal sinkronisasi data:', err.message);
  }
}

syncSpreadsheetData();
`;

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(workflowYaml);
    setCopiedWorkflow(true);
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(fetchDataJs);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6 flex items-center justify-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
              
              {/* Header */}
              <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Github className="w-5 h-5 text-emerald-400" />
                  <DialogTitle as="h3" className="font-bold text-slate-100 text-base">
                    Otomatisasi GitHub Pages & GitHub Actions Workflow
                  </DialogTitle>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* STORAGE LOCATION EXPLANATION CARD */}
          <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <span>Dimana Data Tersimpan Saat Menggunakan GitHub Pages?</span>
            </div>
            <div className="space-y-2 text-amber-100/90 leading-relaxed text-xs">
              <p>
                <strong>GitHub Pages</strong> adalah hosting web statis. Aplikasi ini dirancang cerah, cepat, dan mandiri dengan 3 lapis penyimpanan aman:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>
                  <strong>Penyimpanan Otomatis Browser (localStorage)</strong>: Data yang Anda input via form langsung tersimpan otomatis di perangkat/laptop Anda.
                </li>
                <li>
                  <strong>Export / Import Backup JSON</strong>: Anda dapat mengunduh backup file <code className="bg-amber-900/60 text-amber-200 px-1 py-0.5 rounded font-mono">.json</code> kapan saja melalui menu <em>Sinkron Data</em> untuk dipindahkan ke komputer lain.
                </li>
                <li>
                  <strong>Sinkronisasi Google Sheets / GitHub Repository</strong>: Dengan memasang workflow GitHub Actions di bawah, data perkara akan disinkronkan otomatis dari Google Sheets atau disimpan dalam file <code className="bg-amber-900/60 text-amber-200 px-1 py-0.5 rounded font-mono">public/data_perkara.json</code> repository Anda.
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Host Web Statis & Auto-Deploy Workflow</span>
            </div>
            <p className="leading-relaxed">
              Aplikasi ini didesain ringan menggunakan JSON & Caching sehingga sangat ideal dijalankan pada <strong>GitHub Pages</strong>. Dengan bantuan <strong>GitHub Actions</strong>, data spreadsheet akan diperbarui secara otomatis secara berkala (cron schedule) tanpa server mahal.
            </p>
          </div>

          {/* STEP BY STEP GUIDE */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Panduan 3 Langkah Pemasangan di GitHub Repository:</span>
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              <li>
                Buat file <code className="text-emerald-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">.github/workflows/deploy.yml</code> di repository GitHub Anda dan salin kode YAML di bawah.
              </li>
              <li>
                Buat file <code className="text-blue-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">scripts/fetch_data.js</code> untuk mengotomatisasi pengambilan data spreadsheet secara berkala.
              </li>
              <li>
                Aktifkan <strong>GitHub Pages</strong> di menu <em>Repository Settings &gt; Pages &gt; Source: GitHub Actions</em>.
              </li>
            </ol>
          </div>

          {/* CODE BLOCK 1: DEPLOY.YML */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-xs">1. File: .github/workflows/deploy.yml</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyWorkflow}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded flex items-center space-x-1"
                >
                  {copiedWorkflow ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWorkflow ? 'Tersalin' : 'Salin YAML'}</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('deploy.yml', workflowYaml)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center space-x-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </button>
              </div>
            </div>
            <pre className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-snug">
              {workflowYaml}
            </pre>
          </div>

          {/* CODE BLOCK 2: FETCH_DATA.JS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white font-mono text-xs">2. File: scripts/fetch_data.js</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyScript}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded flex items-center space-x-1"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Tersalin' : 'Salin JS'}</span>
                </button>
                <button
                  onClick={() => handleDownloadFile('fetch_data.js', fetchDataJs)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center space-x-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </button>
              </div>
            </div>
            <pre className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 leading-snug">
              {fetchDataJs}
            </pre>
          </div>

          {/* TROUBLESHOOTING: EXIT CODE 1 */}
          <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
              <span className="text-lg">🚨</span>
              <span>Solusi Error "Process completed with exit code 1" di GitHub Actions:</span>
            </div>
            <div className="space-y-2 text-rose-100/90 leading-relaxed text-xs">
              <p className="font-semibold text-rose-200">
                Penyebab utama error exit code 1 pada deployment GitHub Pages beserta solusinya:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>
                  <strong>Izin Push / Read & Write Token Belum Diaktifkan</strong>:
                  <br />
                  <span className="text-slate-300">
                    Buka repo GitHub Anda &gt; <em>Settings</em> &gt; <em>Actions</em> &gt; <em>General</em> &gt; scroll ke bawah ke <strong>Workflow permissions</strong> &gt; Pilih <strong>Read and write permissions</strong> &gt; Klik <em>Save</em>.
                  </span>
                </li>
                <li>
                  <strong>Sumber GitHub Pages Belum Diubah ke GitHub Actions</strong>:
                  <br />
                  <span className="text-slate-300">
                    Buka <em>Settings</em> &gt; <em>Pages</em> &gt; Di bagian <strong>Build and deployment</strong>, ubah <em>Source</em> dari "Deploy from a branch" menjadi <strong>GitHub Actions</strong>.
                  </span>
                </li>
                <li>
                  <strong>File <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono">scripts/fetch_data.js</code> Belum Ada di Repository</strong>:
                  <br />
                  <span className="text-slate-300">
                    Pastikan Anda telah membuat folder <code className="font-mono">scripts/</code> dan file <code className="font-mono">fetch_data.js</code> lalu commit ke repository. Gunakan kode <code className="font-mono">deploy.yml</code> terbaru di atas yang secara otomatis mengabaikan jika file belum ada.
                  </span>
                </li>
                <li>
                  <strong>Gagal di Step <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono">npm ci</code></strong>:
                  <br />
                  <span className="text-slate-300">
                    Gunakan command <code className="font-mono">npm install || npm ci</code> pada YAML agar workflow tidak berhenti jika <code className="font-mono">package-lock.json</code> tidak cocok dengan versi Node.
                  </span>
                </li>
              </ol>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
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
