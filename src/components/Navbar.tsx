import React from 'react';
import { ActiveTab, StoreSettings } from '../types';
import {
  ShoppingBag,
  Package,
  Users,
  MessageSquare,
  BarChart3,
  Receipt,
  Settings,
  AlertTriangle,
  Store,
  Clock,
  Wallet,
  Calendar,
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: StoreSettings;
  onOpenSettings: () => void;
  lowStockCount: number;
  cartCount: number;
  unpaidCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onOpenSettings,
  lowStockCount,
  cartCount,
  unpaidCount,
}) => {
  const tabs = [
    { id: 'pos' as ActiveTab, label: 'Kasir (POS)', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    {
      id: 'unpaid' as ActiveTab,
      label: 'Belum Bayar',
      icon: Clock,
      badge: unpaidCount > 0 ? unpaidCount : undefined,
      badgeColor: 'bg-amber-500 text-white font-bold',
    },
    { id: 'inventory' as ActiveTab, label: 'Stok Barang', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-amber-500 text-white' },
    { id: 'expenses' as ActiveTab, label: 'Pengeluaran', icon: Wallet },
    { id: 'daily_report' as ActiveTab, label: 'Laporan Harian', icon: Calendar },
    { id: 'monthly_dashboard' as ActiveTab, label: 'Laporan Bulanan', icon: BarChart3 },
    { id: 'customers' as ActiveTab, label: 'Pelanggan & Poin', icon: Users },
    { id: 'history' as ActiveTab, label: 'Riwayat & Kuitansi', icon: Receipt },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-inner">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">KoperasiKu</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/30">
                  POS KANTOR
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[180px] sm:max-w-xs">
                {settings.storeName || 'Koperasi Karyawan'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all relative ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        tab.badgeColor || 'bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Store Settings */}
          <div className="flex items-center gap-2">
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                title={`${lowStockCount} barang stok menipis!`}
                className="hidden sm:flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1.5 rounded-lg hover:bg-amber-900/60 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{lowStockCount} Menipis</span>
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Pengaturan Toko & Struk"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center overflow-x-auto py-2 gap-1 border-t border-slate-800 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
