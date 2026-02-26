import { AppDatabase } from '../types';
import { addAuditLog, addTransaction, ensureWallet } from './dataStore';

const BUY_FEE_RATE = 0.003;
const SELL_FEE_RATE = 0.003;

function existsReference(db: AppDatabase, referenceId: string) {
  return db.transactions.some((t) => t.referenceId === referenceId);
}

export function getCurrentPrice(db: AppDatabase) {
  return db.prices[0]?.price ?? 4_800_000;
}

export function executeBuy(db: AppDatabase, userId: string, amountRial: number, referenceId: string) {
  if (existsReference(db, referenceId)) throw new Error('Duplicate request');
  if (amountRial <= 0) throw new Error('مبلغ خرید نامعتبر است');

  const wallet = ensureWallet(db, userId);
  const price = getCurrentPrice(db);
  const fee = amountRial * BUY_FEE_RATE;
  const netAmount = amountRial - fee;
  const goldAmount = netAmount / price;

  if (wallet.cash < amountRial) throw new Error('موجودی ریالی کافی نیست');

  wallet.cash -= amountRial;
  wallet.gold += goldAmount;
  wallet.updatedAt = Date.now();

  addTransaction(db, {
    userId,
    type: 'BUY',
    amount: amountRial,
    goldAmount,
    pricePerGram: price,
    fee,
    status: 'COMPLETED',
    referenceId,
    description: 'خرید طلای آب‌شده',
  });

  addAuditLog(db, {
    userId,
    action: 'BUY_GOLD',
    details: `amount=${amountRial},gold=${goldAmount.toFixed(5)},fee=${fee}`,
    ipAddress: '127.0.0.1',
    userAgent: navigator.userAgent,
  });
}

export function executeSell(db: AppDatabase, userId: string, amountGold: number, referenceId: string) {
  if (existsReference(db, referenceId)) throw new Error('Duplicate request');
  if (amountGold <= 0) throw new Error('مقدار فروش نامعتبر است');

  const wallet = ensureWallet(db, userId);
  const price = getCurrentPrice(db);
  const grossAmount = amountGold * price;
  const fee = grossAmount * SELL_FEE_RATE;
  const finalAmount = grossAmount - fee;

  if (wallet.gold < amountGold) throw new Error('موجودی طلای کافی نیست');

  wallet.gold -= amountGold;
  wallet.cash += finalAmount;
  wallet.updatedAt = Date.now();

  addTransaction(db, {
    userId,
    type: 'SELL',
    amount: finalAmount,
    goldAmount: amountGold,
    pricePerGram: price,
    fee,
    status: 'COMPLETED',
    referenceId,
    description: 'فروش طلای آب‌شده',
  });

  addAuditLog(db, {
    userId,
    action: 'SELL_GOLD',
    details: `final=${finalAmount},gold=${amountGold.toFixed(5)},fee=${fee}`,
    ipAddress: '127.0.0.1',
    userAgent: navigator.userAgent,
  });
}
