import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { formatCurrency, safeAdd } from '../../utils/formatters';
import { Banknote, CreditCard, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../ui/Toast';

export function CheckoutModal({ isOpen, onClose, cartItems, onCompleteCheckout, isProcessing }) {
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (Number(item.price || item.product.sell_price) * item.quantity),
    0
  );

  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [debt, setDebt] = useState('');
  const [debtorUserId, setDebtorUserId] = useState('');
  const [tenderedCash, setTenderedCash] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setCash(totalAmount.toString());
      setCard('');
      setDebt('');
      setDebtorUserId('');
      setTenderedCash(totalAmount.toString());
    }
  }, [isOpen, totalAmount]);

  const cashNum = Number(cash) || 0;
  const cardNum = Number(card) || 0;
  const debtNum = Number(debt) || 0;
  const totalPaid = safeAdd(cashNum, cardNum, debtNum);
  const remaining = Math.round((totalAmount - totalPaid) * 100) / 100;
  const isExact = Math.abs(remaining) < 0.05;

  const tenderedNum = Number(tenderedCash) || 0;
  const changeDue = Math.max(0, tenderedNum - cashNum);

  const handleQuickExact = (method) => {
    if (method === 'cash') {
      setCash(totalAmount.toString());
      setCard('');
      setDebt('');
      setTenderedCash(totalAmount.toString());
    } else if (method === 'card') {
      setCash('');
      setCard(totalAmount.toString());
      setDebt('');
      setTenderedCash('');
    } else if (method === 'debt') {
      setCash('');
      setCard('');
      setDebt(totalAmount.toString());
      setTenderedCash('');
    }
  };

  const handleTenderedPreset = (presetAmount) => {
    setTenderedCash(presetAmount.toString());
    if (cashNum === 0) setCash(totalAmount.toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isExact) {
      toast.error(`To'lov summasi to'liq qoplanmagan! Qoldiq: ${formatCurrency(remaining)}`);
      return;
    }

    if (debtNum > 0 && (!debtorUserId || isNaN(Number(debtorUserId)))) {
      toast.error("Nasiya uchun qarzdor mijoz ID raqamini kiriting!");
      return;
    }

    onCompleteCheckout({
      paidCash: cashNum,
      paidCard: cardNum,
      paidDebt: debtNum,
      debtorUserId: debtNum > 0 ? parseInt(debtorUserId, 10) : null,
      tenderedCash: tenderedNum,
      changeDue,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lovni amalga oshirish" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 text-center">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block mb-1">
            To'lanishi kerak bo'lgan summa
          </span>
          <div className="text-3xl sm:text-4xl font-black text-indigo-700 tracking-tight">
            {formatCurrency(totalAmount)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickExact('cash')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              cashNum === totalAmount && cardNum === 0 && debtNum === 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Banknote className="w-4 h-4 text-emerald-600" />
            <span>To'liq Naqd</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExact('card')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              cardNum === totalAmount && cashNum === 0 && debtNum === 0
                ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-sky-600" />
            <span>To'liq Karta</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExact('debt')}
            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              debtNum === totalAmount && cashNum === 0 && cardNum === 0
                ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>To'liq Nasiya</span>
          </button>
        </div>

        <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            To'lov taqsimoti
          </h4>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-0.5">Naqd to'lov</label>
              <input
                type="number"
                min="0"
                step="any"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {cashNum > 0 && (
            <div className="ml-13 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Mijoz bergan naqd summa:</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tenderedCash}
                  onChange={(e) => setTenderedCash(e.target.value)}
                  placeholder="Summa"
                  className="w-32 px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 text-right focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                {[10000, 20000, 50000, 100000, 200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTenderedPreset(preset)}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-100/60 border border-emerald-200 rounded text-[11px] font-bold text-emerald-800 cursor-pointer"
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>

              {tenderedNum >= cashNum && changeDue > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-xs font-bold text-emerald-900">
                  <span>Qaytim (Сдача):</span>
                  <span className="text-base text-emerald-700">{formatCurrency(changeDue)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-0.5">Plastik karta orqali</label>
              <input
                type="number"
                min="0"
                step="any"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-0.5">Nasiyaga (Qarzga)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={debt}
                onChange={(e) => setDebt(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {debtNum > 0 && (
            <div className="ml-13 p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <label className="block text-xs font-bold text-amber-900">
                Qarzdor mijoz ID raqami (User ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={debtorUserId}
                onChange={(e) => setDebtorUserId(e.target.value)}
                placeholder="masalan: 4"
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-sm font-medium border ${
            isExact
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isExact ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>
              {isExact
                ? "To'lov summasi to'g'ri taqsimlandi"
                : remaining > 0
                ? `Yetmayotgan summa: ${formatCurrency(remaining)}`
                : `Ortiqcha summa: ${formatCurrency(Math.abs(remaining))}`}
            </span>
          </div>
          <span className="font-bold">{formatCurrency(totalPaid)}</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={!isExact || isProcessing}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Chekni urish va yakunlash</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
