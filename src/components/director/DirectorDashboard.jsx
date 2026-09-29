import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  BookOpen,
  DollarSign,
  CreditCard,
  Banknote,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShoppingBag,
  Users,
  Search,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate, getUnitLabel } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { debtService } from '../../services/debtService';
import { useToast } from '../ui/Toast';
import { ReceiptModal } from '../pos/ReceiptModal';

export function DirectorDashboard({ products = [], categories = [], onRefresh }) {
  const [orders, setOrders] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('ALL'); // 'TODAY', 'WEEK', 'ALL'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  const toast = useToast();

  const loadDirectorData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedDebts] = await Promise.all([
        orderService.getAllOrders(),
        debtService.getAllDebts(),
      ]);
      setOrders(fetchedOrders || []);
      setDebts(fetchedDebts || []);
    } catch (err) {
      console.error('Director data error:', err);
      toast.error("Direktor tahliliy ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectorData();
  }, []);

  const handleRefresh = async () => {
    await loadDirectorData();
    if (onRefresh) onRefresh();
    toast.success("Monitoring ma'lumotlari yangilandi", 2000);
  };

  // Period filtering
  const filteredOrders = useMemo(() => {
    if (selectedPeriod === 'ALL') return orders;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();
      if (selectedPeriod === 'TODAY') {
        return orderTime >= todayStart;
      }
      if (selectedPeriod === 'WEEK') {
        return orderTime >= weekStart;
      }
      return true;
    });
  }, [orders, selectedPeriod]);

  // Financial calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCash = 0;
    let totalCard = 0;
    let totalDebt = 0;
    let completedCount = 0;
    let returnedCount = 0;

    filteredOrders.forEach((o) => {
      if (o.status === 'RETURNED') {
        returnedCount++;
        return;
      }
      completedCount++;
      const tot = Number(o.total_amount) || 0;
      const c = Number(o.paid_cash) || 0;
      const card = Number(o.paid_card) || 0;
      const d = Number(o.paid_debt) || 0;

      totalRevenue += tot;
      totalCash += c;
      totalCard += card;
      totalDebt += d;
    });

    const averageCheck = completedCount > 0 ? totalRevenue / completedCount : 0;

    // Inventory valuation
    let totalInventoryValue = 0;
    let totalStockUnits = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      const stock = Number(p.stock_quantity) || 0;
      const price = Number(p.sell_price) || 0;
      totalStockUnits += stock;
      totalInventoryValue += stock * price;

      if (stock <= 0) outOfStockCount++;
      else if (stock < 5) lowStockCount++;
    });

    // Total outstanding debt
    let totalPendingDebt = 0;
    debts.forEach((debt) => {
      const amount = Number(debt.amount) || 0;
      const paid = Number(debt.paid_amount) || 0;
      const remaining = Math.max(0, amount - paid);
      totalPendingDebt += remaining;
    });

    return {
      totalRevenue,
      totalCash,
      totalCard,
      totalDebt,
      completedCount,
      returnedCount,
      averageCheck,
      totalInventoryValue,
      totalStockUnits,
      outOfStockCount,
      lowStockCount,
      totalPendingDebt,
    };
  }, [filteredOrders, products, debts]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => (Number(p.stock_quantity) || 0) < 5)
      .sort((a, b) => (Number(a.stock_quantity) || 0) - (Number(b.stock_quantity) || 0));
  }, [products]);

  // Category map
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Filtered products list for inventory monitoring
  const filteredProductsList = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 15);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Direktor Kabineti
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Jonli Monitoring
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Magazin Umumiy Boshqaruv va Tahlil
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Sotuvlar, kassa tushumi, ombordagi tovarlar qiymati va barcha nasiya qarzdorliklarini real vaqtda toʻliq nazorat qiling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Period buttons */}
          <div className="bg-slate-800/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 flex items-center">
            <button
              onClick={() => setSelectedPeriod('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'TODAY'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Bugun
            </button>
            <button
              onClick={() => setSelectedPeriod('WEEK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'WEEK'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Haftalik
            </button>
            <button
              onClick={() => setSelectedPeriod('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Barchasi
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {selectedPeriod === 'TODAY' ? 'Bugungi Tushum' : selectedPeriod === 'WEEK' ? 'Haftalik Tushum' : 'Jami Tushum'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px]">
              <div>
                <span className="text-slate-400 block font-medium">Naqd</span>
                <span className="font-bold text-slate-700">{formatCurrency(stats.totalCash)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Karta</span>
                <span className="font-bold text-indigo-600">{formatCurrency(stats.totalCard)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nasiya</span>
                <span className="font-bold text-amber-600">{formatCurrency(stats.totalDebt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Total Value */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ombor (Sklad) Qiymati
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.totalInventoryValue)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Jami mahsulotlar: <strong className="text-slate-800">{products.length} tur</strong></span>
              <span>Qoldiq: <strong className="text-slate-800">{stats.totalStockUnits} dona</strong></span>
            </div>
          </div>
        </div>

        {/* Outstanding Receivables (Debts) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Nasiya Qarzdorliklari
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {formatCurrency(stats.totalPendingDebt)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mijozlar qarzi: <strong className="text-slate-800">{debts.length} ta yozuv</strong></span>
              <span className="text-amber-600 font-semibold">Qaytarilishi kerak</span>
            </div>
          </div>
        </div>

        {/* Checks & AOV */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cheklar va Oʻrtacha Chek
            </span>
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.completedCount} <span className="text-sm font-semibold text-slate-500">ta chek</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Oʻrtacha chek:</span>
              <strong className="text-indigo-600 text-sm font-bold">{formatCurrency(stats.averageCheck)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Omborda Kam Qolgan Mahsulotlar ({lowStockProducts.length})
                </h3>
                <p className="text-xs text-amber-700">
                  Ushbu tovarlar tugash arafasida yoki tugagan. Zudlik bilan yangi partiya buyurtma qilish tavsiya etiladi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {lowStockProducts.slice(0, 6).map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-2xl p-3 border border-amber-200 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {categoryMap[prod.category] || 'Umumiy'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1 block">
                    {prod.name}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Qoldiq:</span>
                  <span
                    className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                      Number(prod.stock_quantity) <= 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {prod.stock_quantity} {getUnitLabel(prod.unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns: Recent Sales Feed & Live Inventory Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Orders & Cashier Feed */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Soʻnggi Sotuvlar va Kassirlar Monitoringi
                </h3>
                <span className="text-xs text-slate-400">
                  Magazinda amalga oshirilgan oxirgi kassa cheklari
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Jami: {filteredOrders.length} ta
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Tanlangan davrda cheklar yoʻq</p>
              </div>
            ) : (
              filteredOrders.slice(0, 15).map((order) => {
                const isReturned = order.status === 'RETURNED';
                return (
                  <div
                    key={order.id}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isReturned
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        #{order.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Chek #{order.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isReturned
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isReturned ? 'QAYTARILGAN' : 'MUVAFFAQIYATLI'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(order.created_at)}</span>
                          {order.device_id && (
                            <span className="text-indigo-500 font-mono text-[10px]">
                              • Kassa: {order.device_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <div className="flex items-center gap-1.5 justify-end text-[10px] text-slate-500 font-medium">
                          {Number(order.paid_cash) > 0 && <span>Naqd</span>}
                          {Number(order.paid_card) > 0 && <span>Karta</span>}
                          {Number(order.paid_debt) > 0 && (
                            <span className="text-amber-600 font-bold">Nasiya</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        title="Chekni koʻrish"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Sklad & Inventory Monitoring (Read-Only) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sklad Nazorati</h3>
                <span className="text-xs text-slate-400">Tovarlar qoldigʻi va narxlari</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Mahsulot yoki shtrix-kod qidirish..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {filteredProductsList.map((prod) => {
              const stock = Number(prod.stock_quantity) || 0;
              const isLow = stock < 5;
              const isOut = stock <= 0;

              return (
                <div key={prod.id} className="py-2.5 flex items-center justify-between">
                  <div className="pr-2 min-w-0">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {prod.name}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-600 block">
                      {formatCurrency(prod.sell_price)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        isOut
                          ? 'bg-rose-100 text-rose-700'
                          : isLow
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {stock} {getUnitLabel(prod.unit)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Receipt Modal for Director Preview */}
      {selectedReceiptOrder && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
          items={[]}
        />
      )}
    </div>
  );
}
