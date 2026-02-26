import { AppDatabase, AuditLog, PriceSnapshot, Session, Transaction, User, Wallet } from '../types';

const DB_KEY = 'gold_fintech_db_v1';
const SESSION_KEY = 'gold_fintech_session_v1';

const uid = () => Math.random().toString(36).slice(2, 11);

const demoAdmin: User = {
  id: 'admin-1',
  email: 'admin@goldapp.ir',
  phone: '09120000000',
  name: 'مدیر سیستم',
  password: 'Admin@12345',
  role: 'ADMIN',
  twoFactorEnabled: true,
  lastIpAddress: '127.0.0.1',
  createdAt: Date.now(),
};

const demoUser: User = {
  id: 'user-1',
  email: 'user@goldapp.ir',
  phone: '09121111111',
  name: 'کاربر نمونه',
  password: 'User@12345',
  role: 'USER',
  twoFactorEnabled: false,
  lastIpAddress: '127.0.0.1',
  createdAt: Date.now(),
};

const initialDatabase: AppDatabase = {
  users: [demoAdmin, demoUser],
  wallets: [
    { userId: demoAdmin.id, cash: 500_000_000, gold: 200, updatedAt: Date.now() },
    { userId: demoUser.id, cash: 120_000_000, gold: 32.5, updatedAt: Date.now() },
  ],
  transactions: [],
  auditLogs: [],
  prices: [{ id: uid(), price: 4_850_000, source: 'demo-live', createdAt: Date.now() }],
};

export function loadDatabase(): AppDatabase {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return initialDatabase;
  try {
    return JSON.parse(raw) as AppDatabase;
  } catch {
    return initialDatabase;
  }
}

export function saveDatabase(db: AppDatabase) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function findUserByCredentials(db: AppDatabase, login: string, password: string) {
  return db.users.find((u) => (u.email === login || u.phone === login) && u.password === password);
}

export function ensureWallet(db: AppDatabase, userId: string): Wallet {
  let wallet = db.wallets.find((w) => w.userId === userId);
  if (!wallet) {
    wallet = { userId, cash: 0, gold: 0, updatedAt: Date.now() };
    db.wallets.push(wallet);
  }
  return wallet;
}

export function addAuditLog(db: AppDatabase, payload: Omit<AuditLog, 'id' | 'createdAt'>) {
  db.auditLogs.unshift({
    id: uid(),
    createdAt: Date.now(),
    ...payload,
  });
}

export function addTransaction(db: AppDatabase, tx: Omit<Transaction, 'id' | 'createdAt'>) {
  db.transactions.unshift({
    id: uid(),
    createdAt: Date.now(),
    ...tx,
  });
}

export function addPrice(db: AppDatabase, price: number, source: string) {
  const snapshot: PriceSnapshot = { id: uid(), price, source, createdAt: Date.now() };
  db.prices.unshift(snapshot);
  db.prices = db.prices.slice(0, 240);
}
