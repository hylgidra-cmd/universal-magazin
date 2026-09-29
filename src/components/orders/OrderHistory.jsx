import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../ui/Toast';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ReceiptText, RotateCcw, Search, Eye, CheckCircle2, AlertOctagon } from 'lucide-react';

export function OrderHistory({ products = [] }) {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const toast = useToast();

  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [products]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allOrders, allItems] = await Promise.all([
        orderService.getAllOrders(),
        orderService.getAllOrderItems(),
      ]);
      const sorted = (allOrders || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
      setOrderItems(allItems || []);
    } catch (err) {
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleReturnOrder = async (order) => {
    if (!window.confirm(`№${order.id} raqamli chekni QAYTARILGAN deb belgilamoqchimisiz?`)) return;
    setReturningId(order.id);
    try {
      await orderService.returnOrder(order.id);
      toast.success(`№${order.id} buyurtma qaytarildi`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Qaytarishda xatolik");
    } finally {
      setReturningId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const idMatch = o.id.toString().includes(q);
        const cashierMatch = (o.cashier?.username || '').toLowerCase().includes(q);
        if (!idMatch && !cashierMatch) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const currentOrderItems = useMemo(() => {
    if (!selectedOrder) return [];
    return orderItems.filter((item) => item.order === selectedOrder.id);
  }, [selectedOrder, orderItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cheklar va Savdo Tarixi</h1>
          <p className="text-xs text-slate-500 mt-1">Barcha rasmiylashtirilgan savdolar va qaytarishlar</p>
        </div>
        <button onClick={loadData} disabled={loading} className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer">
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Yangilash</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Chek № yoki kassir bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          <option value="ALL">Barcha cheklar</option>
          <option value="COMPLETED">Faqat muvaffaqiyatli</option>
          <option value="RETURNED">Faqat qaytarilgan</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Chek №</th>
                <th className="px-4 py-3.5">Sana</th>
                <th className="px-4 py-3.5">Kassir</th>
                <th className="px-4 py-3.5 text-right">Summa</th>
                <th className="px-4 py-3.5">To'lov</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-bold font-mono">#{order.id}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-700">{order.cashier?.username || 'Kassir'}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-4 py-3.5 text-xs">
                    {Number(order.paid_cash) > 0 && <span className="mr-1 text-emerald-600">Naqd: {formatCurrency(order.paid_cash)}</span>}
                    {Number(order.paid_card) > 0 && <span className="mr-1 text-sky-600">Karta: {formatCurrency(order.paid_card)}</span>}
                    {Number(order.paid_debt) > 0 && <span className="text-amber-600">Nasiya: {formatCurrency(order.paid_debt)}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${order.status === 'RETURNED' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {order.status === 'RETURNED' ? 'Qaytarilgan' : 'Yakunlangan'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status !== 'RETURNED' && (
                        <button onClick={() => handleReturnOrder(order)} disabled={returningId === order.id} className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer">
                          Qaytarish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Chek №#${selectedOrder?.id} tafsilotlari`} maxWidth="max-w-lg">
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
              <div>Sana: <span className="font-semibold">{formatDateTime(selectedOrder.created_at)}</span></div>
              <div>Kassir: <span className="font-semibold">{selectedOrder.cashier?.username}</span></div>
            </div>
            <div>
              <h4 className="font-bold mb-2">Tovarlar ({currentOrderItems.length})</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-2">
                {currentOrderItems.map((item) => (
                  <div key={item.id} className="py-1.5 flex justify-between">
                    <div>{productMap[item.product] || `#${item.product}`} x {item.quantity}</div>
                    <div className="font-bold">{formatCurrency(Number(item.price) * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 font-bold text-sm flex justify-between">
              <span>Jami:</span>
              <span>{formatCurrency(selectedOrder.total_amount)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
