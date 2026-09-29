import React from 'react';
import { Zap } from 'lucide-react';
import { formatCurrency, getUnitLabel } from '../../utils/formatters';

export function FastButtons({ products, onAddToCart }) {
  const fastProducts = products.filter((p) => p.is_fast_button && p.is_active);

  if (fastProducts.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
        <span>Tezkor tugmalar (Eng ko'p sotiladiganlar)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {fastProducts.map((p) => {
          const isOutOfStock = p.stock_quantity !== undefined && p.stock_quantity <= 0;

          return (
            <button
              key={p.id}
              onClick={() => onAddToCart(p)}
              disabled={isOutOfStock}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 group cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-b from-white to-amber-50/40 border-amber-200/70 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10'
              }`}
            >
              <div className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight group-hover:text-amber-800">
                {p.name}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs font-black text-amber-700">
                  {formatCurrency(p.sell_price)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {getUnitLabel(p.unit)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
