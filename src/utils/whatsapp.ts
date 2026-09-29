import { Transaction, StoreSettings } from '../types';
import { formatRupiah } from './storage';

export interface DailyReportSummary {
  dateStr: string; // YYYY-MM-DD
  displayDate: string;
  totalRevenue: number;
  totalKoperasiProfit: number; // Laba Bersih Koperasi (SHU)
  totalTransactions: number;
  officeOrderCount: number;
  officeOrderRevenue: number;
  averageBasket: number;
  totalItemsSold: number;
  paymentBreakdown: {
    tunai: { count: number; total: number };
    qris: { count: number; total: number };
    transfer: { count: number; total: number };
    debit: { count: number; total: number };
  };
  topProducts: {
    name: string;
    quantity: number;
    subtotal: number;
    unit: string;
  }[];
  totalPointsGiven: number;
  customerCount: number;
  transactions: Transaction[];
}

export function calculateDailyReport(
  transactions: Transaction[],
  dateStr: string // YYYY-MM-DD
): DailyReportSummary {
  const dailyTrx = transactions.filter((t) => {
    const trxDate = new Date(t.date).toISOString().split('T')[0];
    return trxDate === dateStr;
  });

  const totalRevenue = dailyTrx.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = dailyTrx.length;
  const averageBasket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  
  let totalItemsSold = 0;
  let totalPointsGiven = 0;
  let totalKoperasiProfit = 0;
  let officeOrderCount = 0;
  let officeOrderRevenue = 0;
  const uniqueCustomers = new Set<string>();

  const productMap = new Map<string, { name: string; quantity: number; subtotal: number; unit: string }>();

  const paymentBreakdown = {
    tunai: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
    transfer: { count: 0, total: 0 },
    debit: { count: 0, total: 0 },
  };

  dailyTrx.forEach((t) => {
    totalPointsGiven += t.pointsEarned || 0;
    if (t.customerName) {
      uniqueCustomers.add(t.customerName);
    }

    if (t.transactionType === 'pesanan_kantor') {
      officeOrderCount += 1;
      officeOrderRevenue += t.total;
    }

    // Profit calculation
    if (t.totalKoperasiProfit !== undefined) {
      totalKoperasiProfit += t.totalKoperasiProfit;
    } else {
      const trxProfit = t.items.reduce((sum, item) => {
        return sum + (item.koperasiProfit || (item.price - (item.costPrice || item.price * 0.8)) * item.quantity);
      }, 0);
      totalKoperasiProfit += trxProfit;
    }

    if (t.paymentMethod in paymentBreakdown) {
      paymentBreakdown[t.paymentMethod].count += 1;
      paymentBreakdown[t.paymentMethod].total += t.total;
    }

    t.items.forEach((item) => {
      totalItemsSold += item.quantity;
      const current = productMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        subtotal: 0,
        unit: item.unit || 'pcs',
      };
      current.quantity += item.quantity;
      current.subtotal += item.subtotal;
      productMap.set(item.productId, current);
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const dateObj = new Date(dateStr + 'T00:00:00');
  const displayDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    dateStr,
    displayDate,
    totalRevenue,
    totalKoperasiProfit,
    totalTransactions,
    officeOrderCount,
    officeOrderRevenue,
    averageBasket,
    totalItemsSold,
    paymentBreakdown,
    topProducts,
    totalPointsGiven,
    customerCount: uniqueCustomers.size,
    transactions: dailyTrx,
  };
}

/**
 * Format daily report as clean WhatsApp markdown message
 */
export function formatDailyReportWhatsAppText(
  summary: DailyReportSummary,
  settings: StoreSettings
): string {
  const lines: string[] = [];

  lines.push(`📊 *LAPORAN HARIAN KOPERASI KARYAWAN*`);
  lines.push(`🏢 *${(settings.koperasiName || settings.storeName).toUpperCase()}*`);
  lines.push(`📅 Hari, Tanggal: ${summary.displayDate}`);
  lines.push(`⏰ Dibuat pada: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  lines.push(`💰 *RINGKASAN KEUANGAN KOPERASI*`);
  lines.push(`• *Total Omset:* ${formatRupiah(summary.totalRevenue)}`);
  lines.push(`• *Estimasi Laba Bersih Koperasi (SHU):* *${formatRupiah(summary.totalKoperasiProfit)}*`);
  lines.push(`• *Total Transaksi:* ${summary.totalTransactions} transaksi`);
  if (summary.officeOrderCount > 0) {
    lines.push(`• *Pengadaan/Pesanan Kantor:* ${summary.officeOrderCount} pesanan (${formatRupiah(summary.officeOrderRevenue)})`);
  }
  lines.push(`• *Barang Terjual:* ${summary.totalItemsSold} item/pcs`);
  lines.push(`• *Rata-rata Transaksi:* ${formatRupiah(summary.averageBasket)}`);
  lines.push(``);

  lines.push(`💳 *METODE PEMBAYARAN*`);
  lines.push(`• Tunai: ${formatRupiah(summary.paymentBreakdown.tunai.total)} (${summary.paymentBreakdown.tunai.count}x)`);
  lines.push(`• QRIS: ${formatRupiah(summary.paymentBreakdown.qris.total)} (${summary.paymentBreakdown.qris.count}x)`);
  if (summary.paymentBreakdown.transfer.count > 0) {
    lines.push(`• Transfer: ${formatRupiah(summary.paymentBreakdown.transfer.total)} (${summary.paymentBreakdown.transfer.count}x)`);
  }
  if (summary.paymentBreakdown.debit.count > 0) {
    lines.push(`• Kartu Debit: ${formatRupiah(summary.paymentBreakdown.debit.total)} (${summary.paymentBreakdown.debit.count}x)`);
  }
  lines.push(``);

  if (summary.topProducts.length > 0) {
    lines.push(`🏆 *5 PRODUK TERLARIS HARI INI*`);
    summary.topProducts.forEach((p, idx) => {
      lines.push(`${idx + 1}. ${p.name} - *${p.quantity} ${p.unit}* (${formatRupiah(p.subtotal)})`);
    });
    lines.push(``);
  }

  lines.push(`⭐ *LOYALITAS ANGGOTA/PELANGGAN*`);
  lines.push(`• Pembeli Terdaftar: ${summary.customerCount} orang`);
  lines.push(`• Poin Diberikan: +${summary.totalPointsGiven} poin (min. Rp 10.000 = 1 poin)`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Laporan otomatis dibuat dari aplikasi Kasir Koperasi._`);

  return lines.join('\n');
}

/**
 * Format a single customer receipt or kuitansi to WhatsApp text
 */
export function formatReceiptWhatsAppText(
  transaction: Transaction,
  settings: StoreSettings
): string {
  const lines: string[] = [];
  const isUnpaid = transaction.paymentStatus === 'belum_bayar';

  lines.push(`🧾 *STRUK THERMAL KASIR KOPERASI*`);
  lines.push(`🏢 *${(settings.koperasiName || 'KOPERASI SABANG PRIMA MEUJAYA').toUpperCase()}*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`• *No. Struk:* ${transaction.invoiceNumber}`);
  lines.push(`• *Waktu:* ${new Date(transaction.date).toLocaleString('id-ID')}`);
  lines.push(`• *Kasir:* ${transaction.cashierName || 'Kasir Koperasi'}`);
  
  if (transaction.customerDepartment) {
    lines.push(`• *Unit / Divisi:* ${transaction.customerDepartment}`);
  }
  if (transaction.customerName) {
    lines.push(`• *Pelanggan / PIC:* ${transaction.customerName}`);
  }
  if (transaction.officialPurpose) {
    lines.push(`• *Keperluan:* ${transaction.officialPurpose}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`*RINCIAN PESANAN:*`);
  transaction.items.forEach((item) => {
    lines.push(`• ${item.productName}`);
    lines.push(`  ${item.quantity} ${item.unit} x ${formatRupiah(item.price)} = *${formatRupiah(item.subtotal)}*`);
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`*TOTAL TAGIHAN:* *${formatRupiah(transaction.total)}*`);

  if (isUnpaid) {
    lines.push(`*STATUS PEMBAYARAN:* ⏳ *BELUM LUNAS (TAGIHAN TEMPO)*`);
    if (transaction.dueDate) {
      lines.push(`*Jatuh Tempo:* ${new Date(transaction.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    }
    if ((transaction.paidAmount || 0) > 0) {
      lines.push(`*Uang Muka (DP):* ${formatRupiah(transaction.paidAmount || 0)}`);
    }
    lines.push(`*Sisa Tagihan Belum Dibayar:* *${formatRupiah(transaction.remainingAmount ?? transaction.total)}*`);
  } else {
    lines.push(`*STATUS PEMBAYARAN:* ✅ *LUNAS* (${transaction.paymentMethod.toUpperCase()})`);
    if (transaction.paymentMethod === 'tunai' && transaction.changeAmount > 0) {
      lines.push(`*Kembalian:* ${formatRupiah(transaction.changeAmount)}`);
    }
  }

  if (transaction.pointsEarned > 0 && !isUnpaid) {
    lines.push(`🎁 *Poin Diperoleh:* +${transaction.pointsEarned} Poin`);
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Struk Thermal resmi Koperasi Sabang Prima Meujaya._`);

  return lines.join('\n');
}

/**
 * Creates a WhatsApp URL for sharing
 */
export function createWhatsAppUrl(phoneNumber: string | undefined, message: string): string {
  const encodedText = encodeURIComponent(message);
  if (!phoneNumber || phoneNumber.trim() === '') {
    return `https://wa.me/?text=${encodedText}`;
  }
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.substring(1);
  }
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
