import React, { useState, useMemo } from 'react';
import { Product, CartItem, Customer, StoreSettings, PaymentMethod, Transaction } from '../../types';
import { formatRupiah } from '../../utils/storage';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { ExternalOrderModal } from './ExternalOrderModal';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserCheck,
  UserPlus,
  Sparkles,
  ArrowRight,
  PackageX,
  CreditCard,
  X,
  Phone,
  User,
  CheckCircle2,
  FileText,
  Building,
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  onCompleteSale: (transaction: Transaction, updatedCustomers: Customer[], updatedProducts: Product[]) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  settings,
  onCompleteSale,
  cart,
  setCart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [customerInput, setCustomerInput] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [customerMode, setCustomerMode] = useState<'search' | 'manual'>('search');
  const [discountInput, setDiscountInput] = useState<number>(0);

  // Office External Order state (Pesanan Rapat dari Luar / Kuitansi Koperasi)
  const [isExternalOrderOpen, setIsExternalOrderOpen] = useState(false);
  const [orderMetadata, setOrderMetadata] = useState<{
    department: string;
    picName: string;
    purpose: string;
  } | null>(null);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['Semua', ...list];
  }, [products]);

  // Filter products by category & search term
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Filtered customer search for the POS cart section
  const searchedCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) {
      return customers;
    }
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const total = Math.max(0, subtotal - discountInput);

  // Points calculation: min 10rb = 1 poin (e.g. Rp 35.000 = 3 poin)
  const rate = settings.pointsRuleRate || 10000;
  const pointsEarned = Math.floor(total / rate);
  const remainingForNextPoint = total > 0 ? rate - (total % rate) : rate;

  // Add to cart helper with stock check
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok ${product.name} tersisa ${product.stock} ${product.unit}. Tidak dapat menambah lebih banyak.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Jumlah melebihi stok yang tersedia (${item.product.stock} ${item.product.unit})`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan semua barang dari keranjang kasir?')) {
      setCart([]);
      setDiscountInput(0);
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerInput(cust.name);
    setCustomerPhone(cust.phone || '');
    setCustomerSearchQuery('');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerInput('');
    setCustomerPhone('');
    setCustomerSearchQuery('');
    setCustomerMode('search');
  };

  const handleAddExternalOrder = (
    item: CartItem,
    meta: { department: string; picName: string; purpose: string }
  ) => {
    setCart((prev) => [...prev, item]);
    setOrderMetadata(meta);
    if (!customerInput && meta.picName) {
      setCustomerInput(meta.picName);
    }
  };

  // Payment confirmation & real-time stock reduction
  const handleConfirmPayment = (
    paymentMethod: PaymentMethod,
    cashAmount: number,
    changeAmount: number,
    paymentStatus: 'lunas' | 'belum_bayar' = 'lunas',
    unpaidDetails?: {
      dueDate?: string;
      dpAmount?: number;
      notes?: string;
    }
  ) => {
    const now = new Date();
    const hasExternalOrder = cart.some((c) => c.isExternalOrder || c.product.isExternalOrder);
    
    // Calculate total Koperasi profit
    const totalKoperasiProfit = cart.reduce((sum, c) => {
      if (c.koperasiProfit !== undefined) return sum + c.koperasiProfit;
      const profitPerUnit = c.product.price - (c.costPrice || c.product.costPrice || 0);
      return sum + profitPerUnit * c.quantity;
    }, 0);

    const prefix = hasExternalOrder ? 'KUI' : 'TRX';
    const invoiceNumber = `${prefix}-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const isUnpaid = paymentStatus === 'belum_bayar';
    const dp = unpaidDetails?.dpAmount || 0;
    const remainingAmount = isUnpaid ? Math.max(0, total - dp) : 0;

    // Prepare transaction object
    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber,
      date: now.toISOString(),
      items: cart.map((c) => ({
        productId: c.product.id,
        productName: c.product.name,
        price: c.product.price,
        costPrice: c.costPrice || c.product.costPrice,
        quantity: c.quantity,
        subtotal: c.subtotal,
        unit: c.product.unit,
        isExternalOrder: c.isExternalOrder || c.product.isExternalOrder,
        markupPercent: c.markupPercent,
        koperasiProfit: c.koperasiProfit,
        notes: c.notes,
      })),
      subtotal,
      discount: discountInput,
      total,
      totalKoperasiProfit,
      paymentMethod,
      paymentStatus,
      paidAt: isUnpaid ? undefined : now.toISOString(),
      dueDate: unpaidDetails?.dueDate,
      paidAmount: isUnpaid ? dp : total,
      remainingAmount,
      cashAmount,
      changeAmount,
      customerId: selectedCustomer?.id,
      customerName: customerInput.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerDepartment: orderMetadata?.department || (selectedCustomer as any)?.department,
      officialPurpose: orderMetadata?.purpose,
      transactionType: hasExternalOrder ? 'pesanan_kantor' : 'reguler',
      pointsEarned: isUnpaid ? 0 : pointsEarned,
      cashierName: settings.cashierName || 'Kasir Koperasi',
      notes: unpaidDetails?.notes || orderMetadata?.purpose,
    };

    // 1. Deduct stock in real-time (ONLY for physical inventory items, not external orders)
    const updatedProducts = products.map((prod) => {
      const cartMatch = cart.find(
        (c) => c.product.id === prod.id && !c.isExternalOrder && !c.product.isExternalOrder
      );
      if (cartMatch) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartMatch.quantity),
        };
      }
      return prod;
    });

    // 2. Update or register customer with earned loyalty points
    let updatedCustomers = [...customers];
    const effectiveCustomerName = customerInput.trim();

    if (effectiveCustomerName) {
      if (selectedCustomer) {
        // Existing customer
        updatedCustomers = updatedCustomers.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                points: c.points + pointsEarned,
                totalSpent: c.totalSpent + total,
                transactionCount: c.transactionCount + 1,
                phone: customerPhone.trim() || c.phone,
              }
            : c
        );
      } else {
        // Check if customer name already exists in customer database
        const existingByName = customers.find(
          (c) => c.name.toLowerCase() === effectiveCustomerName.toLowerCase()
        );
        if (existingByName) {
          updatedCustomers = updatedCustomers.map((c) =>
            c.id === existingByName.id
              ? {
                  ...c,
                  points: c.points + pointsEarned,
                  totalSpent: c.totalSpent + total,
                  transactionCount: c.transactionCount + 1,
                  phone: customerPhone.trim() || c.phone,
                }
            : c
          );
          newTransaction.customerId = existingByName.id;
        } else {
          // Register brand new customer
          const newCust: Customer = {
            id: `cust-${Date.now()}`,
            name: effectiveCustomerName,
            phone: customerPhone.trim(),
            points: pointsEarned,
            totalSpent: total,
            transactionCount: 1,
            createdAt: now.toISOString(),
          };
          updatedCustomers.push(newCust);
          newTransaction.customerId = newCust.id;
        }
      }
    }

    // Call state update handler
    onCompleteSale(newTransaction, updatedCustomers, updatedProducts);

    // Close payment modal and open receipt modal
    setIsPaymentOpen(false);
    setCompletedTransaction(newTransaction);
    setIsReceiptOpen(true);

    // Reset cart
    setCart([]);
    setDiscountInput(0);
    setSelectedCustomer(null);
    setCustomerInput('');
    setCustomerPhone('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Catalog (7 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari nama produk, SKU, atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Categories Segmented Control */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Special Feature: Office External Order (Pesanan Rapat dari Luar / Kuitansi Koperasi) */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-800/60">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-white">
                    Pesanan Luar & Kuitansi Kantor
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Custom Margin Untung
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 max-w-xl">
                  Beli kue/konsumsi rapat dari luar tanpa kuitansi? Buatkan kuitansi resmi koperasi berstempel sah dan tentukan margin keuntungan koperasi secara bebas/kustom.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExternalOrderOpen(true)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Pesanan Kantor</span>
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((c) => c.product.id === product.id);
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`group relative bg-white rounded-2xl border transition-all duration-150 p-3.5 flex flex-col justify-between text-left select-none ${
                    isOutOfStock
                      ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {/* Top: Category & Emoji Icon */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl" role="img" aria-label={product.name}>
                        {product.imageEmoji || '📦'}
                      </span>
                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="text-[11px] font-bold text-red-600">Habis</span>
                        ) : isLowStock ? (
                          <span className="text-[11px] font-bold text-amber-600">
                            Sisa {product.stock} {product.unit}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500">
                            Stok {product.stock} {product.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{product.sku}</p>
                  </div>

                  {/* Bottom: Price & Add Badge */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {formatRupiah(product.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/{product.unit}</span>
                    </div>

                    {inCartItem ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                        {inCartItem.quantity}
                      </span>
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <PackageX className="w-7 h-7" />
                </div>
                {products.length === 0 ? (
                  <>
                    <h3 className="text-base font-bold text-slate-800">Katalog Barang Masih Kosong</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Aplikasi siap dipakai! Anda dapat menambahkan barang dagangan di menu <strong>Stok Barang</strong>, atau langsung membuat transaksi pesanan kantor lewat tombol di atas.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-slate-800">Produk Tidak Ditemukan</h3>
                    <p className="text-xs text-slate-400">Coba kata kunci pencarian atau kategori lain</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart, Customer & Point Calculation (5 cols on lg) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-16 flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden">
            {/* Cart Header */}
            <div className="shrink-0 p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Keranjang Kasir</h3>
                <span className="text-xs text-slate-500 font-medium">({cart.length} item)</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              )}
            </div>

            {/* Customer & Points Section */}
            <div className="shrink-0 p-3 bg-slate-50/80 border-b border-slate-200/80 space-y-2">
              {/* Header & Mode Switcher */}
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Data Pelanggan</span>
                </label>

                {!selectedCustomer && (
                  <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('search')}
                      className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                        customerMode === 'search'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      <span>Cari Pelanggan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('manual')}
                      className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                        customerMode === 'manual'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Input Baru</span>
                    </button>
                  </div>
                )}
              </div>

              {/* State 1: A customer IS selected */}
              {selectedCustomer ? (
                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                          <span>{selectedCustomer.name}</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                            Member
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{selectedCustomer.phone || 'Tanpa No. WhatsApp'}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="text-[11px] text-slate-400 hover:text-red-600 font-medium underline transition-colors"
                      title="Ganti / Cari Pelanggan Lain"
                    >
                      Ganti
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-800">Saldo Poin Saat Ini:</span>
                    <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      ★ {selectedCustomer.points} Poin
                    </span>
                  </div>
                </div>
              ) : customerMode === 'search' ? (
                /* State 2: Cari Data Pelanggan Search Box */
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari nama atau No. WhatsApp pelanggan..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                      autoFocus={customerMode === 'search'}
                    />
                    {customerSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Customer search results list */}
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                    {searchedCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-1.5 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-400 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{cust.phone || 'Tanpa no. WA'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            {cust.points}p
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 group-hover:underline">
                            Pilih
                          </span>
                        </div>
                      </div>
                    ))}

                    {searchedCustomers.length === 0 && customerSearchQuery.trim() !== '' && (
                      <div className="p-2.5 bg-slate-100 rounded-lg text-center space-y-1.5">
                        <p className="text-[11px] text-slate-500">
                          Tidak ditemukan pelanggan &quot;{customerSearchQuery}&quot;
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerInput(customerSearchQuery);
                            setCustomerMode('manual');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                        >
                          + Tambah &quot;{customerSearchQuery}&quot; sebagai Pelanggan Baru
                        </button>
                      </div>
                    )}

                    {customers.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        Belum ada data pelanggan terdaftar.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* State 3: Input Pelanggan Baru Manual */
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Nama Pelanggan Baru (cth: Hendra)"
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />

                  <input
                    type="text"
                    placeholder="No. WhatsApp Pelanggan (opsional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-slate-400">
                      Otomatis tersimpan & dapat poin saat checkout
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('search')}
                      className="text-[10px] text-emerald-600 hover:underline font-medium"
                    >
                      ← Cari Pelanggan Lama
                    </button>
                  </div>
                </div>
              )}

              {/* Real-time Loyalty Point Calculation Banner */}
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-200 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      +{pointsEarned} Poin Loyalitas
                    </span>
                    <span className="text-[10px] text-emerald-300">
                      {selectedCustomer
                        ? `Saldo nanti: ${selectedCustomer.points + pointsEarned} Poin`
                        : 'Aturan: Min. Rp 10.000 = 1 Poin'}
                    </span>
                  </div>
                </div>
                {total > 0 && remainingForNextPoint < 10000 && remainingForNextPoint > 0 && (
                  <span className="text-[10px] text-emerald-300 text-right">
                    +{formatRupiah(remainingForNextPoint)} lagi
                    <br />
                    utk 1 poin baru
                  </span>
                )}
              </div>
            </div>

            {/* Cart Items Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-[100px]">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-50/70 rounded-xl border border-slate-100"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-800 truncate">
                      {item.product.name}
                    </h5>
                    {item.isExternalOrder && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          <span>Pesanan Luar (+{formatRupiah(item.koperasiProfit || 0)} Laba Koperasi)</span>
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{formatRupiah(item.product.price)}</span>
                      <span>·</span>
                      <span className="font-bold text-slate-800">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product.id, 1)}
                      disabled={!item.isExternalOrder && item.quantity >= item.product.stock}
                      className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                        !item.isExternalOrder && item.quantity >= item.product.stock
                          ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-8 text-center">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-500">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400">Pilih produk di katalog sebelah kiri</p>
                </div>
              )}
            </div>

            {/* Cart Footer: Subtotal, Discount & Checkout (Pinned Shrink-0, Never Cut Off) */}
            <div className="shrink-0 p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
              {cart.some((c) => c.isExternalOrder) && (
                <div className="p-2 bg-emerald-100/80 rounded-lg text-[11px] text-emerald-900 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Termasuk Pesanan Kantor</span>
                  </span>
                  <span className="font-bold text-emerald-800">Kuitansi Resmi Tersedia</span>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Diskon (Rp)</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discountInput || ''}
                    onChange={(e) => setDiscountInput(Math.min(subtotal, Math.max(0, parseInt(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-24 text-right px-2 py-0.5 text-xs border border-slate-300 rounded bg-white font-medium"
                  />
                </div>

                <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900 uppercase">Total Akhir</span>
                  <span className="text-lg font-black text-emerald-600">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Checkout Button: KLIK BAYAR */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setIsPaymentOpen(true)}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all ${
                  cart.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] ring-2 ring-emerald-500/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>
                  {cart.length === 0
                    ? 'PILIH PRODUK UNTUK BAYAR'
                    : cart.some((c) => c.isExternalOrder)
                    ? `KLIK BAYAR & CETAK STRUK (${formatRupiah(total)})`
                    : `KLIK BAYAR SEKARANG (${formatRupiah(total)})`}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        discount={discountInput}
        total={total}
        customerName={customerInput}
        selectedCustomer={selectedCustomer}
        pointsEarned={pointsEarned}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* External Office Order Modal */}
      <ExternalOrderModal
        isOpen={isExternalOrderOpen}
        onClose={() => setIsExternalOrderOpen(false)}
        settings={settings}
        onAddToCart={handleAddExternalOrder}
      />

      {/* Receipt Modal (Specifically supports JPG receipt & Kuitansi download) */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={completedTransaction}
        settings={settings}
        customer={selectedCustomer}
        onNewTransaction={() => {
          setIsReceiptOpen(false);
          setCompletedTransaction(null);
          setOrderMetadata(null);
        }}
      />

      {/* Floating Bottom Bar (Khusus Layar HP / Tablet atau saat scroll agar tombol KLIK BAYAR selalu muncul) */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 lg:hidden z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="min-w-0">
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{cart.length} Produk di Keranjang</span>
            </div>
            <div className="text-sm font-black text-white font-mono">
              {formatRupiah(total)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-transform shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            <span>KLIK BAYAR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
