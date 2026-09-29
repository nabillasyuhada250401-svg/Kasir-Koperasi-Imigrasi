import React, { useState, useMemo } from 'react';
import { Customer } from '../../types';
import { formatRupiah } from '../../utils/storage';
import {
  Users,
  Search,
  Plus,
  Sparkles,
  Gift,
  Phone,
  Calendar,
  X,
  Check,
  Award,
} from 'lucide-react';

interface CustomerViewProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  customers,
  onUpdateCustomers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [redeemCustomer, setRedeemCustomer] = useState<Customer | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(10);
  const [redeemNote, setRedeemNote] = useState<string>('Potongan Belanja Rp 5.000');

  // New Customer Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [initialPoints, setInitialPoints] = useState<number>(0);

  // Metrics
  const totalPointsCirculating = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.points, 0);
  }, [customers]);

  const totalSpentByCustomers = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalSpent, 0);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      points: Number(initialPoints) || 0,
      totalSpent: 0,
      transactionCount: 0,
      createdAt: new Date().toISOString(),
    };

    onUpdateCustomers([newCust, ...customers]);
    setNewName('');
    setNewPhone('');
    setInitialPoints(0);
    setIsAddModalOpen(false);
  };

  const handleConfirmRedeem = () => {
    if (!redeemCustomer || redeemPoints <= 0 || redeemPoints > redeemCustomer.points) return;

    const updated = customers.map((c) =>
      c.id === redeemCustomer.id
        ? { ...c, points: c.points - redeemPoints }
        : c
    );

    onUpdateCustomers(updated);
    alert(`Berhasil menukarkan ${redeemPoints} poin milik ${redeemCustomer.name}! Sisa poin: ${redeemCustomer.points - redeemPoints}`);
    setRedeemCustomer(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pelanggan & Poin Loyalitas</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Min. Rp 10.000 = 1 Poin
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap pelanggan yang bertransaksi otomatis mendapatkan 1 poin per kelipatan Rp 10.000.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Total Pelanggan Terdaftar</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{customers.length} Member</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Otomatis terdaftar saat input di POS</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Total Saldo Poin Beredar</span>
          </div>
          <div className="text-2xl font-black text-amber-600">{totalPointsCirculating} Poin</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Dapat ditukarkan dengan hadiah/diskon</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Total Belanja Member</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(totalSpentByCustomers)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Akumulasi transaksi member</span>
        </div>
      </div>

      {/* Search & Loyalty Rule Explanation Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari pelanggan berdasarkan nama atau no WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Rule note */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-3 text-xs text-emerald-900">
          <div className="p-1 rounded bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold block">Cara Kerja Poin Loyalitas KasirKu:</span>
            <span className="text-emerald-800 text-[11px]">
              Setiap kali kasir memasukkan nama pelanggan pada transaksi minimal Rp 10.000, sistem otomatis menghitung 
              <strong> 1 poin setiap kelipatan Rp 10.000</strong> (contoh: Belanja Rp 45.000 = dapat 4 Poin). 
              Poin ini tercetak di struk JPG dan dapat ditukarkan kapan saja oleh pelanggan.
            </span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Nama Pelanggan</th>
                <th className="px-4 py-3">No. WhatsApp</th>
                <th className="px-4 py-3 text-center">Saldo Poin</th>
                <th className="px-4 py-3 text-right">Total Belanja</th>
                <th className="px-4 py-3 text-center">Transaksi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{cust.name}</div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Sejak {new Date(cust.createdAt).toLocaleDateString('id-ID')}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {cust.phone ? (
                      <span className="text-xs text-slate-700 font-mono flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{cust.phone}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada No. WA</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs bg-amber-50 text-amber-800 border border-amber-200">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{cust.points} Poin</span>
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatRupiah(cust.totalSpent)}
                  </td>

                  <td className="px-4 py-3 text-center text-slate-600 font-medium">
                    {cust.transactionCount}x
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setRedeemCustomer(cust);
                        setRedeemPoints(Math.min(10, cust.points || 1));
                      }}
                      disabled={cust.points <= 0}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                        cust.points > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Tukar Poin</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {customers.length === 0 ? (
                      <div className="space-y-3">
                        <Users className="w-10 h-10 text-slate-300 mx-auto" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">Belum ada data pelanggan / anggota</p>
                          <p className="text-xs text-slate-400 mt-0.5">Daftarkan anggota koperasi untuk pengumpulan poin loyalitas.</p>
                        </div>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Anggota Pertama</span>
                        </button>
                      </div>
                    ) : (
                      <span>Tidak ada pelanggan yang ditemukan sesuai pencarian.</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redeem Points Modal */}
      {redeemCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Penukaran Poin Loyalitas</span>
              </h3>
              <button onClick={() => setRedeemCustomer(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <strong className="text-slate-900">{redeemCustomer.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Saldo Poin Sekarang:</span>
                <strong className="text-amber-600 font-bold">{redeemCustomer.points} Poin</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Poin yang Ditukarkan
                </label>
                <input
                  type="number"
                  min="1"
                  max={redeemCustomer.points}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Math.min(redeemCustomer.points, Math.max(1, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 text-base font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Hadiah / Voucher
                </label>
                <input
                  type="text"
                  value={redeemNote}
                  onChange={(e) => setRedeemNote(e.target.value)}
                  placeholder="Contoh: Diskon Belanja Rp 5.000 / Minyak 1L"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Sisa poin setelah ditukar: <strong className="text-slate-900">{redeemCustomer.points - redeemPoints} Poin</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRedeemCustomer(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRedeem}
                className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tukarkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Pelanggan Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hendra Kusuma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp (opsional)</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Poin Awal (Bonus)</label>
                <input
                  type="number"
                  min="0"
                  value={initialPoints}
                  onChange={(e) => setInitialPoints(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
