import { apiRequest } from './api';

export const productService = {
  async getAllProducts() {
    let all = [];
    let url = '/api/product/';

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

  async getProduct(id) {
    return apiRequest(`/api/product/${id}/`);
  },

  async createProduct(payload) {
    const body = {
      unit: payload.unit || 'ITEM',
      category: payload.category,
      name: payload.name.trim(),
      description: payload.description ? payload.description.trim() : payload.name.trim(),
      cost_price: String(payload.cost_price ?? '0.00'),
      sell_price: String(payload.sell_price ?? '0.00'),
      stock_quantity: parseInt(payload.stock_quantity ?? 0, 10),
      is_fast_button: Boolean(payload.is_fast_button),
      is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
    };

    if (payload.barcode && payload.barcode.trim()) {
      body.barcode = payload.barcode.trim();
    }

    return apiRequest('/api/product/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateProduct(id, payload) {
    return apiRequest(`/api/product/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async updateStock(id, newStockQuantity) {
    return apiRequest(`/api/product/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantity: Math.max(0, parseInt(newStockQuantity, 10)) }),
    });
  },

  async deleteProduct(id) {
    return apiRequest(`/api/product/${id}/`, {
      method: 'DELETE',
    });
  },
};
