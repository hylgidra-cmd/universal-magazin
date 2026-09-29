import React from 'react';
import { Modal } from '../ui/Modal';
import { Printer, Check } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function ReceiptModal({ isOpen, onClose, orderData, onNewSale }) {
  if (!orderData) return null;

  const { order, items = [], changeDue } = orderData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sotuv cheki" maxWidth="max-w-md">
      <div className="space-y-4">
        <div
          id="receipt-print-area"
          className="bg-white p-6 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-4 shadow-xs"
        >
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="font-bold text-base tracking-widest uppercase">POSTORE MAGRO</div>
            <div className="text-[10px] text-slate-500">Kassa savdo cheki</div>
            <div className="text-[10px] text-slate-500">
              Chek №: <span className="font-bold text-slate-800">#{order.id}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Sana: {formatDateTime(order.created_at || new Date().toISOString())}
            </div>
            <div className="text-[10px] text-slate-500">
              Kassir: <span className="font-semibold">{order.cashier?.first_name || order.cashier?.username || 'Kassir'}</span>
            </div>
          </div>

          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200">
              <span>Mahsulot</span>
              <span>Jami</span>
            </div>
            {items.map((item, idx) => {
              const itemTotal = Number(item.price) * item.quantity;
              return (
                <div key={item.id || idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-900 truncate">
                    {item.product_name || `Mahsulot #${item.product}`}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                    <span className="font-bold text-slate-800">{formatCurrency(itemTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-extrabold text-sm pt-1">
              <span>JAMI SUMMA:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>

            {Number(order.paid_cash) > 0 && (
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Naqd to'lov:</span>
                <span>{formatCurrency(order.paid_cash)}</span>
              </div>
            )}

            {Number(order.paid_card) > 0 && (
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Karta orqali:</span>
                <span>{formatCurrency(order.paid_card)}</span>
              </div>
            )}

            {Number(order.paid_debt) > 0 && (
              <div className="flex justify-between text-[11px] text-amber-700 font-semibold">
                <span>Nasiya (Qarz):</span>
                <span>{formatCurrency(order.paid_debt)}</span>
              </div>
            )}

            {changeDue > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1 border-t border-slate-200">
                <span>Qaytim:</span>
                <span>{formatCurrency(changeDue)}</span>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-dashed border-slate-300">
            Xaridingiz uchun rahmat!
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish</span>
          </button>
          <button
            onClick={onNewSale}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Check className="w-4 h-4" />
            <span>Yangi savdo</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
