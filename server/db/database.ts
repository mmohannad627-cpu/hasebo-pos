/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  Role,
  Branch,
  Product,
  ProductCategory,
  ProductBatch,
  Sale,
  SaleItem,
  SaleReturn,
  Purchase,
  Customer,
  Supplier,
  Expense,
  CashAccount,
  CashSession,
  InventoryMovement,
  Stocktake,
  AuditLog,
  SystemNotification,
  StoreSettings,
  CurrencyConfig,
  PriceHistory,
  CustomerTransaction,
  SupplierTransaction,
  SubscriptionStatus,
  PlanId,
  PlanConfig,
  StoreSubscription,
  LaunchCampaign,
  SubscriptionInvoice,
  SubscriptionState,
  EntitlementCheckResult,
} from '../../src/types/index.js';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  roles: Role[];
  branches: Branch[];
  categories: ProductCategory[];
  products: Product[];
  batches: ProductBatch[];
  priceHistories: PriceHistory[];
  sales: Sale[];
  saleReturns: SaleReturn[];
  purchases: Purchase[];
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  expenses: Expense[];
  cashAccounts: CashAccount[];
  cashSessions: CashSession[];
  inventoryMovements: InventoryMovement[];
  stocktakes: Stocktake[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  settings: StoreSettings;
  currencies: CurrencyConfig[];
  plans: PlanConfig[];
  subscription: StoreSubscription;
  campaigns: LaunchCampaign[];
  subscriptionInvoices: SubscriptionInvoice[];
  version: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'grocery_erp_database.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

class RelationalDatabase {
  private data: DatabaseSchema;
  private isSaving = false;
  private saveQueued = false;

  constructor() {
    this.ensureDirectories();
    this.data = this.loadOrInitialize();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const calc = this.hashPassword(password, salt);
    return calc === hash;
  }

  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public createPasswordHash(password: string): { hash: string; salt: string } {
    const salt = this.generateSalt();
    const hash = this.hashPassword(password, salt);
    return { hash, salt };
  }

  private loadOrInitialize(): DatabaseSchema {
    let schema: DatabaseSchema;
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version) {
          schema = parsed as DatabaseSchema;
        } else {
          schema = this.generateSeedData();
        }
      } catch (err) {
        console.error('Error reading database file, initializing seed data:', err);
        schema = this.generateSeedData();
      }
    } else {
      schema = this.generateSeedData();
    }

    // Ensure plans, subscription, campaigns, subscriptionInvoices exist in loaded database
    const seed = this.generateSeedData();
    if (!schema.plans || !Array.isArray(schema.plans) || schema.plans.length === 0) {
      schema.plans = seed.plans;
    }
    if (!schema.campaigns || !Array.isArray(schema.campaigns)) {
      schema.campaigns = seed.campaigns;
    }
    if (!schema.subscriptionInvoices || !Array.isArray(schema.subscriptionInvoices)) {
      schema.subscriptionInvoices = seed.subscriptionInvoices;
    }
    if (!schema.subscription || !schema.subscription.planId) {
      schema.subscription = seed.subscription;
    }

    // Automatically check and update subscription expiration / status
    this.refreshSubscriptionStatusInPlace(schema);

    this.saveDirect(schema);
    return schema;
  }

  private refreshSubscriptionStatusInPlace(schema: DatabaseSchema) {
    if (!schema.subscription) return;
    const now = new Date().getTime();
    const expiry = new Date(schema.subscription.expiresAt).getTime();

    if (schema.subscription.status === 'TRIAL' || schema.subscription.isTrial) {
      if (now > expiry) {
        schema.subscription.status = 'EXPIRED';
        schema.subscription.isTrial = false;
      }
    } else if (schema.subscription.status === 'ACTIVE') {
      if (now > expiry) {
        if (schema.subscription.autoRenew) {
          // In real life renewal charge, or mark past due
          schema.subscription.status = 'PAST_DUE';
        } else {
          schema.subscription.status = 'EXPIRED';
        }
      }
    }
  }

  public getSubscriptionState(): SubscriptionState {
    this.refreshSubscriptionStatusInPlace(this.data);
    return {
      currentSubscription: this.data.subscription,
      plans: this.data.plans,
      campaigns: this.data.campaigns,
      invoices: this.data.subscriptionInvoices || [],
    };
  }

  public claimLaunchOffer(storeId: string, storeNameAr: string): { success: boolean; messageAr: string; subscription?: StoreSubscription } {
    const campaign = this.data.campaigns.find(c => c.id === 'LAUNCH_10_STORES');
    if (!campaign) {
      return { success: false, messageAr: 'عرض الإطلاق غير متاح حالياً' };
    }

    if (!campaign.isActive) {
      return { success: false, messageAr: 'انتهت فترة حملة عرض الإطلاق' };
    }

    if (campaign.claimedStoreIds.includes(storeId) || this.data.subscription.claimedLaunchOffer) {
      return { success: false, messageAr: 'تمت الاستفادة من هذا العرض مسبقاً لهذا المتجر. لا يمكن المطالبة بالعرض أكثر من مرة' };
    }

    if (campaign.currentClaims >= campaign.maxClaims) {
      campaign.isActive = false;
      this.save();
      return { success: false, messageAr: 'اكتمل عدد المستفيدين من العرض (10 متاجر)' };
    }

    // Atomic claim registration
    campaign.claimedStoreIds.push(storeId);
    campaign.currentClaims = campaign.claimedStoreIds.length;
    if (campaign.currentClaims >= campaign.maxClaims) {
      campaign.isActive = false;
    }

    const now = new Date();
    const trialDays = campaign.trialDays || 30;
    const endDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription: StoreSubscription = {
      storeId,
      storeNameAr: storeNameAr || this.data.settings.storeNameAr,
      planId: 'PRO_MONTHLY',
      status: 'TRIAL',
      startDate: now.toISOString(),
      expiresAt: endDate.toISOString(),
      renewalDate: endDate.toISOString(),
      trialStartDate: now.toISOString(),
      trialEndDate: endDate.toISOString(),
      isTrial: true,
      appliedCampaignId: campaign.id,
      discountPercentage: 100,
      pricePaidUSD: 0,
      autoRenew: true,
      claimedLaunchOffer: true,
      lastPaymentDate: now.toISOString(),
      paymentMethod: 'store_credit',
    };

    this.data.subscription = subscription;

    // Create a 0$ invoice receipt for record keeping
    const invoice: SubscriptionInvoice = {
      id: `sinv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      storeId,
      invoiceNumber: `INV-PROMO-${Date.now().toString().slice(-6)}`,
      planId: 'PRO_MONTHLY',
      planNameAr: 'حاسبوا برو (عرض الإطلاق الترويجي - تجربة 30 يوماً مجاناً)',
      amountUSD: 5,
      discountUSD: 5,
      totalPaidUSD: 0,
      currency: 'USD',
      paymentMethod: 'عرض تدشين مجاني (30 يوماً)',
      status: 'PAID',
      periodStart: now.toISOString(),
      periodEnd: endDate.toISOString(),
      createdAt: now.toISOString(),
      notesAr: 'تم تفعيل باقة برو مجاناً كأحد أول 10 متاجر في عرض الإطلاق الذهبي',
    };

    if (!this.data.subscriptionInvoices) this.data.subscriptionInvoices = [];
    this.data.subscriptionInvoices.unshift(invoice);

    this.save();
    return {
      success: true,
      messageAr: 'تهانينا! لقد بدأت فترتك التجريبية المجانية في حاسبوا برو لمدة 30 يوماً بنجاح.',
      subscription,
    };
  }

  public subscribePlan(
    storeId: string,
    planId: PlanId,
    billingPeriod: 'monthly' | 'yearly',
    paymentMethod: 'card' | 'kuraimi' | 'wallet' | 'store_credit' | 'google_play' | 'apple_store' = 'card',
    appliedCampaignId?: string
  ): { success: boolean; messageAr: string; subscription: StoreSubscription } {
    const plan = this.data.plans.find(p => p.id === planId);
    if (!plan) {
      return { success: false, messageAr: 'الباقة المحددة غير موجودة', subscription: this.data.subscription };
    }

    const now = new Date();
    let monthsToAdd = planId === 'PRO_YEARLY' ? 12 : 1;
    let basePriceUSD = plan.priceUSD;
    let discountPercent = 0;

    // Check optional Early Customer campaign
    if (appliedCampaignId) {
      const campaign = this.data.campaigns.find(c => c.id === appliedCampaignId);
      if (campaign && campaign.isActive && campaign.eligiblePlanId === planId) {
        if (campaign.currentClaims < campaign.maxClaims && !campaign.claimedStoreIds.includes(storeId)) {
          discountPercent = campaign.discountPercentage;
          campaign.claimedStoreIds.push(storeId);
          campaign.currentClaims = campaign.claimedStoreIds.length;
          if (campaign.currentClaims >= campaign.maxClaims) {
            campaign.isActive = false;
          }
        }
      }
    }

    const finalPriceUSD = +(basePriceUSD * (1 - discountPercent / 100)).toFixed(2);
    const expiresAt = new Date(now.getTime() + monthsToAdd * 30.5 * 24 * 60 * 60 * 1000);

    const subscription: StoreSubscription = {
      storeId,
      storeNameAr: this.data.settings.storeNameAr,
      planId,
      status: planId === 'FREE' ? 'FREE' : 'ACTIVE',
      startDate: now.toISOString(),
      expiresAt: planId === 'FREE' ? '2099-12-31T23:59:59.000Z' : expiresAt.toISOString(),
      renewalDate: planId === 'FREE' ? undefined : expiresAt.toISOString(),
      isTrial: false,
      appliedCampaignId,
      discountPercentage: discountPercent,
      pricePaidUSD: finalPriceUSD,
      autoRenew: true,
      claimedLaunchOffer: this.data.subscription.claimedLaunchOffer,
      lastPaymentDate: now.toISOString(),
      paymentMethod,
    };

    this.data.subscription = subscription;

    if (planId !== 'FREE') {
      const invoice: SubscriptionInvoice = {
        id: `sinv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        storeId,
        invoiceNumber: `INV-SUB-${Date.now().toString().slice(-6)}`,
        planId,
        planNameAr: plan.nameAr,
        amountUSD: basePriceUSD,
        discountUSD: +(basePriceUSD - finalPriceUSD).toFixed(2),
        totalPaidUSD: finalPriceUSD,
        currency: 'USD',
        paymentMethod: paymentMethod === 'kuraimi' ? 'الكريمي جوال / إلكتروني' : paymentMethod === 'wallet' ? 'محفظة جوال (جوالي/فلوسك)' : 'بطاقة بنكية / فيزا',
        status: 'PAID',
        periodStart: now.toISOString(),
        periodEnd: expiresAt.toISOString(),
        createdAt: now.toISOString(),
        notesAr: discountPercent > 0 ? `تم تطبيق خصم ترويجي بقيمة ${discountPercent}%` : undefined,
      };

      if (!this.data.subscriptionInvoices) this.data.subscriptionInvoices = [];
      this.data.subscriptionInvoices.unshift(invoice);
    }

    this.save();
    return {
      success: true,
      messageAr: planId === 'FREE' ? 'تم التحويل إلى الباقة المجانية الدائمة بنجاح' : `تم الاشتراك بنجاح في ${plan.nameAr}`,
      subscription,
    };
  }

  public cancelSubscription(storeId: string, reasonAr?: string): { success: boolean; messageAr: string; subscription: StoreSubscription } {
    if (!this.data.subscription) {
      return { success: false, messageAr: 'لا يوجد اشتراك نشط', subscription: this.data.subscription };
    }

    this.data.subscription.autoRenew = false;
    this.data.subscription.status = 'CANCELLED';
    this.data.subscription.cancelledAt = new Date().toISOString();

    this.save();
    return {
      success: true,
      messageAr: 'تم إلغاء التجديد التلقائي للاشتراك بنجاح. ستظل الميزات الاحترافية مفعلة حتى نهاية الفترة الحالية.',
      subscription: this.data.subscription,
    };
  }

  public renewSubscription(storeId: string): { success: boolean; messageAr: string; subscription: StoreSubscription } {
    const current = this.data.subscription;
    return this.subscribePlan(storeId, current.planId, current.planId === 'PRO_YEARLY' ? 'yearly' : 'monthly', current.paymentMethod || 'card');
  }

  public updateCampaignAdmin(campaignId: string, updates: Partial<LaunchCampaign>): LaunchCampaign | null {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    if (!campaign) return null;

    Object.assign(campaign, updates);
    this.save();
    return campaign;
  }

  public updatePlanPriceAdmin(planId: PlanId, priceUSD: number): PlanConfig | null {
    const plan = this.data.plans.find(p => p.id === planId);
    if (!plan) return null;

    plan.priceUSD = priceUSD;
    this.save();
    return plan;
  }

  public checkEntitlement(feature: 'ai' | 'whatsapp' | 'cloud' | 'reports' | 'branches' | 'products' | 'invoices'): EntitlementCheckResult {
    this.refreshSubscriptionStatusInPlace(this.data);
    const sub = this.data.subscription;
    const plan = this.data.plans.find(p => p.id === sub.planId);

    const isPro = sub.status === 'ACTIVE' || sub.status === 'TRIAL' || sub.status === 'PROMOTIONAL';

    if (feature === 'ai') {
      if (!isPro) {
        return {
          allowed: false,
          reasonAr: 'مستشار الذكاء الاصطناعي متاح حصرياً لمشتركي باقة حاسبوا برو (PRO)',
          requiredPlan: 'PRO_MONTHLY',
        };
      }
    }

    if (feature === 'whatsapp') {
      if (!isPro) {
        return {
          allowed: false,
          reasonAr: 'إرسال الفواتير وكشوفات الحساب عبر واتساب متاح في باقة حاسبوا برو',
          requiredPlan: 'PRO_MONTHLY',
        };
      }
    }

    if (feature === 'products' && !isPro && plan && plan.maxProducts > 0) {
      if (this.data.products.length >= plan.maxProducts) {
        return {
          allowed: false,
          reasonAr: `لقد بلغت الحد الأقصى للمنتجات في الباقة المجانية (${plan.maxProducts} صنف). قم بالترقية إلى برو للإضافة بلا حدود.`,
          requiredPlan: 'PRO_MONTHLY',
        };
      }
    }

    return { allowed: true };
  }

  public save() {
    if (this.isSaving) {
      this.saveQueued = true;
      return;
    }
    this.isSaving = true;
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file:', err);
    } finally {
      this.isSaving = false;
      if (this.saveQueued) {
        this.saveQueued = false;
        this.save();
      }
    }
  }

  private saveDirect(db: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }

  public createBackup(label = 'manual'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${label}_${timestamp}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupFileName);
    fs.writeFileSync(backupPath, JSON.stringify(this.data, null, 2), 'utf-8');
    return backupFileName;
  }

  public listBackups(): { name: string; size: number; createdAt: string }[] {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    return fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUPS_DIR, f));
        return {
          name: f,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public restoreBackup(fileName: string): boolean {
    const safeName = path.basename(fileName);
    const backupPath = path.join(BACKUPS_DIR, safeName);
    if (!fs.existsSync(backupPath)) return false;
    const raw = fs.readFileSync(backupPath, 'utf-8');
    const parsed = JSON.parse(raw);
    this.data = parsed;
    this.save();
    return true;
  }

  public getDb(): DatabaseSchema {
    return this.data;
  }

  // ==========================================
  // SEED GENERATION WITH REALISTIC ARABIC DATA
  // ==========================================
  private generateSeedData(): DatabaseSchema {
    const adminPass = this.createPasswordHash('admin123');
    const cashierPass = this.createPasswordHash('cashier123');
    const managerPass = this.createPasswordHash('manager123');

    const roles: Role[] = [
      {
        id: 'role_admin',
        name: 'SUPER_ADMIN',
        labelAr: 'مدير عام النظام',
        labelEn: 'Super Administrator',
        descriptionAr: 'كامل الصلاحيات على جميع الفروع والعمليات والتقارير والإعدادات',
        permissions: [
          'pos.access', 'pos.discount', 'pos.credit_sale', 'pos.refund',
          'products.view', 'products.create', 'products.edit', 'products.delete', 'products.cost_view',
          'inventory.view', 'inventory.adjust', 'inventory.stocktake',
          'purchases.view', 'purchases.create', 'purchases.edit',
          'customers.view', 'customers.create', 'customers.edit', 'customers.collect_debt',
          'suppliers.view', 'suppliers.create', 'suppliers.pay',
          'expenses.view', 'expenses.create',
          'cash_register.view', 'cash_register.manage',
          'accounting.view', 'reports.view', 'reports.export',
          'users.manage', 'branches.manage', 'settings.manage',
          'ai.assistant', 'ai.ocr',
        ],
        isSystem: true,
      },
      {
        id: 'role_manager',
        name: 'BRANCH_MANAGER',
        labelAr: 'مدير فرع',
        labelEn: 'Branch Manager',
        descriptionAr: 'صلاحيات إدارة الفرع والمخزون والمشتريات والمبيعات ونقاط البيع',
        permissions: [
          'pos.access', 'pos.discount', 'pos.credit_sale', 'pos.refund',
          'products.view', 'products.create', 'products.edit', 'products.cost_view',
          'inventory.view', 'inventory.adjust', 'inventory.stocktake',
          'purchases.view', 'purchases.create',
          'customers.view', 'customers.create', 'customers.edit', 'customers.collect_debt',
          'suppliers.view', 'suppliers.create', 'suppliers.pay',
          'expenses.view', 'expenses.create',
          'cash_register.view', 'cash_register.manage',
          'reports.view', 'ai.assistant', 'ai.ocr',
        ],
        isSystem: true,
      },
      {
        id: 'role_accountant',
        name: 'ACCOUNTANT',
        labelAr: 'محاسب مالي',
        labelEn: 'Accountant',
        descriptionAr: 'إدارة القيود المالية والمصاريف والديون والتقارير والأرباح والخسائر',
        permissions: [
          'products.view', 'products.cost_view',
          'purchases.view', 'purchases.create',
          'customers.view', 'customers.create', 'customers.collect_debt',
          'suppliers.view', 'suppliers.create', 'suppliers.pay',
          'expenses.view', 'expenses.create',
          'cash_register.view', 'cash_register.manage',
          'accounting.view', 'reports.view', 'reports.export',
          'ai.assistant',
        ],
        isSystem: true,
      },
      {
        id: 'role_cashier',
        name: 'CASHIER',
        labelAr: 'كاشير / نقطة بيع',
        labelEn: 'Cashier / POS Operator',
        descriptionAr: 'إتمام المبيعات والفواتير والتحصيل اليومي وفتح وإغلاق اليومية',
        permissions: [
          'pos.access', 'pos.credit_sale',
          'products.view',
          'customers.view', 'customers.create',
          'cash_register.view',
        ],
        isSystem: true,
      },
      {
        id: 'role_inventory',
        name: 'INVENTORY_MANAGER',
        labelAr: 'مسؤول مخزن وجرد',
        labelEn: 'Inventory Specialist',
        descriptionAr: 'إدارة الأصناف، حركات المخزون، الجرد الدوري، صلاحية المنتجات',
        permissions: [
          'products.view', 'products.create', 'products.edit',
          'inventory.view', 'inventory.adjust', 'inventory.stocktake',
          'purchases.view',
        ],
        isSystem: true,
      },
    ];

    const branches: Branch[] = [
      {
        id: 'branch_main',
        nameAr: 'الفرع الرئيسي - صنعاء (شارع الستين)',
        nameEn: 'Main Branch - Sanaa 60th St',
        code: 'BR-01',
        phone: '+967 770 123 456',
        addressAr: 'صنعاء، شارع الستين الغربي، جوار مجمع المدينة',
        isMain: true,
        isActive: true,
        taxNumber: 'TAX-YER-998822',
        receiptHeaderAr: 'بقالة وسوبرماركت الوفاء المركزي',
        receiptFooterAr: 'شكراً لزيارتكم! البضاعة المباعة تستبدل خلال 24 ساعة بموجب الفاتورة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'branch_hadda',
        nameAr: 'فرع حدة - شارع بيروت',
        nameEn: 'Hadda Branch - Beirut St',
        code: 'BR-02',
        phone: '+967 771 987 654',
        addressAr: 'صنعاء، منطقة حدة، تقاطع شارع بيروت',
        isMain: false,
        isActive: true,
        taxNumber: 'TAX-YER-998823',
        receiptHeaderAr: 'سوبرماركت الوفاء - فرع حدة',
        receiptFooterAr: 'أهلاً وسهلاً بكم دائماً - أسعارنا تنافسية',
        createdAt: new Date().toISOString(),
      },
    ];

    const users: (User & { passwordHash: string; salt: string })[] = [
      {
        id: 'usr_admin',
        username: 'admin',
        fullName: 'مهند أحمد الزبير (المدير العام)',
        email: 'admin@alwafa-store.com',
        phone: '+967 777 000 111',
        roleId: 'role_admin',
        branchIds: ['branch_main', 'branch_hadda'],
        currentBranchId: 'branch_main',
        isActive: true,
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_manager',
        username: 'manager',
        fullName: 'طارق عبدالكريم العولقي (مدير الفرع)',
        email: 'tariq@alwafa-store.com',
        phone: '+967 772 111 222',
        roleId: 'role_manager',
        branchIds: ['branch_main'],
        currentBranchId: 'branch_main',
        isActive: true,
        passwordHash: managerPass.hash,
        salt: managerPass.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_cashier',
        username: 'cashier',
        fullName: 'سامي صالح الريمي (كاشير الصباح)',
        email: 'sami@alwafa-store.com',
        phone: '+967 773 333 444',
        roleId: 'role_cashier',
        branchIds: ['branch_main'],
        currentBranchId: 'branch_main',
        isActive: true,
        passwordHash: cashierPass.hash,
        salt: cashierPass.salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const categories: ProductCategory[] = [
      { id: 'cat_dairy', nameAr: 'الألبان والأجبان', nameEn: 'Dairy & Cheese', code: 'CAT-01', displayOrder: 1, isActive: true, iconName: 'Milk', color: 'text-blue-400 bg-blue-500/10' },
      { id: 'cat_beverages', nameAr: 'المشروبات والعصائر', nameEn: 'Beverages & Juices', code: 'CAT-02', displayOrder: 2, isActive: true, iconName: 'CupSoda', color: 'text-emerald-400 bg-emerald-500/10' },
      { id: 'cat_bakery', nameAr: 'المخبوزات والحلويات', nameEn: 'Bakery & Sweets', code: 'CAT-03', displayOrder: 3, isActive: true, iconName: 'Cake', color: 'text-amber-400 bg-amber-500/10' },
      { id: 'cat_canned', nameAr: 'المعلبات والبقوليات', nameEn: 'Canned Goods & Pulses', code: 'CAT-04', displayOrder: 4, isActive: true, iconName: 'Boxes', color: 'text-rose-400 bg-rose-500/10' },
      { id: 'cat_snacks', nameAr: 'البسكويت والمقرمشات', nameEn: 'Snacks & Biscuits', code: 'CAT-05', displayOrder: 5, isActive: true, iconName: 'Cookie', color: 'text-purple-400 bg-purple-500/10' },
      { id: 'cat_spices', nameAr: 'الزيوت والبهارات والأرز', nameEn: 'Oils, Rice & Spices', code: 'CAT-06', displayOrder: 6, isActive: true, iconName: 'Flame', color: 'text-orange-400 bg-orange-500/10' },
      { id: 'cat_cleaning', nameAr: 'المنظفات والعناية المنزلية', nameEn: 'Cleaning & Household', code: 'CAT-07', displayOrder: 7, isActive: true, iconName: 'Sparkles', color: 'text-cyan-400 bg-cyan-500/10' },
      { id: 'cat_personal', nameAr: 'العناية الشخصية', nameEn: 'Personal Care', code: 'CAT-08', displayOrder: 8, isActive: true, iconName: 'Heart', color: 'text-pink-400 bg-pink-500/10' },
    ];

    const suppliers: Supplier[] = [
      {
        id: 'sup_hail_saeed',
        nameAr: 'مجموعة هائل سعيد أنعم وشركاه',
        nameEn: 'HSA Group Yemen',
        companyName: 'شركة الصناعات الغذائية والزيوت',
        phone: '+967 1 200 300',
        email: 'sales@hsayemen.com',
        address: 'صنعاء، شارع الزبيري',
        currentBalance: 450000, // 450,000 YER payable
        taxNumber: 'SUP-TAX-1002',
        notes: 'مورد معتمد للزيوت والألبان والدقيق والبسكويت',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sup_alqubati',
        nameAr: 'مؤسسة القبيطي للتجارة والاستيراد',
        nameEn: 'Al-Qubati Trading Est',
        companyName: 'مؤسسة القبيطي للمواد الغذائية',
        phone: '+967 771 222 888',
        email: 'info@alqubati-trade.com',
        address: 'صنعاء، شارع خولان',
        currentBalance: 180000,
        taxNumber: 'SUP-TAX-1009',
        notes: 'مورد للمعلبات والتونا والأرز البسمتي',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sup_yemen_dairy',
        nameAr: 'شركة منتجات الألبان والأغذية الوطنية (نادك/يماني)',
        nameEn: 'National Dairy & Food Co',
        companyName: 'يماني للألبان والعصائر',
        phone: '+967 1 445 566',
        email: 'orders@yamani-dairy.ye',
        address: 'الحديدة / صنعاء',
        currentBalance: 95000,
        taxNumber: 'SUP-TAX-1015',
        notes: 'مورد حليب وحقين وزبادي يماني الطازج يومياً',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const customers: Customer[] = [
      {
        id: 'cust_cash_default',
        nameAr: 'عميل نقدي عام (زبون محل)',
        nameEn: 'General Cash Customer',
        phone: '000000000',
        address: 'المحل',
        currentBalance: 0,
        creditLimit: 0,
        creditDays: 0,
        isActive: true,
        notes: 'العميل النقدي الافتراضي للمبيعات السريعة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cust_dr_fouad',
        nameAr: 'د. فؤاد محمد العريقي',
        nameEn: 'Dr. Fouad Al-Areqi',
        phone: '+967 777 555 444',
        address: 'شارع الستين - عمارة الأمل شقة 4',
        currentBalance: 38500, // owes 38,500 YER
        creditLimit: 150000,
        creditDays: 30,
        isActive: true,
        notes: 'عميل دائم، يسدد شهرياً مع الراتب',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cust_albaraka_bakery',
        nameAr: 'مخبز وبوفية البركة',
        nameEn: 'Al-Baraka Bakery',
        phone: '+967 733 999 111',
        address: 'جوار السوبرماركت',
        currentBalance: 82000,
        creditLimit: 250000,
        creditDays: 15,
        isActive: true,
        notes: 'يشتري بالسكر والزيت والدقيق والبيض أسبوعياً',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cust_abu_ahmed',
        nameAr: 'العم أحمد صالح الشامي',
        nameEn: 'Ahmed Al-Shami',
        phone: '+967 775 888 222',
        address: 'حارة النصر - منزل 12',
        currentBalance: 12000,
        creditLimit: 60000,
        creditDays: 30,
        isActive: true,
        notes: 'حساب شهري مفتوح للمنزل',
        createdAt: new Date().toISOString(),
      },
    ];

    const cashAccounts: CashAccount[] = [
      { id: 'acc_drawer_main', nameAr: 'درج الكاشير الرئيسي (صندوق 1)', nameEn: 'Main Cash Drawer #1', type: 'cash_register', currency: 'YER', currentBalance: 125000, branchId: 'branch_main', isActive: true },
      { id: 'acc_safe_main', nameAr: 'خزنة المحل الرئيسية', nameEn: 'Main Store Safe', type: 'safe', currency: 'YER', currentBalance: 850000, branchId: 'branch_main', isActive: true },
      { id: 'acc_kuraimi', nameAr: 'حساب بنك الكريمي للتمويل الأصغر', nameEn: 'Kuraimi Bank Account', type: 'bank', currency: 'YER', currentBalance: 2400000, accountNumber: '120984532', isActive: true },
      { id: 'acc_floosak', nameAr: 'محفظة فلوسك الإلكترونية', nameEn: 'Floosak E-Wallet', type: 'e_wallet', currency: 'YER', currentBalance: 320000, accountNumber: '777000111', isActive: true },
      { id: 'acc_jawali', nameAr: 'محفظة جوالي / كاش', nameEn: 'Jawali Wallet', type: 'e_wallet', currency: 'YER', currentBalance: 180000, accountNumber: '771987654', isActive: true },
    ];

    const products: Product[] = [
      {
        id: 'prod_milk_yamani_1l',
        nameAr: 'حليب يماني طويل الأجل 1 لتر',
        nameEn: 'Yamani Long Life Milk 1L',
        sku: 'DAI-YAM-001',
        barcode: '6291003001018',
        internalBarcode: 'INT-001',
        categoryId: 'cat_dairy',
        baseUnit: 'piece',
        units: [
          { id: 'u_1', unitNameAr: 'حبة (لتر)', unitNameEn: 'Piece (Liter)', unitType: 'piece', conversionFactor: 1, purchasePrice: 850, costPrice: 850, retailPrice: 1000, wholesalePrice: 930, isBaseUnit: true, barcode: '6291003001018' },
          { id: 'u_2', unitNameAr: 'كرتون (12 حبة)', unitNameEn: 'Carton (12 pcs)', unitType: 'carton', conversionFactor: 12, purchasePrice: 10000, costPrice: 10000, retailPrice: 11500, wholesalePrice: 11000, isBaseUnit: false, barcode: '6291003001019' },
        ],
        minStockLevel: 24,
        maxStockLevel: 240,
        currentStock: 72,
        averageCost: 850,
        retailPrice: 1000,
        wholesalePrice: 930,
        hasBatches: true,
        manufacturer: 'يماني للألبان',
        supplierId: 'sup_yemen_dairy',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_yoghurt_hana',
        nameAr: 'زبادي هناء طازج 170 جرام',
        nameEn: 'Hana Fresh Yoghurt 170g',
        sku: 'DAI-HAN-002',
        barcode: '6291003002025',
        categoryId: 'cat_dairy',
        baseUnit: 'piece',
        units: [
          { id: 'u_3', unitNameAr: 'حبة', unitNameEn: 'Piece', unitType: 'piece', conversionFactor: 1, purchasePrice: 200, costPrice: 200, retailPrice: 250, wholesalePrice: 230, isBaseUnit: true, barcode: '6291003002025' },
          { id: 'u_4', unitNameAr: 'بكت (6 حبات)', unitNameEn: 'Pack (6 pcs)', unitType: 'pack', conversionFactor: 6, purchasePrice: 1150, costPrice: 1150, retailPrice: 1450, wholesalePrice: 1350, isBaseUnit: false, barcode: '6291003002026' },
        ],
        minStockLevel: 30,
        maxStockLevel: 180,
        currentStock: 48,
        averageCost: 200,
        retailPrice: 250,
        wholesalePrice: 230,
        hasBatches: true,
        manufacturer: 'هائل سعيد',
        supplierId: 'sup_hail_saeed',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_oil_safia_1_5l',
        nameAr: 'زيت صافية نباتي نقي 1.5 لتر',
        nameEn: 'Safia Pure Vegetable Oil 1.5L',
        sku: 'OIL-SAF-001',
        barcode: '6291003003032',
        categoryId: 'cat_spices',
        baseUnit: 'bottle',
        units: [
          { id: 'u_5', unitNameAr: 'دبة (1.5 لتر)', unitNameEn: 'Bottle (1.5L)', unitType: 'bottle', conversionFactor: 1, purchasePrice: 2600, costPrice: 2600, retailPrice: 3000, wholesalePrice: 2850, isBaseUnit: true, barcode: '6291003003032' },
          { id: 'u_6', unitNameAr: 'كرتون (6 دبات)', unitNameEn: 'Carton (6 bottles)', unitType: 'carton', conversionFactor: 6, purchasePrice: 15400, costPrice: 15400, retailPrice: 17500, wholesalePrice: 16800, isBaseUnit: false, barcode: '6291003003033' },
        ],
        minStockLevel: 12,
        currentStock: 36,
        averageCost: 2600,
        retailPrice: 3000,
        wholesalePrice: 2850,
        hasBatches: true,
        manufacturer: 'شركة السعيد للزيوت',
        supplierId: 'sup_hail_saeed',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_tuna_alqubati',
        nameAr: 'تونا الوزة فاخرة لحم أبيض 185 جرام',
        nameEn: 'Al-Wazzah White Meat Tuna 185g',
        sku: 'CAN-TUN-001',
        barcode: '6291003004049',
        categoryId: 'cat_canned',
        baseUnit: 'piece',
        units: [
          { id: 'u_7', unitNameAr: 'علبة', unitNameEn: 'Can', unitType: 'piece', conversionFactor: 1, purchasePrice: 900, costPrice: 900, retailPrice: 1100, wholesalePrice: 1000, isBaseUnit: true, barcode: '6291003004049' },
          { id: 'u_8', unitNameAr: 'شدة (24 علبة)', unitNameEn: 'Box (24 cans)', unitType: 'box', conversionFactor: 24, purchasePrice: 21200, costPrice: 21200, retailPrice: 25500, wholesalePrice: 23800, isBaseUnit: false, barcode: '6291003004050' },
        ],
        minStockLevel: 24,
        currentStock: 80,
        averageCost: 900,
        retailPrice: 1100,
        wholesalePrice: 1000,
        hasBatches: true,
        supplierId: 'sup_alqubati',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_biscuit_abu_walad',
        nameAr: 'بسكويت أبو ولد الشهير أصلي (سندوتش)',
        nameEn: 'Abu Walad Sandwich Biscuit',
        sku: 'SNK-ABU-001',
        barcode: '6291003005056',
        categoryId: 'cat_snacks',
        baseUnit: 'piece',
        units: [
          { id: 'u_9', unitNameAr: 'حبة فردي', unitNameEn: 'Piece', unitType: 'piece', conversionFactor: 1, purchasePrice: 120, costPrice: 120, retailPrice: 150, wholesalePrice: 135, isBaseUnit: true, barcode: '6291003005056' },
          { id: 'u_10', unitNameAr: 'باكت (24 حبة)', unitNameEn: 'Pack (24 pcs)', unitType: 'pack', conversionFactor: 24, purchasePrice: 2750, costPrice: 2750, retailPrice: 3400, wholesalePrice: 3100, isBaseUnit: false, barcode: '6291003005057' },
          { id: 'u_11', unitNameAr: 'كرتون (12 باكت)', unitNameEn: 'Carton (12 packs)', unitType: 'carton', conversionFactor: 288, purchasePrice: 32500, costPrice: 32500, retailPrice: 39500, wholesalePrice: 36000, isBaseUnit: false, barcode: '6291003005058' },
        ],
        minStockLevel: 48,
        currentStock: 240,
        averageCost: 120,
        retailPrice: 150,
        wholesalePrice: 135,
        hasBatches: true,
        manufacturer: 'شركة كمران / نادك',
        supplierId: 'sup_hail_saeed',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_tea_kabous_227g',
        nameAr: 'شاي الكبوس أحمر نخب أول 227 جرام',
        nameEn: 'Al-Kbous Black Tea 227g',
        sku: 'BEV-KAB-001',
        barcode: '6291003006063',
        categoryId: 'cat_beverages',
        baseUnit: 'box',
        units: [
          { id: 'u_12', unitNameAr: 'باكت 227 جم', unitNameEn: 'Pack 227g', unitType: 'box', conversionFactor: 1, purchasePrice: 1100, costPrice: 1100, retailPrice: 1300, wholesalePrice: 1220, isBaseUnit: true, barcode: '6291003006063' },
          { id: 'u_13', unitNameAr: 'كرتون (24 باكت)', unitNameEn: 'Carton (24 packs)', unitType: 'carton', conversionFactor: 24, purchasePrice: 25800, costPrice: 25800, retailPrice: 30500, wholesalePrice: 28500, isBaseUnit: false, barcode: '6291003006064' },
        ],
        minStockLevel: 12,
        currentStock: 42,
        averageCost: 1100,
        retailPrice: 1300,
        wholesalePrice: 1220,
        hasBatches: true,
        manufacturer: 'مجموعة الكبوس للتجارة والصناعة',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_rice_shaalan_5kg',
        nameAr: 'أرز الشعلان بسمتي عنبر هندي درجة أولى 5 كجم',
        nameEn: 'Al-Shaalan Basmati Rice 5KG',
        sku: 'SPI-RIC-005',
        barcode: '6291003007070',
        categoryId: 'cat_spices',
        baseUnit: 'pack',
        units: [
          { id: 'u_14', unitNameAr: 'كيس 5 كجم', unitNameEn: 'Bag 5KG', unitType: 'pack', conversionFactor: 1, purchasePrice: 7800, costPrice: 7800, retailPrice: 8800, wholesalePrice: 8400, isBaseUnit: true, barcode: '6291003007070' },
          { id: 'u_15', unitNameAr: 'شوالة (4 أكياس = 20 كجم)', unitNameEn: 'Bundle (4 bags)', unitType: 'pack', conversionFactor: 4, purchasePrice: 30500, costPrice: 30500, retailPrice: 34500, wholesalePrice: 33000, isBaseUnit: false, barcode: '6291003007071' },
        ],
        minStockLevel: 8,
        currentStock: 18,
        averageCost: 7800,
        retailPrice: 8800,
        wholesalePrice: 8400,
        hasBatches: false,
        supplierId: 'sup_alqubati',
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prod_cleaner_ariel_1kg',
        nameAr: 'مسحوق غسيل إريال للغسالات العادية 1 كجم',
        nameEn: 'Ariel Washing Powder 1KG',
        sku: 'CLN-ARI-001',
        barcode: '6291003008087',
        categoryId: 'cat_cleaning',
        baseUnit: 'pack',
        units: [
          { id: 'u_16', unitNameAr: 'كيس 1 كجم', unitNameEn: 'Pack 1KG', unitType: 'pack', conversionFactor: 1, purchasePrice: 1900, costPrice: 1900, retailPrice: 2250, wholesalePrice: 2100, isBaseUnit: true, barcode: '6291003008087' },
          { id: 'u_17', unitNameAr: 'كرتون (12 كيس)', unitNameEn: 'Carton (12 pcs)', unitType: 'carton', conversionFactor: 12, purchasePrice: 22200, costPrice: 22200, retailPrice: 26000, wholesalePrice: 24500, isBaseUnit: false, barcode: '6291003008088' },
        ],
        minStockLevel: 10,
        currentStock: 22,
        averageCost: 1900,
        retailPrice: 2250,
        wholesalePrice: 2100,
        hasBatches: false,
        isActive: true,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const today = new Date();
    const expirySoon = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expirySafe = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const batches: ProductBatch[] = [
      {
        id: 'batch_yamani_1',
        batchNumber: 'LOT-YAM-2026-08',
        productId: 'prod_milk_yamani_1l',
        branchId: 'branch_main',
        quantity: 36,
        unitId: 'u_1',
        purchaseCost: 850,
        productionDate: '2026-08-01',
        expiryDate: expirySoon, // expiring soon alert
        supplierId: 'sup_yemen_dairy',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'batch_yamani_2',
        batchNumber: 'LOT-YAM-2026-09',
        productId: 'prod_milk_yamani_1l',
        branchId: 'branch_main',
        quantity: 36,
        unitId: 'u_1',
        purchaseCost: 850,
        productionDate: '2026-08-15',
        expiryDate: expirySafe,
        supplierId: 'sup_yemen_dairy',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'batch_hana_1',
        batchNumber: 'LOT-HAN-0881',
        productId: 'prod_yoghurt_hana',
        branchId: 'branch_main',
        quantity: 48,
        unitId: 'u_3',
        purchaseCost: 200,
        productionDate: '2026-08-20',
        expiryDate: expirySoon,
        supplierId: 'sup_hail_saeed',
        createdAt: new Date().toISOString(),
      },
    ];

    const sampleSales: Sale[] = [
      {
        id: 'sale_inv_1001',
        invoiceNumber: 'INV-2026-001001',
        branchId: 'branch_main',
        userId: 'usr_cashier',
        userName: 'سامي صالح الريمي (كاشير)',
        customerId: 'cust_cash_default',
        customerName: 'عميل نقدي عام',
        items: [
          {
            id: 'si_1',
            saleId: 'sale_inv_1001',
            productId: 'prod_milk_yamani_1l',
            productNameAr: 'حليب يماني طويل الأجل 1 لتر',
            barcode: '6291003001018',
            unitId: 'u_1',
            unitNameAr: 'حبة (لتر)',
            unitConversionFactor: 1,
            quantity: 2,
            baseQuantity: 2,
            unitCost: 850,
            unitPrice: 1000,
            discountAmount: 0,
            subtotal: 2000,
            taxAmount: 0,
            total: 2000,
            profit: 300,
          },
          {
            id: 'si_2',
            saleId: 'sale_inv_1001',
            productId: 'prod_biscuit_abu_walad',
            productNameAr: 'بسكويت أبو ولد الشهير أصلي (سندوتش)',
            barcode: '6291003005056',
            unitId: 'u_9',
            unitNameAr: 'حبة فردي',
            unitConversionFactor: 1,
            quantity: 4,
            baseQuantity: 4,
            unitCost: 120,
            unitPrice: 150,
            discountAmount: 0,
            subtotal: 600,
            taxAmount: 0,
            total: 600,
            profit: 120,
          },
        ],
        subtotal: 2600,
        discountAmount: 0,
        taxAmount: 0,
        total: 2600,
        paidAmount: 2600,
        remainingAmount: 0,
        totalCost: 2180,
        grossProfit: 420,
        payments: [
          { id: 'sp_1', saleId: 'sale_inv_1001', method: 'cash', amount: 2600, currency: 'YER', exchangeRate: 1, accountId: 'acc_drawer_main', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() }
        ],
        status: 'completed',
        notes: 'فاتورة نقدية سريعة',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'sale_inv_1002',
        invoiceNumber: 'INV-2026-001002',
        branchId: 'branch_main',
        userId: 'usr_cashier',
        userName: 'سامي صالح الريمي (كاشير)',
        customerId: 'cust_dr_fouad',
        customerName: 'د. فؤاد محمد العريقي',
        customerPhone: '+967 777 555 444',
        items: [
          {
            id: 'si_3',
            saleId: 'sale_inv_1002',
            productId: 'prod_oil_safia_1_5l',
            productNameAr: 'زيت صافية نباتي نقي 1.5 لتر',
            barcode: '6291003003032',
            unitId: 'u_5',
            unitNameAr: 'دبة (1.5 لتر)',
            unitConversionFactor: 1,
            quantity: 2,
            baseQuantity: 2,
            unitCost: 2600,
            unitPrice: 3000,
            discountAmount: 0,
            subtotal: 6000,
            taxAmount: 0,
            total: 6000,
            profit: 800,
          },
          {
            id: 'si_4',
            saleId: 'sale_inv_1002',
            productId: 'prod_tea_kabous_227g',
            productNameAr: 'شاي الكبوس أحمر نخب أول 227 جرام',
            barcode: '6291003006063',
            unitId: 'u_12',
            unitNameAr: 'باكت 227 جم',
            unitConversionFactor: 1,
            quantity: 1,
            baseQuantity: 1,
            unitCost: 1100,
            unitPrice: 1300,
            discountAmount: 0,
            subtotal: 1300,
            taxAmount: 0,
            total: 1300,
            profit: 200,
          }
        ],
        subtotal: 7300,
        discountAmount: 0,
        taxAmount: 0,
        total: 7300,
        paidAmount: 2000, // partial payment
        remainingAmount: 5300, // added to credit debt
        totalCost: 6300,
        grossProfit: 1000,
        payments: [
          { id: 'sp_2', saleId: 'sale_inv_1002', method: 'cash', amount: 2000, currency: 'YER', exchangeRate: 1, accountId: 'acc_drawer_main', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
          { id: 'sp_3', saleId: 'sale_inv_1002', method: 'credit', amount: 5300, currency: 'YER', exchangeRate: 1, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
        ],
        status: 'completed',
        notes: 'دفع 2000 والباقي على الحساب',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ];

    const samplePurchases: Purchase[] = [
      {
        id: 'purch_2001',
        invoiceNumber: 'PUR-2026-002001',
        supplierInvoiceNumber: 'HSA-INV-9941',
        supplierId: 'sup_hail_saeed',
        supplierName: 'مجموعة هائل سعيد أنعم وشركاه',
        branchId: 'branch_main',
        userId: 'usr_admin',
        userName: 'مهند أحمد (المدير)',
        items: [
          {
            id: 'pi_1',
            purchaseId: 'purch_2001',
            productId: 'prod_oil_safia_1_5l',
            productNameAr: 'زيت صافية نباتي نقي 1.5 لتر',
            unitId: 'u_6',
            unitNameAr: 'كرتون (6 دبات)',
            unitConversionFactor: 6,
            quantity: 5,
            unitPurchasePrice: 15400,
            subtotal: 77000,
            taxAmount: 0,
            total: 77000,
            batchNumber: 'LOT-SAF-099',
            expiryDate: '2027-02-01',
          },
          {
            id: 'pi_2',
            purchaseId: 'purch_2001',
            productId: 'prod_biscuit_abu_walad',
            productNameAr: 'بسكويت أبو ولد الشهير أصلي (سندوتش)',
            unitId: 'u_11',
            unitNameAr: 'كرتون (12 باكت)',
            unitConversionFactor: 288,
            quantity: 2,
            unitPurchasePrice: 32500,
            subtotal: 65000,
            taxAmount: 0,
            total: 65000,
            batchNumber: 'LOT-ABU-882',
            expiryDate: '2027-04-10',
          }
        ],
        subtotal: 142000,
        discountAmount: 2000,
        taxAmount: 0,
        total: 140000,
        paidAmount: 100000,
        remainingAmount: 40000,
        payments: [
          { id: 'pp_1', purchaseId: 'purch_2001', method: 'bank_transfer', amount: 100000, accountId: 'acc_kuraimi', referenceNumber: 'KUR-TX-99011', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }
        ],
        status: 'received',
        notes: 'توريد دفعة بضاعة جديدة للمخزن الرئيسي',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ];

    const sampleExpenses: Expense[] = [
      {
        id: 'exp_01',
        branchId: 'branch_main',
        category: 'electricity',
        categoryLabelAr: 'كهرباء وطاقة واشتراك ماطور',
        amount: 25000,
        currency: 'YER',
        paymentMethod: 'cash',
        accountId: 'acc_drawer_main',
        recipient: 'شركة توليد الكهرباء التجارية',
        description: 'سداد فاتورة الكهرباء التجارية للنصف الأول من الشهر',
        userId: 'usr_admin',
        userName: 'مهند أحمد',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'exp_02',
        branchId: 'branch_main',
        category: 'supplies',
        categoryLabelAr: 'مستلزمات وأكياس ورقية ومطبوعات',
        amount: 8500,
        currency: 'YER',
        paymentMethod: 'cash',
        accountId: 'acc_drawer_main',
        recipient: 'مطبعة النجاح',
        description: 'شراء أكياس تغليف نايلون وورق فواتير حرارية 80 ملم',
        userId: 'usr_manager',
        userName: 'طارق عبدالكريم',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ];

    const currentCashSession: CashSession = {
      id: 'cs_today_01',
      sessionNumber: 'CS-20260828-01',
      branchId: 'branch_main',
      userId: 'usr_cashier',
      userName: 'سامي صالح الريمي (كاشير الصباح)',
      openingCash: 50000,
      openingNotes: 'افتتاح الوردية الصباحية بمبلغ فكة 50,000 ريال يمني',
      openedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'open',
      cashSalesTotal: 4600,
      cashRefundsTotal: 0,
      customerCashPaymentsTotal: 0,
      supplierCashPaymentsTotal: 0,
      cashExpensesTotal: 8500,
      cashDepositsTotal: 0,
      cashWithdrawalsTotal: 0,
    };

    const currencies: CurrencyConfig[] = [
      { code: 'YER', nameAr: 'ريال يمني', nameEn: 'Yemeni Rial', symbol: 'ر.ي', exchangeRateToYER: 1, isBase: true, decimalPlaces: 0 },
      { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س', exchangeRateToYER: 140, isBase: false, decimalPlaces: 2 },
      { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$', exchangeRateToYER: 535, isBase: false, decimalPlaces: 2 },
    ];

    const settings: StoreSettings = {
      storeNameAr: 'سوبرماركت الوفاء المركزي',
      storeNameEn: 'Al-Wafa Central Supermarket',
      commercialRegNo: 'CR-YER-104928',
      taxNumber: 'TAX-998822',
      phone: '+967 770 123 456',
      email: 'contact@alwafa-store.com',
      addressAr: 'صنعاء، شارع الستين الغربي، تقاطع الجامعة',
      baseCurrency: 'YER',
      enableTax: false,
      defaultTaxRate: 5,
      isTaxInclusive: true,
      expiryWarningDays: 30,
      lowStockGlobalThreshold: 15,
      enableCustomerCreditLimit: true,
      creditLimitAction: 'warn',
      receiptPrinterType: '80mm',
      receiptHeaderMessageAr: 'مرحباً بكم في سوبرماركت الوفاء المركزي',
      receiptFooterMessageAr: 'شكراً لتعاملكم معنا ونتشرف بزيارتكم مجدداً',
      allowNegativeStock: false,
      costingMethod: 'FEFO',
      autoBackupIntervalHours: 24,
      offlineSyncEnabled: true,
    };

    const plans: PlanConfig[] = [
      {
        id: 'FREE',
        nameAr: 'الباقة المجانية الدائمة',
        nameEn: 'Free Lifetime Plan',
        priceUSD: 0,
        interval: 'lifetime',
        billingPeriodMonths: 0,
        descriptionAr: 'خطة مجانية دائمة للمحلات الصغيرة ونقاط البيع الفردية مع الميزات الأساسية.',
        features: [
          { textAr: 'نقاط بيع سريعة للمبيعات اليومية وإصدار الفواتير', included: true },
          { textAr: 'إدارة المنتجات حتى 100 صنف فقط', included: true },
          { textAr: 'إصدار حتى 150 فاتورة شهرياً', included: true },
          { textAr: 'إدارة الديون وحسابات الزبائن الأساسية', included: true },
          { textAr: 'قارئ باركود بكاميرا الهاتف والكمبيوتر', included: true },
          { textAr: 'مستشار الذكاء الاصطناعي (Gemini AI Advisor)', included: false },
          { textAr: 'إرسال الفواتير وكشوفات الحساب عبر واتساب', included: false },
          { textAr: 'المزامنة السحابية الفورية وتعدد الأجهزة', included: false },
          { textAr: 'تعدد المستخدمين وإدارة الصلاحيات المتقدمة', included: false },
        ],
        maxProducts: 100,
        maxInvoicesPerMonth: 150,
        maxUsers: 1,
        maxBranches: 1,
        aiAssistantAllowed: false,
        whatsappInvoicingAllowed: false,
        cameraScannerAllowed: true,
        cloudSyncAllowed: false,
        bluetoothPrintingAllowed: true,
        advancedReportsAllowed: false,
      },
      {
        id: 'PRO_MONTHLY',
        nameAr: 'حاسبوا برو الشهري',
        nameEn: 'HASEBO Pro Monthly',
        priceUSD: 5,
        interval: 'monthly',
        billingPeriodMonths: 1,
        descriptionAr: 'اشتراك شهري مرن يمنحك كافة الميزات الاحترافية والذكاء الاصطناعي بدون أي قيود.',
        features: [
          { textAr: 'فواتير ومبيعات لا محدودة يومياً', included: true, highlight: true },
          { textAr: 'أصناف ومنتجات ومخزون غير محدود', included: true, highlight: true },
          { textAr: 'مستشار الذكاء الاصطناعي (Gemini AI Advisor)', included: true, highlight: true },
          { textAr: 'مشاركة الفواتير وكشوفات الحساب عبر واتساب WhatsApp', included: true, highlight: true },
          { textAr: 'قارئ باركود ذكي بكاميرا الأندرويد والكمبيوتر', included: true },
          { textAr: 'مزامنة سحابية فورية ونسخ احتياطي مشفر', included: true },
          { textAr: 'طباعة الإيصالات بالبلوتوث والحراري (58mm/80mm)', included: true },
          { textAr: 'تعدد المستخدمين والصناديق والورديات', included: true },
          { textAr: 'العمل دون إنترنت بالكامل (Offline First)', included: true },
        ],
        maxProducts: -1,
        maxInvoicesPerMonth: -1,
        maxUsers: 10,
        maxBranches: 3,
        aiAssistantAllowed: true,
        whatsappInvoicingAllowed: true,
        cameraScannerAllowed: true,
        cloudSyncAllowed: true,
        bluetoothPrintingAllowed: true,
        advancedReportsAllowed: true,
      },
      {
        id: 'PRO_YEARLY',
        nameAr: 'حاسبوا برو السنوي',
        nameEn: 'HASEBO Pro Yearly',
        priceUSD: 50,
        interval: 'yearly',
        billingPeriodMonths: 12,
        badge: 'الأفضل قيمة والأكثر توفيراً (BEST VALUE)',
        savingTextAr: 'وفر 10 دولار سنوياً ($50 بدلاً من $60)',
        descriptionAr: 'الخيار الأوفر والأكثر قيمة! ادفع 50$ سنوياً بدلاً من 60$ واحصل على جميع مزايا PRO كاملة.',
        features: [
          { textAr: 'جميع مزايا باقة حاسبوا برو كاملة لمدة عام', included: true, highlight: true },
          { textAr: 'توفير سنوي فوري بقيمة 10 دولار (17% خصم)', included: true, highlight: true },
          { textAr: 'فواتير ومبيعات ومنتجات غير محدودة', included: true },
          { textAr: 'مستشار الذكاء الاصطناعي والتحليلات التنبؤية', included: true },
          { textAr: 'مشاركة فواتير وكشوفات واتساب غير محدودة', included: true },
          { textAr: 'دعم فني وأولوية قصوى للتحديثات والنسخ السحابي', included: true },
        ],
        maxProducts: -1,
        maxInvoicesPerMonth: -1,
        maxUsers: 25,
        maxBranches: 10,
        aiAssistantAllowed: true,
        whatsappInvoicingAllowed: true,
        cameraScannerAllowed: true,
        cloudSyncAllowed: true,
        bluetoothPrintingAllowed: true,
        advancedReportsAllowed: true,
      },
    ];

    const campaigns: LaunchCampaign[] = [
      {
        id: 'LAUNCH_10_STORES',
        titleAr: '🔥 عرض الإطلاق — أول 10 متاجر تحصل على PRO مجاناً لمدة 30 يوماً',
        titleEn: 'First 10 Stores Get PRO Free for 30 Days',
        descriptionAr: 'عرض تدشين خاص وحصري: يحصل أول 10 متاجر مسجلة على باقة حاسبوا برو بكافة ميزاتها مجاناً لمدة 30 يوماً كاملة.',
        maxClaims: 10,
        currentClaims: 3,
        claimedStoreIds: ['store_baraka_sanaa', 'store_alwafa_aden', 'store_alnoor_taiz'],
        isActive: true,
        discountPercentage: 100,
        trialDays: 30,
        eligiblePlanId: 'PRO_MONTHLY',
        startDate: '2026-08-01T00:00:00.000Z',
        badgeAr: 'عرض تدشين حصري',
      },
      {
        id: 'EARLY_CUSTOMER_50',
        titleAr: '⭐ عرض العملاء الأوائل — خصم 50% على باقة PRO السنوية لأول 50 متجر',
        titleEn: 'Early Customer Offer: 50% Off PRO Yearly for First 50 Stores',
        descriptionAr: 'احصل على الباقة السنوية الشاملة بنصف السعر (25$ فقط بدلاً من 50$) لأول 50 متجر مؤهل عند تفعيل الحملة من الإدارة.',
        maxClaims: 50,
        currentClaims: 0,
        claimedStoreIds: [],
        isActive: false, // controlled by admin
        discountPercentage: 50,
        trialDays: 0,
        eligiblePlanId: 'PRO_YEARLY',
        startDate: '2026-09-01T00:00:00.000Z',
        badgeAr: 'خصم 50% للعملاء الأوائل',
      },
    ];

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 28 days remaining in trial
    const trialStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // started 2 days ago

    const subscription: StoreSubscription = {
      storeId: 'store_current_main',
      storeNameAr: 'سوبرماركت الوفاء المركزي',
      planId: 'PRO_MONTHLY',
      status: 'TRIAL',
      startDate: trialStart.toISOString(),
      expiresAt: trialEnd.toISOString(),
      renewalDate: trialEnd.toISOString(),
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      isTrial: true,
      appliedCampaignId: 'LAUNCH_10_STORES',
      discountPercentage: 100,
      pricePaidUSD: 0,
      autoRenew: true,
      claimedLaunchOffer: true,
      lastPaymentDate: trialStart.toISOString(),
      paymentMethod: 'store_credit',
    };

    const subscriptionInvoices: SubscriptionInvoice[] = [
      {
        id: 'sinv_init_1',
        storeId: 'store_current_main',
        invoiceNumber: 'INV-LAUNCH-000003',
        planId: 'PRO_MONTHLY',
        planNameAr: 'حاسبوا برو (عرض الإطلاق الترويجي - تجربة 30 يوماً مجاناً)',
        amountUSD: 5,
        discountUSD: 5,
        totalPaidUSD: 0,
        currency: 'USD',
        paymentMethod: 'عرض تدشين مجاني (أول 10 متاجر)',
        status: 'PAID',
        periodStart: trialStart.toISOString(),
        periodEnd: trialEnd.toISOString(),
        createdAt: trialStart.toISOString(),
        notesAr: 'تم تفعيل باقة حاسبوا برو مجاناً كأحد أول 10 متاجر ضمن حملة التدشين',
      },
    ];

    const notifications: SystemNotification[] = [
      {
        id: 'notif_1',
        type: 'expiring_soon',
        titleAr: 'تنبيه انتهاء صلاحية وشيك',
        messageAr: 'يوجد 36 حبة من حليب يماني 1 لتر تنتهي صلاحيتها خلال 14 يوماً (الدفعة: LOT-YAM-2026-08)',
        severity: 'warning',
        isRead: false,
        entityId: 'prod_milk_yamani_1l',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        type: 'low_stock',
        titleAr: 'تنبيه مخزون منخفض',
        messageAr: 'مسحوق غسيل إريال 1 كجم وصل إلى 22 كيس، وهو قريب من حد الطلب الأدنى',
        severity: 'info',
        isRead: false,
        entityId: 'prod_cleaner_ariel_1kg',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif_3',
        type: 'ai_insight',
        titleAr: 'تحليل ذكاء اصطناعي لمبيعات اليوم',
        messageAr: 'هامش الربح الإجمالي اليوم بلغ 17.5%، ويُنصح بعمل عرض ترويجي على منتجات الألبان السريعة لزيادة التدفق النقدي',
        severity: 'success',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'audit_1',
        userId: 'usr_admin',
        userName: 'مهند أحمد',
        action: 'INITIALIZE_SYSTEM',
        actionAr: 'تهيئة النظام وقاعدة البيانات وتأسيس الفروع والمستخدمين',
        entity: 'auth',
        details: 'تم بدء تشغيل منظومة سوبرماركت إي آر بي بنجاح',
        createdAt: new Date().toISOString(),
      }
    ];

    return {
      users,
      roles,
      branches,
      categories,
      products,
      batches,
      priceHistories: [],
      sales: sampleSales,
      saleReturns: [],
      purchases: samplePurchases,
      customers,
      customerTransactions: [
        {
          id: 'ctx_1',
          customerId: 'cust_dr_fouad',
          branchId: 'branch_main',
          type: 'sale_credit',
          referenceNumber: 'INV-2026-001002',
          debit: 5300,
          credit: 0,
          balanceAfter: 38500,
          notes: 'متبقي فاتورة مبيعات آجل',
          userId: 'usr_cashier',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ],
      suppliers,
      supplierTransactions: [
        {
          id: 'stx_1',
          supplierId: 'sup_hail_saeed',
          branchId: 'branch_main',
          type: 'purchase_credit',
          referenceNumber: 'PUR-2026-002001',
          debit: 0,
          credit: 40000,
          balanceAfter: 450000,
          notes: 'متبقي فاتورة توريد زيوت وبسكويت',
          userId: 'usr_admin',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      ],
      expenses: sampleExpenses,
      cashAccounts,
      cashSessions: [currentCashSession],
      inventoryMovements: [
        {
          id: 'mov_1',
          productId: 'prod_oil_safia_1_5l',
          productNameAr: 'زيت صافية نباتي نقي 1.5 لتر',
          branchId: 'branch_main',
          type: 'purchase',
          typeLabelAr: 'فاتورة مشتريات وتوريد',
          quantityChange: 30, // 5 cartons * 6
          previousQuantity: 6,
          newQuantity: 36,
          unitCost: 2600,
          referenceNumber: 'PUR-2026-002001',
          userId: 'usr_admin',
          userName: 'مهند أحمد',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      ],
      stocktakes: [],
      auditLogs,
      notifications,
      settings,
      currencies,
      plans,
      subscription,
      campaigns,
      subscriptionInvoices,
      version: 2,
    };
  }
}

export const db = new RelationalDatabase();
