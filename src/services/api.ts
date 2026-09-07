/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim();
const API_BASE = configuredApiBase.replace(/\/$/, '');

export function getAuthToken(): string | null {
  return localStorage.getItem('grocery_erp_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('grocery_erp_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('grocery_erp_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'حدث خطأ في الاتصال بالخادم';
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      // fallback text
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string; branchId?: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request<any>('/auth/me'),
  switchBranch: (branchId: string) =>
    request<any>('/auth/switch-branch', { method: 'POST', body: JSON.stringify({ branchId }) }),

  // Dashboard
  getDashboardStats: (branchId?: string, date?: string) =>
    request<any>(`/dashboard/stats?branchId=${branchId || ''}&date=${date || ''}`),

  // Categories & Products
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  getProducts: (params: { categoryId?: string; search?: string; lowStock?: boolean; activeOnly?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.search) query.set('search', params.search);
    if (params.lowStock) query.set('lowStock', 'true');
    if (params.activeOnly) query.set('activeOnly', 'true');
    return request<any[]>(`/products?${query.toString()}`);
  },
  getProductById: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),

  // POS & Sales
  checkoutSale: (saleData: any) => request<any>('/pos/checkout', { method: 'POST', body: JSON.stringify(saleData) }),
  getSales: (params: { branchId?: string; startDate?: string; endDate?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.branchId) query.set('branchId', params.branchId);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.search) query.set('search', params.search);
    return request<any[]>(`/sales?${query.toString()}`);
  },
  getSaleById: (id: string) => request<any>(`/sales/${id}`),
  returnSale: (returnData: any) => request<any>('/sales/return', { method: 'POST', body: JSON.stringify(returnData) }),

  // Suppliers & Purchases
  getSuppliers: () => request<any[]>('/suppliers'),
  createSupplier: (data: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getPurchases: () => request<any[]>('/purchases'),
  createPurchase: (data: any) => request<any>('/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Customers
  getCustomers: () => request<any[]>('/customers'),
  createCustomer: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  collectCustomerPayment: (data: any) => request<any>('/customers/payment', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerStatement: (id: string) => request<any>(`/customers/${id}/statement`),

  // Expenses & Cash
  getExpenses: () => request<any[]>('/expenses'),
  createExpense: (data: any) => request<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getActiveCashSession: () => request<any>('/cash-sessions/active'),
  openCashSession: (data: any) => request<any>('/cash-sessions/open', { method: 'POST', body: JSON.stringify(data) }),
  closeCashSession: (data: any) => request<any>('/cash-sessions/close', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventoryMovements: () => request<any[]>('/inventory/movements'),
  adjustInventory: (data: any) => request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),

  // Accounting
  getProfitAndLoss: (params: { startDate?: string; endDate?: string; branchId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.branchId) query.set('branchId', params.branchId);
    return request<any>(`/accounting/profit-loss?${query.toString()}`);
  },

  // AI
  askAIAdvisor: (query: string) => request<{ response: string }>('/ai/advisor', { method: 'POST', body: JSON.stringify({ query }) }),
  scanInvoiceAI: (imageBase64: string, mimeType = 'image/jpeg') =>
    request<any>('/ai/scan-invoice', { method: 'POST', body: JSON.stringify({ imageBase64, mimeType }) }),

  // Settings & Backups
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  createBackup: () => request<any>('/system/backup', { method: 'POST' }),
  listBackups: () => request<any[]>('/system/backups'),
  restoreBackup: (backupFileName: string) => request<any>('/system/restore', { method: 'POST', body: JSON.stringify({ backupFileName }) }),

  // Subscriptions, Pricing & Campaigns
  getSubscriptionState: () => request<any>('/subscriptions/state'),
  claimLaunchOffer: () => request<any>('/subscriptions/claim-launch-offer', { method: 'POST' }),
  subscribePlan: (data: { planId: string; billingPeriod?: 'monthly' | 'yearly'; paymentMethod?: string; appliedCampaignId?: string }) =>
    request<any>('/subscriptions/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  cancelSubscription: (reasonAr?: string) =>
    request<any>('/subscriptions/cancel', { method: 'POST', body: JSON.stringify({ reasonAr }) }),
  renewSubscription: () => request<any>('/subscriptions/renew', { method: 'POST' }),
  updateCampaignAdmin: (campaignId: string, data: any) =>
    request<any>(`/subscriptions/admin/campaigns/${campaignId}`, { method: 'PUT', body: JSON.stringify(data) }),
  updatePlanPriceAdmin: (planId: string, priceUSD: number) =>
    request<any>(`/subscriptions/admin/plans/${planId}`, { method: 'PUT', body: JSON.stringify({ priceUSD }) }),
};

