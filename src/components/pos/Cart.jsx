import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency, getUnitLabel } from '../../utils/formatters';

export function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }) {
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (Number(item.price || item.product.sell_price) * item.quantity),
    0
  );

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-800">Savat</h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
            {totalItemCount}
          </span>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-500 hover:text-rose-700 font-medium hover:underline cursor-pointer"
          >
            Tozalash
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Savat bo'sh</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Mahsulotlarni tanlang yoki shtrix-kodni skaner qiling
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const itemPrice = Number(item.price || item.product.sell_price);
            const itemTotal = itemPrice * item.quantity;
            const unitLabel = getUnitLabel(item.product.unit);
            const isWeighed = item.product.unit === 'KG' || item.product.unit === 'LITER';
            const step = isWeighed ? 0.25 : 1;

            return (
              <div key={item.product.id} className="py-3 flex items-center justify-between gap-3 group">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 truncate" title={item.product.name}>
                    {item.product.name}
                  </h4>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {formatCurrency(itemPrice)} / {unitLabel}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, Math.max(0, Number((item.quantity - step).toFixed(3))))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-xs text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                    title={`-${step} ${unitLabel}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 min-w-[42px] text-center text-xs font-bold text-slate-800 select-none">
                    {item.quantity} {isWeighed ? unitLabel.toLowerCase() : ''}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, Number((item.quantity + step).toFixed(3)))}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-xs text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                    title={`+${step} ${unitLabel}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-[75px]">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(itemTotal)}</div>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1 mt-0.5 cursor-pointer"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Tovarlar:</span>
            <span className="font-semibold text-slate-700">{cartItems.length} xil pozitsiya</span>
          </div>
          <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
            <span className="text-base font-bold text-slate-800">Jami to'lov:</span>
            <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <button
            onClick={onCheckout}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer text-base"
          >
            <span>To'lovga o'tish</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
