import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Coins, LogOut, ShieldCheck, Wallet as WalletIcon } from 'lucide-react';
import { AppDatabase, Session, Transaction } from './types';
import { addAuditLog, addPrice, findUserByCredentials, getSession, loadDatabase, saveDatabase, setSession } from './services/dataStore';
import { executeBuy, executeSell, getCurrentPrice } from './services/tradeEngine';

const fmt = (n: number) => new Intl.NumberFormat('fa-IR').format(Math.round(n));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [session, setSessionState] = useState<Session | null>(() => getSession());
  const [login, setLogin] = useState({ user: '', pass: '' });
  const [trade, setTrade] = useState({ buyRial: '', sellGold: '' });
  const [message, setMessage] = useState<string>('');

  const currentUser = useMemo(() => db.users.find((u) => u.id === session?.userId), [db.users, session]);
  const wallet = useMemo(() => db.wallets.find((w) => w.userId === session?.userId), [db.wallets, session]);
  const price = getCurrentPrice(db);
  const myTransactions = useMemo(() => db.transactions.filter((t) => t.userId === session?.userId).slice(0, 8), [db.transactions, session]);

  useEffect(() => saveDatabase(db), [db]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDb((prev) => {
        const next = structuredClone(prev);
        const base = getCurrentPrice(next);
        const randomMove = Math.round((Math.random() - 0.5) * 20_000);
        addPrice(next, Math.max(4_500_000, base + randomMove), 'simulator');
        return next;
      });
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const updateDb = (mutator: (draft: AppDatabase) => void) => {
    setDb((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  };

  const handleLogin = () => {
    const user = findUserByCredentials(db, login.user.trim(), login.pass);
    if (!user) return setMessage('ورود ناموفق: اطلاعات صحیح نیست.');

    const nextSession: Session = { userId: user.id, role: user.role };
    setSessionState(nextSession);
    setSession(nextSession);
    setMessage(`خوش آمدید ${user.name}`);

    updateDb((draft) => {
      addAuditLog(draft, {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: 'user login',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });
    });
  };

  const handleBuy = () => {
    if (!session) return;
    const amount = Number(trade.buyRial);
    try {
      updateDb((draft) => executeBuy(draft, session.userId, amount, uid()));
      setTrade((prev) => ({ ...prev, buyRial: '' }));
      setMessage('خرید با موفقیت انجام شد.');
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const handleSell = () => {
    if (!session) return;
    const amount = Number(trade.sellGold);
    try {
      updateDb((draft) => executeSell(draft, session.userId, amount, uid()));
      setTrade((prev) => ({ ...prev, sellGold: '' }));
      setMessage('فروش با موفقیت انجام شد.');
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    setSessionState(null);
    setSession(null);
  };

  const adminOverview = {
    totalCash: db.wallets.reduce((a, b) => a + b.cash, 0),
    totalGold: db.wallets.reduce((a, b) => a + b.gold, 0),
    feeIncome: db.transactions.reduce((a, b) => a + b.fee, 0),
  };

  if (!session || !currentUser || !wallet) {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-10" dir="rtl">
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 shadow-sm border">
          <h1 className="text-2xl font-bold mb-2">MVP خرید و فروش طلای آب‌شده</h1>
          <p className="text-sm text-slate-600 mb-4">دموی عملیاتی برای جذب سرمایه (نسخه وب تک‌ریپو).</p>
          <div className="space-y-3">
            <input className="w-full border rounded-xl p-3" placeholder="ایمیل یا موبایل" value={login.user} onChange={(e) => setLogin((p) => ({ ...p, user: e.target.value }))} />
            <input type="password" className="w-full border rounded-xl p-3" placeholder="رمز عبور" value={login.pass} onChange={(e) => setLogin((p) => ({ ...p, pass: e.target.value }))} />
            <button onClick={handleLogin} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold">ورود</button>
            <div className="text-xs text-slate-500 leading-6 bg-slate-50 rounded-xl p-3">
              حساب ادمین: admin@goldapp.ir / Admin@12345<br />
              حساب کاربر: user@goldapp.ir / User@12345
            </div>
          </div>
          {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="bg-white rounded-2xl p-4 border flex items-center justify-between gap-2">
          <div>
            <h1 className="font-black text-xl">داشبورد فین‌تک طلا</h1>
            <p className="text-xs text-slate-500">کاربر: {currentUser.name} | نقش: {currentUser.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">هر گرم: {fmt(price)} ریال</span>
            <button onClick={logout} className="px-3 py-2 text-sm rounded-xl border flex items-center gap-2"><LogOut size={15} /> خروج</button>
          </div>
        </header>

        {message && <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl p-3 text-sm">{message}</div>}

        <section className="grid md:grid-cols-3 gap-4">
          <Card title="کیف پول ریالی" value={`${fmt(wallet.cash)} ریال`} icon={<WalletIcon size={18} />} />
          <Card title="کیف پول طلایی" value={`${wallet.gold.toFixed(5)} گرم`} icon={<Coins size={18} />} />
          <Card title="وضعیت امنیت" value={currentUser.twoFactorEnabled ? '2FA فعال' : '2FA غیرفعال'} icon={<ShieldCheck size={18} />} />
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <h2 className="font-bold">خرید طلا</h2>
            <input value={trade.buyRial} onChange={(e) => setTrade((p) => ({ ...p, buyRial: e.target.value }))} className="w-full border rounded-xl p-3" placeholder="مبلغ ریال" />
            <p className="text-xs text-slate-500">کارمزد خرید: ۰.۳٪ | تخمین طلا: {trade.buyRial ? ((Number(trade.buyRial) * 0.997) / price).toFixed(5) : '0'} گرم</p>
            <button onClick={handleBuy} className="w-full bg-emerald-600 text-white rounded-xl py-2">ثبت خرید</button>
          </div>

          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <h2 className="font-bold">فروش طلا</h2>
            <input value={trade.sellGold} onChange={(e) => setTrade((p) => ({ ...p, sellGold: e.target.value }))} className="w-full border rounded-xl p-3" placeholder="مقدار گرم" />
            <p className="text-xs text-slate-500">کارمزد فروش: ۰.۳٪ | تخمین ریال: {trade.sellGold ? fmt(Number(trade.sellGold) * price * 0.997) : 0}</p>
            <button onClick={handleSell} className="w-full bg-sky-600 text-white rounded-xl py-2">ثبت فروش</button>
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-bold mb-3">تراکنش‌های اخیر من</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="p-2">نوع</th><th className="p-2">ریال</th><th className="p-2">طلا</th><th className="p-2">کارمزد</th><th className="p-2">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {myTransactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </tbody>
            </table>
          </div>
        </section>

        {session.role === 'ADMIN' && (
          <section className="bg-white border rounded-2xl p-4">
            <h2 className="font-bold mb-3">پنل ادمین</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <Card title="مجموع ریال سیستم" value={`${fmt(adminOverview.totalCash)} ریال`} icon={<WalletIcon size={18} />} />
              <Card title="مجموع طلای سیستم" value={`${adminOverview.totalGold.toFixed(5)} گرم`} icon={<Coins size={18} />} />
              <Card title="درآمد کارمزد" value={`${fmt(adminOverview.feeIncome)} ریال`} icon={<AlertTriangle size={18} />} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Card({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="font-bold mt-1">{value}</p>
      </div>
      <div className="bg-slate-100 p-2 rounded-xl">{icon}</div>
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  return (
    <tr className="border-b last:border-0 text-center">
      <td className="p-2">{tx.type === 'BUY' ? 'خرید' : tx.type === 'SELL' ? 'فروش' : tx.type}</td>
      <td className="p-2">{fmt(tx.amount)}</td>
      <td className="p-2">{tx.goldAmount.toFixed(5)}</td>
      <td className="p-2">{fmt(tx.fee)}</td>
      <td className="p-2">{tx.status}</td>
    </tr>
  );
}
