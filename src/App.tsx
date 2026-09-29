import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  Product,
  Customer,
  Transaction,
  StoreSettings,
  CartItem,
  Expense,
} from './types';
import {
  loadProducts,
  saveProducts,
  loadCustomers,
  saveCustomers,
  loadTransactions,
  saveTransactions,
  loadExpenses,
  saveExpenses,
  loadSettings,
  saveSettings,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { PosView } from './components/pos/PosView';
import { UnpaidBillsView } from './components/unpaid/UnpaidBillsView';
import { InventoryView } from './components/inventory/InventoryView';
import { ExpenseView } from './components/expenses/ExpenseView';
import { CustomerView } from './components/customers/CustomerView';
import { DailyReportView } from './components/reports/DailyReportView';
import { MonthlyDashboardView } from './components/dashboard/MonthlyDashboardView';
import { HistoryView } from './components/history/HistoryView';
import { SettingsModal } from './components/settings/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(loadSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize data on mount - clean storage ready for real production use
  useEffect(() => {
    // Check if initial reset to clean state has been performed
    const hasBeenCleaned = localStorage.getItem('kasirku_cleaned_for_production_v2');
    if (!hasBeenCleaned) {
      saveProducts([]);
      saveCustomers([]);
      saveTransactions([]);
      saveExpenses([]);
      localStorage.setItem('kasirku_cleaned_for_production_v2', 'true');
    }

    setProducts(loadProducts());
    setCustomers(loadCustomers());
    setTransactions(loadTransactions());
    setExpenses(loadExpenses());
    setSettings(loadSettings());
    setIsLoaded(true);
  }, []);

  // Real-time low stock counter
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  }, [products]);

  // Cart total items count
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Real-time unpaid bills counter
  const unpaidCount = useMemo(() => {
    return transactions.filter((t) => t.paymentStatus === 'belum_bayar').length;
  }, [transactions]);

  // Handler to mark an unpaid transaction as fully paid
  const handleMarkAsPaid = (
    transactionId: string,
    paidMethod: any,
    notes?: string
  ) => {
    const updatedTransactions = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          paymentStatus: 'lunas' as const,
          paymentMethod: paidMethod,
          paidAt: new Date().toISOString(),
          remainingAmount: 0,
          paidAmount: t.total,
          notes: notes ? `${t.notes ? t.notes + ' | ' : ''}Dilunasi: ${notes}` : t.notes,
        };
      }
      return t;
    });

    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
  };

  // Handler for completed sale (real-time stock deduction + loyalty points)
  const handleCompleteSale = (
    newTransaction: Transaction,
    updatedCustomers: Customer[],
    updatedProducts: Product[]
  ) => {
    // 1. Update transactions
    const newTrxList = [newTransaction, ...transactions];
    setTransactions(newTrxList);
    saveTransactions(newTrxList);

    // 2. Update customers
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);

    // 3. Update products (real-time stock reduction)
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    saveProducts(newProducts);
  };

  const handleUpdateCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    saveCustomers(newCustomers);
  };

  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleAddExpense = (
    newExpense: Expense,
    restockData?: { productId: string; qty: number }
  ) => {
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    // If restock is linked, also update products stock automatically
    if (restockData && restockData.productId && restockData.qty > 0) {
      const updatedProducts = products.map((p) => {
        if (p.id === restockData.productId) {
          return { ...p, stock: p.stock + restockData.qty };
        }
        return p;
      });
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  const handleResetData = (
    newProducts: Product[],
    newCustomers: Customer[],
    newTransactions: Transaction[],
    newExpenses: Expense[] = []
  ) => {
    setProducts(newProducts);
    setCustomers(newCustomers);
    setTransactions(newTransactions);
    setExpenses(newExpenses);
    setCart([]);
  };

  const handleClearAll = () => {
    setProducts([]);
    setCustomers([]);
    setTransactions([]);
    setExpenses([]);
    setCart([]);
    saveProducts([]);
    saveCustomers([]);
    saveTransactions([]);
    saveExpenses([]);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wider">Memuat Aplikasi KasirKu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lowStockCount={lowStockCount}
        cartCount={cartCount}
        unpaidCount={unpaidCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'pos' && (
          <PosView
            products={products}
            customers={customers}
            settings={settings}
            onCompleteSale={handleCompleteSale}
            cart={cart}
            setCart={setCart}
          />
        )}

        {activeTab === 'unpaid' && (
          <UnpaidBillsView
            transactions={transactions}
            settings={settings}
            customers={customers}
            onMarkAsPaid={handleMarkAsPaid}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpenseView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            products={products}
            settings={settings}
            transactions={transactions}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerView
            customers={customers}
            onUpdateCustomers={handleUpdateCustomers}
          />
        )}

        {activeTab === 'daily_report' && (
          <DailyReportView
            transactions={transactions}
            settings={settings}
            customers={customers}
          />
        )}

        {activeTab === 'monthly_dashboard' && (
          <MonthlyDashboardView
            transactions={transactions}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={transactions}
            settings={settings}
            customers={customers}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetData={handleResetData}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
