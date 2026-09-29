import React, { useState } from 'react';
import { Customer, PaymentMethod, PaymentStatus } from '../../types';
import { formatRupiah } from '../../utils/storage';
import {
  CreditCard,
  QrCode,
  Banknote,
  Building2,
  Check,
  X,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discount: number;
  total: number;
  customerName: string;
  selectedCustomer: Customer | null;
  pointsEarned: number;
  onConfirmPayment: (
    method: PaymentMethod,
    cashAmount: number,
    changeAmount: number,
    status: PaymentStatus,
    unpaidDetails?: {
      dueDate?: string;
      dpAmount?: number;
      notes?: string;
    }
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  discount,
  total,
  customerName,
  selectedCustomer,
  pointsEarned,
  onConfirmPayment,
}) => {
  // Status: Lunas vs Belum Bayar
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('lunas');

  // Lunas states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [cashInput, setCashInput] = useState<string>(total.toString());

  // Belum Bayar states (Kasbon / Tempo Kantor)
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [dpInput, setDpInput] = useState<string>('0');
  const [tempoNotes, setTempoNotes] = useState<string>('Menunggu pencairan SPJ kantor');

  if (!isOpen) return null;

  // Lunas calculations
  const numericCash = parseInt(cashInput.replace(/[^0-9]/g, ''), 10) || 0;
  const changeAmount = Math.max(0, numericCash - total);
  const isCashSufficient = paymentStatus === 'belum_bayar' || paymentMethod !== 'tunai' || numericCash >= total;

  // Belum Bayar calculations
  const numericDp = parseInt(dpInput.replace(/[^0-9]/g, ''), 10) || 0;
  const remainingAmount = Math.max(0, total - numericDp);

  const quickNominals = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    100000,
    200000,
  ].filter((v, i, self) => v >= total && self.indexOf(v) === i).slice(0, 4);

  const handleSetDueDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSetDueEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDueDate(lastDay.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCashSufficient) return;

    if (paymentStatus === 'belum_bayar') {
      onConfirmPayment(
        paymentMethod,
        numericDp,
        0,
        'belum_bayar',
        {
          dueDate,
          dpAmount: numericDp,
          notes: tempoNotes.trim(),
        }
      );
    } else {
      const finalCash = paymentMethod === 'tunai' ? numericCash : total;
      const finalChange = paymentMethod === 'tunai' ? changeAmount : 0;
      onConfirmPayment(paymentMethod, finalCash, finalChange, 'lunas');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pembayaran Kasir Koperasi</h3>
            <p className="text-xs text-slate-500">Pilih status lunas atau tempo belum bayar</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="payment-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Status Pembayaran Toggle: LUNAS vs BELUM BAYAR */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Status Pembayaran Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPaymentStatus('lunas')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  paymentStatus === 'lunas'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>LUNAS (Sudah Bayar)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('belum_bayar')}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  paymentStatus === 'belum_bayar'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>BELUM BAYAR (Tempo / SPJ)</span>
              </button>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                Total Tagihan
              </span>
              <div className="text-2xl font-black text-emerald-400">{formatRupiah(total)}</div>
              {discount > 0 && (
                <div className="text-xs text-red-300 mt-0.5">
                  Hemat {formatRupiah(discount)} (Subtotal: {formatRupiah(subtotal)})
                </div>
              )}
            </div>

            {/* Customer & Department Tag */}
            {(customerName || selectedCustomer) && (
              <div className="text-right bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-200 block font-bold truncate max-w-[140px]">
                  {customerName || selectedCustomer?.name}
                </span>
                {paymentStatus === 'belum_bayar' ? (
                  <span className="text-[10px] text-amber-400 font-bold">
                    Penanggung Tagihan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Sparkles className="w-3 h-3" />
                    +{pointsEarned} Poin
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Conditional View Based on Payment Status */}
          {paymentStatus === 'belum_bayar' ? (
            /* --- SECTION BELUM BAYAR (KASBON / TEMPO KANTOR) --- */
            <div className="space-y-3 bg-amber-50/80 p-4 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Detail Tagihan Tempo / Kasbon Kantor</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Jatuh Tempo Pembayaran *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Quick Due Date Presets */}
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetDueDays(7)}
                    className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 rounded font-semibold text-[10px] hover:bg-amber-100"
                  >
                    +7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDueDays(14)}
                    className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 rounded font-semibold text-[10px] hover:bg-amber-100"
                  >
                    +14 Hari
                  </button>
                  <button
                    type="button"
                    onClick={handleSetDueEndOfMonth}
                    className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 rounded font-semibold text-[10px] hover:bg-amber-100"
                  >
                    Akhir Bulan
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uang Muka / DP Dibayar Sekarang (Opsional, Default Rp 0)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    value={dpInput}
                    onChange={(e) => setDpInput(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tagihan
                </label>
                <input
                  type="text"
                  value={tempoNotes}
                  onChange={(e) => setTempoNotes(e.target.value)}
                  placeholder="Contoh: Menunggu pencairan SPJ Bagian Umum"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Unpaid calculation box */}
              <div className="bg-white p-3 rounded-lg border border-amber-300 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Tagihan:</span>
                  <span className="font-semibold">{formatRupiah(total)}</span>
                </div>
                {numericDp > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Uang Muka (DP):</span>
                    <span className="font-semibold">-{formatRupiah(numericDp)}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-900 font-bold border-t border-slate-100 pt-1 text-xs">
                  <span>Sisa Tagihan Belum Dibayar:</span>
                  <span className="text-sm font-black text-amber-700">{formatRupiah(remainingAmount)}</span>
                </div>
              </div>

              <p className="text-[10px] text-amber-800 italic">
                * Transaksi akan otomatis masuk ke menu <strong>Belum Bayar</strong> untuk dipantau dan dapat dilunasi kapan saja.
              </p>
            </div>
          ) : (
            /* --- SECTION LUNAS (METODE BAYAR LENGKAP) --- */
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tunai')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'tunai'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span className="text-[11px]">Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'qris'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-[11px]">QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-[11px]">Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debit')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      paymentMethod === 'debit'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[11px]">Debit</span>
                  </button>
                </div>
              </div>

              {/* Cash Input */}
              {paymentMethod === 'tunai' ? (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Jumlah Uang Tunai Diterima (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2.5 text-base font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Quick Nominals */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickNominals.map((nom) => (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => setCashInput(nom.toString())}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        {formatRupiah(nom)}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between mt-2">
                    <span className="font-semibold text-slate-600">Uang Kembalian:</span>
                    <span
                      className={`text-base font-black ${
                        changeAmount > 0 ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {formatRupiah(changeAmount)}
                    </span>
                  </div>

                  {!isCashSufficient && (
                    <p className="text-red-500 text-[11px] font-medium">
                      Uang tunai kurang sebesar {formatRupiah(total - numericCash)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                  <p className="font-bold text-emerald-900 text-xs">
                    Pembayaran Non-Tunai ({paymentMethod.toUpperCase()})
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Pastikan dana sebesar <strong>{formatRupiah(total)}</strong> sudah berhasil masuk.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Pinned Modal Footer: KLIK BAYAR (Selalu terlihat, tidak tertutup scroll) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="submit"
            form="payment-form"
            disabled={!isCashSufficient}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
              !isCashSufficient
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : paymentStatus === 'belum_bayar'
                ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-[0.98]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
            }`}
          >
            {paymentStatus === 'belum_bayar' ? (
              <>
                <Clock className="w-4 h-4" />
                <span>KLIK SIMPAN TAGIHAN TEMPO ({formatRupiah(total)})</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>KLIK BAYAR SEKARANG ({formatRupiah(total)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
