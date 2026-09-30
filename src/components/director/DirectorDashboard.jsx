import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
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
  Eye,
  Printer,
  BarChart3,
  Layers,
  Award,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Video,
  Lock,
  ShoppingCart,
} from 'lucide-react';
import { formatCurrency, formatDate, getUnitLabel } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { debtService } from '../../services/debtService';
import { useToast } from '../ui/Toast';
import { ReceiptModal } from '../pos/ReceiptModal';
import { DirectorLockScreen } from './DirectorLockScreen';
import { DirectorCameraSystem } from './DirectorCameraSystem';
import { DirectorProcurementAnalytics } from './DirectorProcurementAnalytics';
import { DirectorShiftHistory } from './DirectorShiftHistory';
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_ORDERS,
  DEMO_ORDER_ITEMS,
  DEMO_DEBTS,
} from '../../data/demoStoreData';

export function DirectorDashboard({ products = [], categories = [], onRefresh }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('director_authorized') === 'true';
  });
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('ALL'); // 'TODAY', 'WEEK', 'MONTH', 'ALL'
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'categories', 'products', 'cashiers', 'debts'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  // Default to Demo mode so dashboard is immediately rich and interactive
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('director_demo_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const toast = useToast();

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    localStorage.setItem('director_demo_mode', String(nextVal));
    if (nextVal) {
      toast.info("✨ Demo / Test ma'lumotlar rejimi yoqildi (20+ tovarlar, buyurtmalar va tahlil)");
    } else {
      toast.info("Asosiy real baza rejimiga o'tildi");
    }
  };

  const loadDirectorData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedItems, fetchedDebts] = await Promise.all([
        orderService.getAllOrders(),
        orderService.getAllOrderItems(),
        debtService.getAllDebts(),
      ]);
      setOrders(fetchedOrders || []);
      setOrderItems(fetchedItems || []);
      setDebts(fetchedDebts || []);
    } catch (err) {
      console.error('Director data error:', err);
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

  // Determine whether to use demo data (if demo mode is on OR if backend returns empty data)
  const effectiveProducts = useMemo(() => {
    if (isDemoMode || products.length === 0) return DEMO_PRODUCTS;
    return products;
  }, [isDemoMode, products]);

  const effectiveCategories = useMemo(() => {
    if (isDemoMode || categories.length === 0) return DEMO_CATEGORIES;
    return categories;
  }, [isDemoMode, categories]);

  const effectiveOrders = useMemo(() => {
    if (isDemoMode || orders.length === 0) return DEMO_ORDERS;
    return orders;
  }, [isDemoMode, orders]);

  const effectiveOrderItems = useMemo(() => {
    if (isDemoMode || orderItems.length === 0) return DEMO_ORDER_ITEMS;
    return orderItems;
  }, [isDemoMode, orderItems]);

  const effectiveDebts = useMemo(() => {
    if (isDemoMode || debts.length === 0) return DEMO_DEBTS;
    return debts;
  }, [isDemoMode, debts]);

  // Product and Category Maps for instant lookup
  const productMap = useMemo(() => {
    const map = {};
    effectiveProducts.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [effectiveProducts]);

  const categoryMap = useMemo(() => {
    const map = {};
    effectiveCategories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [effectiveCategories]);

  // Period filtering
  const filteredOrders = useMemo(() => {
    if (selectedPeriod === 'ALL') return effectiveOrders;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return effectiveOrders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();
      if (selectedPeriod === 'TODAY') return orderTime >= todayStart;
      if (selectedPeriod === 'WEEK') return orderTime >= weekStart;
      if (selectedPeriod === 'MONTH') return orderTime >= monthStart;
      return true;
    });
  }, [effectiveOrders, selectedPeriod]);

  const filteredOrderIds = useMemo(() => {
    return new Set(filteredOrders.map((o) => o.id));
  }, [filteredOrders]);

  const filteredItems = useMemo(() => {
    return effectiveOrderItems.filter((item) => filteredOrderIds.has(item.order));
  }, [effectiveOrderItems, filteredOrderIds]);

  // Comprehensive Financial & Business Metrics
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
      totalRevenue += Number(o.total_amount) || 0;
      totalCash += Number(o.paid_cash) || 0;
      totalCard += Number(o.paid_card) || 0;
      totalDebt += Number(o.paid_debt) || 0;
    });

    const averageCheck = completedCount > 0 ? totalRevenue / completedCount : 0;

    // Inventory Valuation
    let totalInventoryRetail = 0;
    let totalInventoryCost = 0;
    let totalStockUnits = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;

    effectiveProducts.forEach((p) => {
      const stock = Number(p.stock_quantity) || 0;
      const sell = Number(p.sell_price) || 0;
      const cost = Number(p.cost_price) || 0;

      totalStockUnits += stock;
      totalInventoryRetail += stock * sell;
      totalInventoryCost += stock * cost;

      if (stock <= 0) outOfStockCount++;
      else if (stock < 5) lowStockCount++;
    });

    // Estimated Profit Calculation from sold items
    let estimatedCOGS = 0; // Cost of Goods Sold
    filteredItems.forEach((item) => {
      const p = productMap[item.product];
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.cost_price || p?.cost_price) || 0;
      estimatedCOGS += qty * cost;
    });

    // If order items exist use item COGS, else estimate standard 22% margin
    const estimatedProfit = estimatedCOGS > 0
      ? Math.max(0, totalRevenue - estimatedCOGS)
      : totalRevenue * 0.22;
    const profitMargin = totalRevenue > 0 ? Math.round((estimatedProfit / totalRevenue) * 100) : 0;

    // Total outstanding debt
    let totalGivenDebt = 0;
    let totalPaidDebt = 0;
    effectiveDebts.forEach((debt) => {
      totalGivenDebt += Number(debt.amount) || 0;
      totalPaidDebt += Number(debt.paid_amount) || 0;
    });
    const totalPendingDebt = Math.max(0, totalGivenDebt - totalPaidDebt);

    return {
      totalRevenue,
      totalCash,
      totalCard,
      totalDebt,
      completedCount,
      returnedCount,
      averageCheck,
      totalInventoryRetail,
      totalInventoryCost,
      totalStockUnits,
      outOfStockCount,
      lowStockCount,
      estimatedProfit,
      profitMargin,
      totalPendingDebt,
      totalGivenDebt,
      totalPaidDebt,
    };
  }, [filteredOrders, filteredItems, effectiveProducts, effectiveDebts, productMap]);

  // 1. CATEGORY ANALYTICS BREAKDOWN
  const categoryAnalytics = useMemo(() => {
    const catStats = {};

    effectiveCategories.forEach((c) => {
      catStats[c.id] = {
        id: c.id,
        name: c.name,
        revenue: 0,
        itemsSold: 0,
        productCount: 0,
        stockUnits: 0,
        stockValue: 0,
      };
    });

    // Add uncategorized container
    catStats['other'] = {
      id: 'other',
      name: 'Boshqa / Umumiy',
      revenue: 0,
      itemsSold: 0,
      productCount: 0,
      stockUnits: 0,
      stockValue: 0,
    };

    // Calculate product stock per category
    effectiveProducts.forEach((p) => {
      const catId = p.category || 'other';
      if (!catStats[catId]) {
        catStats[catId] = {
          id: catId,
          name: categoryMap[catId] || 'Umumiy',
          revenue: 0,
          itemsSold: 0,
          productCount: 0,
          stockUnits: 0,
          stockValue: 0,
        };
      }
      const stock = Number(p.stock_quantity) || 0;
      const sell = Number(p.sell_price) || 0;
      catStats[catId].productCount++;
      catStats[catId].stockUnits += stock;
      catStats[catId].stockValue += stock * sell;
    });

    // Calculate sales per category from filteredItems
    filteredItems.forEach((item) => {
      const p = productMap[item.product];
      const catId = p?.category || 'other';
      if (catStats[catId]) {
        const qty = Number(item.quantity) || 0;
        const total = Number(item.price || p?.sell_price) * qty;
        catStats[catId].itemsSold += qty;
        catStats[catId].revenue += total;
      }
    });

    // If orderItems is empty, estimate from orders primary product
    if (filteredItems.length === 0 && filteredOrders.length > 0) {
      filteredOrders.forEach((o) => {
        const p = productMap[o.product];
        const catId = p?.category || 'other';
        if (catStats[catId]) {
          catStats[catId].revenue += Number(o.total_amount) || 0;
          catStats[catId].itemsSold += 1;
        }
      });
    }

    const list = Object.values(catStats).filter(
      (c) => c.productCount > 0 || c.revenue > 0
    );

    list.sort((a, b) => b.revenue - a.revenue);
    return list;
  }, [effectiveCategories, effectiveProducts, filteredItems, filteredOrders, productMap, categoryMap]);

  // 2. PRODUCT PERFORMANCE (TOP SELLERS & DEAD STOCK)
  const productAnalytics = useMemo(() => {
    const map = {};

    effectiveProducts.forEach((p) => {
      map[p.id] = {
        product: p,
        totalSold: 0,
        totalRevenue: 0,
        categoryName: categoryMap[p.category] || 'Umumiy',
      };
    });

    filteredItems.forEach((item) => {
      if (map[item.product]) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price || map[item.product].product.sell_price) || 0;
        map[item.product].totalSold += qty;
        map[item.product].totalRevenue += qty * price;
      }
    });

    // Fallback if order items are flat
    if (filteredItems.length === 0 && filteredOrders.length > 0) {
      filteredOrders.forEach((o) => {
        if (map[o.product]) {
          map[o.product].totalSold += 1;
          map[o.product].totalRevenue += Number(o.total_amount) || 0;
        }
      });
    }

    const all = Object.values(map);
    const topSellers = [...all].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const lowStock = effectiveProducts
      .filter((p) => Number(p.stock_quantity) < 5)
      .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity));

    return {
      topSellers,
      lowStock,
    };
  }, [effectiveProducts, filteredItems, filteredOrders, categoryMap]);

  // 3. CASHIER / DEVICE TERMINAL BREAKDOWN
  const cashierAnalytics = useMemo(() => {
    const devices = {};

    filteredOrders.forEach((o) => {
      const dev = o.cashier_device || o.device_id || 'Kassa №1 (Asosiy)';
      if (!devices[dev]) {
        devices[dev] = {
          name: dev,
          orderCount: 0,
          revenue: 0,
          cash: 0,
          card: 0,
          debt: 0,
        };
      }
      devices[dev].orderCount++;
      devices[dev].revenue += Number(o.total_amount) || 0;
      devices[dev].cash += Number(o.paid_cash) || 0;
      devices[dev].card += Number(o.paid_card) || 0;
      devices[dev].debt += Number(o.paid_debt) || 0;
    });

    return Object.values(devices);
  }, [filteredOrders]);

  // Print Executive Report handler
  const handlePrintReport = () => {
    window.print();
  };

  const handleLock = () => {
    sessionStorage.removeItem('director_authorized');
    setIsUnlocked(false);
    toast.info("Direktor kabineti qulflandi");
  };

  if (!isUnlocked) {
    return <DirectorLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              Direktor Analitika & Tahlil Portali
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Jonli Maʼlumotlar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Magazin Umumiy Biznes & Savdo Dashboardi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Kategoriyalar daromadi, mahsulotlar reytingi, ombor tovarlari qiymati, sof foyda va nasiyadorlar harakatini toʻliq nazorat qiling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Period selector */}
          <div className="bg-slate-800/80 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 flex items-center">
            {[
              { id: 'TODAY', label: 'Bugun' },
              { id: 'WEEK', label: 'Hafta' },
              { id: 'MONTH', label: 'Bu oy' },
              { id: 'ALL', label: 'Barchasi' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleDemoMode}
            title="Demo va real baza rejimini almashtirish"
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
              isDemoMode
                ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-300'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-950' : 'text-amber-400'}`} />
            <span>{isDemoMode ? '✨ Demo Rejim (Faol)' : 'Real Baza'}</span>
          </button>

          <button
            onClick={handlePrintReport}
            title="Hisobotni chop etish"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700/60 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Chop etish</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>

          <button
            onClick={handleLock}
            title="Direktor kabinetini qulflash va chiqish"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold border border-rose-500/60 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Qulflash</span>
          </button>
        </div>
      </div>

      {/* Main KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Jami Savdo (Revenue) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Yalpi Savdo Tushumi
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

        {/* 2. Kutilayotgan Sof Foyda (Gross Profit) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kutilayotgan Sof Foyda
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 tracking-tight">
              {formatCurrency(stats.estimatedProfit)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Rentabellik marjasi:</span>
              <strong className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-lg">
                ~{stats.profitMargin}%
              </strong>
            </div>
          </div>
        </div>

        {/* 3. Ombor (Sklad) Qiymati */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Sklad Tovarlar Qiymati
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(stats.totalInventoryRetail)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{products.length} xil tovar</span>
              <span className="font-bold text-slate-700">{stats.totalStockUnits} dona qoldiq</span>
            </div>
          </div>
        </div>

        {/* 4. Nasiyalar Balansi */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mijozlar Qarzdorligi
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
              <span>Qarzlar soni: {debts.length} ta</span>
              <span className="text-amber-600 font-bold">Qaytarilishi shart</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Deep Analytics */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Umumiy Tahlil', icon: BarChart3 },
          { id: 'shifts', label: 'Smenalar & Z-Hisobot', icon: Clock },
          { id: 'procurement', label: '🧠 AI Analiz (07:00)', icon: Sparkles },
          { id: 'cameras', label: 'Kameralar Tizimi (CCTV)', icon: Video },
          { id: 'categories', label: 'Kategoriyalar Tahlili', icon: Layers },
          { id: 'products', label: 'Mahsulotlar Reytingi', icon: Package },
          { id: 'cashiers', label: 'Kassirlar Faoliyati', icon: Users },
          { id: 'debts', label: 'Nasiyalar Monitoringi', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB: SHIFTS & Z-REPORTS */}
      {activeSubTab === 'shifts' && <DirectorShiftHistory />}

      {/* SUB-TAB: CAMERAS CCTV */}
      {activeSubTab === 'cameras' && <DirectorCameraSystem />}

      {/* SUB-TAB: PROCUREMENT 07:00 */}
      {activeSubTab === 'procurement' && (
        <DirectorProcurementAnalytics
          products={effectiveProducts}
          orders={effectiveOrders}
          orderItems={effectiveOrderItems}
          categories={effectiveCategories}
        />
      )}

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive 07:00 Morning Briefing Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-purple-800/60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-amber-400/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    AI Analiz • Har Kuni Soat 07:00 da
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">Tongi Avtomatik Xulosa</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Coca-Cola juda tez sotilmoqda (xarid qilish kerak), Pepsi esa omborda yetarli!
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Sunʼiy intellekt savdo tezligi boʻyicha qaysi tovardan zudlik bilan zakaz qilish kerakligi va qaysi biri omborda yetarli ekanligi tahlilini chiqardi.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('procurement')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black rounded-2xl transition-all shadow-md active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>07:00 AI Tahlilini Koʻrish</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* Low stock alert */}
          {stats.lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    Omborda {stats.lowStockCount} ta mahsulot zaxirasi tugamoqda!
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Ushbu tovarlar soni 5 tadan kam qolgan yoki butunlay tugagan. Skladni toʻldirish tavsiya etiladi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('products')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Kam tovarlarni koʻrish
              </button>
            </div>
          )}

          {/* Grid: Category distribution & Recent checks */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 cols: Category Share */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Kategoriyalar boʻyicha Tushum Ulushi
                    </h3>
                    <span className="text-[11px] text-slate-400">Eng koʻp foyda keltirayotgan sohalar</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSubTab('categories')}
                  className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                >
                  Barchasi →
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {categoryAnalytics.slice(0, 5).map((cat) => {
                  const share = stats.totalRevenue > 0
                    ? Math.round((cat.revenue / stats.totalRevenue) * 100)
                    : 0;
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(cat.revenue)}
                          </span>
                          <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
                            {share}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, share)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 6 cols: Recent orders stream */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Soʻnggi Kassa Tranzaksiyalari
                    </h3>
                    <span className="text-[11px] text-slate-400">Magazinda urilgan oxirgi cheklar</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {filteredOrders.length} ta chek
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {filteredOrders.slice(0, 6).map((order) => (
                  <div key={order.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        #{order.id}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Chek #{order.id}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {Number(order.paid_cash) > 0 && 'Naqd '}
                          {Number(order.paid_card) > 0 && 'Karta '}
                          {Number(order.paid_debt) > 0 && 'Nasiya'}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CATEGORY ANALYTICS */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Kategoriyalar boʻyicha Toʻliq Tahlil
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Har bir boʻlimning magazin daromadidagi ulushi, tovarlar soni va ombordagi qoldiq qiymati
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl">
              Jami toifalar: {effectiveCategories.length} ta
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Kategoriya Nomi</th>
                  <th className="px-4 py-3.5 text-center">Tovarlar Soni</th>
                  <th className="px-4 py-3.5 text-center">Sotilgan Donalar</th>
                  <th className="px-4 py-3.5 text-right">Keltirgan Tushum</th>
                  <th className="px-4 py-3.5 text-center">Savdodagi Ulushi</th>
                  <th className="px-5 py-3.5 text-right">Sklad Qoldiq Qiymati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {categoryAnalytics.map((cat) => {
                  const share = stats.totalRevenue > 0
                    ? Math.round((cat.revenue / stats.totalRevenue) * 100)
                    : 0;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{cat.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {cat.stockUnits} dona omborda
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-700">
                        {cat.productCount} xil
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-indigo-600">
                        {cat.itemsSold} dona
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-900">
                        {formatCurrency(cat.revenue)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-lg">
                          {share}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-700">
                        {formatCurrency(cat.stockValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PRODUCT PERFORMANCE & BEST SELLERS */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Mahsulot nomi yoki shtrix-kod boʻyicha qidirish..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 shrink-0">
              Jami: {effectiveProducts.length} ta mahsulot
            </span>
          </div>

          {/* Best Sellers Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Eng Koʻp Sotilgan Top Mahsulotlar Reytingi
                  </h3>
                  <span className="text-xs text-slate-400">Daromad boʻyicha yetakchi tovarlar</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 text-center">Oʻrin</th>
                    <th className="px-5 py-3.5">Mahsulot Nomi</th>
                    <th className="px-4 py-3.5">Kategoriya</th>
                    <th className="px-4 py-3.5 text-right">Sotuv Narxi</th>
                    <th className="px-4 py-3.5 text-center">Sotilgan Miqdor</th>
                    <th className="px-4 py-3.5 text-right">Jami Tushum</th>
                    <th className="px-5 py-3.5 text-center">Ombor Qoldigʻi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {productAnalytics.topSellers
                    .filter((item) => {
                      if (!productSearch.trim()) return true;
                      const q = productSearch.toLowerCase();
                      return (
                        item.product.name?.toLowerCase().includes(q) ||
                        item.product.barcode?.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 20)
                    .map((item, index) => {
                      const stock = Number(item.product.stock_quantity) || 0;
                      const isLow = stock < 5;
                      const isOut = stock <= 0;

                      return (
                        <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-black ${
                                index === 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : index === 1
                                  ? 'bg-slate-200 text-slate-700'
                                  : index === 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'text-slate-400'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900">{item.product.name}</div>
                            {item.product.barcode && (
                              <div className="text-[10px] font-mono text-slate-400">
                                #{item.product.barcode}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-600">
                            {item.categoryName}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                            {formatCurrency(item.product.sell_price)}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-purple-700">
                            {item.totalSold} {getUnitLabel(item.product.unit)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-slate-900">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                isOut
                                  ? 'bg-rose-100 text-rose-700'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {stock} {getUnitLabel(item.product.unit)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CASHIERS & TERMINALS */}
      {activeSubTab === 'cashiers' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Kassirlar va Kassa Qurilmalari Faoliyati
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Har bir kassa apparatining kunlik va davriy savdo hajmi, naqd va karta orqali tushumi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashierAnalytics.map((dev) => (
              <div
                key={dev.name}
                className="bg-slate-50/70 border border-slate-200 rounded-3xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      POS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{dev.name}</h4>
                      <span className="text-[10px] text-slate-400">Kassa terminali</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                    {dev.orderCount} ta chek
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <div className="text-xl font-black text-slate-900">
                    {formatCurrency(dev.revenue)}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-slate-500">
                    <div>Naqd: <strong className="text-slate-700 block">{formatCurrency(dev.cash)}</strong></div>
                    <div>Karta: <strong className="text-indigo-600 block">{formatCurrency(dev.card)}</strong></div>
                    <div>Nasiya: <strong className="text-amber-600 block">{formatCurrency(dev.debt)}</strong></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DEBTS & RECEIVABLES */}
      {activeSubTab === 'debts' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nasiyalar va Qarzdorliklar Monitoringi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mijozlarga berilgan jami qarzlar, qoplangan toʻlovlar va qolgan haqiqiy balans
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl">
                Qolgan qarz: {formatCurrency(stats.totalPendingDebt)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">№ ID</th>
                  <th className="px-4 py-3.5">Mijoz (User ID)</th>
                  <th className="px-4 py-3.5 text-right">Berilgan Nasiya</th>
                  <th className="px-4 py-3.5 text-right">Toʻlangan Summa</th>
                  <th className="px-4 py-3.5 text-right">Qoldiq Qarz</th>
                  <th className="px-5 py-3.5 text-center">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {effectiveDebts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Nasiyalar mavjud emas
                    </td>
                  </tr>
                ) : (
                  effectiveDebts.map((debt) => {
                    const amount = Number(debt.amount) || 0;
                    const paid = Number(debt.paid_amount) || 0;
                    const remaining = Math.max(0, amount - paid);
                    const isClosed = remaining <= 0;

                    return (
                      <tr key={debt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                          #{debt.id}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          Mijoz #{debt.user}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                          {formatCurrency(paid)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-black text-amber-600">
                          {formatCurrency(remaining)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              isClosed
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isClosed ? 'YOPILGAN' : 'QARZDORLIK MAVJUD'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Order Receipt details */}
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
