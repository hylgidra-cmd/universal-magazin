import { apiRequest } from './api';
import { toDecimalString } from '../utils/formatters';

export const debtService = {
  async getAllDebts() {
    let all = [];
    let url = '/api/debt/';

    while (url) {
      const data = await apiRequest(url);
      if (data && data.results) {
        all = all.concat(data.results);
        url = data.next ? data.next : null;
      } else if (Array.isArray(data)) {
        all = data;
        break;
      } else {
        break;
      }
    }
    return all;
  },

  async createDebt({ userId, cashierId, orderId, amount, paidAmount = 0, type = 'INCREASE' }) {
    return apiRequest('/api/debt/', {
      method: 'POST',
      body: JSON.stringify({
        user: parseInt(userId, 10),
        cashier: parseInt(cashierId, 10),
        order: parseInt(orderId, 10),
        type,
        amount: toDecimalString(amount),
        paid_amount: toDecimalString(paidAmount),
      }),
    });
  },

  async updateDebtPayment(debtId, paidAmount) {
    return apiRequest(`/api/debt/${debtId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        paid_amount: toDecimalString(paidAmount),
      }),
    });
  },
};
