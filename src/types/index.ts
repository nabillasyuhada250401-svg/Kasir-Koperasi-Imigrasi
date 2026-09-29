export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  imageEmoji?: string;
  isExternalOrder?: boolean; // True if item is a custom outside order (no regular warehouse stock deduction)
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  isExternalOrder?: boolean;
  costPrice?: number;
  markupPercent?: number; // e.g. 20%, 25%, 30%
  koperasiProfit?: number; // Total profit for Koperasi from markup
  notes?: string; // Purpose note, e.g. "Rapat Pleno Ruang Melati"
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  department?: string; // Divisi / Unit Kerja Kantor
  points: number;
  totalSpent: number;
  transactionCount: number;
  createdAt: string;
}

export type PaymentMethod = 'tunai' | 'qris' | 'transfer' | 'debit';
export type PaymentStatus = 'lunas' | 'belum_bayar';

export interface TransactionItem {
  productId: string;
  productName: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  unit: string;
  isExternalOrder?: boolean;
  markupPercent?: number;
  koperasiProfit?: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalKoperasiProfit?: number; // Total laba koperasi dari pengadaan luar + margin reguler
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus; // 'lunas' atau 'belum_bayar' (kasbon / tempo kantor)
  paidAt?: string; // ISO string when paid off
  dueDate?: string; // YYYY-MM-DD
  paidAmount?: number; // Uang yang sudah masuk (DP / bayar sebagian)
  remainingAmount?: number; // Sisa tagihan belum dibayar
  cashAmount: number;
  changeAmount: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerDepartment?: string; // Unit/Divisi Kantor pemesan
  pointsEarned: number;
  cashierName: string;
  notes?: string;
  transactionType?: 'reguler' | 'pesanan_kantor'; // If true, can print formal Kuitansi Koperasi
  officialPurpose?: string; // Keperluan/Untuk Pembayaran kuitansi, e.g. "Konsumsi Kue Rapat Koordinasi"
}

export type ExpenseCategory =
  | 'belanja_stok'      // Belanja Stok Barang Dagangan
  | 'operasional'       // Operasional Toko (Listrik, Air, Wifi, Plastik, Lakban, dll.)
  | 'konsumsi_rapat'    // Konsumsi & Rapat Koperasi
  | 'gaji_honor'        // Honor / Gaji Pengurus & Kasir
  | 'transport'         // Ongkos Kirim / Transport Kulakan
  | 'lain_lain';        // Lain-lain

export interface Expense {
  id: string;
  expenseNumber: string; // e.g. "EXP-20260927-001"
  date: string;          // ISO string
  category: ExpenseCategory;
  categoryLabel: string;
  description: string;   // e.g. "Kulakan Beras & Minyak dari Distributor"
  amount: number;        // Nominal pengeluaran (Rp)
  paymentMethod: 'kas_tunai' | 'transfer_bank';
  recordedBy: string;    // e.g. "Pengurus Koperasi" / "Nadia"
  receiptProof?: string; // No. Nota / Kwitansi Toko Luar
  productId?: string;    // Optional: if linked to a specific product restock
  restockQty?: number;   // Optional: automatically add stock to that product
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  koperasiName: string;
  badanHukumNo?: string;
  address: string;
  phone: string;
  receiptFooter: string;
  cashierName: string;
  bendaharaName: string;
  pointsRuleRate: number; // default: 10000 (1 point per 10k)
  defaultMarkupPercent: number; // default: 25% (range 20-30%)
}

export type ActiveTab =
  | 'pos'
  | 'unpaid'
  | 'inventory'
  | 'expenses'
  | 'daily_report'
  | 'monthly_dashboard'
  | 'customers'
  | 'history';
