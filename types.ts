export type Role = 'USER' | 'ADMIN';

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  role: Role;
  twoFactorEnabled: boolean;
  lastIpAddress: string;
  createdAt: number;
}

export interface Wallet {
  userId: string;
  cash: number;
  gold: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  goldAmount: number;
  pricePerGram: number;
  fee: number;
  status: TransactionStatus;
  referenceId: string;
  description: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
}

export interface PriceSnapshot {
  id: string;
  price: number;
  source: string;
  createdAt: number;
}

export interface AppDatabase {
  users: User[];
  wallets: Wallet[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  prices: PriceSnapshot[];
}

export interface Session {
  userId: string;
  role: Role;
}
