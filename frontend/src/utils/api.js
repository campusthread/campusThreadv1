/**
 * API Service for CampusThread Frontend
 * Handles all HTTP requests to the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const isFormData = options.body instanceof FormData;

    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the request
            return this.request(endpoint, options);
          }
          // Redirect to login
          localStorage.clear();
          window.location.href = '/auth';
          throw new Error('Unauthorized');
        }
        throw new Error(data.message || 'API Error');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    const requestBody = body instanceof FormData ? body : JSON.stringify(body);
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: requestBody,
    });
  }

  async put(endpoint, body, options = {}) {
    const requestBody = body instanceof FormData ? body : JSON.stringify(body);
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: requestBody,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('media', file);

    for (const [key, value] of Object.entries(additionalData)) {
      formData.append(key, value);
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
  }
}

const apiClient = new APIClient(API_URL);

// ============================================
// PRODUCT ENDPOINTS
// ============================================
export const productAPI = {
  getAll: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/products?${queryString}`);
  },
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  uploadMedia: (productId, file) => apiClient.uploadFile(`/products/${productId}/media`, file),
  getVendorProducts: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/products/vendor/products?${queryString}`);
  },
  addReview: (productId, data) => apiClient.post(`/products/${productId}/reviews`, data),
};

// ============================================
// VENDOR ENDPOINTS
// ============================================
export const vendorAPI = {
  getProfile: () => apiClient.get('/vendors/profile'),
  updateProfile: (data) => apiClient.put('/vendors/profile', data),
  uploadProfilePicture: (file) => apiClient.uploadFile('/vendors/profile/picture', file),
  getStats: () => apiClient.get('/vendors/stats'),
  getDashboard: () => apiClient.get('/vendors/dashboard'),
};

// ============================================
// ORDER ENDPOINTS
// ============================================
export const orderAPI = {
  create: (data) => apiClient.post('/orders', data),
  getById: (id) => apiClient.get(`/orders/${id}`),
  getUserOrders: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/orders/user/orders?${queryString}`);
  },
  getVendorOrders: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/orders/vendor/orders?${queryString}`);
  },
  updateStatus: (id, status, trackingNumber, note) =>
    apiClient.put(`/orders/${id}/status`, { status, trackingNumber, note }),
  initializePayment: (orderId, email) => apiClient.post(`/orders/${orderId}/initialize-payment`, { email }),
  verifyPayment: (reference) => apiClient.get(`/orders/payment/verify?reference=${reference}`),
};

export default apiClient;
