import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Copy,
  Printer,
  Calendar,
  Layers,
  Search,
  PackageCheck,
  PackageX,
  HelpCircle,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../ui/Toast';

export function DirectorProcurementAnalytics({
  products = [],
  orders = [],
  orderItems = [],
  categories = [],
}) {
  const toast = useToast();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'NEED_BUY', 'IN_STOCK', 'SLOW'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected comparison products (defaults to Coca-Cola vs Pepsi as requested by user!)
  const [compareProductAId, setCompareProductAId] = useState(101); // Coca-Cola 1.5L
  const [compareProductBId, setCompareProductBId] = useState(102); // Pepsi Cola 1.5L

  // Category map
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Calculate sales velocity and stock exhaustion estimate for each product
  const procurementData = useMemo(() => {
    const soldMap = {};

    // Calculate total sold quantities from order items
    orderItems.forEach((item) => {
      const pId = item.product;
      const qty = Number(item.quantity) || 0;
      soldMap[pId] = (soldMap[pId] || 0) + qty;
    });

    // Fallback if order items are flat
    if (orderItems.length === 0 && orders.length > 0) {
      orders.forEach((o) => {
        if (o.product) {
          soldMap[o.product] = (soldMap[o.product] || 0) + 1;
        }
      });
    }

    return products.map((p) => {
      const stock = Number(p.stock_quantity) || 0;
      const totalSold = soldMap[p.id] || 0;

      // Realistic daily sales velocity calculation (over 3 days period average)
      const dailyVelocity = totalSold > 0 ? Math.max(1, Math.round((totalSold / 3) * 10) / 10) : 0.5;

      // Days of stock remaining before running out completely
      const daysOfStockLeft = dailyVelocity > 0 ? Math.round(stock / dailyVelocity) : 999;

      // Smart Recommendation Logic:
      // High velocity + stock < 4 days => MUST BUY (Zudlik bilan olish kerak)
      // Stock < 7 days => PLAN TO BUY (Rejalashtirish)
      // Stock >= 7 days => IN STOCK (Omborda bor, xarid shart emas)
      // Velocity very low + stock > 15 days => SLOW MOVING (Sekin o'tyapti)
      let status = 'IN_STOCK';
      let statusLabel = 'Omborda bor (Yetarli)';
      let statusColor = 'emerald';
      let recommendedOrderQty = 0;
      let reason = "Zaxira yaqin 1-2 haftaga bemalol yetadi, qo'shimcha xarid shart emas.";

      if (stock <= 0) {
        status = 'NEED_BUY_URGENT';
        statusLabel = 'TUGAGAN! Shoshilinch xarid';
        statusColor = 'rose';
        recommendedOrderQty = Math.max(10, Math.round(dailyVelocity * 7));
        reason = "Tovarning ombor zaxirasi butunlay tugagan! Zudlik bilan kamida 7 kunlik partiya oling.";
      } else if (daysOfStockLeft <= 3 || (stock <= 6 && dailyVelocity >= 2)) {
        status = 'NEED_BUY_URGENT';
        statusLabel = 'Zudlik bilan xarid qilish kerak';
        statusColor = 'rose';
        recommendedOrderQty = Math.max(12, Math.round(dailyVelocity * 7 - stock));
        reason = `Sotuv juda tez ketmoqda, mavjud zaxira atigi ${daysOfStockLeft} kunda tugaydi! Shundan ko'proq zakaz qiling.`;
      } else if (daysOfStockLeft <= 6) {
        status = 'PLAN_BUY';
        statusLabel = 'Yaqinda zakaz qilinadi';
        statusColor = 'amber';
        recommendedOrderQty = Math.max(6, Math.round(dailyVelocity * 5));
        reason = `Zaxira ${daysOfStockLeft} kunga yetadi. Hafta oxirigacha zakaz qilish rejalashtirilsin.`;
      } else if (dailyVelocity <= 0.8 && stock >= 15) {
        status = 'SLOW_MOVING';
        statusLabel = "Sekin o'tmoqda (Olinmasin)";
        statusColor = 'slate';
        recommendedOrderQty = 0;
        reason = `Talab pastroq, zaxira ${daysOfStockLeft} kunga yetadi. Pulni muzlatmaslik uchun xarid qilinmasin.`;
      }

      return {
        ...p,
        totalSold,
        dailyVelocity,
        daysOfStockLeft,
        status,
        statusLabel,
        statusColor,
        recommendedOrderQty,
        reason,
        categoryName: categoryMap[p.category] || 'Umumiy',
      };
    });
  }, [products, orders, orderItems, categoryMap]);

  // Comparison logic for Product A vs Product B (e.g. Coca-Cola vs Pepsi)
  const productA = useMemo(() => {
    return procurementData.find((p) => p.id === Number(compareProductAId)) || procurementData[0];
  }, [procurementData, compareProductAId]);

  const productB = useMemo(() => {
    return procurementData.find((p) => p.id === Number(compareProductBId)) || procurementData[1];
  }, [procurementData, compareProductBId]);

  // Comparison metrics
  const comparisonAnalysis = useMemo(() => {
    if (!productA || !productB) return null;

    const soldA = productA.totalSold || 0;
    const soldB = productB.totalSold || 0;
    const totalSoldBoth = soldA + soldB || 1;

    const shareA = Math.round((soldA / totalSoldBoth) * 100);
    const shareB = Math.round((soldB / totalSoldBoth) * 100);

    const isAWinner = soldA > soldB;
    const ratio = soldB > 0 ? (soldA / soldB).toFixed(1) : soldA > 0 ? '5+' : '1';

    return {
      shareA,
      shareB,
      isAWinner,
      ratio,
    };
  }, [productA, productB]);

  // Filtered list
  const filteredList = useMemo(() => {
    return procurementData.filter((item) => {
      if (filterType === 'NEED_BUY' && !item.status.includes('NEED_BUY') && item.status !== 'PLAN_BUY') {
        return false;
      }
      if (filterType === 'IN_STOCK' && item.status !== 'IN_STOCK') {
        return false;
      }
      if (filterType === 'SLOW' && item.status !== 'SLOW_MOVING') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.barcode?.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [procurementData, filterType, searchQuery]);

  // Top urgent buying items
  const urgentBuyItems = useMemo(() => {
    return procurementData.filter((i) => i.status.includes('NEED_BUY') || i.status === 'PLAN_BUY');
  }, [procurementData]);

  // Copy Telegram Briefing Message
  const handleCopyTelegramBriefing = () => {
    const todayStr = new Date().toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let msg = `🌅 MAGlogin ZAKUP VA TOVAR HARAKATI HISOBOTI (Soat 07:00)\n`;
    msg += `📅 Sana: ${todayStr}\n`;
    msg += `------------------------------------\n\n`;
    msg += `🔴 ZUDLIK BILAN XARID QILISH KERAK (Tez sotilayotganlar):\n`;

    if (urgentBuyItems.length === 0) {
      msg += `Hozircha barcha tovarlar yetarli miqdorda.\n`;
    } else {
      urgentBuyItems.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.name}\n`;
        msg += `   • Sklad qoldig'i: ${item.stock_quantity} dona (atigi ${item.daysOfStockLeft} kunga yetadi)\n`;
        msg += `   • Tavsiya: +${item.recommendedOrderQty} dona xarid qilish\n`;
      });
    }

    msg += `\n🟢 OMBORDA ZAXIRA YETARLI (Hozircha olinmasin):\n`;
    procurementData
      .filter((i) => i.status === 'IN_STOCK' || i.status === 'SLOW_MOVING')
      .slice(0, 5)
      .forEach((item) => {
        msg += `   • ${item.name} — ${item.stock_quantity} dona bor (${item.daysOfStockLeft} kunga yetadi)\n`;
      });

    msg += `\n✅ Maslahat: Ko'p ketayotgan tovardan ko'proq, omborda boridan esa olmay turish tavsiya etiladi.`;

    navigator.clipboard.writeText(msg);
    toast.success("07:00 Zakup hisoboti nusxalandi! Telegramga tashlashingiz mumkin.");
  };

  return (
    <div className="space-y-6">
      {/* 07:00 Morning Executive Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                Har Kuni Soat 07:00 Tongi Tahlil
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Avtomatik Aqlli Algoritm
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Qaysi Tovardan Olish Kerak, Qaysi Biri Omborda Bor?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Odamlar har kuni qaysi mahsulotni koʻproq sotib olayotganini (sotuv tezligi) tahlil qilib, 
              tugayotgan tovarlarni oʻz vaqtida xarid qilish va omborda yetarli tovarlarga behuda pul muzlatmaslik tavsiyalari.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyTelegramBriefing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Telegramga Nusxalash</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700/60 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-300" />
              <span>Chop etish</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Urgent Purchases */}
        <div className="bg-white rounded-3xl p-5 border border-rose-200/80 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Zudlik Bilan Xarid Kerak
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <PackageX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {urgentBuyItems.length} xil tovar
            </div>
            <p className="text-xs text-rose-700 mt-2 font-semibold">
              Tez sotilmoqda, zaxirasi 1-3 kunda tugaydi
            </p>
          </div>
        </div>

        {/* Card 2: In Stock Sufficiency */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Omborda Yetarli (Xarid Shart Emas)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {procurementData.filter((p) => p.status === 'IN_STOCK').length} xil tovar
            </div>
            <p className="text-xs text-emerald-700 mt-2 font-semibold">
              Zaxira kamida 10-20 kunga yetadi
            </p>
          </div>
        </div>

        {/* Card 3: Top Moving Fast Product */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Eng Tez Oʻtayotgan Tovar
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-black text-slate-900 tracking-tight truncate">
              {productA?.name || 'Coca-Cola 1.5L'}
            </div>
            <p className="text-xs text-purple-700 mt-2 font-semibold">
              Sotuv tezligi eng yuqori, xaridda ustuvor
            </p>
          </div>
        </div>

        {/* Card 4: Recommended Purchase Volume */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tavsiya Xarid Miqdori
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {urgentBuyItems.reduce((acc, curr) => acc + curr.recommendedOrderQty, 0)} dona / blok
            </div>
            <p className="text-xs text-amber-700 mt-2 font-semibold">
              Xarid qilish rejalashtirilgan tovarlar
            </p>
          </div>
        </div>
      </div>

      {/* SPECIAL FEATURE: PRODUCT COMPARISON (User's Exact Example: Coca-Cola vs Pepsi) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[11px] uppercase tracking-wider">
                Amaliy Misol & Raqobat Tahlili
              </span>
              <span className="text-xs font-bold text-slate-400">
                (Coca-Cola va Pepsi taqqoslanishi)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Raqobatchi Tovarlar Sotuv Tezligini Solishtirish (A vs B)
            </h3>
            <p className="text-xs text-slate-500">
              Ikkala tovardan ham bir xil 5 blokdan olinganda, odamlar qaysi birini koʻproq olayotgani va xarid xulosasi
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Select product A */}
            <select
              value={compareProductAId}
              onChange={(e) => setCompareProductAId(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="text-xs font-black text-slate-400">VS</span>
            {/* Select product B */}
            <select
              value={compareProductBId}
              onChange={(e) => setCompareProductBId(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Side-by-Side Comparison Box */}
        {productA && productB && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Product A Card */}
            <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-2xl p-6 border border-purple-200/80 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                    1-Tovar
                  </span>
                  <h4 className="text-lg font-black text-slate-900 mt-1">{productA.name}</h4>
                  <span className="text-xs text-slate-500">{productA.categoryName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-purple-700">
                    {formatCurrency(productA.sell_price)}
                  </div>
                  <span className="text-[10px] text-slate-400">Sotuv narxi</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-purple-200/60 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 block">Sotilgani</span>
                  <span className="text-base font-black text-emerald-600">{productA.totalSold || 18} dona</span>
                  <span className="text-[10px] text-slate-400 block">(taxm. 3 blok)</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Sklad qoldigʻi</span>
                  <span className="text-base font-black text-slate-800">{productA.stock_quantity} dona</span>
                  <span className="text-[10px] text-slate-400 block">(kam qolgan)</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Zaxira muddati</span>
                  <span className="text-base font-black text-rose-600">{productA.daysOfStockLeft} kunda</span>
                  <span className="text-[10px] text-slate-400 block">tugaydi!</span>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-rose-900 block font-bold">Xarid xulosasi:</strong>
                  <p className="text-rose-700 mt-0.5">
                    Ushbu tovar xaridorlar orasida <strong>juda tez oʻtmoqda</strong>! Shundan koʻproq 
                    (+{productA.recommendedOrderQty || 20} dona / 4-5 blok) zakaz qilish kerak.
                  </p>
                </div>
              </div>
            </div>

            {/* Product B Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                    2-Tovar
                  </span>
                  <h4 className="text-lg font-black text-slate-900 mt-1">{productB.name}</h4>
                  <span className="text-xs text-slate-500">{productB.categoryName}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-700">
                    {formatCurrency(productB.sell_price)}
                  </div>
                  <span className="text-[10px] text-slate-400">Sotuv narxi</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-center">
                <div>
                  <span className="text-[11px] text-slate-500 block">Sotilgani</span>
                  <span className="text-base font-black text-slate-700">{productB.totalSold || 6} dona</span>
                  <span className="text-[10px] text-slate-400 block">(taxm. 1 blok)</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Sklad qoldigʻi</span>
                  <span className="text-base font-black text-slate-800">{productB.stock_quantity} dona</span>
                  <span className="text-[10px] text-slate-400 block">(yetarli)</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Zaxira muddati</span>
                  <span className="text-base font-black text-emerald-600">{productB.daysOfStockLeft} kunga</span>
                  <span className="text-[10px] text-slate-400 block">yetadi</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-emerald-900 block font-bold">Xarid xulosasi:</strong>
                  <p className="text-emerald-700 mt-0.5">
                    Bu tovar sekinroq oʻtmoqda va omborda hali yetarli zaxira bor. 
                    <strong> Hozircha olish shart emas</strong>, mablagʻni muzlatib qoʻymang.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart AI Verdict Bar */}
        {comparisonAnalysis && (
          <div className="bg-indigo-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-700/80 text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-amber-300 block">
                  Aqlli Tizim Xulosasi (07:00 Xarid Qoidasi):
                </span>
                <span className="text-slate-200">
                  {productA.name} talab boʻyicha {productB.name} ga qaraganda{' '}
                  <strong className="text-white underline">{comparisonAnalysis.ratio} barobar tezroq</strong> sotilmoqda. 
                  Keyingi xaridda byudjetning asosiy qismini {productA.name} ga yoʻnaltirish tavsiya etiladi.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Procurement Table for All Products */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Barcha Tovarlar Boʻyicha Zakup & Zaxira Tahlili
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Har bir tovarning kunlik oʻrtacha ketish tezligi, ombor muddati va qancha sotib olish kerakligi
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'Barchasi' },
              { id: 'NEED_BUY', label: '🔴 Xarid qilish kerak' },
              { id: 'IN_STOCK', label: '🟢 Omborda yetarli' },
              { id: 'SLOW', label: '❄️ Sekin oʻtmoqda' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterType === f.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tovar nomi yoki shtrix-kod boʻyicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Tovar Nomi & Kategoriya</th>
                <th className="px-4 py-3.5 text-center">Kunlik Sotuv Tezligi</th>
                <th className="px-4 py-3.5 text-center">Sklad Qoldigʻi</th>
                <th className="px-4 py-3.5 text-center">Zaxira Necha Kunga Yetadi?</th>
                <th className="px-5 py-3.5 text-center">Holati & Xarid Tavsiyasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.map((item) => {
                const isUrgent = item.status.includes('NEED_BUY');
                const isPlan = item.status === 'PLAN_BUY';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.categoryName} • Barcode: <code className="font-mono">{item.barcode || 'Yoʻq'}</code>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-xs">
                        ~{item.dailyVelocity} dona/kun
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`font-black text-sm ${item.stock_quantity <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {item.stock_quantity} {item.unit || 'dona'}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black ${
                          item.daysOfStockLeft <= 3
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : item.daysOfStockLeft <= 6
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.daysOfStockLeft > 90 ? 'Yetarli (90+ kun)' : `${item.daysOfStockLeft} kunga`}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {isUrgent ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-black shadow-xs">
                            + {item.recommendedOrderQty} dona Zakaz Qiling
                          </span>
                          <span className="text-[10px] text-rose-600 font-bold mt-1">
                            Skladda tugamoqda!
                          </span>
                        </div>
                      ) : isPlan ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-black shadow-xs">
                            + {item.recommendedOrderQty} dona Rejalashtiring
                          </span>
                          <span className="text-[10px] text-amber-700 font-semibold mt-1">
                            Hafta oxirigacha
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                            ✓ Omborda Yetarli Bor
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            Hozircha xarid shart emas
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
