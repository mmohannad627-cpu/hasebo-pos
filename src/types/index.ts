/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// GROCERY STORE ERP - CORE SYSTEM TYPES
// ==========================================

export type Language = 'ar' | 'en';
export type ThemeMode = 'dark' | 'light';

export type CurrencyCode = 'YER' | 'SAR' | 'USD' | 'AED' | 'EGP';

export interface CurrencyConfig {
  code: CurrencyCode;
  nameAr: string;
  nameEn: string;
  symbol: string;
  exchangeRateToYER: number; // base YER = 1
  isBase: boolean;
  decimalPlaces: number;
}

// User & Role Based Access Control (RBAC)
export type RoleName = 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'INVENTORY_MANAGER';

export type PermissionKey =
  | 'pos.access'
  | 'pos.discount'
  | 'pos.credit_sale'
  | 'pos.refund'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'products.cost_view'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.stocktake'
  | 'purchases.view'
  | 'purchases.create'
  | 'purchases.edit'
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.collect_debt'
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.pay'
  | 'expenses.view'
  | 'expenses.create'
  | 'cash_register.view'
  | 'cash_register.manage'
  | 'accounting.view'
  | 'reports.view'
  | 'reports.export'
  | 'users.manage'
  | 'branches.manage'
  | 'settings.manage'
  | 'ai.assistant'
  | 'ai.ocr';

export interface Role {
  id: string;
  name: RoleName;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  permissions: PermissionKey[];
  isSystem: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  roleId: string;
  role?: Role;
  branchIds: string[];
  currentBranchId: string;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  phone?: string;
  addressAr?: string;
  isMain: boolean;
  isActive: boolean;
  taxNumber?: string;
  receiptHeaderAr?: string;
  receiptFooterAr?: string;
  createdAt: string;
}

// Products & Inventory Models
export type ProductUnitType = 'piece' | 'carton' | 'box' | 'kg' | 'g' | 'liter' | 'pack' | 'bottle';

export interface ProductUnit {
  id: string;
  unitNameAr: string;
  unitNameEn: string;
  unitType: ProductUnitType;
  conversionFactor: number; // e.g. 1 carton = 24 pieces
  barcode?: string;
  purchasePrice: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  isBaseUnit: boolean;
}

export type UnitOption = ProductUnit;

export interface ProductBatch {
  id: string;
  batchNumber: string;
  productId: string;
  branchId: string;
  quantity: number;
  unitId: string;
  purchaseCost: number;
  productionDate?: string;
  expiryDate: string;
  supplierId?: string;
  purchaseInvoiceId?: string;
  isExpired?: boolean;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  iconName?: string;
  color?: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  barcode: string;
  internalBarcode?: string;
  categoryId: string;
  category?: ProductCategory;
  imageUrl?: string;
  baseUnit: ProductUnitType;
  units: ProductUnit[];
  minStockLevel: number;
  maxStockLevel?: number;
  currentStock: number; // in base unit
  averageCost: number;
  retailPrice: number;
  wholesalePrice?: number;
  hasBatches: boolean;
  batches?: ProductBatch[];
  manufacturer?: string;
  supplierId?: string;
  notes?: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  unitId?: string;
  priceType: 'retail' | 'wholesale' | 'cost';
  oldPrice: number;
  newPrice: number;
  changedByUserId: string;
  changedByUserName?: string;
  reason?: string;
  createdAt: string;
}

// Sales & POS Models
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'e_wallet' | 'credit';

export type SaleStatus = 'completed' | 'returned_partial' | 'returned_full' | 'voided';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productNameAr: string;
  barcode: string;
  unitId: string;
  unitNameAr: string;
  unitConversionFactor: number;
  quantity: number; // in chosen unit
  baseQuantity: number; // in base unit
  unitCost: number; // historical cost at sale moment
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  profit: number; // (unitPrice - unitCost) * quantity - discountAmount
  batchId?: string;
  isReturned?: boolean;
  returnedQuantity?: number;
}

export interface SalePayment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  currency: CurrencyCode;
  exchangeRate: number;
  referenceNumber?: string;
  accountId?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  branchId: string;
  branch?: Branch;
  userId: string;
  userName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent?: number;
  taxAmount: number;
  taxPercent?: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  totalCost: number; // historical sum
  grossProfit: number; // total - totalCost - tax
  payments: SalePayment[];
  status: SaleStatus;
  cashSessionId?: string;
  notes?: string;
  isOfflineSynced?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleReturnItem {
  id: string;
  returnId: string;
  saleItemId: string;
  productId: string;
  productNameAr: string;
  quantity: number;
  refundUnitPrice: number;
  restockCost: number;
  totalRefund: number;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  saleId: string;
  saleInvoiceNumber: string;
  branchId: string;
  userId: string;
  userName: string;
  customerId?: string;
  items: SaleReturnItem[];
  totalRefundAmount: number;
  refundMethod: PaymentMethod;
  reason: string;
  restockInventory: boolean;
  createdAt: string;
}

