/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { db } from '../db/database.js';
import {
  createToken,
  authMiddleware,
  requirePermission,
  logAudit,
  type AuthenticatedRequest,
} from '../auth/authService.js';
import { askBusinessAdvisor, scanInvoiceDocument } from '../gemini/aiService.js';
import type {
  Product,
  Sale,
  SaleItem,
  Purchase,
  Customer,
  Supplier,
  Expense,
  CashSession,
  Stocktake,
  InventoryMovement,
  CustomerTransaction,
  SupplierTransaction,
  ProductCategory,
  Branch,
  User,
} from '../../src/types/index.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================
apiRouter.post('/auth/login', (req, res) => {
  const { username, password, branchId } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
  }

  const database = db.getDb();
  const user = database.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  const isValid = db.verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  // Update current branch if provided and permitted
  if (branchId && user.branchIds.includes(branchId)) {
    user.currentBranchId = branchId;
  }
  user.lastLoginAt = new Date().toISOString();
  db.save();

  const token = createToken(user);
  const role = database.roles.find(r => r.id === user.roleId);
  const currentBranch = database.branches.find(b => b.id === user.currentBranchId) || database.branches[0];

  const { passwordHash, salt, ...safeUser } = user;
  logAudit(user.id, user.fullName, 'LOGIN', 'تسجيل دخول ناجح للمستخدم', 'auth', user.id, undefined, user.currentBranchId);

  res.json({
    token,
    user: safeUser,
    role,
    branch: currentBranch,
    settings: database.settings,
    currencies: database.currencies,
  });
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  const currentBranch = database.branches.find(b => b.id === req.user?.currentBranchId) || database.branches[0];
  res.json({
    user: req.user,
    role: req.role,
    branch: currentBranch,
    settings: database.settings,
    currencies: database.currencies,
    subscription: database.subscription,
  });
});

apiRouter.post('/auth/switch-branch', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { branchId } = req.body;
  const database = db.getDb();
  const user = database.users.find(u => u.id === req.user?.id);
  const branch = database.branches.find(b => b.id === branchId && b.isActive);

  if (!user || !branch) {
    return res.status(400).json({ error: 'الفرع المطلوب غير موجود أو غير مفعل' });
  }

  if (req.role?.name !== 'SUPER_ADMIN' && !user.branchIds.includes(branchId)) {
    return res.status(403).json({ error: 'ليس لديك صلاحية الوصول إلى هذا الفرع' });
  }

  user.currentBranchId = branchId;
  db.save();

  logAudit(user.id, user.fullName, 'SWITCH_BRANCH', `التبديل إلى الفرع: ${branch.nameAr}`, 'auth', branchId, undefined, branchId);
  res.json({ success: true, branch, currentBranchId: branchId });
});

// ==========================================
// 2. DASHBOARD METRICS & REAL-TIME KPIS
// ==========================================
apiRouter.get('/dashboard/stats', authMiddleware, (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  const branchId = req.query.branchId as string || req.user?.currentBranchId;
  const filterDate = req.query.date as string || 'today';

  const todayStr = new Date().toISOString().split('T')[0];

  // Sales filter
  const branchSales = database.sales.filter(s => !branchId || s.branchId === branchId);
  const todaySales = branchSales.filter(s => s.createdAt.startsWith(todayStr) && s.status !== 'voided');

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayGrossProfit = todaySales.reduce((acc, s) => acc + s.grossProfit, 0);
  const todayInvoicesCount = todaySales.length;

  // Purchases filter
  const branchPurchases = database.purchases.filter(p => !branchId || p.branchId === branchId);
  const todayPurchases = branchPurchases.filter(p => p.createdAt.startsWith(todayStr));
  const todayPurchasesTotal = todayPurchases.reduce((acc, p) => acc + p.total, 0);

  // Expenses
  const branchExpenses = database.expenses.filter(e => !branchId || e.branchId === branchId);
  const todayExpenses = branchExpenses.filter(e => e.createdAt.startsWith(todayStr));
  const todayExpensesTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  const todayNetProfit = todayGrossProfit - todayExpensesTotal;

  // Inventory value & counts
  const totalProducts = database.products.filter(p => !p.isArchived).length;
  const lowStockProducts = database.products.filter(p => !p.isArchived && p.currentStock <= p.minStockLevel);
  const inventoryTotalValue = database.products.reduce((acc, p) => acc + (p.currentStock * p.averageCost), 0);

  // Balances
  const totalCustomerDebts = database.customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalSupplierPayables = database.suppliers.reduce((acc, s) => acc + s.currentBalance, 0);
  const totalCashBalance = database.cashAccounts.reduce((acc, a) => acc + a.currentBalance, 0);

  // Expiring items
  const now = Date.now();
  const expiringSoonBatches = database.batches.filter(b => {
    const diff = (new Date(b.expiryDate).getTime() - now) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 30;
  });

  // Recent 10 activities
  const recentSales = branchSales.slice(-8).reverse();
  const recentPurchases = branchPurchases.slice(-5).reverse();
  const recentActivities = database.auditLogs.slice(0, 10);

  res.json({
    todayRevenue,
    todayGrossProfit,
    todayNetProfit,
    todayExpensesTotal,
    todayPurchasesTotal,
    todayInvoicesCount,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 5),
    inventoryTotalValue,
    totalCustomerDebts,
    totalSupplierPayables,
    totalCashBalance,
    expiringSoonCount: expiringSoonBatches.length,
    recentSales,
    recentPurchases,
    recentActivities,
  });
});

// ==========================================
// 3. PRODUCTS & CATEGORIES & BATCHES
// ==========================================
apiRouter.get('/categories', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json(database.categories.filter(c => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder));
});

apiRouter.post('/categories', authMiddleware, requirePermission('products.create'), (req: AuthenticatedRequest, res) => {
  const { nameAr, nameEn, code, iconName, color } = req.body;
  if (!nameAr) return res.status(400).json({ error: 'اسم التصنيف مطلوب' });

  const database = db.getDb();
  const newCat: ProductCategory = {
    id: `cat_${Date.now()}`,
    nameAr,
    nameEn: nameEn || nameAr,
    code: code || `CAT-${database.categories.length + 1}`,
    iconName: iconName || 'Boxes',
    color: color || 'text-emerald-400 bg-emerald-500/10',
    displayOrder: database.categories.length + 1,
    isActive: true,
  };
  database.categories.push(newCat);
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'CREATE_CATEGORY', `إضافة تصنيف جديد: ${nameAr}`, 'product', newCat.id);
  res.json(newCat);
});

