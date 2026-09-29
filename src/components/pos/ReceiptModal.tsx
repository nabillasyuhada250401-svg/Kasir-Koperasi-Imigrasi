import React, { useEffect, useState } from 'react';
import { Transaction, StoreSettings, Customer } from '../../types';
import {
  downloadReceiptAsJpg,
  downloadKuitansiAsJpg,
  getReceiptJpgDataUrl,
  renderReceiptToCanvas,
  renderKuitansiToCanvas,
} from '../../utils/receiptGenerator';
import { formatRupiah } from '../../utils/storage';
import {
  Download,
  CheckCircle2,
  X,
  RefreshCw,
  Smartphone,
  FileText,
  Receipt as ReceiptIcon,
  TrendingUp,
  Clock,
  Send,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: StoreSettings;
  customer?: Customer | null;
  onNewTransaction?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
  customer,
  onNewTransaction,
}) => {
  const [activeFormat, setActiveFormat] = useState<'struk' | 'kuitansi'>('struk');
  const [jpgDataUrl, setJpgDataUrl] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState<string>('');
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setHasDownloaded(false);
      setShareMessage(null);
      setWaPhoneNumber(transaction.customerPhone || customer?.phone || '');
      
      // Auto-select Kuitansi if it's an office external order
      const initialMode = transaction.transactionType === 'pesanan_kantor' ? 'kuitansi' : 'struk';
      setActiveFormat(initialMode);

      try {
        const url = getReceiptJpgDataUrl({
          transaction,
          settings,
          customer,
          mode: initialMode,
        });
        setJpgDataUrl(url);
      } catch (err) {
        console.error('Failed to generate receipt JPG:', err);
      }
    }
  }, [isOpen, transaction, settings, customer]);

  // Update preview when toggling format
  const handleToggleFormat = (mode: 'struk' | 'kuitansi') => {
    setActiveFormat(mode);
    if (transaction) {
      try {
        const url = getReceiptJpgDataUrl({
          transaction,
          settings,
          customer,
          mode,
        });
        setJpgDataUrl(url);
      } catch (err) {
        console.error('Failed to switch receipt JPG mode:', err);
      }
    }
  };

  if (!isOpen || !transaction) return null;

  const handleDownloadActiveJpg = () => {
    if (activeFormat === 'kuitansi') {
      downloadKuitansiAsJpg({ transaction, settings, customer });
    } else {
      downloadReceiptAsJpg({ transaction, settings, customer });
    }
    setHasDownloaded(true);
  };

  // Kirim Gambar Struk Thermal (JPG) ke WhatsApp (Tanpa format ketikan teks)
  const handleSendThermalJpgToWhatsApp = () => {
    if (!transaction) return;
    const canvas = activeFormat === 'kuitansi'
      ? renderKuitansiToCanvas({ transaction, settings, customer })
      : renderReceiptToCanvas({ transaction, settings, customer });

    const isKuitansi = activeFormat === 'kuitansi';
    const fileName = `${isKuitansi ? 'kuitansi' : 'struk'}-${transaction.invoiceNumber}.jpg`;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Coba bagikan langsung GAMBAR JPG saja tanpa format ketikan
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: isKuitansi ? `Kuitansi ${transaction.invoiceNumber}` : `Struk ${transaction.invoiceNumber}`,
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') return;
        }
      }

      // Fallback: Unduh otomatis gambar JPG & buka chat WhatsApp langsung tanpa format ketikan
      if (isKuitansi) {
        downloadKuitansiAsJpg({ transaction, settings, customer });
      } else {
        downloadReceiptAsJpg({ transaction, settings, customer });
      }

      const cleanPhone = waPhoneNumber.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
      const url = formattedPhone ? `https://wa.me/${formattedPhone}` : 'https://wa.me/';
      window.open(url, '_blank', 'noopener,noreferrer');
      setShareMessage(`Gambar ${isKuitansi ? 'Kuitansi' : 'Struk'} (JPG) telah diunduh! Silakan lampirkan gambar tersebut di chat WhatsApp.`);
      setTimeout(() => setShareMessage(null), 6000);
    }, 'image/jpeg', 0.95);
  };

  // Calculate cooperative profit from external items
  const koperasiProfitTotal = transaction.items.reduce((sum, item) => {
    return sum + (item.koperasiProfit || (item.isExternalOrder ? (item.price - item.costPrice) * item.quantity : 0));
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-auto flex flex-col md:flex-row max-h-[94vh]">
        {/* Left Side: Real-time Preview (Rendered JPG) */}
        <div className="md:w-7/12 bg-slate-100 p-4 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center justify-start overflow-y-auto max-h-[50vh] md:max-h-full">
          {/* Format Switcher */}
          <div className="w-full flex items-center justify-between gap-2 mb-3 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => handleToggleFormat('struk')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeFormat === 'struk'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ReceiptIcon className="w-3.5 h-3.5" />
              <span>Struk Thermal (JPG)</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleFormat('kuitansi')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeFormat === 'kuitansi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Kuitansi Koperasi (JPG)</span>
            </button>
          </div>

          {/* Rendered JPG Canvas Image */}
          <div className={`w-full ${activeFormat === 'kuitansi' ? 'max-w-[480px]' : 'max-w-[290px]'} bg-white shadow-xl rounded-lg p-2 border border-slate-200 overflow-hidden transition-all hover:scale-[1.01]`}>
            {jpgDataUrl ? (
              <img
                src={jpgDataUrl}
                alt={`${activeFormat === 'kuitansi' ? 'Kuitansi' : 'Struk'} ${transaction.invoiceNumber}`}
                className="w-full h-auto object-contain rounded"
              />
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Memproses gambar {activeFormat}...
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Actions & Share Controls */}
        <div className="md:w-5/12 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Top Close Button & Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {transaction.transactionType === 'pesanan_kantor' ? 'Pesanan Kantor Berhasil!' : 'Transaksi Berhasil!'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profit summary banner if office order */}
            {koperasiProfitTotal > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block">Keuntungan Koperasi</span>
                    <span className="text-[10px] text-emerald-700">Masuk ke kas / SHU Koperasi</span>
                  </div>
                </div>
                <span className="font-mono font-black text-sm text-emerald-800">
                  +{formatRupiah(koperasiProfitTotal)}
                </span>
              </div>
            )}

            {/* Quick Metadata */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>No. Dokumen:</span>
                <span className="font-bold text-slate-900 font-mono">{transaction.invoiceNumber}</span>
              </div>
              {transaction.customerDepartment && (
                <div className="flex justify-between">
                  <span>Unit / Divisi:</span>
                  <span className="font-bold text-slate-900">{transaction.customerDepartment}</span>
                </div>
              )}
              {transaction.officialPurpose && (
                <div className="flex justify-between text-[11px] text-emerald-800">
                  <span>Keperluan:</span>
                  <span className="font-medium truncate max-w-[160px]">{transaction.officialPurpose}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200/60 pt-1">
                <span>Total Tagihan:</span>
                <span className="font-black text-emerald-700 text-sm">{formatRupiah(transaction.total)}</span>
              </div>
            </div>

            {/* Download JPG Action Button (Specifically requested: struk & kuitansi versi JPG saja) */}
            <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Unduh {activeFormat === 'kuitansi' ? 'Kuitansi Resmi Koperasi' : 'Struk Kasir'} (JPG)
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {activeFormat === 'kuitansi'
                      ? 'Format kuitansi formal bertanda tangan & stempel digital untuk SPJ/reimbursement kantor.'
                      : 'Format struk kasir thermal beresolusi tinggi tersimpan langsung sebagai .JPG.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadActiveJpg}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                  hasDownloaded
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold active:scale-[0.98]'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  {hasDownloaded
                    ? `Unduh Ulang ${activeFormat === 'kuitansi' ? 'Kuitansi' : 'Struk'} (JPG)`
                    : `Unduh ${activeFormat === 'kuitansi' ? 'Kuitansi Koperasi' : 'Struk'} (JPG)`}
                </span>
              </button>
            </div>

            {/* WhatsApp Share Section (Specifically Struk Thermal JPG) */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Kirim Struk Thermal (JPG) ke WA</span>
                </div>
                {transaction.paymentStatus === 'belum_bayar' ? (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Belum Lunas</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Lunas</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600">
                Kirimkan gambar Struk Thermal (JPG) langsung ke WhatsApp pelanggan atau bagian pemesan kantor:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nomor WA (cth: 08123456789)"
                  value={waPhoneNumber}
                  onChange={(e) => setWaPhoneNumber(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendThermalJpgToWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  title="Kirim Struk Thermal JPG langsung ke WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Struk WA</span>
                </button>
              </div>

              {shareMessage && (
                <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-lg text-[11px] text-emerald-950 font-medium">
                  {shareMessage}
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center pt-0.5">
                Struk dikirim dalam bentuk gambar utuh (JPG) tanpa format teks ketikan.
              </p>
            </div>
          </div>

          {/* Bottom Action: New Transaction */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNewTransaction) onNewTransaction();
              }}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Transaksi Baru</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