// Purchases & Suppliers
export type PurchaseStatus = 'received' | 'partially_received' | 'returned_full' | 'returned_partial';

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productNameAr: string;
  unitId: string;
  unitNameAr: string;
  unitConversionFactor: number;
  quantity: number;
  unitPurchasePrice: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  batchNumber?: string;
  productionDate?: string;
  expiryDate?: string;
}

export interface PurchasePayment {
  id: string;
  purchaseId: string;
  method: PaymentMethod;
  amount: number;
  accountId?: string;
  referenceNumber?: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber?: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  userId: string;
  userName: string;
  items: PurchaseItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  payments: PurchasePayment[];
  status: PurchaseStatus;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  nameAr: string;
  nameEn?: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  currentBalance: number; // positive = we owe them
  taxNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

// Customers & Receivables
export interface Customer {
  id: string;
  nameAr: string;
  nameEn?: string;
  phone: string;
  address?: string;
  currentBalance: number; // positive = customer owes us (debt)
  creditLimit: number;
  creditDays: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  branchId: string;
  type: 'sale_credit' | 'payment_received' | 'sale_return' | 'manual_adjustment';
  referenceId?: string;
  referenceNumber?: string;
  debit: number; // increases debt
  credit: number; // decreases debt
  balanceAfter: number;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  branchId: string;
  type: 'purchase_credit' | 'payment_made' | 'purchase_return' | 'manual_adjustment';
  referenceId?: string;
  referenceNumber?: string;
  debit: number; // we pay, lowers payable
  credit: number; // we buy, increases payable
  balanceAfter: number;
  notes?: string;
  userId: string;
  createdAt: string;
}

// Expenses & Cash Management
export type ExpenseCategory =
  | 'rent'
  | 'salaries'
  | 'electricity'
  | 'water'
  | 'maintenance'
  | 'transportation'
  | 'supplies'
  | 'taxes_fees'
  | 'marketing'
  | 'other';

export interface Expense {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  categoryLabelAr: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  accountId?: string;
  recipient?: string;
  description: string;
  receiptImageUrl?: string;
  userId: string;
  userName: string;
  cashSessionId?: string;
  createdAt: string;
}

export interface CashAccount {
  id: string;
  nameAr: string;
  nameEn: string;
  type: 'cash_register' | 'bank' | 'e_wallet' | 'safe';
  currency: CurrencyCode;
  currentBalance: number;
  branchId?: string;
  accountNumber?: string;
  isActive: boolean;
}

export interface CashSession {
  id: string;
  sessionNumber: string;
  branchId: string;
  userId: string;
  userName: string;
  openingCash: number;
  openingNotes?: string;
  openedAt: string;
  closingCashExpected?: number;
  closingCashActual?: number;
  difference?: number;
  closingNotes?: string;
  closedAt?: string;
  status: 'open' | 'closed';
  cashSalesTotal: number;
  cashRefundsTotal: number;
  customerCashPaymentsTotal: number;
  supplierCashPaymentsTotal: number;
  cashExpensesTotal: number;
  cashDepositsTotal: number;
  cashWithdrawalsTotal: number;
}

// Inventory Movements & Stocktaking
export type InventoryMovementType =
  | 'purchase'
  | 'sale'
  | 'sales_return'
  | 'purchase_return'
  | 'manual_adjustment'
  | 'stocktake_adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'damaged'
  | 'expired'
  | 'opening_stock';

export interface InventoryMovement {
  id: string;
  productId: string;
  productNameAr: string;
  branchId: string;
  type: InventoryMovementType;
  typeLabelAr: string;
  quantityChange: number; // positive = added, negative = deducted
  previousQuantity: number;
  newQuantity: number;
  unitCost: number;
  referenceId?: string;
  referenceNumber?: string;
  userId: string;
  userName: string;
  reason?: string;
  createdAt: string;
}

export interface StocktakeItem {
  id: string;
  stocktakeId: string;
  productId: string;
  productNameAr: string;
  barcode: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  unitCost: number;
  varianceValue: number;
  isAdjusted: boolean;
}

export interface Stocktake {
  id: string;
  stocktakeNumber: string;
  branchId: string;
  userId: string;
  userName: string;
  titleAr: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  items: StocktakeItem[];
  totalSystemQty: number;
  totalActualQty: number;
  totalVarianceValue: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

// Audit Log & Notifications
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  branchId?: string;
  action: string;
  actionAr: string;
  entity: 'sale' | 'purchase' | 'product' | 'customer' | 'supplier' | 'expense' | 'user' | 'inventory' | 'auth' | 'settings' | 'ai';
  entityId?: string;
  details?: string;
  beforeState?: any;
  afterState?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  type: 'low_stock' | 'expired_product' | 'expiring_soon' | 'customer_overdue' | 'cash_difference' | 'system_alert' | 'ai_insight';
  titleAr: string;
  messageAr: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  link?: string;
  entityId?: string;
  createdAt: string;
}

// System Settings & Subscription
export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  commercialRegNo?: string;
  taxNumber?: string;
  phone: string;
  email?: string;
  addressAr: string;
  logoUrl?: string;
  baseCurrency: CurrencyCode;
  enableTax: boolean;
  defaultTaxRate: number; // e.g. 5% or 15%
  isTaxInclusive: boolean;
  expiryWarningDays: number;
  lowStockGlobalThreshold: number;
  enableCustomerCreditLimit: boolean;
  creditLimitAction: 'warn' | 'block' | 'manager_approval';
  receiptPrinterType: '58mm' | '80mm' | 'A4';
  receiptHeaderMessageAr: string;
  receiptFooterMessageAr: string;
  receiptHeaderAr?: string;
  receiptFooterAr?: string;
  allowNegativeStock: boolean;
  costingMethod: 'FIFO' | 'WEIGHTED_AVG' | 'FEFO';
  autoBackupIntervalHours: number;
  offlineSyncEnabled: boolean;
}

