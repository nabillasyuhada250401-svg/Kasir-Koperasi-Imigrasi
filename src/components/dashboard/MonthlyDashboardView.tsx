import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { formatRupiah } from '../../utils/storage';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  ShoppingBag,
  Receipt,
  Users,
  Award,
} from 'lucide-react';

interface MonthlyDashboardViewProps {
  transactions: Transaction[];
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MonthlyDashboardView: React.FC<MonthlyDashboardViewProps> = ({
  transactions,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth()); // 0-indexed

  // Available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentDate.getFullYear());
    transactions.forEach((t) => {
      years.add(new Date(t.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentDate]);

  // Current selected month transactions
  const currentMonthTrx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Previous month transactions for comparative % growth
  const previousMonthTrx = useMemo(() => {
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Metrics for selected month
  const totalRevenue = useMemo(() => {
    return currentMonthTrx.reduce((sum, t) => sum + t.total, 0);
  }, [currentMonthTrx]);

  const prevTotalRevenue = useMemo(() => {
    return previousMonthTrx.reduce((sum, t) => sum + t.total, 0);
  }, [previousMonthTrx]);

  const revenueGrowthPercent = useMemo(() => {
    if (prevTotalRevenue === 0) return totalRevenue > 0 ? 100 : 0;
    return Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100);
  }, [totalRevenue, prevTotalRevenue]);

  const totalTransactions = currentMonthTrx.length;
  const averageBasket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  let totalItemsSold = 0;
  let totalGrossProfit = 0;
  const uniqueCustomers = new Set<string>();
  const productSalesMap = new Map<string, { name: string; quantity: number; subtotal: number; unit: string }>();
  const paymentBreakdown = { tunai: 0, qris: 0, transfer: 0, debit: 0 };

  currentMonthTrx.forEach((t) => {
    if (t.customerName) uniqueCustomers.add(t.customerName);
    if (t.paymentMethod in paymentBreakdown) {
      paymentBreakdown[t.paymentMethod] += t.total;
    }

    t.items.forEach((item) => {
      totalItemsSold += item.quantity;
      const profitPerItem = item.koperasiProfit !== undefined
        ? item.koperasiProfit
        : (item.price - (item.costPrice || item.price * 0.8)) * item.quantity;
      totalGrossProfit += profitPerItem;

      const cur = productSalesMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        subtotal: 0,
        unit: item.unit || 'pcs',
      };
      cur.quantity += item.quantity;
      cur.subtotal += item.subtotal;
      productSalesMap.set(item.productId, cur);
    });
  });

  const topProductsOfMonth = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Daily revenue breakdown for the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyData = useMemo(() => {
    const days: { day: number; revenue: number; count: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, revenue: 0, count: 0 });
    }

    currentMonthTrx.forEach((t) => {
      const dayNum = new Date(t.date).getDate();
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        days[dayNum - 1].revenue += t.total;
        days[dayNum - 1].count += 1;
      }
    });

    return days;
  }, [currentMonthTrx, daysInMonth]);

  const maxDailyRevenue = Math.max(...dailyData.map((d) => d.revenue), 100000);

