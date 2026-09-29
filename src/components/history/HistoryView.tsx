import React, { useState, useMemo } from 'react';
import { Transaction, StoreSettings, Customer } from '../../types';
import { formatRupiah } from '../../utils/storage';
import { ReceiptModal } from '../pos/ReceiptModal';
import { downloadReceiptAsJpg, downloadKuitansiAsJpg } from '../../utils/receiptGenerator';
import {
  Receipt,
  Search,
  Download,
  Eye,
  Calendar,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  FileText,
} from 'lucide-react';

interface HistoryViewProps {
  transactions: Transaction[];
  settings: StoreSettings;
  customers: Customer[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  settings,
  customers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.customerDepartment && t.customerDepartment.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.items.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMethod = methodFilter === 'all' || t.paymentMethod === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [transactions, searchTerm, methodFilter]);

  const handleQuickDownloadJpg = (trx: Transaction) => {
    const cust = customers.find((c) => c.id === trx.customerId) || null;
    if (trx.transactionType === 'pesanan_kantor') {
      downloadKuitansiAsJpg({
        transaction: trx,
        settings,
        customer: cust,
      });
    } else {
      downloadReceiptAsJpg({
        transaction: trx,
        settings,
        customer: cust,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Riwayat Transaksi & Cetak Ulang Struk</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Format JPG
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua riwayat struk penjualan tersimpan rapi dan dapat diunduh ulang versi JPG kapan saja.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nomor invoice, nama pelanggan, atau nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'tunai', 'qris', 'transfer', 'debit'].map((method) => (
              <button
                key={method}
                onClick={() => setMethodFilter(method)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  methodFilter === method ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {method === 'all' ? 'Semua Metode' : method}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">No. Invoice & Tanggal</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Rincian Item</th>
                <th className="px-4 py-3">Metode Bayar</th>
                <th className="px-4 py-3 text-center">Poin</th>
                <th className="px-4 py-3 text-right">Total Transaksi</th>
                <th className="px-4 py-3 text-right">Aksi Struk JPG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {trx.invoiceNumber}
                      </span>
                      {trx.transactionType === 'pesanan_kantor' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          Kuitansi Kantor
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(trx.date).toLocaleString('id-ID')}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {trx.customerDepartment || trx.customerName ? (
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {trx.customerDepartment || trx.customerName}
                        </span>
                        {trx.customerDepartment && trx.customerName && (
                          <span className="text-[11px] text-slate-500 block">
                            PIC: {trx.customerName}
                          </span>
                        )}
                        {trx.customerPhone && (
                          <span className="text-[11px] text-slate-400 font-mono">{trx.customerPhone}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pelanggan Umum</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">
                      {trx.items.length} item ({trx.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                    </span>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">
                      {trx.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold uppercase text-[11px]">
                      {trx.paymentMethod === 'tunai' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                      {trx.paymentMethod === 'qris' && <QrCode className="w-3.5 h-3.5 text-blue-600" />}
                      {trx.paymentMethod === 'transfer' && <Building2 className="w-3.5 h-3.5 text-indigo-600" />}
                      {trx.paymentMethod === 'debit' && <CreditCard className="w-3.5 h-3.5 text-purple-600" />}
                      <span>{trx.paymentMethod}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {trx.pointsEarned > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>+{trx.pointsEarned} Poin</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-slate-900 text-xs sm:text-sm">
                      {formatRupiah(trx.total)}
                    </span>
                    {trx.discount > 0 && (
                      <span className="text-[10px] text-red-500 block">
                        Diskon: -{formatRupiah(trx.discount)}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTransaction(trx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Lihat Preview Struk JPG"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </button>

                      <button
                        onClick={() => handleQuickDownloadJpg(trx)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                        title="Unduh Struk Versi JPG"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh JPG</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span>Tidak ada riwayat transaksi yang sesuai.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        settings={settings}
        customer={customers.find((c) => c.id === selectedTransaction?.customerId) || null}
      />
    </div>
  );
};