apiRouter.get('/products', authMiddleware, (req, res) => {
  const database = db.getDb();
  const { categoryId, search, lowStock, expiringSoon, activeOnly } = req.query;

  let list = database.products.filter(p => !p.isArchived);

  if (activeOnly === 'true') {
    list = list.filter(p => p.isActive);
  }

  if (categoryId) {
    list = list.filter(p => p.categoryId === categoryId);
  }

  if (lowStock === 'true') {
    list = list.filter(p => p.currentStock <= p.minStockLevel);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter(p =>
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.internalBarcode && p.internalBarcode.includes(q)) ||
      p.units.some(u => u.barcode && u.barcode.includes(q))
    );
  }

  // Attach category object & active batches
  const enriched = list.map(p => ({
    ...p,
    category: database.categories.find(c => c.id === p.categoryId),
    batches: database.batches.filter(b => b.productId === p.id),
  }));

  res.json(enriched);
});

apiRouter.get('/products/:id', authMiddleware, (req, res) => {
  const database = db.getDb();
  const product = database.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

  const category = database.categories.find(c => c.id === product.categoryId);
  const batches = database.batches.filter(b => b.productId === product.id);
  const priceHistory = database.priceHistories.filter(ph => ph.productId === product.id);

  res.json({ ...product, category, batches, priceHistory });
});

apiRouter.post('/products', authMiddleware, requirePermission('products.create'), (req: AuthenticatedRequest, res) => {
  const data = req.body;
  if (!data.nameAr || !data.barcode || !data.retailPrice) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم الصنف والباركود وسعر البيع' });
  }

  const database = db.getDb();
  // Check duplicate barcode
  const exists = database.products.find(p => p.barcode === data.barcode && !p.isArchived);
  if (exists) {
    return res.status(400).json({ error: 'رقم الباركود مسجل مسبقاً لصنف آخر' });
  }

  const productId = `prod_${Date.now()}`;
  const baseUnitId = `u_${Date.now()}_1`;

  const units = (data.units && data.units.length > 0)
    ? data.units
    : [
        {
          id: baseUnitId,
          unitNameAr: data.baseUnitNameAr || 'حبة',
          unitNameEn: data.baseUnitNameEn || 'Piece',
          unitType: data.baseUnit || 'piece',
          conversionFactor: 1,
          purchasePrice: Number(data.averageCost || data.retailPrice * 0.8),
          costPrice: Number(data.averageCost || data.retailPrice * 0.8),
          retailPrice: Number(data.retailPrice),
          wholesalePrice: Number(data.wholesalePrice || data.retailPrice * 0.95),
          isBaseUnit: true,
          barcode: data.barcode,
        },
      ];

  const newProduct: Product = {
    id: productId,
    nameAr: data.nameAr,
    nameEn: data.nameEn || data.nameAr,
    sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
    barcode: data.barcode,
    internalBarcode: data.internalBarcode,
    categoryId: data.categoryId || database.categories[0]?.id || 'cat_dairy',
    imageUrl: data.imageUrl,
    baseUnit: data.baseUnit || 'piece',
    units,
    minStockLevel: Number(data.minStockLevel || 10),
    maxStockLevel: Number(data.maxStockLevel || 200),
    currentStock: Number(data.currentStock || 0),
    averageCost: Number(data.averageCost || data.retailPrice * 0.8),
    retailPrice: Number(data.retailPrice),
    wholesalePrice: Number(data.wholesalePrice || data.retailPrice * 0.95),
    hasBatches: Boolean(data.hasBatches),
    manufacturer: data.manufacturer,
    supplierId: data.supplierId,
    notes: data.notes,
    isActive: true,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  database.products.push(newProduct);

  // If opening stock provided, log movement
  if (newProduct.currentStock > 0) {
    const mov: InventoryMovement = {
      id: `mov_init_${Date.now()}`,
      productId: newProduct.id,
      productNameAr: newProduct.nameAr,
      branchId: req.user!.currentBranchId,
      type: 'opening_stock',
      typeLabelAr: 'رصيد افتتاحي أولي',
      quantityChange: newProduct.currentStock,
      previousQuantity: 0,
      newQuantity: newProduct.currentStock,
      unitCost: newProduct.averageCost,
      userId: req.user!.id,
      userName: req.user!.fullName,
      reason: 'رصيد افتتاحي عند تعريف الصنف',
      createdAt: new Date().toISOString(),
    };
    database.inventoryMovements.unshift(mov);
  }

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'CREATE_PRODUCT', `إضافة منتج جديد: ${newProduct.nameAr}`, 'product', newProduct.id);

  res.status(201).json(newProduct);
});

apiRouter.put('/products/:id', authMiddleware, requirePermission('products.edit'), (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  const index = database.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'المنتج غير موجود' });

  const oldProduct = database.products[index];
  const updateData = req.body;

  // Track price changes
  if (updateData.retailPrice && updateData.retailPrice !== oldProduct.retailPrice) {
    database.priceHistories.unshift({
      id: `ph_${Date.now()}`,
      productId: oldProduct.id,
      priceType: 'retail',
      oldPrice: oldProduct.retailPrice,
      newPrice: Number(updateData.retailPrice),
      changedByUserId: req.user!.id,
      changedByUserName: req.user!.fullName,
      reason: updateData.priceChangeReason || 'تعديل سعر البيع',
      createdAt: new Date().toISOString(),
    });
  }

  database.products[index] = {
    ...oldProduct,
    ...updateData,
    updatedAt: new Date().toISOString(),
  };

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'EDIT_PRODUCT', `تعديل بيانات الصنف: ${oldProduct.nameAr}`, 'product', oldProduct.id);

  res.json(database.products[index]);
});

