import { apiRequest } from './api';
import { productService } from './productService';

const OFFLINE_ORDERS_KEY = 'postore_offline_orders_queue';
const CACHED_PRODUCTS_KEY = 'postore_cached_products';
const CACHED_CATEGORIES_KEY = 'postore_cached_categories';

export const offlineSyncService = {
  // Check if browser is currently online
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  // Perform active ping check to verify true internet connectivity
  async checkRealConnection() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      await fetch('/favicon.ico?_ping=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  },

  // Cache catalog in LocalStorage for offline startup
  cacheCatalog(products, categories) {
    try {
      if (products && products.length > 0) {
        localStorage.setItem(CACHED_PRODUCTS_KEY, JSON.stringify(products));
      }
      if (categories && categories.length > 0) {
        localStorage.setItem(CACHED_CATEGORIES_KEY, JSON.stringify(categories));
      }
    } catch (e) {
      console.warn('Could not cache catalog locally:', e);
    }
  },

  // Retrieve cached products if offline
  getCachedProducts() {
    try {
      const data = localStorage.getItem(CACHED_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Retrieve cached categories if offline
  getCachedCategories() {
    try {
      const data = localStorage.getItem(CACHED_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Get list of pending offline orders
  getPendingOrders() {
    try {
      const stored = localStorage.getItem(OFFLINE_ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Save order to offline queue
  saveOfflineOrder(orderData) {
    const queue = this.getPendingOrders();
    const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const offlineOrder = {
      ...orderData,
      id: offlineId,
      offline_id: offlineId,
      created_at: new Date().toISOString(),
      is_offline: true,
      sync_status: 'PENDING',
    };

    queue.push(offlineOrder);
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('offline-orders-updated', { detail: { count: queue.length } }));
    return offlineOrder;
  },

  // Deduct stock locally when sold offline
  deductLocalStock(cartItems) {
    try {
      const cached = this.getCachedProducts();
      if (!cached || cached.length === 0) return;

      const updated = cached.map((p) => {
        const item = cartItems.find((c) => c.product.id === p.id);
        if (item) {
          const currentStock = Number(p.stock_quantity) || 0;
          return {
            ...p,
            stock_quantity: Math.max(0, currentStock - Number(item.quantity)),
          };
        }
        return p;
      });

      localStorage.setItem(CACHED_PRODUCTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to deduct local cached stock:', e);
    }
  },

  // Synchronize pending offline orders with the backend server
  async syncPendingOrders() {
    const queue = this.getPendingOrders();
    if (queue.length === 0) {
      return { syncedCount: 0, failedCount: 0 };
    }

    if (!this.isOnline()) {
      throw new Error("Hozirda internet aloqasi yo'q. Ulangach qayta urinib ko'ring.");
    }

    let syncedCount = 0;
    const remainingQueue = [];

    for (const offlineOrder of queue) {
      try {
        const { orderPayload, cartItems, debtData } = offlineOrder;

        // 1. Send Order to backend
        const serverOrder = await apiRequest('/api/order/', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
        });

        const orderId = serverOrder.id;

        // 2. Send Order Items
        for (const item of cartItems) {
          await apiRequest('/api/order_item/', {
            method: 'POST',
            body: JSON.stringify({
              order: orderId,
              product: item.product.id,
              quantity: item.quantity,
              price: item.price || item.product.sell_price,
            }),
          }).catch((err) => console.warn('Sync order item err:', err));

          // Stock update on server
          if (item.product.stock_quantity !== undefined) {
            const newQty = Math.max(0, item.product.stock_quantity - item.quantity);
            productService.updateStock(item.product.id, newQty).catch(() => {});
          }
        }

        // 3. Send Debt if applicable
        if (debtData && debtData.amount > 0) {
          await apiRequest('/api/debt/', {
            method: 'POST',
            body: JSON.stringify({
              ...debtData,
              orderId,
            }),
          }).catch((err) => console.warn('Sync debt err:', err));
        }

        syncedCount++;
      } catch (err) {
        console.error('Failed to sync offline order:', offlineOrder.id, err);
        remainingQueue.push(offlineOrder);
      }
    }

    // Update remaining queue
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(remainingQueue));
    window.dispatchEvent(
      new CustomEvent('offline-orders-updated', { detail: { count: remainingQueue.length } })
    );

    return {
      syncedCount,
      failedCount: remainingQueue.length,
    };
  },
};

