import React, { useState, useMemo } from 'react';
import { Transaction, StoreSettings, Customer, PaymentMethod } from '../../types';
import { formatRupiah } from '../../utils/storage';
import { createWhatsAppUrl } from '../../utils/whatsapp';
import { ReceiptModal } from '../pos/ReceiptModal';
import { downloadKuitansiAsJpg, downloadReceiptAsJpg, renderReceiptToCanvas } from '../../utils/receiptGenerator';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  Phone,
  Search,
  Check,
  Share2,
  Eye,
  Download,
  FileText,
  DollarSign,
  ArrowRight,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface UnpaidBillsViewProps {
  transactions: Transaction[];
  settings: StoreSettings;
  customers: Customer[];
  onMarkAsPaid: (
    transactionId: string,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => void;
}

export const UnpaidBillsView: React.FC<UnpaidBillsViewProps> = ({
  transactions,
  settings,
  customers,
  onMarkAsPaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'upcoming'>('all');

  // Modal Pelunasan State
  const [settlingTransaction, setSettlingTransaction] = useState<Transaction | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('transfer');
  const [settleNotes, setSettleNotes] = useState('Pelunasan SPJ kantor');

  // Preview Document Modal State
  const [previewTransaction, setPreviewTransaction] = useState<Transaction | null>(null);

  // Filter only unpaid transactions
  const unpaidTransactions = useMemo(() => {
    return transactions.filter((t) => t.paymentStatus === 'belum_bayar');
  }, [transactions]);

  // Calculations for KPI Cards
  const totalUnpaidAmount = useMemo(() => {
    return unpaidTransactions.reduce((sum, t) => sum + (t.remainingAmount ?? t.total), 0);
  }, [unpaidTransactions]);

  const totalOriginalAmount = useMemo(() => {
    return unpaidTransactions.reduce((sum, t) => sum + t.total, 0);
  }, [unpaidTransactions]);

  const totalPaidAmount = totalOriginalAmount - totalUnpaidAmount;

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter and search
  const filteredList = useMemo(() => {
    return unpaidTransactions.filter((t) => {
      const matchSearch =
        t.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customerName && t.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.customerDepartment && t.customerDepartment.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.items.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchFilter = true;
      if (filterStatus === 'overdue' && t.dueDate) {
        matchFilter = t.dueDate < todayStr;
      } else if (filterStatus === 'upcoming' && t.dueDate) {
        matchFilter = t.dueDate >= todayStr;
      }

      return matchSearch && matchFilter;
    });
  }, [unpaidTransactions, searchTerm, filterStatus, todayStr]);

  // Handle WhatsApp Tagihan Reminder (Specifically Struk Thermal JPG)
  const handleSendReminderWA = (trx: Transaction) => {
    const cust = customers.find((c) => c.id === trx.customerId);
    const canvas = renderReceiptToCanvas({ transaction: trx, settings, customer: cust });
    const sisa = trx.remainingAmount ?? trx.total;
    const dueDateFormatted = trx.dueDate
      ? new Date(trx.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    const message = [
      `🔔 *PENGINGAT TAGIHAN KOPERASI*`,
      `🏢 *${(settings.koperasiName || 'KOPERASI SABANG PRIMA MEUJAYA').toUpperCase()}*`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `Yth. *${trx.customerDepartment || trx.customerName || 'Bapak/Ibu Pemesan'}*`,
      ``,
      `Kami menginformasikan rincian tagihan pesanan kantor yang belum terselesaikan:`,
      `• *No. Struk:* ${trx.invoiceNumber}`,
      `• *Tanggal Pesanan:* ${new Date(trx.date).toLocaleDateString('id-ID')}`,
      `• *Keperluan:* ${trx.officialPurpose || trx.notes || 'Pengadaan Rapat Kantor'}`,
      `• *Total Tagihan:* ${formatRupiah(trx.total)}`,
      trx.paidAmount ? `• *Sudah Dibayar (DP):* ${formatRupiah(trx.paidAmount)}` : '',
      `• *STATUS:* ⏳ *BELUM LUNAS (TAGIHAN TEMPO)*`,
      `• *Sisa Tagihan Belum Dibayar:* *${formatRupiah(sisa)}*`,
      `• *Jatuh Tempo:* ${dueDateFormatted}`,
      ``,
      `*Rincian Barang:*`,
      ...trx.items.map((i) => ` - ${i.productName} (${i.quantity} ${i.unit}): ${formatRupiah(i.subtotal)}`),
      ``,
      `Mohon dapat segera diproses pelunasannya untuk kelancaran administrasi kas koperasi.`,
      `Terima kasih atas kerja samanya. 🙏`,
      `_Lampiran: Gambar Struk Thermal (JPG)_`,
    ]
      .filter(Boolean)
      .join('\n');

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `struk-${trx.invoiceNumber}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Tagihan Struk Thermal ${trx.invoiceNumber}`,
              text: message,
            });
            return;
          } catch (e: any) {
            if (e.name === 'AbortError') return;
          }
        }
        // Fallback: download thermal JPG
        downloadReceiptAsJpg({ transaction: trx, settings, customer: cust });
      }

      const phone = trx.customerPhone || '';
      const url = createWhatsAppUrl(phone, message);
      window.open(url, '_blank');
    }, 'image/jpeg', 0.95);
  };

  // Submit Pelunasan
  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingTransaction) return;

    onMarkAsPaid(settlingTransaction.id, settleMethod, settleNotes.trim());

    // Prepare updated transaction object for receipt modal
    const updatedTransaction: Transaction = {
      ...settlingTransaction,
      paymentStatus: 'lunas',
      paymentMethod: settleMethod,
      paidAt: new Date().toISOString(),
      remainingAmount: 0,
      paidAmount: settlingTransaction.total,
      notes: settleNotes.trim()
        ? `${settlingTransaction.notes ? settlingTransaction.notes + ' | ' : ''}Dilunasi: ${settleNotes.trim()}`
        : settlingTransaction.notes,
    };

    setSettlingTransaction(null);
    setPreviewTransaction(updatedTransaction);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Tagihan Belum Bayar</h2>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                {unpaidTransactions.length} Tagihan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar kasbon, tempo belanja anggota, dan pengadaan rapat kantor yang belum lunas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <Building className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengelolaan Piutang Koperasi Kantor</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
            <span>Total Belum Dibayar (Piutang)</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {formatRupiah(totalUnpaidAmount)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dari total {unpaidTransactions.length} transaksi belum lunas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Jumlah Dokumen Tagihan</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {unpaidTransactions.length} Nota / Kuitansi
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalPaidAmount > 0 ? `DP masuk: ${formatRupiah(totalPaidAmount)}` : 'Belum ada uang muka'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Status Keuangan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-800 mt-1">
            {unpaidTransactions.length === 0 ? 'Semua Tagihan Lunas' : 'Menunggu Pelunasan'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {unpaidTransactions.length > 0
              ? 'Dapat ditagih via WA atau langsung dilunasi'
              : 'Tidak ada kasbon / piutang yang tertunda'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nomor kuitansi, nama pemesan, divisi kantor, atau item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Semua ({unpaidTransactions.length})
          </button>
          <button
            onClick={() => setFilterStatus('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Lewat Tempo
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === 'upcoming'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            Belum Jatuh Tempo
          </button>
        </div>
      </div>

      {/* List of Unpaid Bills */}
      <div className="space-y-3">
        {filteredList.map((trx) => {
          const sisa = trx.remainingAmount ?? trx.total;
          const isOverdue = trx.dueDate && trx.dueDate < todayStr;
          const isOfficeOrder = trx.transactionType === 'pesanan_kantor';

          return (
            <div
              key={trx.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isOverdue ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-amber-400'
              }`}
            >
              {/* Left Column: Invoice Meta & Department */}
              <div className="space-y-2 lg:max-w-md">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {trx.invoiceNumber}
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>BELUM LUNAS</span>
                  </span>
                  {isOfficeOrder && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Pesanan Kantor
                    </span>
                  )}
                  {isOverdue && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Lewat Tempo
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{trx.customerDepartment || trx.customerName || 'Pelanggan Umum'}</span>
                  </div>
                  {trx.customerDepartment && trx.customerName && (
                    <p className="text-[11px] text-slate-500 ml-5">
                      PIC Pemesan: <strong>{trx.customerName}</strong>
                    </p>
                  )}
                  {trx.customerPhone && (
                    <p className="text-[11px] text-slate-500 ml-5 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{trx.customerPhone}</span>
                    </p>
                  )}
                </div>

                {trx.officialPurpose && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Keperluan: <strong>{trx.officialPurpose}</strong>
                  </p>
                )}

                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Dipesan: {new Date(trx.date).toLocaleDateString('id-ID')}</span>
                  {trx.dueDate && (
                    <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                      Jatuh Tempo: {new Date(trx.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Column: Items Preview */}
              <div className="lg:flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Rincian Barang ({trx.items.length} item):
                </span>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {trx.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                      <span className="truncate max-w-[200px]">{item.productName}</span>
                      <span className="font-medium shrink-0 ml-2">
                        {item.quantity} {item.unit} · {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Amount & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Sisa Yang Harus Dibayar:
                  </span>
                  <div className="text-xl font-black text-amber-700 font-mono">
                    {formatRupiah(sisa)}
                  </div>
                  {trx.paidAmount && trx.paidAmount > 0 ? (
                    <span className="text-[10px] text-slate-400 block">
                      Total: {formatRupiah(trx.total)} (DP: {formatRupiah(trx.paidAmount)})
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Action 1: Lunasi */}
                  <button
                    type="button"
                    onClick={() => setSettlingTransaction(trx)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lunasi Sekarang</span>
                  </button>

                  {/* Action 2: Tagih via WA */}
                  <button
                    type="button"
                    onClick={() => handleSendReminderWA(trx)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                    title="Kirim pengingat tagihan ke WhatsApp pemesan"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tagih WA</span>
                  </button>

                  {/* Action 3: Lihat Dokumen */}
                  <button
                    type="button"
                    onClick={() => setPreviewTransaction(trx)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    title="Lihat Kuitansi / Struk Belum Bayar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Tidak Ada Tagihan Belum Bayar</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Semua transaksi dan pesanan kantor telah lunas terbayar. Anda dapat membuat pesanan tempo baru di menu Kasir (POS).
            </p>
          </div>
        )}
      </div>

      {/* Settlement Modal (Modal Konfirmasi Pelunasan) */}
      {settlingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Proses Pelunasan Tagihan</h3>
              </div>
              <button
                onClick={() => setSettlingTransaction(null)}
                className="text-emerald-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettlement} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Dokumen:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {settlingTransaction.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pemesan:</span>
                  <span className="font-bold text-slate-900">
                    {settlingTransaction.customerDepartment || settlingTransaction.customerName || 'Pelanggan Umum'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-black">
                  <span className="text-slate-800">Sisa Tagihan Dilunasi:</span>
                  <span className="text-emerald-700 font-mono">
                    {formatRupiah(settlingTransaction.remainingAmount ?? settlingTransaction.total)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Pilih Metode Pembayaran Pelunasan *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettleMethod('transfer')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      settleMethod === 'transfer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-[11px]">Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('tunai')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      settleMethod === 'tunai'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px]">Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('qris')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      settleMethod === 'qris'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[11px]">QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleMethod('debit')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      settleMethod === 'debit'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px]">Debit</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pelunasan / No. Referensi Transfer
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Contoh: Transfer Bank Mandiri / Diterima Bagian Keuangan"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettlingTransaction(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Lunasi & Cetak Kuitansi LUNAS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewTransaction && (
        <ReceiptModal
          isOpen={Boolean(previewTransaction)}
          onClose={() => setPreviewTransaction(null)}
          transaction={previewTransaction}
          settings={settings}
          customer={customers.find((c) => c.id === previewTransaction.customerId)}
        />
      )}
    </div>
  );
};