apiRouter.delete('/products/:id', authMiddleware, requirePermission('products.delete'), (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  const product = database.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

  // Soft-delete (archive) to protect historical financial integrity
  product.isArchived = true;
  product.isActive = false;
  product.updatedAt = new Date().toISOString();

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'ARCHIVE_PRODUCT', `أرشفة وتعطيل الصنف: ${product.nameAr}`, 'product', product.id);

  res.json({ success: true, message: 'تم أرشفة الصنف بنجاح وحفظ السجلات التاريخية' });
});

// ==========================================
// 4. POINT OF SALE (POS) & SALES TRANSACTIONS
// ==========================================
apiRouter.post('/pos/checkout', authMiddleware, requirePermission('pos.access'), (req: AuthenticatedRequest, res) => {
  const {
    items,
    customerId,
    discountAmount = 0,
    discountPercent = 0,
    taxAmount = 0,
    taxPercent = 0,
    payments,
    notes,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'السلة فارغة، يرجى إضافة أصناف لإتمام الفاتورة' });
  }

  const database = db.getDb();
  const branchId = req.user!.currentBranchId;
  const branch = database.branches.find(b => b.id === branchId) || database.branches[0];

  // Calculate totals & verify inventory
  let subtotal = 0;
  let totalCost = 0;
  const saleItems: SaleItem[] = [];

  const saleId = `sale_${Date.now()}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${(database.sales.length + 1001).toString().padStart(6, '0')}`;

  for (const it of items) {
    const product = database.products.find(p => p.id === it.productId);
    if (!product) {
      return res.status(400).json({ error: `المنتج غير موجود: ${it.productNameAr || it.productId}` });
    }

    const conversionFactor = Number(it.unitConversionFactor || 1);
    const qty = Number(it.quantity || 1);
    const baseQuantityDeduction = qty * conversionFactor;

    // Check stock if negative stock not allowed
    if (!database.settings.allowNegativeStock && product.currentStock < baseQuantityDeduction) {
      return res.status(400).json({
        error: `الكمية المتوفرة من (${product.nameAr}) غير كافية. المتوفر: ${product.currentStock} ${product.baseUnit}`,
      });
    }

    const unitPrice = Number(it.unitPrice);
    const itemDiscount = Number(it.discountAmount || 0);
    const itemSubtotal = unitPrice * qty - itemDiscount;
    const historicalUnitCost = product.averageCost * conversionFactor;
    const itemProfit = itemSubtotal - (historicalUnitCost * qty);

    subtotal += unitPrice * qty;
    totalCost += (product.averageCost * baseQuantityDeduction);

    saleItems.push({
      id: `si_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      saleId,
      productId: product.id,
      productNameAr: product.nameAr,
      barcode: it.barcode || product.barcode,
      unitId: it.unitId,
      unitNameAr: it.unitNameAr || 'حبة',
      unitConversionFactor: conversionFactor,
      quantity: qty,
      baseQuantity: baseQuantityDeduction,
      unitCost: historicalUnitCost,
      unitPrice,
      discountAmount: itemDiscount,
      subtotal: unitPrice * qty,
      taxAmount: 0,
      total: itemSubtotal,
      profit: itemProfit,
    });

    // 1. Deduct Product Inventory
    const prevQty = product.currentStock;
    product.currentStock -= baseQuantityDeduction;
    product.updatedAt = new Date().toISOString();

    // 2. Log immutable Inventory Movement
    database.inventoryMovements.unshift({
      id: `mov_sale_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      productId: product.id,
      productNameAr: product.nameAr,
      branchId,
      type: 'sale',
      typeLabelAr: 'مبيعات نقطة بيع',
      quantityChange: -baseQuantityDeduction,
      previousQuantity: prevQty,
      newQuantity: product.currentStock,
      unitCost: product.averageCost,
      referenceId: saleId,
      referenceNumber: invoiceNumber,
      userId: req.user!.id,
      userName: req.user!.fullName,
      createdAt: new Date().toISOString(),
    });

    // 3. Batch FEFO deduction if batches exist
    if (product.hasBatches) {
      let remainingToDeduct = baseQuantityDeduction;
      const sortedBatches = database.batches
        .filter(b => b.productId === product.id && b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      for (const batch of sortedBatches) {
        if (remainingToDeduct <= 0) break;
        const take = Math.min(batch.quantity, remainingToDeduct);
        batch.quantity -= take;
        remainingToDeduct -= take;
      }
    }
  }

  const finalTotal = subtotal - Number(discountAmount) + Number(taxAmount);

  // Customer handling
  const customer = database.customers.find(c => c.id === customerId) || database.customers[0];

  // Process payments
  let paidAmount = 0;
  const processedPayments = (payments || []).map((p: any) => {
    paidAmount += Number(p.amount || 0);
    return {
      id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      saleId,
      method: p.method || 'cash',
      amount: Number(p.amount || 0),
      currency: p.currency || 'YER',
      exchangeRate: Number(p.exchangeRate || 1),
      referenceNumber: p.referenceNumber,
      accountId: p.accountId || 'acc_drawer_main',
      createdAt: new Date().toISOString(),
    };
  });

  const remainingAmount = Math.max(0, finalTotal - paidAmount);
  const grossProfit = finalTotal - totalCost - Number(taxAmount);

  // 4. Update Customer Debt if credit sale
  if (remainingAmount > 0 && customer) {
    customer.currentBalance += remainingAmount;
    database.customerTransactions.unshift({
      id: `ctx_${Date.now()}`,
      customerId: customer.id,
      branchId,
      type: 'sale_credit',
      referenceId: saleId,
      referenceNumber: invoiceNumber,
      debit: remainingAmount,
      credit: 0,
      balanceAfter: customer.currentBalance,
      notes: `متبقي فاتورة بيع آجل (${invoiceNumber})`,
      userId: req.user!.id,
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Update Cash Drawer Session & Cash Account
  const cashPaid = processedPayments
    .filter((p: any) => p.method === 'cash')
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  if (cashPaid > 0) {
    const mainDrawer = database.cashAccounts.find(a => a.type === 'cash_register' && a.branchId === branchId) || database.cashAccounts[0];
    if (mainDrawer) {
      mainDrawer.currentBalance += cashPaid;
    }
    // Update active cash session
    const activeSession = database.cashSessions.find(cs => cs.status === 'open' && cs.branchId === branchId);
    if (activeSession) {
      activeSession.cashSalesTotal += cashPaid;
    }
  }

  const newSale: Sale = {
    id: saleId,
    invoiceNumber,
    branchId,
    branch,
    userId: req.user!.id,
    userName: req.user!.fullName,
    customerId: customer?.id,
    customerName: customer?.nameAr,
    customerPhone: customer?.phone,
    items: saleItems,
    subtotal,
    discountAmount: Number(discountAmount),
    discountPercent: Number(discountPercent),
    taxAmount: Number(taxAmount),
    taxPercent: Number(taxPercent),
    total: finalTotal,
    paidAmount,
    remainingAmount,
    totalCost,
    grossProfit,
    payments: processedPayments,
    status: 'completed',
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  database.sales.unshift(newSale);
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'POS_SALE', `إتمام فاتورة مبيعات ${invoiceNumber} بمبلغ ${finalTotal} ر.ي`, 'sale', saleId, undefined, branchId);

  res.status(201).json(newSale);
});

apiRouter.get('/sales', authMiddleware, (req, res) => {
  const database = db.getDb();
  const { branchId, startDate, endDate, customerId, search } = req.query;

  let list = database.sales;
  if (branchId) list = list.filter(s => s.branchId === branchId);
  if (customerId) list = list.filter(s => s.customerId === customerId);

  if (startDate) {
    list = list.filter(s => s.createdAt >= (startDate as string));
  }
  if (endDate) {
    list = list.filter(s => s.createdAt <= (endDate as string));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(s =>
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      s.userName.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

apiRouter.get('/sales/:id', authMiddleware, (req, res) => {
  const database = db.getDb();
  const sale = database.sales.find(s => s.id === req.params.id || s.invoiceNumber === req.params.id);
  if (!sale) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
  res.json(sale);
});

// Sales Returns
apiRouter.post('/sales/return', authMiddleware, requirePermission('pos.refund'), (req: AuthenticatedRequest, res) => {
  const { saleId, items, reason, refundMethod = 'cash', restockInventory = true } = req.body;
  const database = db.getDb();

  const sale = database.sales.find(s => s.id === saleId);
  if (!sale) return res.status(404).json({ error: 'فاتورة المبيعات الأصلية غير موجودة' });

  let totalRefund = 0;
  const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

  for (const it of items) {
    const saleItem = sale.items.find(si => si.id === it.saleItemId);
    if (!saleItem) continue;

    const returnQty = Number(it.quantity || 1);
    const lineRefund = (saleItem.unitPrice * returnQty) - (saleItem.discountAmount / saleItem.quantity * returnQty);
    totalRefund += lineRefund;

    saleItem.isReturned = true;
    saleItem.returnedQuantity = (saleItem.returnedQuantity || 0) + returnQty;

    // Restock product
    if (restockInventory) {
      const product = database.products.find(p => p.id === saleItem.productId);
      if (product) {
        const baseAdd = returnQty * saleItem.unitConversionFactor;
        product.currentStock += baseAdd;

        database.inventoryMovements.unshift({
          id: `mov_ret_${Date.now()}`,
          productId: product.id,
          productNameAr: product.nameAr,
          branchId: sale.branchId,
          type: 'sales_return',
          typeLabelAr: 'مرتجع مبيعات',
          quantityChange: baseAdd,
          previousQuantity: product.currentStock - baseAdd,
          newQuantity: product.currentStock,
          unitCost: product.averageCost,
          referenceId: sale.id,
          referenceNumber: returnNumber,
          userId: req.user!.id,
          userName: req.user!.fullName,
          reason,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Adjust sale status
  sale.status = 'returned_partial';
  sale.grossProfit = Math.max(0, sale.grossProfit - totalRefund * 0.2); // reverse proportional profit

  // Refund from cash drawer
  if (refundMethod === 'cash') {
    const mainDrawer = database.cashAccounts.find(a => a.type === 'cash_register' && a.branchId === sale.branchId);
    if (mainDrawer) {
      mainDrawer.currentBalance -= totalRefund;
    }
    const activeSession = database.cashSessions.find(cs => cs.status === 'open' && cs.branchId === sale.branchId);
    if (activeSession) {
      activeSession.cashRefundsTotal += totalRefund;
    }
  }

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'SALES_RETURN', `تسجيل مرتجع مبيعات ${returnNumber} بقيمة ${totalRefund} ر.ي للفاتورة ${sale.invoiceNumber}`, 'sale', sale.id);

  res.json({ success: true, returnNumber, totalRefund });
});

// ==========================================
// 5. PURCHASES & SUPPLIERS
// ==========================================
apiRouter.get('/suppliers', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json(database.suppliers);
});

apiRouter.post('/suppliers', authMiddleware, requirePermission('suppliers.create'), (req: AuthenticatedRequest, res) => {
  const { nameAr, nameEn, companyName, phone, email, address, notes, initialBalance = 0 } = req.body;
  if (!nameAr || !phone) {
    return res.status(400).json({ error: 'اسم المورد ورقم الهاتف مطلوبان' });
  }

  const database = db.getDb();
  const newSupplier: Supplier = {
    id: `sup_${Date.now()}`,
    nameAr,
    nameEn: nameEn || nameAr,
    companyName,
    phone,
    email,
    address,
    currentBalance: Number(initialBalance),
    notes,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  database.suppliers.push(newSupplier);
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'CREATE_SUPPLIER', `إضافة مورد جديد: ${nameAr}`, 'supplier', newSupplier.id);
  res.status(201).json(newSupplier);
});

apiRouter.get('/purchases', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json(database.purchases);
});

apiRouter.post('/purchases', authMiddleware, requirePermission('purchases.create'), (req: AuthenticatedRequest, res) => {
  const {
    supplierId,
    supplierInvoiceNumber,
    items,
    discountAmount = 0,
    taxAmount = 0,
    paidAmount = 0,
    paymentMethod = 'cash',
    accountId = 'acc_drawer_main',
    notes,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'يرجى إضافة أصناف لفاتورة الشراء' });
  }

  const database = db.getDb();
  const branchId = req.user!.currentBranchId;
  const supplier = database.suppliers.find(s => s.id === supplierId);
  if (!supplier) return res.status(400).json({ error: 'المورد غير محدد أو غير موجود' });

  let subtotal = 0;
  const purchaseId = `purch_${Date.now()}`;
  const invoiceNumber = `PUR-${new Date().getFullYear()}-${(database.purchases.length + 2001).toString().padStart(6, '0')}`;

  const purchaseItems = items.map((it: any) => {
    const qty = Number(it.quantity || 1);
    const price = Number(it.unitPurchasePrice || 0);
    const lineTotal = qty * price;
    subtotal += lineTotal;

    const conversionFactor = Number(it.unitConversionFactor || 1);
    const baseQuantityAdded = qty * conversionFactor;

    // Update Product Stock & Recalculate Weighted Average Cost
    const product = database.products.find(p => p.id === it.productId);
    if (product) {
      const prevStock = product.currentStock;
      const prevTotalCost = prevStock * product.averageCost;
      const newBatchCost = baseQuantityAdded * (price / conversionFactor);
      const newTotalStock = prevStock + baseQuantityAdded;

      // Weighted Average Cost Formula
      if (newTotalStock > 0) {
        product.averageCost = Math.round((prevTotalCost + newBatchCost) / newTotalStock);
      }
      product.currentStock = newTotalStock;
      product.updatedAt = new Date().toISOString();

      // Log inventory movement
      database.inventoryMovements.unshift({
        id: `mov_pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productNameAr: product.nameAr,
        branchId,
        type: 'purchase',
        typeLabelAr: 'فاتورة مشتريات وتوريد',
        quantityChange: baseQuantityAdded,
        previousQuantity: prevStock,
        newQuantity: product.currentStock,
        unitCost: price / conversionFactor,
        referenceId: purchaseId,
        referenceNumber: invoiceNumber,
        userId: req.user!.id,
        userName: req.user!.fullName,
        createdAt: new Date().toISOString(),
      });

      // If batch tracking enabled
      if (product.hasBatches && it.expiryDate) {
        database.batches.unshift({
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          batchNumber: it.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
          productId: product.id,
          branchId,
          quantity: baseQuantityAdded,
          unitId: it.unitId || product.units[0].id,
          purchaseCost: price / conversionFactor,
          productionDate: it.productionDate,
          expiryDate: it.expiryDate,
          supplierId: supplier.id,
          purchaseInvoiceId: purchaseId,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      purchaseId,
      productId: it.productId,
      productNameAr: it.productNameAr,
      unitId: it.unitId,
      unitNameAr: it.unitNameAr || 'حبة',
      unitConversionFactor: conversionFactor,
      quantity: qty,
      unitPurchasePrice: price,
      subtotal: lineTotal,
      taxAmount: 0,
      total: lineTotal,
      batchNumber: it.batchNumber,
      productionDate: it.productionDate,
      expiryDate: it.expiryDate,
    };
  });

  const finalTotal = subtotal - Number(discountAmount) + Number(taxAmount);
  const remaining = Math.max(0, finalTotal - Number(paidAmount));

  // Supplier balance update
  if (remaining > 0) {
    supplier.currentBalance += remaining;
    database.supplierTransactions.unshift({
      id: `stx_${Date.now()}`,
      supplierId: supplier.id,
      branchId,
      type: 'purchase_credit',
      referenceId: purchaseId,
      referenceNumber: invoiceNumber,
      debit: 0,
      credit: remaining,
      balanceAfter: supplier.currentBalance,
      notes: `متبقي فاتورة شراء (${invoiceNumber})`,
      userId: req.user!.id,
      createdAt: new Date().toISOString(),
    });
  }

  // Deduct payment from cash or bank
  if (paidAmount > 0) {
    const account = database.cashAccounts.find(a => a.id === accountId) || database.cashAccounts[0];
    if (account) {
      account.currentBalance -= Number(paidAmount);
    }
  }

  const newPurchase: Purchase = {
    id: purchaseId,
    invoiceNumber,
    supplierInvoiceNumber,
    supplierId: supplier.id,
    supplierName: supplier.nameAr,
    branchId,
    userId: req.user!.id,
    userName: req.user!.fullName,
    items: purchaseItems,
    subtotal,
    discountAmount: Number(discountAmount),
    taxAmount: Number(taxAmount),
    total: finalTotal,
    paidAmount: Number(paidAmount),
    remainingAmount: remaining,
    payments: paidAmount > 0 ? [{ id: `pp_${Date.now()}`, purchaseId, method: paymentMethod, amount: Number(paidAmount), accountId, createdAt: new Date().toISOString() }] : [],
    status: 'received',
    notes,
    createdAt: new Date().toISOString(),
  };

  database.purchases.unshift(newPurchase);
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'PURCHASE', `تسجيل فاتورة مشتريات ${invoiceNumber} بمبلغ ${finalTotal} ر.ي من المورد ${supplier.nameAr}`, 'purchase', purchaseId);

  res.status(201).json(newPurchase);
});

// ==========================================
// 6. CUSTOMERS & RECEIVABLES
// ==========================================
apiRouter.get('/customers', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json(database.customers);
});

apiRouter.post('/customers', authMiddleware, requirePermission('customers.create'), (req: AuthenticatedRequest, res) => {
  const { nameAr, nameEn, phone, address, creditLimit = 50000, creditDays = 30, notes, initialDebt = 0 } = req.body;
  if (!nameAr || !phone) {
    return res.status(400).json({ error: 'اسم العميل ورقم الهاتف مطلوبان' });
  }

  const database = db.getDb();
  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    nameAr,
    nameEn: nameEn || nameAr,
    phone,
    address,
    currentBalance: Number(initialDebt),
    creditLimit: Number(creditLimit),
    creditDays: Number(creditDays),
    isActive: true,
    notes,
    createdAt: new Date().toISOString(),
  };

  database.customers.push(newCustomer);
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'CREATE_CUSTOMER', `إضافة عميل جديد: ${nameAr}`, 'customer', newCustomer.id);
  res.status(201).json(newCustomer);
});

apiRouter.post('/customers/payment', authMiddleware, requirePermission('customers.collect_debt'), (req: AuthenticatedRequest, res) => {
  const { customerId, amount, paymentMethod = 'cash', accountId = 'acc_drawer_main', notes } = req.body;
  const numAmount = Number(amount);
  if (!customerId || !numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'بيانات سند القبض غير صحيحة' });
  }

  const database = db.getDb();
  const customer = database.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'العميل غير موجود' });

  customer.currentBalance -= numAmount;

  // Add payment to account
  const account = database.cashAccounts.find(a => a.id === accountId) || database.cashAccounts[0];
  if (account) {
    account.currentBalance += numAmount;
  }

  const refNumber = `RCV-${Date.now().toString().slice(-6)}`;
  database.customerTransactions.unshift({
    id: `ctx_${Date.now()}`,
    customerId: customer.id,
    branchId: req.user!.currentBranchId,
    type: 'payment_received',
    referenceNumber: refNumber,
    debit: 0,
    credit: numAmount,
    balanceAfter: customer.currentBalance,
    notes: notes || 'سند قبض وتحصيل نقدي من العميل',
    userId: req.user!.id,
    createdAt: new Date().toISOString(),
  });

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'COLLECT_DEBT', `تحصيل سند قبض بمبلغ ${numAmount} ر.ي من العميل ${customer.nameAr}`, 'customer', customer.id);

  res.json({ success: true, newBalance: customer.currentBalance, refNumber });
});

apiRouter.get('/customers/:id/statement', authMiddleware, (req, res) => {
  const database = db.getDb();
  const customer = database.customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'العميل غير موجود' });

  const txs = database.customerTransactions.filter(t => t.customerId === customer.id);
  const sales = database.sales.filter(s => s.customerId === customer.id);

  res.json({ customer, transactions: txs, sales });
});

// ==========================================
// 7. EXPENSES & CASHIER SESSIONS
// ==========================================
apiRouter.get('/expenses', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json(database.expenses);
});

apiRouter.post('/expenses', authMiddleware, requirePermission('expenses.create'), (req: AuthenticatedRequest, res) => {
  const { category, amount, description, recipient, paymentMethod = 'cash', accountId = 'acc_drawer_main' } = req.body;
  if (!category || !amount || Number(amount) <= 0 || !description) {
    return res.status(400).json({ error: 'الرجاء إدخال بند المصروف والمبلغ والبيان' });
  }

  const database = db.getDb();
  const branchId = req.user!.currentBranchId;

  const categoryLabels: Record<string, string> = {
    rent: 'إيجار المحل أو المستودع',
    salaries: 'رواتب وأجور العمال',
    electricity: 'كهرباء وطاقة وماطور',
    water: 'مياه وصرف صحي',
    maintenance: 'صيانة وتصليحات',
    transportation: 'نقل وشحن ومواصلات',
    supplies: 'مستلزمات وأكياس ومطبوعات',
    taxes_fees: 'رسوم حكومية وضرائب ورخص',
    marketing: 'دعاية وإعلان وعروض',
    other: 'مصاريف نثرية أخرى',
  };

  const newExpense: Expense = {
    id: `exp_${Date.now()}`,
    branchId,
    category,
    categoryLabelAr: categoryLabels[category] || 'مصروف عام',
    amount: Number(amount),
    currency: 'YER',
    paymentMethod,
    accountId,
    recipient,
    description,
    userId: req.user!.id,
    userName: req.user!.fullName,
    createdAt: new Date().toISOString(),
  };

  database.expenses.unshift(newExpense);

  // Deduct from cash drawer/account
  const account = database.cashAccounts.find(a => a.id === accountId) || database.cashAccounts[0];
  if (account) {
    account.currentBalance -= Number(amount);
  }

  const activeSession = database.cashSessions.find(cs => cs.status === 'open' && cs.branchId === branchId);
  if (activeSession && paymentMethod === 'cash') {
    activeSession.cashExpensesTotal += Number(amount);
  }

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'EXPENSE', `تسجيل سند صرف بمبلغ ${amount} ر.ي (${categoryLabels[category]})`, 'expense', newExpense.id);

  res.status(201).json(newExpense);
});

apiRouter.get('/cash-sessions/active', authMiddleware, (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  const branchId = req.user!.currentBranchId;
  const activeSession = database.cashSessions.find(cs => cs.status === 'open' && cs.branchId === branchId);
  res.json(activeSession || null);
});

apiRouter.post('/cash-sessions/open', authMiddleware, requirePermission('cash_register.manage'), (req: AuthenticatedRequest, res) => {
  const { openingCash = 0, openingNotes } = req.body;
  const database = db.getDb();
  const branchId = req.user!.currentBranchId;

  // Check if open session exists
  const existing = database.cashSessions.find(cs => cs.status === 'open' && cs.branchId === branchId);
  if (existing) {
    return res.status(400).json({ error: 'توجد جلسة صندوق مفتوحة بالفعل لهذا الفرع' });
  }

  const sessionNumber = `CS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(database.cashSessions.length + 1).toString().padStart(2, '0')}`;
  const newSession: CashSession = {
    id: `cs_${Date.now()}`,
    sessionNumber,
    branchId,
    userId: req.user!.id,
    userName: req.user!.fullName,
    openingCash: Number(openingCash),
    openingNotes,
    openedAt: new Date().toISOString(),
    status: 'open',
    cashSalesTotal: 0,
    cashRefundsTotal: 0,
    customerCashPaymentsTotal: 0,
    supplierCashPaymentsTotal: 0,
    cashExpensesTotal: 0,
    cashDepositsTotal: 0,
    cashWithdrawalsTotal: 0,
  };

  database.cashSessions.unshift(newSession);
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'OPEN_CASH_SESSION', `فتح وردية صندوق جديدة برصيد افتتاحي ${openingCash} ر.ي`, 'auth', newSession.id);
  res.status(201).json(newSession);
});

apiRouter.post('/cash-sessions/close', authMiddleware, requirePermission('cash_register.manage'), (req: AuthenticatedRequest, res) => {
  const { sessionId, closingCashActual, closingNotes } = req.body;
  const database = db.getDb();

  const session = database.cashSessions.find(cs => cs.id === sessionId && cs.status === 'open');
  if (!session) return res.status(404).json({ error: 'جلسة الصندوق غير موجودة أو مغلقة مسبقاً' });

  const expected = session.openingCash +
    session.cashSalesTotal +
    session.customerCashPaymentsTotal +
    session.cashDepositsTotal -
    session.cashRefundsTotal -
    session.supplierCashPaymentsTotal -
    session.cashExpensesTotal -
    session.cashWithdrawalsTotal;

  const actual = Number(closingCashActual);
  const diff = actual - expected;

  session.status = 'closed';
  session.closingCashExpected = expected;
  session.closingCashActual = actual;
  session.difference = diff;
  session.closingNotes = closingNotes;
  session.closedAt = new Date().toISOString();

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'CLOSE_CASH_SESSION', `إغلاق وردية الصندوق ${session.sessionNumber} - الفارق: ${diff} ر.ي`, 'auth', session.id);

  res.json(session);
});

// ==========================================
// 8. INVENTORY MOVEMENTS & STOCKTAKING
// ==========================================
apiRouter.get('/inventory/movements', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json(database.inventoryMovements);
});

apiRouter.post('/inventory/adjust', authMiddleware, requirePermission('inventory.adjust'), (req: AuthenticatedRequest, res) => {
  const { productId, adjustmentQty, reason } = req.body;
  const numAdj = Number(adjustmentQty);
  if (!productId || numAdj === 0) {
    return res.status(400).json({ error: 'بيانات التسوية غير صحيحة' });
  }

  const database = db.getDb();
  const product = database.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

  const prevQty = product.currentStock;
  product.currentStock += numAdj;
  product.updatedAt = new Date().toISOString();

  database.inventoryMovements.unshift({
    id: `mov_adj_${Date.now()}`,
    productId: product.id,
    productNameAr: product.nameAr,
    branchId: req.user!.currentBranchId,
    type: 'manual_adjustment',
    typeLabelAr: 'تسوية مخزنية يدوية',
    quantityChange: numAdj,
    previousQuantity: prevQty,
    newQuantity: product.currentStock,
    unitCost: product.averageCost,
    userId: req.user!.id,
    userName: req.user!.fullName,
    reason: reason || 'تسوية يدوية بناء على طلب الإدارة',
    createdAt: new Date().toISOString(),
  });

  db.save();
  logAudit(req.user!.id, req.user!.fullName, 'INVENTORY_ADJUST', `تسوية مخزنية للصنف ${product.nameAr} بفارق (${numAdj})`, 'inventory', product.id);

  res.json({ success: true, newStock: product.currentStock });
});

// ==========================================
// 9. ACCOUNTING ENGINE & REPORTS
// ==========================================
apiRouter.get('/accounting/profit-loss', authMiddleware, requirePermission('accounting.view'), (req, res) => {
  const database = db.getDb();
  const { startDate, endDate, branchId } = req.query;

  let sales = database.sales.filter(s => s.status !== 'voided');
  let expenses = database.expenses;

  if (branchId) {
    sales = sales.filter(s => s.branchId === branchId);
    expenses = expenses.filter(e => e.branchId === branchId);
  }

  if (startDate) {
    sales = sales.filter(s => s.createdAt >= (startDate as string));
    expenses = expenses.filter(e => e.createdAt >= (startDate as string));
  }
  if (endDate) {
    sales = sales.filter(s => s.createdAt <= (endDate as string));
    expenses = expenses.filter(e => e.createdAt <= (endDate as string));
  }

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCostOfGoodsSold = sales.reduce((sum, s) => sum + s.totalCost, 0);
  const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Expenses grouped by category
  const expensesByCategory: Record<string, { labelAr: string; amount: number }> = {};
  for (const exp of expenses) {
    if (!expensesByCategory[exp.category]) {
      expensesByCategory[exp.category] = { labelAr: exp.categoryLabelAr, amount: 0 };
    }
    expensesByCategory[exp.category].amount += exp.amount;
  }

  res.json({
    totalSalesRevenue,
    totalCostOfGoodsSold,
    grossProfit,
    grossProfitMarginPercent: totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(2) : 0,
    totalExpenses,
    netProfit,
    netProfitMarginPercent: totalSalesRevenue > 0 ? ((netProfit / totalSalesRevenue) * 100).toFixed(2) : 0,
    expensesByCategory,
    salesCount: sales.length,
  });
});

// ==========================================
// 10. AI BUSINESS ASSISTANT & OCR SCANNER
// ==========================================
apiRouter.post('/ai/advisor', authMiddleware, requirePermission('ai.assistant'), async (req: AuthenticatedRequest, res) => {
  const entitlement = db.checkEntitlement('ai');
  if (!entitlement.allowed) {
    return res.status(403).json({ error: entitlement.reasonAr, requiredPlan: entitlement.requiredPlan });
  }

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'الرجاء إرسال نص الاستفسار' });

  try {
    const analysis = await askBusinessAdvisor(query, req.user?.currentBranchId);
    logAudit(req.user!.id, req.user!.fullName, 'AI_ADVISOR', 'استشارة المستشار الذكي للأعمال', 'ai');
    res.json({ response: analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/ai/scan-invoice', authMiddleware, requirePermission('ai.ocr'), async (req: AuthenticatedRequest, res) => {
  const entitlement = db.checkEntitlement('ai');
  if (!entitlement.allowed) {
    return res.status(403).json({ error: entitlement.reasonAr, requiredPlan: entitlement.requiredPlan });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'الرجاء إرفاق صورة الفاتورة' });

  try {
    const extractedData = await scanInvoiceDocument(imageBase64, mimeType);
    logAudit(req.user!.id, req.user!.fullName, 'AI_OCR_SCAN', 'مسح وتحليل فاتورة بالذكاء الاصطناعي', 'ai');
    res.json(extractedData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 11. HASEBO SUBSCRIPTION, PRICING & CAMPAIGNS
// ==========================================
apiRouter.get('/subscriptions/state', authMiddleware, (req, res) => {
  const state = db.getSubscriptionState();
  res.json(state);
});

apiRouter.post('/subscriptions/claim-launch-offer', authMiddleware, (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  const storeId = 'store_current_main';
  const storeNameAr = database.settings.storeNameAr || 'سوبرماركت الوفاء المركزي';

  const result = db.claimLaunchOffer(storeId, storeNameAr);
  if (!result.success) {
    return res.status(400).json({ error: result.messageAr });
  }

  logAudit(
    req.user!.id,
    req.user!.fullName,
    'CLAIM_LAUNCH_OFFER',
    'المطالبة بعرض الإطلاق المجاني لمدة 30 يوماً لأول 10 متاجر',
    'settings'
  );

  res.json({
    message: result.messageAr,
    subscription: result.subscription,
    state: db.getSubscriptionState(),
  });
});

apiRouter.post('/subscriptions/subscribe', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { planId, billingPeriod, paymentMethod, appliedCampaignId } = req.body;
  if (!planId) {
    return res.status(400).json({ error: 'الرجاء تحديد الباقة المطلوبة' });
  }

  const storeId = 'store_current_main';
  const result = db.subscribePlan(
    storeId,
    planId,
    billingPeriod || (planId === 'PRO_YEARLY' ? 'yearly' : 'monthly'),
    paymentMethod || 'card',
    appliedCampaignId
  );

  if (!result.success) {
    return res.status(400).json({ error: result.messageAr });
  }

  logAudit(
    req.user!.id,
    req.user!.fullName,
    'SUBSCRIBE_PLAN',
    `تفعيل الاشتراك في باقة (${planId}) بمبلغ $${result.subscription.pricePaidUSD}`,
    'settings'
  );

  res.json({
    message: result.messageAr,
    subscription: result.subscription,
    state: db.getSubscriptionState(),
  });
});

apiRouter.post('/subscriptions/cancel', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { reasonAr } = req.body;
  const storeId = 'store_current_main';
  const result = db.cancelSubscription(storeId, reasonAr);

  logAudit(
    req.user!.id,
    req.user!.fullName,
    'CANCEL_SUBSCRIPTION',
    `إلغاء التجديد التلقائي للاشتراك: ${reasonAr || 'بناء على طلب المستخدم'}`,
    'settings'
  );

  res.json({
    message: result.messageAr,
    subscription: result.subscription,
    state: db.getSubscriptionState(),
  });
});

apiRouter.post('/subscriptions/renew', authMiddleware, (req: AuthenticatedRequest, res) => {
  const storeId = 'store_current_main';
  const result = db.renewSubscription(storeId);

  logAudit(
    req.user!.id,
    req.user!.fullName,
    'RENEW_SUBSCRIPTION',
    `تجديد الاشتراك الحالي في ${result.subscription.planId}`,
    'settings'
  );

  res.json({
    message: result.messageAr,
    subscription: result.subscription,
    state: db.getSubscriptionState(),
  });
});

// Admin Campaign Management
apiRouter.put('/subscriptions/admin/campaigns/:campaignId', authMiddleware, requirePermission('settings.manage'), (req: AuthenticatedRequest, res) => {
  const { campaignId } = req.params;
  const updated = db.updateCampaignAdmin(campaignId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'الحملة الترويجية غير موجودة' });
  }

  logAudit(
    req.user!.id,
    req.user!.fullName,
    'UPDATE_CAMPAIGN',
    `تعديل إعدادات الحملة الترويجية (${campaignId}): الحالة=${updated.isActive ? 'مفعلة' : 'معطلة'}، الحد الأقصى=${updated.maxClaims}`,
    'settings'
  );

  res.json(updated);
});

// Admin Plan Pricing Management
apiRouter.put('/subscriptions/admin/plans/:planId', authMiddleware, requirePermission('settings.manage'), (req: AuthenticatedRequest, res) => {
  const { planId } = req.params;
  const { priceUSD } = req.body;
  if (typeof priceUSD !== 'number') {
    return res.status(400).json({ error: 'السعر بالدولار غير صالح' });
  }

  const updated = db.updatePlanPriceAdmin(planId as any, priceUSD);
  if (!updated) {
    return res.status(404).json({ error: 'الباقة غير موجودة' });
  }

  logAudit(
    req.user!.id,
    req.user!.fullName,
    'UPDATE_PLAN_PRICE',
    `تعديل سعر الباقة (${planId}) إلى $${priceUSD}`,
    'settings'
  );

  res.json(updated);
});

// ==========================================
// 12. SYSTEM SETTINGS, BACKUP & RESTORE
// ==========================================
apiRouter.get('/settings', authMiddleware, (req, res) => {
  const database = db.getDb();
  res.json({
    settings: database.settings,
    currencies: database.currencies,
    branches: database.branches,
    subscription: database.subscription,
    plans: database.plans,
    campaigns: database.campaigns,
  });
});

apiRouter.put('/settings', authMiddleware, requirePermission('settings.manage'), (req: AuthenticatedRequest, res) => {
  const database = db.getDb();
  database.settings = { ...database.settings, ...req.body };
  db.save();

  logAudit(req.user!.id, req.user!.fullName, 'UPDATE_SETTINGS', 'تحديث إعدادات النظام والمتجر', 'settings');
  res.json(database.settings);
});

apiRouter.post('/system/backup', authMiddleware, requirePermission('settings.manage'), (req: AuthenticatedRequest, res) => {
  const backupFileName = db.createBackup('manual');
  logAudit(req.user!.id, req.user!.fullName, 'CREATE_BACKUP', `إنشاء نسخة احتياطية جديدة: ${backupFileName}`, 'settings');
  res.json({ success: true, backupFileName });
});

apiRouter.get('/system/backups', authMiddleware, requirePermission('settings.manage'), (req, res) => {
  const backups = db.listBackups();
  res.json(backups);
});

apiRouter.post('/system/restore', authMiddleware, requirePermission('settings.manage'), (req: AuthenticatedRequest, res) => {
  const { backupFileName } = req.body;
  if (!backupFileName) return res.status(400).json({ error: 'اسم ملف النسخة الاحتياطية مطلوب' });

  const ok = db.restoreBackup(backupFileName);
  if (!ok) return res.status(404).json({ error: 'الملف غير موجود أو تالف' });

  logAudit(req.user!.id, req.user!.fullName, 'RESTORE_BACKUP', `استعادة نسخة احتياطية: ${backupFileName}`, 'settings');
  res.json({ success: true, message: 'تم استعادة قاعدة البيانات بنجاح' });
});
