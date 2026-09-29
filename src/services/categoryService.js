import { apiRequest } from './api';

export const categoryService = {
  async getAllCategories() {
    let all = [];
    let url = '/api/category/';

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

  async createCategory(name) {
    return apiRequest('/api/category/', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
  },

  async updateCategory(oldName, newName) {
    const encoded = encodeURIComponent(oldName);
    return apiRequest(`/api/category/${encoded}/`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName.trim() }),
    });
  },

  async deleteCategory(name) {
    const encoded = encodeURIComponent(name);
    return apiRequest(`/api/category/${encoded}/`, {
      method: 'DELETE',
    });
  },
};