export type SubscriptionStatus =
  | 'FREE'
  | 'TRIAL'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PAST_DUE'
  | 'PROMOTIONAL';

export type PlanId = 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
export type SubscriptionPlan = PlanId;

export interface PlanConfig {
  id: PlanId;
  nameAr: string;
  nameEn: string;
  priceUSD: number;
  interval: 'lifetime' | 'monthly' | 'yearly';
  billingPeriodMonths: number;
  badge?: string;
  savingTextAr?: string;
  descriptionAr: string;
  features: {
    textAr: string;
    included: boolean;
    highlight?: boolean;
  }[];
  maxProducts: number; // e.g. 100 for Free, -1 for unlimited
  maxInvoicesPerMonth: number;
  maxUsers: number;
  maxBranches: number;
  aiAssistantAllowed: boolean;
  whatsappInvoicingAllowed: boolean;
  cameraScannerAllowed: boolean;
  cloudSyncAllowed: boolean;
  bluetoothPrintingAllowed: boolean;
  advancedReportsAllowed: boolean;
}

export interface StoreSubscription {
  storeId: string;
  storeNameAr: string;
  planId: PlanId;
  status: SubscriptionStatus;
  startDate: string;
  expiresAt: string;
  renewalDate?: string;
  cancelledAt?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  isTrial: boolean;
  remainingDays?: number;
  appliedCampaignId?: string;
  discountPercentage?: number;
  pricePaidUSD?: number;
  autoRenew: boolean;
  claimedLaunchOffer: boolean;
  lastPaymentDate?: string;
  paymentMethod?: 'card' | 'kuraimi' | 'wallet' | 'store_credit' | 'google_play' | 'apple_store';
}

export interface LaunchCampaign {
  id: 'LAUNCH_10_STORES' | 'EARLY_CUSTOMER_50' | string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  maxClaims: number;
  currentClaims: number;
  claimedStoreIds: string[];
  isActive: boolean;
  discountPercentage: number;
  trialDays: number;
  eligiblePlanId: PlanId;
  startDate: string;
  endDate?: string;
  badgeAr?: string;
}

export interface SubscriptionInvoice {
  id: string;
  storeId: string;
  invoiceNumber: string;
  planId: PlanId;
  planNameAr: string;
  amountUSD: number;
  discountUSD: number;
  totalPaidUSD: number;
  currency: string;
  paymentMethod: string;
  status: 'PAID' | 'REFUNDED' | 'FAILED' | 'PENDING';
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  notesAr?: string;
}

export interface SubscriptionState {
  currentSubscription: StoreSubscription;
  plans: PlanConfig[];
  campaigns: LaunchCampaign[];
  invoices: SubscriptionInvoice[];
}

export interface EntitlementCheckResult {
  allowed: boolean;
  reasonAr?: string;
  requiredPlan?: PlanId;
}