  // 12-Month Annual Revenue Trend for Selected Year
  const annualMonthlyData = useMemo(() => {
    const months = MONTH_NAMES.map((name, index) => ({
      monthIndex: index,
      name,
      shortName: name.slice(0, 3),
      revenue: 0,
      count: 0,
    }));

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        months[m].revenue += t.total;
        months[m].count += 1;
      }
    });

    return months;
  }, [transactions, selectedYear]);

  const maxMonthlyRevenue = Math.max(...annualMonthlyData.map((m) => m.revenue), 100000);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Year/Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dashboard Ringkas Pendapatan Bulanan</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikhtisar performa penjualan, tren pendapatan tahunan, dan produk terlaris setiap bulannya.
          </p>
        </div>

        {/* Year & Month Picker */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Pendapatan</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatRupiah(totalRevenue)}</div>
          
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            {revenueGrowthPercent >= 0 ? (
              <span className="inline-flex items-center text-emerald-700 font-bold text-[11px]">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{revenueGrowthPercent}%
              </span>
            ) : (
              <span className="inline-flex items-center text-red-600 font-bold text-[11px]">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {revenueGrowthPercent}%
              </span>
            )}
            <span className="text-slate-400 text-[10px]">vs bulan sebelumnya</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Transaksi</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTransactions} Struk</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Rata-rata: {formatRupiah(averageBasket)}/transaksi
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
            <span>Laba Koperasi (SHU)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatRupiah(totalGrossProfit)}</div>
          <span className="text-[11px] text-emerald-800 mt-1 block">
            {totalRevenue > 0 ? `${Math.round((totalGrossProfit / totalRevenue) * 100)}% Margin keuntungan koperasi` : '0%'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Volume Terjual</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalItemsSold} Pcs</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Dari {uniqueCustomers.size} pelanggan unik
          </span>
        </div>
      </div>

      {/* Chart 1: Daily Revenue Distribution in Selected Month */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Grafik Pendapatan Harian - {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">Omset per tanggal dari tanggal 1 sampai {daysInMonth}</p>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            Puncak: {formatRupiah(Math.max(...dailyData.map((d) => d.revenue)))}
          </span>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4">
          <div className="h-44 flex items-end gap-1 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {dailyData.map((d) => {
              const heightPct = Math.max(4, Math.round((d.revenue / maxDailyRevenue) * 100));
              const hasSales = d.revenue > 0;
              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center group relative min-w-[14px]"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    Tgl {d.day}: {formatRupiah(d.revenue)} ({d.count} trx)
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      hasSales
                        ? 'bg-emerald-500 group-hover:bg-emerald-600'
                        : 'bg-slate-100'
                    }`}
                  />
                  <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 select-none font-mono">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 2: 12-Month Annual Trend & Payment Method Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Annual Monthly Trend (12 Months) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Tren Pendapatan 12 Bulan ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500">Perbandingan omset bulanan sepanjang tahun {selectedYear}</p>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              Total Tahun {selectedYear}: {formatRupiah(annualMonthlyData.reduce((s, m) => s + m.revenue, 0))}
            </span>
          </div>

          <div className="h-44 flex items-end gap-2 sm:gap-3 border-b border-slate-200 pb-2">
            {annualMonthlyData.map((m) => {
              const heightPct = Math.max(4, Math.round((m.revenue / maxMonthlyRevenue) * 100));
              const isCurrent = m.monthIndex === selectedMonth;
              return (
                <div
                  key={m.monthIndex}
                  onClick={() => setSelectedMonth(m.monthIndex)}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                    {m.name}: {formatRupiah(m.revenue)}
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 shadow-xs ring-2 ring-emerald-400'
                        : m.revenue > 0
                        ? 'bg-slate-300 group-hover:bg-emerald-400'
                        : 'bg-slate-100'
                    }`}
                  />
                  <span
                    className={`text-[10px] sm:text-xs mt-1.5 font-bold transition-colors ${
                      isCurrent ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {m.shortName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Composition & Top Products in Month */}
        <div className="lg:col-span-4 space-y-6">
          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Metode Pembayaran ({MONTH_NAMES[selectedMonth]})</h3>
            
            <div className="space-y-2">
              {[
                { label: 'Tunai', value: paymentBreakdown.tunai, color: 'bg-emerald-500' },
                { label: 'QRIS', value: paymentBreakdown.qris, color: 'bg-blue-500' },
                { label: 'Transfer', value: paymentBreakdown.transfer, color: 'bg-indigo-500' },
                { label: 'Debit', value: paymentBreakdown.debit, color: 'bg-purple-500' },
              ].map((pm) => {
                const pct = totalRevenue > 0 ? Math.round((pm.value / totalRevenue) * 100) : 0;
                return (
                  <div key={pm.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{pm.label}</span>
                      <span className="font-bold text-slate-900">
                        {formatRupiah(pm.value)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full ${pm.color} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Products of the Month */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Top 5 Produk Terlaris Bulan Ini</h3>
            
            <div className="space-y-2">
              {topProductsOfMonth.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-slate-400 font-bold">{idx + 1}.</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700">{p.quantity} {p.unit}</span>
                    <span className="text-[10px] text-slate-400 block">{formatRupiah(p.subtotal)}</span>
                  </div>
                </div>
              ))}

              {topProductsOfMonth.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada penjualan di bulan ini.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
