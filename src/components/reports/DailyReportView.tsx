import React, { useState, useMemo } from 'react';
import { Transaction, StoreSettings, Customer } from '../../types';
import { calculateDailyReport, formatDailyReportWhatsAppText, createWhatsAppUrl } from '../../utils/whatsapp';
import { formatRupiah } from '../../utils/storage';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  Calendar,
  Send,
  Copy,
  Check,
  TrendingUp,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface DailyReportViewProps {
  transactions: Transaction[];
  settings: StoreSettings;
  customers: Customer[];
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  transactions,
  settings,
  customers,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Receipt modal state
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  // Calculate report
  const summary = useMemo(() => {
    return calculateDailyReport(transactions, selectedDate);
  }, [transactions, selectedDate]);

  // WhatsApp formatted text
  const waText = useMemo(() => {
    return formatDailyReportWhatsAppText(summary, settings);
  }, [summary, settings]);

  const handleSendWhatsApp = () => {
    const url = createWhatsAppUrl(targetPhone, waText);
    window.open(url, '_blank');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(waText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Laporan Penjualan Harian</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Kirim ke WhatsApp
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekap omset harian, rincian pembayaran, dan produk terlaris yang siap dikirim langsung ke WhatsApp owner.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              selectedDate === todayStr
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={setYesterday}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
              selectedDate !== todayStr
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Kemarin
          </button>

          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Total Omset Harian</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(summary.totalRevenue)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{summary.displayDate}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/40">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Laba Koperasi (SHU)</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatRupiah(summary.totalKoperasiProfit)}</div>
          <span className="text-[11px] text-emerald-800 mt-1 block">
            {summary.officeOrderCount > 0 ? `Termasuk ${summary.officeOrderCount} pesanan kantor` : 'Laba penjualan hari ini'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Receipt className="w-4 h-4 text-blue-600" />
            <span>Total Transaksi</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.totalTransactions} Struk</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Rata-rata: {formatRupiah(summary.averageBasket)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Poin Loyalitas</span>
          </div>
          <div className="text-2xl font-black text-amber-600">+{summary.totalPointsGiven} Poin</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Diberikan ke {summary.customerCount} pelanggan</span>
        </div>
      </div>

      {/* WhatsApp Share Card & Message Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: WhatsApp Dispatcher Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Kirim Laporan ke WhatsApp</h3>
                <p className="text-xs text-slate-500">Kirim langsung via WhatsApp Web atau aplikasi WA di HP/PC</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp Penerima (Owner / Manajer / Keuangan)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="08123456789 atau kosongkan untuk pilih kontak di WA"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Jika nomor dikosongkan, Anda akan diarahkan ke layar pemilihan kontak atau grup WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Buka & Kirim WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Teks'}</span>
              </button>
            </div>

            {/* Payment Method Details */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Rincian Metode Pembayaran
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">Tunai ({summary.paymentBreakdown.tunai.count}x)</span>
                    <strong className="text-xs text-slate-900">{formatRupiah(summary.paymentBreakdown.tunai.total)}</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">QRIS ({summary.paymentBreakdown.qris.count}x)</span>
                    <strong className="text-xs text-slate-900">{formatRupiah(summary.paymentBreakdown.qris.total)}</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">Transfer ({summary.paymentBreakdown.transfer.count}x)</span>
                    <strong className="text-xs text-slate-900">{formatRupiah(summary.paymentBreakdown.transfer.total)}</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-500 block">Debit ({summary.paymentBreakdown.debit.count}x)</span>
                    <strong className="text-xs text-slate-900">{formatRupiah(summary.paymentBreakdown.debit.total)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            {summary.topProducts.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Produk Terlaris Hari Ini
                </h4>
                <div className="space-y-1.5">
                  {summary.topProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-slate-400 font-bold">{idx + 1}.</span>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">{p.quantity} {p.unit}</span>
                        <span className="text-slate-400 text-[11px] ml-1">({formatRupiah(p.subtotal)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: WhatsApp Chat Bubble Preview */}
        <div className="lg:col-span-6">
          <div className="bg-[#efeae2] p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-inner flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300/60">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Preview Pesan Format WhatsApp
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Monospace WhatsApp Style</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-white rounded-2xl p-4 shadow-sm max-w-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {waText}
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-500">
                Format tebal (*), rincian bullet (•), dan emoji akan otomatis tampil rapi di WhatsApp.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions on this day table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            Daftar Transaksi ({summary.transactions.length} Struk pada {summary.displayDate})
          </h3>
          <span className="text-xs font-semibold text-emerald-700">
            Total: {formatRupiah(summary.totalRevenue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">No. Struk</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Metode Bayar</th>
                <th className="px-4 py-3 text-center">Poin</th>
                <th className="px-4 py-3 text-right">Total Belanja</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {trx.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </td>
                  <td className="px-4 py-3">
                    {trx.customerName ? (
                      <span className="font-medium text-slate-800">{trx.customerName}</span>
                    ) : (
                      <span className="text-slate-400 italic">Pelanggan Umum</span>
                    )}
                  </td>
                  <td className="px-4 py-3 uppercase font-semibold text-slate-600">
                    {trx.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {trx.pointsEarned > 0 ? (
                      <span className="text-emerald-700 font-bold">+{trx.pointsEarned} Poin</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatRupiah(trx.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setViewingTransaction(trx)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      title="Lihat & Unduh Struk JPG"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Struk JPG</span>
                    </button>
                  </td>
                </tr>
              ))}

              {summary.transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada transaksi pada tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal for viewing Struk JPG */}
      <ReceiptModal
        isOpen={Boolean(viewingTransaction)}
        onClose={() => setViewingTransaction(null)}
        transaction={viewingTransaction}
        settings={settings}
        customer={customers.find((c) => c.id === viewingTransaction?.customerId) || null}
      />
    </div>
  );
};
