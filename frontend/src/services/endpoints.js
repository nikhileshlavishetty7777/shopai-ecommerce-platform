import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const productService = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  search: (q) => api.get('/products/search', { params: { q } }),
  featured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updateInventory: (id, data) => api.put(`/products/${id}/inventory`, data),
};

export const categoryService = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const cartService = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (itemId, data) => api.put(`/cart/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

export const wishlistService = {
  get: () => api.get('/wishlist'),
  toggle: (productId) => api.post(`/wishlist/toggle/${productId}`),
  moveToCart: (productId) => api.post(`/wishlist/move-to-cart/${productId}`),
};

export const orderService = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  adminList: (params) => api.get('/admin/orders', { params }),
  updateStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};

export const reviewService = {
  getForProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
};

export const couponService = {
  validate: (data) => api.post('/coupons/validate', data),
  adminList: () => api.get('/admin/coupons'),
  adminCreate: (data) => api.post('/admin/coupons', data),
  adminDelete: (id) => api.delete(`/admin/coupons/${id}`),
};

export const notificationService = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const userService = {
  updateProfile: (data) => api.put('/users/me', data),
  getAddresses: () => api.get('/users/me/addresses'),
  createAddress: (data) => api.post('/users/me/addresses', data),
  updateAddress: (id, data) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/me/addresses/${id}`),
  adminList: (params) => api.get('/admin/users', { params }),
  adminToggleActive: (id) => api.put(`/admin/users/${id}/toggle-active`),
  adminDelete: (id) => api.delete(`/admin/users/${id}`),
};

export const aiService = {
  personalizedRecommendations: (limit) => api.get('/recommendations/personalized', { params: { limit } }),
  similarProducts: (productId, limit) => api.get(`/recommendations/similar/${productId}`, { params: { limit } }),
  trending: (params) => api.get('/trending', { params }),
  bestSellers: (limit) => api.get('/trending/best-sellers', { params: { limit } }),
  topRated: (limit) => api.get('/trending/top-rated', { params: { limit } }),
  newArrivals: (limit) => api.get('/trending/new-arrivals', { params: { limit } }),
  chat: (data) => api.post('/chatbot/message', data),
  forecastRevenue: (days) => api.get('/forecast/revenue', { params: { days } }),
  forecastDemand: (productId, days) => api.get(`/forecast/product/${productId}/demand`, { params: { days } }),
  revenueSummary: () => api.get('/forecast/summary'),
};

export const analyticsService = {
  overview: () => api.get('/analytics/overview'),
  revenueTrend: (days) => api.get('/analytics/revenue-trend', { params: { days } }),
  userGrowth: (days) => api.get('/analytics/user-growth', { params: { days } }),
  categoryPerformance: () => api.get('/analytics/category-performance'),
  topProducts: (limit) => api.get('/analytics/top-products', { params: { limit } }),
  orderDistribution: () => api.get('/analytics/order-distribution'),
  ratingDistribution: () => api.get('/analytics/rating-distribution'),
  lowStock: () => api.get('/admin/inventory/low-stock'),
  inventory: (params) => api.get('/admin/inventory', { params }),
};
