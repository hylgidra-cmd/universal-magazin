import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import {
  Clock,
  User,
  Banknote,
  CreditCard,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Receipt,
  FileSpreadsheet,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { shiftService } from '../../services/shiftService';
import { useToast } from '../ui/Toast';

export function ShiftModal({
  isOpen,
  onClose,
  currentShift,
  onShiftUpdated,
  currentUser,
}) {
  const toast = useToast();

  // Open Shift Form State
  const defaultCashierName =
    currentUser?.first_name || currentUser?.username || 'Kassir 1';
  const [cashierName, setCashierName] = useState(defaultCashierName);
  const [openingCash, setOpeningCash] = useState('100000');
  const [openNote, setOpenNote] = useState('');

  // Close Shift (Z-Report) State
  const [actualCashInput, setActualCashInput] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [zReportResult, setZReportResult] = useState(null);

  // Cash In / Cash Out Modal State
  const [isCashOpOpen, setIsCashOpOpen] = useState(false);
  const [cashOpType, setCashOpType] = useState('CASH_IN'); // 'CASH_IN' | 'CASH_OUT'
  const [cashOpAmount, setCashOpAmount] = useState('');
  const [cashOpReason, setCashOpReason] = useState('');

  // Active view inside modal: 'status' | 'close'
  const [activeView, setActiveView] = useState('status');

  useEffect(() => {
    if (isOpen) {
      setZReportResult(null);
      setActiveView('status');
      if (currentShift) {
        const expected =
          currentShift.openingCashBalance +
          currentShift.cashSales +
          currentShift.cashIn -
          currentShift.cashOut;
        setActualCashInput(String(Math.round(expected)));
      } else {
        setCashierName(defaultCashierName);
        setOpeningCash('100000');
      }
    }
  }, [isOpen, currentShift, defaultCashierName]);

  if (!isOpen) return null;

  // Handle Opening Shift
  const handleOpenShift = (e) => {
    e.preventDefault();
    try {
      const opened = shiftService.openShift({
        cashierName: cashierName.trim() || 'Kassir',
        openingCashBalance: parseFloat(openingCash) || 0,
        note: openNote,
      });
      toast.success(`🟢 Smena #${opened.shiftNumber} muvaffaqiyatli ochildi!`);
      if (onShiftUpdated) onShiftUpdated(opened);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Smenani ochishda xatolik yuz berdi');
    }
  };

  // Handle Cash In / Cash Out
  const handleSaveCashOp = (e) => {
    e.preventDefault();
    const amt = parseFloat(cashOpAmount);
    if (!amt || amt <= 0) {
      toast.error('Iltimos, musbat summa kiriting');
      return;
    }
    try {
      const updated = shiftService.recordCashOperation(
        cashOpType,
        amt,
        cashOpReason
      );
      toast.success(
        cashOpType === 'CASH_IN'
          ? `+${formatCurrency(amt)} kassa qoldigʻiga qoʻshildi`
          : `-${formatCurrency(amt)} kassadan chiqim qilindi`
      );
      setIsCashOpOpen(false);
      setCashOpAmount('');
      setCashOpReason('');
      if (onShiftUpdated) onShiftUpdated(updated);
    } catch (err) {
      toast.error(err.message || 'Xatolik yuz berdi');
    }
  };

  // Handle Closing Shift & Generating Z-Report
  const handleCloseShift = (e) => {
    e.preventDefault();
    const actual = parseFloat(actualCashInput) || 0;
    try {
      const closed = shiftService.closeShift({
        actualCashInDrawer: actual,
        note: closeNote,
      });
      setZReportResult(closed);
      toast.success(`🔴 Smena #${closed.shiftNumber} yopildi! Z-Hisobot tayyor.`);
      if (onShiftUpdated) onShiftUpdated(null);
    } catch (err) {
      toast.error(err.message || 'Smenani yopishda xatolik');
    }
  };

  const handlePrintZReport = () => {
    window.print();
  };

  // ----------------------------------------------------------------------
  // VIEW 1: Z-REPORT PRINT PREVIEW (After shift is closed or on demand)
  // ----------------------------------------------------------------------
  if (zReportResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Z-Hisobot (Smena Yakuni Cheki)"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block text-sm">
                Smena #{zReportResult.shiftNumber} muvaffaqiyatli yopildi!
              </span>
              <span>
                Termo-printer orqali Z-Hisobot chekini chop etib, kassadagi pullar bilan birga topshirishingiz mumkin.
              </span>
            </div>
          </div>

          {/* Printable 80mm / 58mm Z-Report Container */}
          <div className="p-4 bg-slate-100 rounded-2xl flex justify-center">
            <div
              id="shift-z-report-area"
              className="w-80 bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-sm space-y-3.5 text-slate-900 font-mono text-xs"
            >
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                <h4 className="text-sm font-black uppercase tracking-wider">
                  UNIVERSAL MAGAZIN
                </h4>
                <div className="text-[11px] font-bold text-slate-700">
                  *** Z-HISOBOT (SMENA YAKUNI) ***
                </div>
                <div className="text-[10px] text-slate-500">
                  Smena: #{zReportResult.shiftNumber}
                </div>
                <div className="text-[10px] text-slate-500">
                  Kassir: {zReportResult.cashierName}
                </div>
                <div className="text-[10px] text-slate-500">
                  Ochilgan: {formatDateTime(zReportResult.openedAt)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Yopilgan: {formatDateTime(zReportResult.closedAt)}
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold uppercase text-[10px] text-slate-400">
                  Tushumlar Tahlili:
                </div>
                <div className="flex justify-between">
                  <span>Naqd Savdo:</span>
                  <span className="font-bold">
                    {formatCurrency(zReportResult.cashSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Plastik Karta (Uzcard/Humo):</span>
                  <span className="font-bold">
                    {formatCurrency(zReportResult.cardSales)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nasiya (Qarz):</span>
                  <span className="font-bold">
                    {formatCurrency(zReportResult.debtSales)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm">
                  <span>JAMI SAVDO:</span>
                  <span className="text-indigo-700">
                    {formatCurrency(zReportResult.totalSales)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Cheklar soni:</span>
                  <span>{zReportResult.ordersCount} ta chek</span>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold uppercase text-[10px] text-slate-400">
                  Kassa Naqd Puli Solishtirmasi:
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Boshlangʻich mayda pul:</span>
                  <span>{formatCurrency(zReportResult.openingCashBalance)}</span>
                </div>
                {zReportResult.cashIn > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Kassa toʻldirish (+):</span>
                    <span>+{formatCurrency(zReportResult.cashIn)}</span>
                  </div>
                )}
                {zReportResult.cashOut > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Xarajat / Chiqim (-):</span>
                    <span>-{formatCurrency(zReportResult.cashOut)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700 font-semibold">
                  <span>Kassada boʻlishi kerak:</span>
                  <span>{formatCurrency(zReportResult.expectedCashInDrawer)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                  <span>FAKTIK NAQD SANALGAN:</span>
                  <span>{formatCurrency(zReportResult.actualCashInDrawer)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span>FARQ (Kamomad / Ortiqcha):</span>
                  <span
                    className={
                      zReportResult.difference === 0
                        ? 'text-emerald-600'
                        : zReportResult.difference < 0
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }
                  >
                    {zReportResult.difference === 0
                      ? '0 (Toʻliq mos keldi)'
                      : `${formatCurrency(zReportResult.difference)}`}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-1 text-[10px] text-slate-400 space-y-1">
                <div>Kassir imzosi: ___________________</div>
                <div>Direktor imzosi: _________________</div>
                <div>Z-Hisobot tasdiqlandi</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Yopish
            </button>
            <button
              type="button"
              onClick={handlePrintZReport}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Z-Hisobotni Chop Etish</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 2: NO SHIFT OPEN -> OPEN NEW SHIFT FORM
  // ----------------------------------------------------------------------
  if (!currentShift || currentShift.status !== 'OPEN') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Yangi Kassa Smenasini Ochish"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleOpenShift} className="space-y-5">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-bold block text-sm">
                Xush kelibsiz! Savdo boshlash uchun yangi smenani oching.
              </span>
              <p className="text-indigo-700/90 leading-relaxed">
                Kassaga boshlangʻich mayda pul (qaytim berish uchun) qoldigʻini kiritib, smenani faollashtiring.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Kassir Ismi / Familiyasi</span>
              </label>
              <input
                type="text"
                required
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="masalan: Alisher Navoiy"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-indigo-600" />
                <span>Boshlangʻich Kassa Naqd Puli (Mayda pul / Sdacha)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="masalan: 100 000"
                  className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                  SOʻM
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {['0', '50000', '100000', '200000', '300000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setOpeningCash(amt)}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-all"
                  >
                    {amt === '0' ? '0 soʻm' : `${parseInt(amt) / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Qoʻshimcha Izoh (Ixtiyoriy)
              </label>
              <input
                type="text"
                value={openNote}
                onChange={(e) => setOpenNote(e.target.value)}
                placeholder="masalan: 1-kassa ertalabki smena"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>Smenani Ochish</span>
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 3: ACTIVE SHIFT DASHBOARD (Live Metrics, Cash In/Out, Close Shift)
  // ----------------------------------------------------------------------
  const expectedCashInDrawer =
    currentShift.openingCashBalance +
    currentShift.cashSales +
    currentShift.cashIn -
    currentShift.cashOut;

  const actualNum = parseFloat(actualCashInput) || 0;
  const liveDifference = actualNum - expectedCashInDrawer;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kassa Smenasi #${currentShift.shiftNumber} Boshqaruvi`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Active Shift Header Card */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Smena Faol (Ochiq)
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-semibold">
                Smena #{currentShift.shiftNumber}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Ochilgan: {formatDateTime(currentShift.openedAt)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Kassir
              </span>
              <div className="text-lg font-black text-white mt-0.5">
                {currentShift.cashierName}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Jami Savdo Tushumi
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mt-0.5">
                {formatCurrency(currentShift.totalSales)}
              </div>
              <span className="text-[11px] text-slate-300">
                {currentShift.ordersCount} ta muvaffaqiyatli chek
              </span>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Naqd Savdo</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-950">
              {formatCurrency(currentShift.cashSales)}
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-1">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Plastik Karta</span>
            </div>
            <div className="text-base sm:text-lg font-black text-blue-950">
              {formatCurrency(currentShift.cardSales)}
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Nasiya (Qarz)</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-950">
              {formatCurrency(currentShift.debtSales)}
            </div>
          </div>

          <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 mb-1">
              <Banknote className="w-4 h-4 text-purple-600" />
              <span>Kassadagi Naqd</span>
            </div>
            <div className="text-base sm:text-lg font-black text-purple-950">
              {formatCurrency(expectedCashInDrawer)}
            </div>
          </div>
        </div>

        {/* Cash In / Out and Operations Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="text-xs text-slate-600 space-y-0.5">
            <div className="font-bold text-slate-800">Kassa operatsiyalari:</div>
            <div className="text-[11px] text-slate-500">
              Boshlangʻich mayda pul: <strong>{formatCurrency(currentShift.openingCashBalance)}</strong>
              {currentShift.cashIn > 0 && ` • Kiritilgan: +${formatCurrency(currentShift.cashIn)}`}
              {currentShift.cashOut > 0 && ` • Chiqim: -${formatCurrency(currentShift.cashOut)}`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCashOpType('CASH_IN');
                setIsCashOpOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pul Kiritish</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCashOpType('CASH_OUT');
                setIsCashOpOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Chiqim (Xarajat)</span>
            </button>
          </div>
        </div>

        {/* CASH IN / OUT MINI MODAL / INLINE FORM */}
        {isCashOpOpen && (
          <form
            onSubmit={handleSaveCashOp}
            className="p-4 bg-white border-2 border-indigo-200 rounded-2xl shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {cashOpType === 'CASH_IN'
                  ? '➕ Kassani Toʻldirish (Pul Kiritish)'
                  : '➖ Kassadan Chiqim / Xarajat / Inkassatsiya'}
              </span>
              <button
                type="button"
                onClick={() => setIsCashOpOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Summa (soʻm)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={cashOpAmount}
                  onChange={(e) => setCashOpAmount(e.target.value)}
                  placeholder="masalan: 50 000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Sabab / Izoh
                </label>
                <input
                  type="text"
                  required
                  value={cashOpReason}
                  onChange={(e) => setCashOpReason(e.target.value)}
                  placeholder={
                    cashOpType === 'CASH_IN'
                      ? 'masalan: Qaytim uchun mayda pul'
                      : 'masalan: Tushlik yoki inkassatsiya'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCashOpOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-xs"
              >
                Tasdiqlash
              </button>
            </div>
          </form>
        )}

        {/* CLOSE SHIFT ACCORDION / SECTION */}
        <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Smenani Yopish & Z-Otchyot (Hisobot)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">
              Kassa yakuni
            </span>
          </div>

          <form onSubmit={handleCloseShift} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kassada Hozir Sanalgan Faktik Naqd Pul (soʻm):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  min="0"
                  required
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  placeholder="Kassadagi hamma naqd pulni sanab yozing"
                  className="w-full pl-4 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                  SOʻM
                </span>
              </div>
            </div>

            {/* Reconciliation Live Difference Alert */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                liveDifference === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : liveDifference < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {liveDifference === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  Hisoblangan naqd: <strong>{formatCurrency(expectedCashInDrawer)}</strong>
                </span>
              </div>

              <div className="font-bold">
                {liveDifference === 0 ? (
                  <span>✅ Farq yoʻq (100% toʻgʻri)</span>
                ) : liveDifference < 0 ? (
                  <span>⚠️ Kamomad: {formatCurrency(liveDifference)}</span>
                ) : (
                  <span>ℹ️ Ortiqcha: +{formatCurrency(liveDifference)}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Smena yopilish izohi (ixtiyoriy)
              </label>
              <input
                type="text"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="masalan: Pul inkassatsiya xaltasiga joylandi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Orqaga
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Smenani Yopish & Z-Otchyot Chiqarish</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
