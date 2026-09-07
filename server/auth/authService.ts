/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import type { User, Role, PermissionKey, AuditLog } from '../../src/types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'grocery_erp_secure_secret_key_998822';

export interface AuthSession {
  userId: string;
  username: string;
  roleId: string;
  currentBranchId: string;
  exp: number;
}

export function createToken(user: User): string {
  const payload: AuthSession = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    currentBranchId: user.currentBranchId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const jsonStr = JSON.stringify(payload);
  const base64 = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(base64).digest('base64url');
  return `${base64}.${signature}`;
}

export function verifyToken(token: string): AuthSession | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [base64, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(base64).digest('base64url');
  if (signature !== expectedSignature) return null;

  try {
    const payloadStr = Buffer.from(base64, 'base64url').toString('utf-8');
    const session = JSON.parse(payloadStr) as AuthSession;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  role?: Role;
  session?: AuthSession;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول', code: 'UNAUTHORIZED' });
  }

  const session = verifyToken(token);
  if (!session) {
    return res.status(401).json({ error: 'الجلسة منتهية أو غير صالحة', code: 'INVALID_TOKEN' });
  }

  const database = db.getDb();
  const userRecord = database.users.find(u => u.id === session.userId && u.isActive);
  if (!userRecord) {
    return res.status(401).json({ error: 'المستخدم غير موجود أو غير مفعل', code: 'USER_NOT_FOUND' });
  }

  const role = database.roles.find(r => r.id === userRecord.roleId);
  const { passwordHash, salt, ...safeUser } = userRecord;

  req.user = safeUser;
  req.role = role;
  req.session = session;
  next();
}

export function requirePermission(permission: PermissionKey) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.role) {
      return res.status(401).json({ error: 'غير مصرح', code: 'UNAUTHORIZED' });
    }

    if (req.role.name === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.role.permissions.includes(permission)) {
      return res.status(403).json({
        error: `ليس لديك صلاحية لتنفيذ هذا الإجراء (${permission})`,
        code: 'FORBIDDEN',
        requiredPermission: permission,
      });
    }

    next();
  };
}

export function logAudit(
  userId: string,
  userName: string,
  action: string,
  actionAr: string,
  entity: AuditLog['entity'],
  entityId?: string,
  details?: string,
  branchId?: string,
  beforeState?: any,
  afterState?: any
) {
  const database = db.getDb();
  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId,
    userName,
    branchId,
    action,
    actionAr,
    entity,
    entityId,
    details,
    beforeState,
    afterState,
    createdAt: new Date().toISOString(),
  };
  database.auditLogs.unshift(log);
  if (database.auditLogs.length > 2000) {
    database.auditLogs.length = 2000;
  }
  db.save();
}
