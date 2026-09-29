import { apiRequest, getDeviceId } from './api';
import { toDecimalString } from '../utils/formatters';
import { authService } from './authService';
import { debtService } from './debtService';
import { productService } from './productService';

export const orderService = {
  async checkout({
    cartItems,
    paidCash = 0,
    paidCard = 0,
    paidDebt = 0,
    debtorUserId = null,
    autoDeductStock = true,
  }) {
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Savat bo'sh. Mahsulot qo'shing.");
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (Number(item.price || item.product.sell_price) * item.quantity),
      0
    );

    const cashNum = Number(paidCash) || 0;
    const cardNum = Number(paidCard) || 0;
    const debtNum = Number(paidDebt) || 0;
    const sumPaid = Math.round((cashNum + cardNum + debtNum) * 100) / 100;
    const totalRounded = Math.round(totalAmount * 100) / 100;

    if (Math.abs(sumPaid - totalRounded) > 0.05) {
      throw new Error(
        `To'lov summasi noto'g'ri! Jami: ${totalRounded}, Kiritilgan to'lov: ${sumPaid}`
      );
    }

    if (debtNum > 0 && !debtorUserId) {
      throw new Error("Nasiya (qarz) uchun mijoz ID'sini kiritish majburiy!");
    }

    const primaryProductId = cartItems[0].product.id;
    const deviceId = getDeviceId();

    const orderPayload = {
      product: primaryProductId,
      total_amount: toDecimalString(totalAmount),
      paid_cash: toDecimalString(cashNum),
      paid_card: toDecimalString(cardNum),
      paid_debt: toDecimalString(debtNum),
      device_id: deviceId,
    };

    const order = await apiRequest('/api/order/', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });

    const orderId = order.id;
    const createdItems = [];

    for (const item of cartItems) {
      try {
        const itemRes = await apiRequest('/api/order_item/', {
          method: 'POST',
          body: JSON.stringify({
            order: orderId,
            product: item.product.id,
            quantity: item.quantity,
            price: toDecimalString(item.price || item.product.sell_price),
          }),
        });
        createdItems.push(itemRes);

        if (autoDeductStock && item.product.stock_quantity !== undefined) {
          const newQty = Math.max(0, item.product.stock_quantity - item.quantity);
          productService.updateStock(item.product.id, newQty).catch((err) => {
            console.warn(`Could not update stock for product #${item.product.id}:`, err);
          });
        }
      } catch (itemErr) {
        console.error('Error creating order item:', itemErr);
      }
    }

    if (debtNum > 0 && debtorUserId) {
      const currentUser = authService.getCurrentUser();
      const cashierId = currentUser?.id || currentUser?.user_id;

      if (!cashierId) {
        throw new Error("Kassir ID aniqlanmadi (Debt yaratib bo'lmadi).");
      }

      await debtService.createDebt({
        userId: debtorUserId,
        cashierId: cashierId,
        orderId: orderId,
        amount: debtNum,
        paidAmount: 0,
      });
    }

    return { order, items: createdItems };
  },

  async getAllOrders() {
    let all = [];
    let url = '/api/order/';

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

  async getAllOrderItems() {
    let all = [];
    let url = '/api/order_item/';

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

  async returnOrder(orderId) {
    return apiRequest(`/api/order/${orderId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RETURNED' }),
    });
  },
};
