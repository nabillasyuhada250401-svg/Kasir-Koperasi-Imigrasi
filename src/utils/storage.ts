import { Product, Customer, Transaction, StoreSettings, Expense } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'kasirku_products_v1',
  CUSTOMERS: 'kasirku_customers_v1',
  TRANSACTIONS: 'kasirku_transactions_v1',
  SETTINGS: 'kasirku_settings_v1',
  EXPENSES: 'kasirku_expenses_v1',
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Koperasi Sabang Prima Meujaya',
  koperasiName: 'Koperasi Sabang Prima Meujaya',
  badanHukumNo: '284304420260810153821',
  address: 'V8V9+64F, Jl. Teuku Umar No. 10, Kuta Ateueh, Sukakarya, Kota Sabang, Aceh',
  phone: '0812-9876-5432',
  receiptFooter: 'Pelayanan Prima,\nAnggota Meujaya',
  cashierName: 'Nadia nabila',
  bendaharaName: 'Pengurus Koperasi',
  pointsRuleRate: 10000, // 10rb = 1 poin
  defaultMarkupPercent: 25, // default keuntungan koperasi pengadaan luar (20-30%)
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Beras Pandan Wangi 5kg',
    sku: 'BRS-001',
    category: 'Sembako',
    price: 78000,
    costPrice: 69000,
    stock: 24,
    unit: 'karung',
    imageEmoji: '🌾',
  },
  {
    id: 'prod-2',
    name: 'Minyak Goreng Sania 2L',
    sku: 'MYK-002',
    category: 'Sembako',
    price: 38500,
    costPrice: 34000,
    stock: 18,
    unit: 'pouch',
    imageEmoji: '🫒',
  },
  {
    id: 'prod-3',
    name: 'Gula Pasir Gulaku 1kg',
    sku: 'GLA-003',
    category: 'Sembako',
    price: 18000,
    costPrice: 15500,
    stock: 35,
    unit: 'kg',
    imageEmoji: '🧂',
  },
  {
    id: 'prod-4',
    name: 'Telur Ayam Negeri 1kg',
    sku: 'TLR-004',
    category: 'Sembako',
    price: 29000,
    costPrice: 25000,
    stock: 12,
    unit: 'kg',
    imageEmoji: '🥚',
  },
  {
    id: 'prod-5',
    name: 'Kopi Susu Gula Aren 250ml',
    sku: 'KOP-005',
    category: 'Minuman',
    price: 15000,
    costPrice: 9000,
    stock: 30,
    unit: 'botol',
    imageEmoji: '☕',
  },
  {
    id: 'prod-6',
    name: 'Teh Botol Sosro 450ml',
    sku: 'TEH-006',
    category: 'Minuman',
    price: 6500,
    costPrice: 4800,
    stock: 45,
    unit: 'botol',
    imageEmoji: '🧃',
  },
  {
    id: 'prod-7',
    name: 'Susu UHT Ultramilk 1L',
    sku: 'SSU-007',
    category: 'Minuman',
    price: 21500,
    costPrice: 18500,
    stock: 16,
    unit: 'kotak',
    imageEmoji: '🥛',
  },
  {
    id: 'prod-8',
    name: 'Air Mineral Le Minerale 600ml',
    sku: 'AIR-008',
    category: 'Minuman',
    price: 4000,
    costPrice: 2500,
    stock: 60,
    unit: 'botol',
    imageEmoji: '💧',
  },
  {
    id: 'prod-9',
    name: 'Indomie Goreng Spesial',
    sku: 'MIE-009',
    category: 'Makanan',
    price: 3500,
    costPrice: 2800,
    stock: 80,
    unit: 'bungkus',
    imageEmoji: '🍜',
  },
  {
    id: 'prod-10',
    name: 'Sari Roti Tawar Gandum',
    sku: 'RTI-010',
    category: 'Makanan',
    price: 19500,
    costPrice: 16000,
    stock: 8,
    unit: 'bungkus',
    imageEmoji: '🍞',
  },
  {
    id: 'prod-11',
    name: 'Chitato Sapi Panggang 68g',
    sku: 'SNK-011',
    category: 'Camilan',
    price: 12500,
    costPrice: 9800,
    stock: 22,
    unit: 'bungkus',
    imageEmoji: '🥔',
  },
  {
    id: 'prod-12',
    name: 'Sabun Mandi Lifebuoy 450ml',
    sku: 'SBN-012',
    category: 'Kebersihan',
    price: 26000,
    costPrice: 21000,
    stock: 14,
    unit: 'pouch',
    imageEmoji: '🧼',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Budi Santoso',
    phone: '081298765432',
    points: 38,
    totalSpent: 385000,
    transactionCount: 4,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Siti Rahmawati',
    phone: '085712345678',
    points: 52,
    totalSpent: 524000,
    transactionCount: 6,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Ahmad Fauzi',
    phone: '087844556677',
    points: 15,
    totalSpent: 150000,
    transactionCount: 2,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'cust-4',
    name: 'Dewi Lestari',
    phone: '081388990011',
    points: 84,
    totalSpent: 840000,
    transactionCount: 8,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

// Helper to seed initial transactions spanning multiple months for meaningful dashboard
export function generateSeedTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // Sample Unpaid Office Order (Pesanan Rapat Belum Bayar)
  const due = new Date();
  due.setDate(due.getDate() + 5);

  transactions.push({
    id: 'trx-unpaid-sample',
    invoiceNumber: `KUI-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-099`,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30).toISOString(),
    items: [
      {
        productId: 'prod-ext-sample',
        productName: 'Snack Box Kue Tradisional Rapat Koordinasi',
        price: 230000,
        costPrice: 200000,
        quantity: 1,
        subtotal: 230000,
        unit: 'paket',
        isExternalOrder: true,
        koperasiProfit: 30000,
        notes: 'Konsumsi Rapat Koordinasi Triwulan',
      },
    ],
    subtotal: 230000,
    discount: 0,
    total: 230000,
    totalKoperasiProfit: 30000,
    paymentMethod: 'transfer',
    paymentStatus: 'belum_bayar',
    dueDate: due.toISOString().split('T')[0],
    paidAmount: 0,
    remainingAmount: 230000,
    cashAmount: 0,
    changeAmount: 0,
    customerId: 'cust-1',
    customerName: 'Budi Santoso (PIC Bagian Umum)',
    customerPhone: '081298765432',
    customerDepartment: 'Bagian Umum & Perlengkapan',
    officialPurpose: 'Konsumsi Kue Rapat Koordinasi Triwulan Kantor',
    transactionType: 'pesanan_kantor',
    pointsEarned: 23,
    cashierName: 'Kasir Koperasi',
    notes: 'Menunggu pencairan kas kecil kantor / SPJ',
  });

  // Transactions for today
  transactions.push({
    id: 'trx-today-1',
    invoiceNumber: `TRX-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-001`,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15).toISOString(),
    items: [
      { productId: 'prod-1', productName: 'Beras Pandan Wangi 5kg', price: 78000, costPrice: 69000, quantity: 1, subtotal: 78000, unit: 'karung' },
      { productId: 'prod-2', productName: 'Minyak Goreng Sania 2L', price: 38500, costPrice: 34000, quantity: 1, subtotal: 38500, unit: 'pouch' },
    ],
    subtotal: 116500,
    discount: 0,
    total: 116500,
    paymentMethod: 'qris',
    paymentStatus: 'lunas',
    paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 15).toISOString(),
    paidAmount: 116500,
    remainingAmount: 0,
    cashAmount: 116500,
    changeAmount: 0,
    customerId: 'cust-1',
    customerName: 'Budi Santoso',
    customerPhone: '081298765432',
    pointsEarned: 11, // 116500 / 10000 = 11
    cashierName: 'Kasir Koperasi',
    notes: 'Pelanggan langganan',
  });

  transactions.push({
    id: 'trx-today-2',
    invoiceNumber: `TRX-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-002`,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 40).toISOString(),
    items: [
      { productId: 'prod-5', productName: 'Kopi Susu Gula Aren 250ml', price: 15000, costPrice: 9000, quantity: 2, subtotal: 30000, unit: 'botol' },
      { productId: 'prod-11', productName: 'Chitato Sapi Panggang 68g', price: 12500, costPrice: 9800, quantity: 1, subtotal: 12500, unit: 'bungkus' },
    ],
    subtotal: 42500,
    discount: 0,
    total: 42500,
    paymentMethod: 'tunai',
    paymentStatus: 'lunas',
    paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 40).toISOString(),
    paidAmount: 42500,
    remainingAmount: 0,
    cashAmount: 50000,
    changeAmount: 7500,
    customerId: 'cust-2',
    customerName: 'Siti Rahmawati',
    customerPhone: '085712345678',
    pointsEarned: 4, // 42500 / 10000 = 4
    cashierName: 'Kasir Koperasi',
  });

  transactions.push({
    id: 'trx-today-3',
    invoiceNumber: `TRX-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-003`,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 20).toISOString(),
    items: [
      { productId: 'prod-9', productName: 'Indomie Goreng Spesial', price: 3500, costPrice: 2800, quantity: 10, subtotal: 35000, unit: 'bungkus' },
      { productId: 'prod-4', productName: 'Telur Ayam Negeri 1kg', price: 29000, costPrice: 25000, quantity: 1, subtotal: 29000, unit: 'kg' },
    ],
    subtotal: 64000,
    discount: 0,
    total: 64000,
    paymentMethod: 'tunai',
    paymentStatus: 'lunas',
    cashAmount: 100000,
    changeAmount: 36000,
    customerId: 'cust-3',
    customerName: 'Ahmad Fauzi',
    customerPhone: '087844556677',
    pointsEarned: 6,
    cashierName: 'Kasir Koperasi',
  });

  // Historical transactions in the current month and previous 2 months
  const monthsBack = [0, 1, 2];
  let seq = 10;
  for (const m of monthsBack) {
    const daysInSample = m === 0 ? Math.min(now.getDate(), 15) : 8;
    for (let d = 1; d <= daysInSample; d += 2) {
      if (m === 0 && d >= now.getDate()) continue;
      const targetDate = new Date(now.getFullYear(), now.getMonth() - m, d, 10 + (d % 8), (d * 7) % 60);
      const isLarge = d % 3 === 0;
      const amount = isLarge ? 145000 : 54000;
      seq++;
      
      transactions.push({
        id: `trx-hist-${seq}`,
        invoiceNumber: `TRX-${targetDate.getFullYear()}${(targetDate.getMonth() + 1).toString().padStart(2, '0')}${targetDate.getDate().toString().padStart(2, '0')}-${seq}`,
        date: targetDate.toISOString(),
        items: [
          { productId: 'prod-1', productName: 'Beras Pandan Wangi 5kg', price: 78000, costPrice: 69000, quantity: isLarge ? 1 : 0, subtotal: isLarge ? 78000 : 0, unit: 'karung' },
          { productId: 'prod-2', productName: 'Minyak Goreng Sania 2L', price: 38500, costPrice: 34000, quantity: 1, subtotal: 38500, unit: 'pouch' },
          { productId: 'prod-6', productName: 'Teh Botol Sosro 450ml', price: 6500, costPrice: 4800, quantity: 2, subtotal: 13000, unit: 'botol' },
        ].filter(item => item.quantity > 0),
        subtotal: amount,
        discount: 0,
        total: amount,
        paymentMethod: d % 2 === 0 ? 'tunai' : 'qris',
        paymentStatus: 'lunas',
        cashAmount: amount,
        changeAmount: 0,
        customerId: d % 4 === 0 ? 'cust-4' : 'cust-1',
        customerName: d % 4 === 0 ? 'Dewi Lestari' : 'Budi Santoso',
        pointsEarned: Math.floor(amount / 10000),
        cashierName: 'Kasir Utama',
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw === null) {
      // First time initialization: initialize empty for real production use
      saveProducts([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw === null) {
      saveCustomers([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw === null) {
      saveTransactions([]);
      return [];
    }
    const parsed: Transaction[] = JSON.parse(raw);
    const normalized: Transaction[] = parsed.map((t) => ({
      ...t,
      paymentStatus: (t.paymentStatus || 'lunas') as 'lunas' | 'belum_bayar',
      remainingAmount: t.remainingAmount ?? (t.paymentStatus === 'belum_bayar' ? t.total : 0),
      paidAmount: t.paidAmount ?? (t.paymentStatus === 'belum_bayar' ? 0 : t.total),
    }));

    return normalized;
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function clearAllData(): void {
  saveProducts([]);
  saveCustomers([]);
  saveTransactions([]);
  saveExpenses([]);
}

export function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const updated: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      storeName: 'Koperasi Sabang Prima Meujaya',
      koperasiName: 'Koperasi Sabang Prima Meujaya',
      badanHukumNo: parsed.badanHukumNo || '284304420260810153821',
      address: parsed.address || 'V8V9+64F, Jl. Teuku Umar No. 10, Kuta Ateueh, Sukakarya, Kota Sabang, Aceh',
      receiptFooter: parsed.receiptFooter || 'Pelayanan Prima, Anggota Meujaya',
      cashierName: parsed.cashierName && parsed.cashierName !== 'Kasir Koperasi' ? parsed.cashierName : 'Nadia nabila',
      bendaharaName: 'Pengurus Koperasi',
    };
    saveSettings(updated);
    return updated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: StoreSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function generateSeedExpenses(): Expense[] {
  const now = new Date();
  return [
    {
      id: 'exp-1',
      expenseNumber: `EXP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}02-001`,
      date: new Date(now.getFullYear(), now.getMonth(), 2, 9, 30).toISOString(),
      category: 'belanja_stok',
      categoryLabel: 'Belanja Stok Barang',
      description: 'Kulakan Beras Pandan Wangi & Minyak Goreng dari Grosir Sabang',
      amount: 850000,
      paymentMethod: 'kas_tunai',
      recordedBy: 'Nadia nabila',
      receiptProof: 'NOTA-GS-8821',
      notes: 'Restock beras 10 karung dan minyak 2 karton',
    },
    {
      id: 'exp-2',
      expenseNumber: `EXP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}05-002`,
      date: new Date(now.getFullYear(), now.getMonth(), 5, 14, 15).toISOString(),
      category: 'operasional',
      categoryLabel: 'Operasional Toko',
      description: 'Beli Kertas Struk Thermal 58mm & Kantong Kresek Ramah Lingkungan',
      amount: 95000,
      paymentMethod: 'kas_tunai',
      recordedBy: 'Nadia nabila',
      receiptProof: 'STRUK-ATK-441',
    },
    {
      id: 'exp-3',
      expenseNumber: `EXP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}10-003`,
      date: new Date(now.getFullYear(), now.getMonth(), 10, 11, 0).toISOString(),
      category: 'operasional',
      categoryLabel: 'Operasional Toko',
      description: 'Pembayaran Token Listrik PLN Toko Koperasi',
      amount: 150000,
      paymentMethod: 'transfer_bank',
      recordedBy: 'Pengurus Koperasi',
      receiptProof: 'PLN-99882211',
    },
    {
      id: 'exp-4',
      expenseNumber: `EXP-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}15-004`,
      date: new Date(now.getFullYear(), now.getMonth(), 15, 16, 45).toISOString(),
      category: 'belanja_stok',
      categoryLabel: 'Belanja Stok Barang',
      description: 'Kulakan Air Mineral Aqua Botol 600ml & Kopi Sachet (3 Dus)',
      amount: 240000,
      paymentMethod: 'kas_tunai',
      recordedBy: 'Nadia nabila',
      receiptProof: 'NOTA-AGEN-120',
    },
  ];
}

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw === null) {
      saveExpenses([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

