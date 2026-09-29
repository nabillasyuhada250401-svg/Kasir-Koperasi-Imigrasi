import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, Product, StoreSettings, Transaction } from '../../types';
import { formatRupiah } from '../../utils/storage';
import {
  DollarSign,
  Plus,
  Search,
  ShoppingCart,
  Zap,
  TrendingDown,
  TrendingUp,
  Trash2,
  Calendar,
  Building2,
  Banknote,
  FileText,
  X,
  Check,
  Package,
  Layers,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

interface ExpenseViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense, restockData?: { productId: string; qty: number }) => void;
  onDeleteExpense: (id: string) => void;
  products: Product[];
  settings: StoreSettings;
  transactions: Transaction[];
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  products,
  settings,
  transactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('belanja_stok');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formMethod, setFormMethod] = useState<'kas_tunai' | 'transfer_bank'>('kas_tunai');
  const [formProof, setFormProof] = useState('');
  const [formRecordedBy, setFormRecordedBy] = useState(settings.cashierName || 'Nadia nabila');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Optional direct restock linking
  const [isLinkRestock, setIsLinkRestock] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [restockQty, setRestockQty] = useState<number>(10);

  // Category labels map
  const categoryLabels: Record<ExpenseCategory, { label: string; color: string; icon: any }> = {
    belanja_stok: { label: 'Belanja Stok Barang', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ShoppingCart },
    operasional: { label: 'Operasional Toko', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Zap },
    konsumsi_rapat: { label: 'Konsumsi & Rapat', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Layers },
    gaji_honor: { label: 'Honor / Gaji', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: DollarSign },
    transport: { label: 'Transport / Ongkir', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: ArrowUpRight },
    lain_lain: { label: 'Lain-lain', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: FileText },
  };

  // KPIs
  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalStockPurchases = useMemo(() => {
    return expenses
      .filter((e) => e.category === 'belanja_stok')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalOperational = useMemo(() => {
    return expenses
      .filter((e) => e.category !== 'belanja_stok')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Cashflow: Total Income from Sales vs Expenses
  const totalSalesRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (t.paidAmount ?? (t.paymentStatus === 'belum_bayar' ? 0 : t.total)), 0);
  }, [transactions]);

  const netCashflow = totalSalesRevenue - totalExpense;

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.receiptProof && e.receiptProof.toLowerCase().includes(searchTerm.toLowerCase())) ||
        e.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const handleOpenModal = () => {
    setFormCategory('belanja_stok');
    setFormDescription('');
    setFormAmount('');
    setFormMethod('kas_tunai');
    setFormProof('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsLinkRestock(false);
    if (products.length > 0) setSelectedProductId(products[0].id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(formAmount.replace(/[^0-9]/g, ''), 10) || 0;
    if (amountNum <= 0 || !formDescription.trim()) return;

    const now = new Date();
    const dateFormatted = formDate.replace(/-/g, '');
    const expNumber = `EXP-${dateFormatted}-${Math.floor(100 + Math.random() * 900)}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseNumber: expNumber,
      date: new Date(formDate + 'T12:00:00').toISOString(),
      category: formCategory,
      categoryLabel: categoryLabels[formCategory].label,
      description: formDescription.trim(),
      amount: amountNum,
      paymentMethod: formMethod,
      recordedBy: formRecordedBy.trim() || 'Pengurus Koperasi',
      receiptProof: formProof.trim() || undefined,
      productId: isLinkRestock ? selectedProductId : undefined,
      restockQty: isLinkRestock ? restockQty : undefined,
    };

    onAddExpense(
      newExpense,
      isLinkRestock && selectedProductId && restockQty > 0
        ? { productId: selectedProductId, qty: restockQty }
        : undefined
    );

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Pengeluaran & Belanja Koperasi</h2>
              <span className="bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                {expenses.length} Transaksi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Catat belanja stok kulakan, operasional toko, dan arus kas keluar Koperasi Sabang Prima Meujaya
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-gradient-to-br from-rose-50/50 to-white">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-1">
            <span>Total Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {formatRupiah(totalExpense)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {expenses.length} pengeluaran tercatat
          </span>
        </div>

        {/* Belanja Stok Barang */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-1">
            <span>Belanja Stok Barang (Kulakan)</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono">
            {formatRupiah(totalStockPurchases)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Pengadaan barang dagangan
          </span>
        </div>

        {/* Biaya Operasional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold mb-1">
            <span>Biaya Operasional & Lainnya</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatRupiah(totalOperational)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Listrik, plastik, kertas thermal, dll
          </span>
        </div>

        {/* Arus Kas Bersih (Cashflow) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold mb-1">
            <span>Arus Kas Bersih (Net Cashflow)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatRupiah(netCashflow)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Pemasukan ({formatRupiah(totalSalesRevenue)}) - Belanja
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari keterangan, nomor pengeluaran, nota supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Semua
          </button>
          {Object.entries(categoryLabels).map(([catKey, val]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === catKey
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Pengeluaran</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan & Nota</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Dicatat Oleh</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.map((exp) => {
                const catMeta = categoryLabels[exp.category] || categoryLabels.lain_lain;
                const Icon = catMeta.icon;
                const formattedDate = new Date(exp.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catMeta.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{catMeta.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-semibold">{exp.description}</div>
                      {exp.receiptProof && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Bukti/Nota: {exp.receiptProof}
                        </div>
                      )}
                      {exp.restockQty && exp.restockQty > 0 && (
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <Package className="w-3 h-3" />
                          <span>+ Restock {exp.restockQty} unit ke inventaris</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-700 text-xs">
                        {exp.paymentMethod === 'kas_tunai' ? (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kas Tunai</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Transfer Bank</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {exp.recordedBy}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-black text-rose-600 text-sm">
                        -{formatRupiah(exp.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan pengeluaran "${exp.description}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {expenses.length === 0 ? (
                      <div className="space-y-3">
                        <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Belum ada pengeluaran dicatat</p>
                          <p className="text-xs text-slate-400 mt-0.5">Catat belanja stok kulakan atau operasional listrik/ATK toko.</p>
                        </div>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Catat Pengeluaran Pertama</span>
                        </button>
                      </div>
                    ) : (
                      <span>Belum ada data pengeluaran yang sesuai filter atau pencarian.</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Pengeluaran Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-base">Catat Pengeluaran / Belanja Koperasi</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-rose-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Pengeluaran *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryLabels).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormCategory(key as ExpenseCategory)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        formCategory === key
                          ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <val.icon className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="text-xs">{val.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Rincian Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Contoh: Kulakan Beras Pandan Wangi & Minyak Goreng dari Grosir Sabang"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Pengeluaran (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="850000"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sumber Dana / Metode Bayar
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  >
                    <option value="kas_tunai">Kas Tunai Toko</option>
                    <option value="transfer_bank">Transfer Rekening Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Nota / Bukti Toko Luar (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formProof}
                    onChange={(e) => setFormProof(e.target.value)}
                    placeholder="Contoh: NOTA-GS-8821"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dicatat Oleh
                </label>
                <input
                  type="text"
                  value={formRecordedBy}
                  onChange={(e) => setFormRecordedBy(e.target.value)}
                  placeholder="Nadia nabila / Pengurus Koperasi"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                />
              </div>

              {/* Special Optional: Auto Restock Item if Belanja Stok */}
              {formCategory === 'belanja_stok' && products.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900 text-xs">
                    <input
                      type="checkbox"
                      checked={isLinkRestock}
                      onChange={(e) => setIsLinkRestock(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Otomatis tambah stok ke salah satu barang inventaris</span>
                  </label>

                  {isLinkRestock && (
                    <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Pilih Produk:
                        </label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Sisa: {p.stock} {p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Jumlah Tambahan Stok (Unit):
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={restockQty}
                          onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengeluaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
