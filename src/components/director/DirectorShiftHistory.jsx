import React, { useState } from 'react';
import {
  Clock,
  User,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Search,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { shiftService } from '../../services/shiftService';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export function DirectorShiftHistory() {
  const toast = useToast();
  const [shifts, setShifts] = useState(() => shiftService.getShiftHistory());
  const [activeShift, setActiveShift] = useState(() => shiftService.getCurrentShift());
  const [selectedZReport, setSelectedZReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleRefresh = () => {
    setShifts(shiftService.getShiftHistory());
    setActiveShift(shiftService.getCurrentShift());
    toast.success('Smenalar roʻyxati yangilandi', 1500);
  };

  const handlePrintZReport = () => {
    window.print();
  };

  const filteredShifts = shifts.filter((s) => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      s.cashierName?.toLowerCase().includes(query) ||
      String(s.shiftNumber).includes(query) ||
      s.id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
              Kassa Boshqaruvi
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Kassirlar smenalari va Z-Hisobotlar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Kassa Smenalari Tarixi & Z-Otchyotlar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Har bir kassa smenasining ochilish va yopilish vaqti, naqd va karta tushumlari, kamomad yoki ortiqcha pul solishtirmasi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Yangilash</span>
        </button>
      </div>

      {/* CURRENT ACTIVE SHIFT CARD (IF OPEN) */}
      {activeShift && activeShift.status === 'OPEN' && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-emerald-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Ayni Paytda Ochiq Smena: #{activeShift.shiftNumber}
              </span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ochilgan vaqt: {formatDateTime(activeShift.openedAt)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                Kassir
              </span>
              <span className="text-base font-black text-white mt-0.5 block">
                {activeShift.cashierName}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                Jami Tushum
              </span>
              <span className="text-base font-black text-amber-300 mt-0.5 block">
                {formatCurrency(activeShift.totalSales)}
              </span>
              <span className="text-[10px] text-slate-400">
                {activeShift.ordersCount} ta chek
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                Naqd / Karta
              </span>
              <span className="text-xs font-bold text-slate-200 mt-1 block">
                Naqd: {formatCurrency(activeShift.cashSales)}
              </span>
              <span className="text-xs font-bold text-indigo-300 block">
                Karta: {formatCurrency(activeShift.cardSales)}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold block">
                Kassadagi Naqd
              </span>
              <span className="text-base font-black text-emerald-300 mt-0.5 block">
                {formatCurrency(
                  activeShift.openingCashBalance +
                    activeShift.cashSales +
                    activeShift.cashIn -
                    activeShift.cashOut
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT HISTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              Yopilgan Smenalar Arxivi (Z-Hisobotlar)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {filteredShifts.length} ta smena
            </span>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Kassir yoki smena №..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Hozircha yopilgan smenalar mavjud emas
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Kassir ish kuni yakunida smenani yopganda, barcha Z-Hisobotlar bu yerda avtomatik saqlanib boradi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 pl-2">Smena №</th>
                  <th className="pb-3">Kassir</th>
                  <th className="pb-3">Ochilgan / Yopilgan</th>
                  <th className="pb-3">Savdolar (Naqd / Karta)</th>
                  <th className="pb-3">Jami Savdo</th>
                  <th className="pb-3">Kassadagi Naqd & Farq</th>
                  <th className="pb-3 pr-2 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.map((shift) => {
                  const isBalanced = shift.difference === 0;
                  const isShortage = shift.difference < 0;

                  return (
                    <tr
                      key={shift.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 pl-2 font-mono font-bold text-slate-900">
                        #{shift.shiftNumber}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {shift.cashierName}
                      </td>
                      <td className="py-3 text-slate-500 space-y-0.5">
                        <div>Ochilgan: {formatDateTime(shift.openedAt)}</div>
                        <div className="text-[11px] text-slate-400">
                          Yopilgan: {formatDateTime(shift.closedAt)}
                        </div>
                      </td>
                      <td className="py-3 space-y-0.5">
                        <div className="text-emerald-700 font-bold">
                          Naqd: {formatCurrency(shift.cashSales)}
                        </div>
                        <div className="text-indigo-600 font-semibold text-[11px]">
                          Karta: {formatCurrency(shift.cardSales)}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          {shift.ordersCount} ta chek
                        </div>
                      </td>
                      <td className="py-3 font-black text-sm text-slate-900">
                        {formatCurrency(shift.totalSales)}
                      </td>
                      <td className="py-3 space-y-1">
                        <div className="text-slate-700 font-bold">
                          Sanalgan: {formatCurrency(shift.actualCashInDrawer)}
                        </div>
                        <div>
                          {isBalanced ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Kamomad yoʻq</span>
                            </span>
                          ) : isShortage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Kamomad: {formatCurrency(shift.difference)}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span>Ortiqcha: +{formatCurrency(shift.difference)}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedZReport(shift)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition-all cursor-pointer border border-purple-200 shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Z-Hisobot</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW & PRINT PAST Z-REPORT MODAL */}
      {selectedZReport && (
        <Modal
          isOpen={Boolean(selectedZReport)}
          onClose={() => setSelectedZReport(null)}
          title={`Z-Hisobot (Smena #${selectedZReport.shiftNumber})`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-2xl flex justify-center">
              <div
                id="shift-z-report-area"
                className="w-80 bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 shadow-sm space-y-3.5 text-slate-900 font-mono text-xs"
              >
                <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                  <h4 className="text-sm font-black uppercase tracking-wider">
                    UNIVERSAL MAGAZIN
                  </h4>
                  <div className="text-[11px] font-bold text-slate-700">
                    *** Z-HISOBOT (SMENA YAKUNI) ***
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Smena: #{selectedZReport.shiftNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Kassir: {selectedZReport.cashierName}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Ochilgan: {formatDateTime(selectedZReport.openedAt)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Yopilgan: {formatDateTime(selectedZReport.closedAt)}
                  </div>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                  <div className="font-bold uppercase text-[10px] text-slate-400">
                    Tushumlar Tahlili:
                  </div>
                  <div className="flex justify-between">
                    <span>Naqd Savdo:</span>
                    <span className="font-bold">
                      {formatCurrency(selectedZReport.cashSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plastik Karta:</span>
                    <span className="font-bold">
                      {formatCurrency(selectedZReport.cardSales)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nasiya (Qarz):</span>
                    <span className="font-bold">
                      {formatCurrency(selectedZReport.debtSales)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-black text-sm">
                    <span>JAMI SAVDO:</span>
                    <span className="text-indigo-700">
                      {formatCurrency(selectedZReport.totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Cheklar soni:</span>
                    <span>{selectedZReport.ordersCount} ta chek</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                  <div className="font-bold uppercase text-[10px] text-slate-400">
                    Kassa Solishtirmasi:
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Boshlangʻich mayda pul:</span>
                    <span>{formatCurrency(selectedZReport.openingCashBalance)}</span>
                  </div>
                  {selectedZReport.cashIn > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Kassa toʻldirish (+):</span>
                      <span>+{formatCurrency(selectedZReport.cashIn)}</span>
                    </div>
                  )}
                  {selectedZReport.cashOut > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Xarajat / Chiqim (-):</span>
                      <span>-{formatCurrency(selectedZReport.cashOut)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700 font-semibold">
                    <span>Kassada boʻlishi kerak:</span>
                    <span>{formatCurrency(selectedZReport.expectedCashInDrawer)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                    <span>FAKTIK NAQD:</span>
                    <span>{formatCurrency(selectedZReport.actualCashInDrawer)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1">
                    <span>FARQ (Kamomad / Ortiqcha):</span>
                    <span
                      className={
                        selectedZReport.difference === 0
                          ? 'text-emerald-600'
                          : selectedZReport.difference < 0
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }
                    >
                      {selectedZReport.difference === 0
                        ? '0 (Toʻliq toʻgʻri)'
                        : formatCurrency(selectedZReport.difference)}
                    </span>
                  </div>
                </div>

                {selectedZReport.closeNote && (
                  <div className="text-[11px] text-slate-500 italic">
                    Izoh: {selectedZReport.closeNote}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedZReport(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
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
      )}
    </div>
  );
}
