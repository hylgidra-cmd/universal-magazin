// Shift (Smena) & Z-Report Service
// Manages Cashier Shift Lifecycle: Open Shift, Sales aggregation, Cash-in/Cash-out, Close Shift & Z-Report

const SHIFT_STORAGE_KEY = 'postore_active_shift';
const SHIFT_HISTORY_KEY = 'postore_shift_history';

export const shiftService = {
  /**
   * Retrieves currently open shift, or null if no active shift.
   */
  getCurrentShift() {
    try {
      const data = localStorage.getItem(SHIFT_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load active shift:', e);
      return null;
    }
  },

  /**
   * Opens a new shift for the cashier.
   */
  openShift({ cashierName = 'Kassir', openingCashBalance = 0, note = '' }) {
    const existing = this.getCurrentShift();
    if (existing && existing.status === 'OPEN') {
      return existing;
    }

    const shiftNumber = this.getNextShiftNumber();
    const newShift = {
      id: `SHIFT-${Date.now()}`,
      shiftNumber,
      cashierName,
      openedAt: new Date().toISOString(),
      closedAt: null,
      status: 'OPEN',
      openingCashBalance: Number(openingCashBalance) || 0,
      cashSales: 0,
      cardSales: 0,
      debtSales: 0,
      totalSales: 0,
      ordersCount: 0,
      cashIn: 0,   // Kassa to'ldirish (masalan mayda pul kiritish)
      cashOut: 0,  // Xarajat yoki inkassatsiya
      operations: [],
      note: note.trim(),
    };

    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(newShift));
    return newShift;
  },

  /**
   * Records a sale transaction to the active shift.
   */
  recordOrderSale({ orderId, paidCash = 0, paidCard = 0, paidDebt = 0, totalAmount = 0 }) {
    const shift = this.getCurrentShift();
    if (!shift || shift.status !== 'OPEN') return null;

    const cash = Number(paidCash) || 0;
    const card = Number(paidCard) || 0;
    const debt = Number(paidDebt) || 0;
    const total = Number(totalAmount) || (cash + card + debt);

    shift.cashSales = Math.round((shift.cashSales + cash) * 100) / 100;
    shift.cardSales = Math.round((shift.cardSales + card) * 100) / 100;
    shift.debtSales = Math.round((shift.debtSales + debt) * 100) / 100;
    shift.totalSales = Math.round((shift.totalSales + total) * 100) / 100;
    shift.ordersCount += 1;

    shift.operations.push({
      id: `OP-${Date.now()}`,
      type: 'SALE',
      orderId,
      amount: total,
      paidCash: cash,
      paidCard: card,
      paidDebt: debt,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
    return shift;
  },

  /**
   * Cash operation: Pul kiritish (CASH_IN) yoki Kassadan pul olish / Xarajat (CASH_OUT).
   */
  recordCashOperation(type, amount, reason = '') {
    const shift = this.getCurrentShift();
    if (!shift || shift.status !== 'OPEN') {
      throw new Error('Faol ochiq smena topilmadi');
    }

    const amt = Number(amount) || 0;
    if (amt <= 0) throw new Error("Miqdor 0 dan katta bo'lishi kerak");

    if (type === 'CASH_IN') {
      shift.cashIn = Math.round((shift.cashIn + amt) * 100) / 100;
    } else if (type === 'CASH_OUT') {
      shift.cashOut = Math.round((shift.cashOut + amt) * 100) / 100;
    } else {
      throw new Error('Nomaʼlum operatsiya turi');
    }

    shift.operations.push({
      id: `OP-${Date.now()}`,
      type,
      amount: amt,
      reason: reason.trim() || (type === 'CASH_IN' ? 'Kassani toʻldirish' : 'Xarajat / Chiqim'),
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(shift));
    return shift;
  },

  /**
   * Closes the active shift and generates the Z-Report.
   */
  closeShift({ actualCashInDrawer = 0, note = '' }) {
    const shift = this.getCurrentShift();
    if (!shift || shift.status !== 'OPEN') {
      throw new Error('Yopish uchun faol smena mavjud emas');
    }

    const expectedCashInDrawer =
      shift.openingCashBalance + shift.cashSales + shift.cashIn - shift.cashOut;
    const actualCash = Number(actualCashInDrawer) || 0;
    const difference = Math.round((actualCash - expectedCashInDrawer) * 100) / 100;

    const closedShift = {
      ...shift,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      expectedCashInDrawer,
      actualCashInDrawer: actualCash,
      difference, // 0 = aniq, < 0 = kamomad (kam), > 0 = ortiqcha
      closeNote: note.trim(),
    };

    // Save to history
    const history = this.getShiftHistory();
    history.unshift(closedShift);
    localStorage.setItem(SHIFT_HISTORY_KEY, JSON.stringify(history));

    // Clear active shift
    localStorage.removeItem(SHIFT_STORAGE_KEY);

    return closedShift;
  },

  /**
   * Retrieves shift history.
   */
  getShiftHistory() {
    try {
      const data = localStorage.getItem(SHIFT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load shift history:', e);
      return [];
    }
  },

  getNextShiftNumber() {
    const history = this.getShiftHistory();
    if (history.length === 0) return 1;
    const maxNum = Math.max(...history.map((s) => s.shiftNumber || 0));
    return maxNum + 1;
  },
};
