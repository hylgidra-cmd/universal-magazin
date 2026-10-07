import React from 'react';
import { GroqAiBriefingCard } from '../director/GroqAiBriefingCard';
import { Package, AlertTriangle, TrendingUp, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency, getUnitLabel } from '../../utils/formatters';

export function AdminAiAnalytics({ products = [], orders = [], onNavigateToProducts, onNavigateToPos }) {
  // Low stock products (< 5)
  const lowStockProducts = products
    .filter((p) => Number(p.stock_quantity) < 5)
    .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity));

  // Critical stock products (<= 1)
  const criticalStockProducts = products.filter((p) => Number(p.stock_quantity) <= 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute -right-8 -bottom-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Admin Boshqaruv & AI Tahlil Portali
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Groq LLM Faol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Magazin Kundalik AI Analitikasi & Xarid Tavsiyalari
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Groq sun'iy intellekti magazin omboridagi kam qolgan tovarlarni avtomatik tahlil qiladi,
              talab yuqori bo'lgan mahsulotlarni aniqlaydi va admin uchun Markdown hisobot taqdim etadi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToProducts && (
              <button
                onClick={onNavigateToProducts}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Omborga o'tish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mini KPI summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[11px] text-slate-400 font-medium">Barcha tovarlar</div>
            <div className="text-xl font-black text-white mt-0.5">{products.length} ta</div>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
            <div className="text-[11px] text-amber-300 font-medium">Zaxirasi kam qolgan</div>
            <div className="text-xl font-black text-amber-400 mt-0.5">{lowStockProducts.length} ta</div>
          </div>
          <div className="bg-rose-500/10 rounded-2xl p-3 border border-rose-500/20">
            <div className="text-[11px] text-rose-300 font-medium">Zudlik bilan xarid (Kritik)</div>
            <div className="text-xl font-black text-rose-400 mt-0.5">{criticalStockProducts.length} ta</div>
          </div>
          <div className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
            <div className="text-[11px] text-emerald-300 font-medium">Jami buyurtmalar</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{orders.length} ta</div>
          </div>
        </div>
      </div>

      {/* 1. Main Groq AI Daily Store & Shortage Briefing Card (Markdown) */}
      <GroqAiBriefingCard products={products} orders={orders} />

      {/* 2. Low Stock Procurement Action Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kam Qolgan Mahsulotlar Ro'yxati (Xarid Kerak)
              </h2>
              <p className="text-xs text-slate-500">
                Qoldig'i 5 tadan kam qolgan tovarlar (zudlik bilan yetkazib beruvchidan buyurtma qiling)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 self-start sm:self-auto">
            {lowStockProducts.length} ta kam tovar
          </span>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold text-sm">Barcha mahsulotlar yetarli miqdorda!</div>
            <p className="text-xs text-emerald-600 mt-0.5">
              Hozirda qoldig'i 5 tadan kam bo'lgan tovarlar yo'q. Ombor xavfsiz holatda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Mahsulot</th>
                  <th className="py-3 px-3">Shtrix-kod</th>
                  <th className="py-3 px-3 text-center">Qoldiq</th>
                  <th className="py-3 px-3 text-right">Sotuv narxi</th>
                  <th className="py-3 px-3 text-center">Holat</th>
                  <th className="py-3 px-3 text-right">Tavsiya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockProducts.map((p) => {
                  const qty = Number(p.stock_quantity) || 0;
                  const isCritical = qty <= 1;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.category_name || 'Umumiy'}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-500">
                        {p.barcode || '—'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                            isCritical
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {qty} {getUnitLabel(p.measurement_unit)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-700">
                        {formatCurrency(p.selling_price)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isCritical ? (
                          <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            🚨 Zudlik bilan xarid
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⚠️ Zaxira kam
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right text-xs font-medium text-indigo-600">
                        +{isCritical ? '20' : '15'} {getUnitLabel(p.measurement_unit)} zakaz bering
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
