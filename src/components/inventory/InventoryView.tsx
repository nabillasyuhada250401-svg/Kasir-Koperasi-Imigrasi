import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/storage';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onUpdateProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // New product form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: 'Sembako',
    price: 10000,
    costPrice: 8000,
    stock: 20,
    unit: 'pcs',
    imageEmoji: '📦',
  });

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['Semua', ...list];
  }, [products]);

  // Inventory stats
  const totalStockUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock, 0);
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.price, 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= 5);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'Semua' || p.category === categoryFilter;
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'low'
          ? p.stock > 0 && p.stock <= 5
          : p.stock <= 0;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      category: 'Sembako',
      price: 15000,
      costPrice: 12000,
      stock: 20,
      unit: 'pcs',
      imageEmoji: '📦',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;

    if (editingProduct) {
      // Update existing
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? ({ ...p, ...formData } as Product)
          : p
      );
      onUpdateProducts(updated);
      setEditingProduct(null);
    } else {
      // Create new
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name!,
        sku: formData.sku!,
        category: formData.category || 'Lainnya',
        price: Number(formData.price) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stock: Number(formData.stock) || 0,
        unit: formData.unit || 'pcs',
        imageEmoji: formData.imageEmoji || '📦',
      };
      onUpdateProducts([...products, newProd]);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Hapus produk "${name}" dari inventaris?`)) {
      onUpdateProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleConfirmRestock = () => {
    if (!restockProduct || restockQty <= 0) return;
    const updated = products.map((p) =>
      p.id === restockProduct.id
        ? { ...p, stock: p.stock + restockQty }
        : p
    );
    onUpdateProducts(updated);
    setRestockProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Manajemen Stok & Inventaris Barang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stok barang otomatis terpotong saat kasir mencetak struk transaksi penjualan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Barang Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Total Produk</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{products.length} SKU</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{totalStockUnits} total unit fisik</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Estimasi Nilai Stok</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(totalInventoryValue)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Berdasarkan harga jual</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'low'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Stok Menipis (≤5)</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{lowStockProducts.length} Produk</div>
          <span className="text-[11px] text-amber-600/80 mt-1 block">Perlu restock segera</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'out'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-500/20'
              : 'bg-white border-slate-200/80 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-1">
            <X className="w-4 h-4" />
            <span>Stok Habis (0)</span>
          </div>
          <div className="text-2xl font-black text-red-700">{outOfStockProducts.length} Produk</div>
          <span className="text-[11px] text-red-600/80 mt-1 block">Tidak dapat dijual di POS</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari barang berdasarkan nama atau kode SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Semua ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('low')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'low' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Menipis ({lowStockProducts.length})
            </button>
            <button
              onClick={() => setStatusFilter('out')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'out' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Habis ({outOfStockProducts.length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Modal</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-center">Sisa Stok Real-time</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= 5;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl" role="img" aria-label={p.name}>
                          {p.imageEmoji || '📦'}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</div>
                          <span className="text-[11px] text-slate-400 font-mono">{p.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 font-medium">{p.category}</span>
                    </td>

                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatRupiah(p.costPrice || 0)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatRupiah(p.price)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`font-black text-sm ${
                            isOut
                              ? 'text-red-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                        <span className="text-slate-400 text-[11px]">{p.unit}</span>
                        {isLow && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Menipis
                          </span>
                        )}
                        {isOut && (
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                            Habis
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setRestockProduct(p);
                            setRestockQty(10);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                          title="Restock Cepat"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Restock</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setFormData(p);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {products.length === 0 ? (
                      <div className="space-y-3">
                        <Package className="w-10 h-10 text-slate-300 mx-auto" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Belum ada barang di inventaris</p>
                          <p className="text-xs text-slate-400 mt-0.5">Mulai dengan menambahkan produk dagangan koperasi Anda.</p>
                        </div>
                        <button
                          onClick={handleOpenAdd}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Barang Pertama</span>
                        </button>
                      </div>
                    ) : (
                      <span>Tidak ada barang yang sesuai dengan filter atau pencarian.</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Restock Barang Masuk</h3>
            <p className="text-xs text-slate-500 mb-4">
              Tambah stok untuk <strong className="text-slate-800">{restockProduct.name}</strong> (Stok saat ini: {restockProduct.stock} {restockProduct.unit})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Tambahan Unit</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex gap-2">
                {[5, 10, 20, 50].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setRestockQty(q)}
                    className="flex-1 py-1 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    +{q}
                  </button>
                ))}
              </div>

              <div className="pt-2 text-xs text-slate-500">
                Stok setelah restock: <span className="font-bold text-emerald-700">{restockProduct.stock + restockQty} {restockProduct.unit}</span>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestock}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Stok</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Ramos 5kg"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU / Barcode</label>
                  <input
                    type="text"
                    required
                    placeholder="BRS-001"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category || 'Sembako'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Sembako">Sembako</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Camilan">Camilan</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice || 0}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock || 0}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    placeholder="pcs / kg / botol"
                    value={formData.unit || 'pcs'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ikon / Emoji</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.imageEmoji || '📦'}
                    onChange={(e) => setFormData({ ...formData, imageEmoji: e.target.value })}
                    className="w-full px-3 py-2 text-center text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Perbarui Produk' : 'Simpan Produk Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
