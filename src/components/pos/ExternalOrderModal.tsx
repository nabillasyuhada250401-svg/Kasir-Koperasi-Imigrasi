import React, { useState } from 'react';
import { CartItem, Product, StoreSettings } from '../../types';
import { formatRupiah } from '../../utils/storage';
import {
  FileText,
  Plus,
  X,
  TrendingUp,
  Banknote,
  Receipt,
  Building,
} from 'lucide-react';

interface ExternalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onAddToCart: (item: CartItem, orderMetadata: { department: string; picName: string; purpose: string }) => void;
}

export const ExternalOrderModal: React.FC<ExternalOrderModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
}) => {
  // Detail pesanan
  const [orderName, setOrderName] = useState('Kue & Snack Rapat Kantor');
  const [department, setDepartment] = useState('Bagian Umum');
  const [picName, setPicName] = useState('');
  const [purpose, setPurpose] = useState('Konsumsi Rapat Koordinasi Kantor');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('paket');
  
  // Total modal beli dari luar (Gausa hitung per unit, hitung total)
  const [totalCost, setTotalCost] = useState<number>(200000);

  // Custom keuntungan koperasi (nominal Rp langsung, tanpa persen-persen)
  const [customProfit, setCustomProfit] = useState<number>(30000);

  // Total harga kuitansi kantor
  const [totalKuitansi, setTotalKuitansi] = useState<number>(230000);

  if (!isOpen) return null;

  // Handlers sinkronisasi langsung & simpel
  const handleCostChange = (val: number) => {
    const cost = Math.max(0, val);
    setTotalCost(cost);
    setTotalKuitansi(cost + customProfit);
  };

  const handleProfitChange = (val: number) => {
    const profit = Math.max(0, val);
    setCustomProfit(profit);
    setTotalKuitansi(totalCost + profit);
  };

  const handleKuitansiChange = (val: number) => {
    const kuitansi = Math.max(totalCost, val);
    setTotalKuitansi(kuitansi);
    setCustomProfit(Math.max(0, kuitansi - totalCost));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderName.trim() || totalKuitansi <= 0) return;

    const validQty = Math.max(1, quantity);
    const unitPrice = Math.round(totalKuitansi / validQty);
    const unitCost = Math.round(totalCost / validQty);

    // Create a virtual non-inventory product
    const virtualProduct: Product = {
      id: `ext-order-${Date.now()}`,
      name: orderName.trim(),
      sku: `KOP-EXT-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Pesanan Luar / Rapat',
      price: unitPrice,
      costPrice: unitCost,
      stock: 99999, // Virtual stock (external purchase, does not deduct physical inventory)
      unit: unit.trim() || 'paket',
      imageEmoji: '🍱',
      isExternalOrder: true,
    };

    const cartItem: CartItem = {
      product: virtualProduct,
      quantity: validQty,
      subtotal: totalKuitansi,
      isExternalOrder: true,
      costPrice: unitCost,
      koperasiProfit: customProfit,
      notes: purpose.trim(),
    };

    onAddToCart(cartItem, {
      department: department.trim(),
      picName: picName.trim(),
      purpose: purpose.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Input Pesanan Luar & Kuitansi Kantor
              </h3>
              <p className="text-xs text-emerald-200">
                Pengadaan kue/konsumsi dari luar dengan kuitansi resmi koperasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Detail Pesanan */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
              1. Detail Pesanan / Konsumsi Rapat
            </span>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Barang / Kue / Konsumsi *
              </label>
              <input
                type="text"
                required
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="Contoh: Kue & Snack Rapat Kantor / Nasi Kotak"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah (Qty)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="paket / box / porsi"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Divisi / Bagian Pemesan di Kantor *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Contoh: Bagian Umum / Dept. Keuangan"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pemesan / PIC (Opsional)
                </label>
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Pak Budi / Bu Rahma"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Keterangan / Keperluan Rapat (Tercetak di Kuitansi)
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Contoh: Konsumsi Rapat Koordinasi Kantor"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Atur Modal & Keuntungan Koperasi (Custom) - Simpel & Mudah */}
          <div className="space-y-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>2. Atur Modal & Keuntungan Koperasi (Custom)</span>
            </span>

            {/* Input 1: Harga Beli dari Luar (Total) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Harga Beli dari Luar (Total Belanja) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={totalCost || ''}
                  onChange={(e) => handleCostChange(parseInt(e.target.value) || 0)}
                  placeholder="200000"
                  className="w-full pl-10 pr-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total uang yang dibayarkan ke penjual kue/pasar luar (tanpa kuitansi resmi).
              </p>
            </div>

            {/* Input 2: Custom Keuntungan Koperasi */}
            <div>
              <label className="block font-bold text-emerald-900 mb-1">
                Custom Keuntungan Koperasi (Laba Bersih Koperasi) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-emerald-600 text-sm">Rp</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={customProfit || ''}
                  onChange={(e) => handleProfitChange(parseInt(e.target.value) || 0)}
                  placeholder="30000"
                  className="w-full pl-10 pr-3 py-2 text-base font-black bg-white border border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-emerald-700"
                />
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                Ketik langsung nominal keuntungan yang ingin diambil koperasi.
              </p>
            </div>

            {/* Input 3: Harga Kuitansi Kantor (Rp) */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Harga Kuitansi Kantor (Total Tagihan ke Kantor) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                <input
                  type="number"
                  min={totalCost}
                  required
                  value={totalKuitansi || ''}
                  onChange={(e) => handleKuitansiChange(parseInt(e.target.value) || 0)}
                  placeholder="230000"
                  className="w-full pl-10 pr-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Nilai resmi yang tercetak di Kuitansi Koperasi untuk reimbursement / SPJ kantor.
              </p>
            </div>

            {/* Visual Display Cards Sesuai Permintaan (Tanpa Persen2) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl">
                <div className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="text-sm">🔵</span>
                  <span>Modal Beli:</span>
                </div>
                <div className="text-sm font-extrabold text-blue-950 mt-0.5">
                  {formatRupiah(totalCost)}
                </div>
              </div>

              <div className="bg-emerald-100/70 border border-emerald-300 p-2.5 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="text-sm">🟢</span>
                  <span>Laba Koperasi:</span>
                </div>
                <div className="text-sm font-black text-emerald-900 mt-0.5">
                  +{formatRupiah(customProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* Kotak Ringkasan Finansial Real-time */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400">Total Modal Dibayar ke Luar :</span>
              <span className="font-mono text-slate-200 font-semibold">{formatRupiah(totalCost)}</span>
            </div>

            <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-800">
              <span className="text-emerald-400 font-semibold">Laba Bersih Koperasi :</span>
              <span className="font-mono font-bold text-emerald-400">+{formatRupiah(customProfit)}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                  Total Nilai Kuitansi Kantor
                </span>
                <span className="text-[10px] text-slate-400">
                  Untuk bukti SPJ / reimbursement divisi {department}
                </span>
              </div>
              <span className="text-xl font-black text-white">{formatRupiah(totalKuitansi)}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Masukkan ke Keranjang & Buat Kuitansi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
