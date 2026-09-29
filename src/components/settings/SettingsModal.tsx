import React, { useState } from 'react';
import { StoreSettings, Product, Customer, Transaction } from '../../types';
import {
  saveSettings,
  saveProducts,
  saveCustomers,
  saveTransactions,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  generateSeedTransactions,
  DEFAULT_SETTINGS,
} from '../../utils/storage';
import { Settings, Save, RotateCcw, X, Store, Download, Upload, Check, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onResetData: (products: Product[], customers: Customer[], transactions: Transaction[]) => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetData,
  onClearAll,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearAllData = () => {
    if (confirm('PERINGATAN: Kosongkan semua data transaksi, produk/stok, pelanggan, dan pengeluaran agar aplikasi bersih 100% siap dipakai dari awal?')) {
      onClearAll();
      alert('Semua data berhasil dikosongkan! Aplikasi kini bersih dan siap dipakai.');
      onClose();
    }
  };

  const handleResetToDemo = () => {
    if (confirm('Kembalikan semua data ke data demo awal? Semua produk, transaksi, dan poin akan di-reset.')) {
      const initialProducts = INITIAL_PRODUCTS;
      const initialCustomers = INITIAL_CUSTOMERS;
      const initialTransactions = generateSeedTransactions();
      
      saveProducts(initialProducts);
      saveCustomers(initialCustomers);
      saveTransactions(initialTransactions);
      saveSettings(DEFAULT_SETTINGS);

      onUpdateSettings(DEFAULT_SETTINGS);
      onResetData(initialProducts, initialCustomers, initialTransactions);
      alert('Data berhasil di-reset ke data demo!');
      onClose();
    }
  };

  const handleExportData = () => {
    const backup = {
      settings: formData,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup-kasirku-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Pengaturan Toko & Struk</h3>
              <p className="text-xs text-slate-500">Konfigurasi header struk thermal JPG & aturan kasir</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko / Unit POS *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Resmi Koperasi (Kop) *</label>
              <input
                type="text"
                required
                value={formData.koperasiName || ''}
                onChange={(e) => setFormData({ ...formData, koperasiName: e.target.value })}
                placeholder="KOPERASI KARYAWAN..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. Badan Hukum Koperasi</label>
              <input
                type="text"
                value={formData.badanHukumNo || ''}
                onChange={(e) => setFormData({ ...formData, badanHukumNo: e.target.value })}
                placeholder="AHU-0004521.AH.01.26"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bendahara / Penandatangan</label>
              <input
                type="text"
                value={formData.bendaharaName || ''}
                onChange={(e) => setFormData({ ...formData, bendaharaName: e.target.value })}
                placeholder="Nama Bendahara Koperasi"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Kantor / Koperasi</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. Telp / WhatsApp Koperasi</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kasir Bertugas</label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => setFormData({ ...formData, cashierName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Margin & Points rules */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Margin Untung Pesanan Kantor
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.defaultMarkupPercent || 25}
                  onChange={(e) => setFormData({ ...formData, defaultMarkupPercent: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-1.5 text-xs font-bold border border-emerald-300 rounded-lg bg-white"
                />
                <span className="absolute right-3 top-1.5 text-xs font-bold text-emerald-700">%</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">Standar: 20-30% keuntungan</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                Aturan Poin Pelanggan
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.pointsRuleRate}
                  onChange={(e) => setFormData({ ...formData, pointsRuleRate: Math.max(1000, parseInt(e.target.value) || 10000) })}
                  className="w-full px-3 py-1.5 text-xs font-bold border border-emerald-300 rounded-lg bg-white"
                />
                <span className="absolute right-3 top-1.5 text-xs text-slate-400">/ 1 Poin</span>
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">Min. Rp 10.000 = 1 Poin</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Footer / Catatan Kaki Dokumen</label>
            <textarea
              rows={2}
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>

        {/* Danger zone / Data Management */}
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
            <div>
              <span className="text-xs font-bold text-red-900 block">Kosongkan Semua Data (Mulai Baru)</span>
              <span className="text-[11px] text-red-700">Hapus semua transaksi, stok barang, pelanggan & pengeluaran agar bersih siap dipakai</span>
            </div>

            <button
              type="button"
              onClick={handleClearAllData}
              className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Semua</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Reset ke Data Sampel Demo</span>
              <span className="text-[11px] text-slate-400">Isi ulang contoh katalog barang & contoh transaksi</span>
            </div>

            <button
              type="button"
              onClick={handleResetToDemo}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
