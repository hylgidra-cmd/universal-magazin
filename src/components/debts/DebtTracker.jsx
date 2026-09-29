import React, { useState, useEffect, useMemo } from 'react';
import { debtService } from '../../services/debtService';
import { authService } from '../../services/authService';
import { useToast } from '../ui/Toast';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { BookOpen, Search, RotateCcw, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

export function DebtTracker() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const toast = useToast();

  const loadDebts = async () => {
    setLoading(true);
    try {
      const data = await debtService.getAllDebts();
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDebts(sorted);
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDebts(); }, []);

  const handleOpenPay = (debt) => {
    setSelectedDebt(debt);
    const balance = Math.max(0, Number(debt.amount) - Number(debt.paid_amount));
    setPayAmount(balance.toString());
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.warning("To'lov summasini kiriting");
      return;
    }
    const payNum = Number(payAmount);
    setSubmittingPayment(true);
    try {
      const newPaid = Number(selectedDebt.paid_amount || 0) + payNum;
      await debtService.updateDebtPayment(selectedDebt.id, newPaid);
      toast.success("Nasiya to'lovi qabul qilindi!");
      setIsPayModalOpen(false);
      loadDebts();
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const userMatch = d.user?.toString().includes(q);
        const orderMatch = d.order?.toString().includes(q);
        if (!userMatch && !orderMatch) return false;
      }
      return true;
    });
  }, [debts, typeFilter, searchTerm]);

  const totalDebt = useMemo(() => debts.filter(d => d.type === 'INCREASE').reduce((s, d) => s + Number(d.amount), 0), [debts]);
  const totalPaid = useMemo(() => debts.filter(d => d.type === 'INCREASE').reduce((s, d) => s + Number(d.paid_amount), 0), [debts]);
  const balance = Math.max(0, totalDebt - totalPaid);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Nasiya (Qarz) Daftari</h1>
          <p className="text-xs text-slate-500 mt-1">Mijozlar nasiyalari hisobi</p>
        </div>
        <button onClick={loadDebts} disabled={loading} className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer">
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400">Jami berilgan nasiyalar</span>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-slate-400">Qaytarilgan summa</span>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30">
          <span className="text-xs text-amber-700">Qoldiq qarz</span>
          <div className="text-2xl font-black text-amber-800">{formatCurrency(balance)}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Mijoz ID, Chek №..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          <option value="ALL">Barchasi</option>
          <option value="INCREASE">Nasiya berish</option>
          <option value="PAYMENT">To'lov</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-4 py-3.5">Mijoz (User ID)</th>
                <th className="px-4 py-3.5">Chek</th>
                <th className="px-4 py-3.5">Tur</th>
                <th className="px-4 py-3.5 text-right">Summa</th>
                <th className="px-4 py-3.5 text-right">To'langan</th>
                <th className="px-4 py-3.5 text-right">Qoldiq</th>
                <th className="px-4 py-3.5">Sana</th>
                <th className="px-5 py-3.5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDebts.map((d) => {
                const bal = Math.max(0, Number(d.amount) - Number(d.paid_amount));
                return (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 font-bold font-mono">#{d.id}</td>
                    <td className="px-4 py-3.5 font-bold text-indigo-600 font-mono">Mijoz #{d.user}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">Chek #{d.order}</td>
                    <td className="px-4 py-3.5 text-xs">
                      {d.type === 'INCREASE' ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Qarz berildi</span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">To'landi</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-emerald-600">{formatCurrency(d.paid_amount)}</td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-amber-700">{formatCurrency(bal)}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{formatDateTime(d.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {bal > 0 ? (
                        <button onClick={() => handleOpenPay(d)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer">
                          To'lov olish
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Yopilgan</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Nasiya to'lovini qabul qilish" maxWidth="max-w-md">
        {selectedDebt && (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div>Mijoz: <span className="font-bold">Mijoz #{selectedDebt.user}</span></div>
              <div>Chek: <span className="font-bold">Chek #{selectedDebt.order}</span></div>
              <div className="font-bold pt-1">Umumiy qarz: {formatCurrency(selectedDebt.amount)}</div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">To'lanayotgan summa</label>
              <input type="number" step="any" min="1" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 py-2 border rounded-xl text-xs font-bold">Bekor qilish</button>
              <button type="submit" disabled={submittingPayment} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">To'lovni kiritish</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
