import { useEffect, useState } from 'react';
import { supabase, StudentProfile, Transaction } from '../lib/supabase';
import { categorizeTransaction, roastSpending } from '../lib/aiCoach';
import { unlockAchievement, updateStreak } from '../lib/achievements';
import { formatMoney, amountFromInput, currencyCode } from '../lib/currency';
import { getSpendingCategories } from '../lib/budgets';
import MoneyInput from '../components/MoneyInput';
import { Plus, Trash2, Sparkles, Flame, X } from 'lucide-react';

interface Props {
  profile: StudentProfile;
}

export default function SpendingTracker({ profile }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roast, setRoast] = useState('');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [toast, setToast] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const categories = getSpendingCategories(profile);

  useEffect(() => { loadTransactions(); }, []);

  async function loadTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    setTransactions(data || []);
  }

  async function handleAiCategorize() {
    if (!description || !amount) return;
    setAiCategorizing(true);
    try {
      const result = await categorizeTransaction(description, amountFromInput(amount), categories.map(c => c.id));
      setCategory(result.category || 'other');
      showToast('AI categorized your transaction!');
    } catch {
      // fallback silently
    }
    setAiCategorizing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amountFromInput(amount)) return;
    setSaving(true);

    const { data } = await supabase.from('transactions').insert({
      user_id: profile.user_id,
      description: description.trim(),
      amount: amountFromInput(amount),
      category,
      transaction_date: date,
    }).select().single();

    if (data) {
      const updated = [data, ...transactions];
      setTransactions(updated);

      // Achievements
      await unlockAchievement(profile.user_id, 'first_transaction');
      if (updated.length >= 10) await unlockAchievement(profile.user_id, 'ten_transactions');

      // Streak
      const { streak } = await updateStreak(profile.user_id);
      if (streak >= 3) await unlockAchievement(profile.user_id, 'streak_3');
      if (streak >= 7) await unlockAchievement(profile.user_id, 'streak_7');
      if (streak >= 30) await unlockAchievement(profile.user_id, 'streak_30');

      showToast('Transaction saved!');
      setDescription(''); setAmount(''); setCategory('other'); setShowForm(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }

  async function fetchRoast() {
    if (!transactions.length) return;
    setLoadingRoast(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthTx = transactions.filter(t => t.transaction_date >= startOfMonth);
      const result = await roastSpending(monthTx.length ? monthTx : transactions, profile);
      setRoast(result.message || '');
    } catch {
      setRoast('Your spending is a mystery even to AI... 🤷');
    }
    setLoadingRoast(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  const filtered = filterCat === 'all' ? transactions : transactions.filter(t => t.category === filterCat);
  const totalThisMonth = (() => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    return transactions.filter(t => t.transaction_date >= start).reduce((s, t) => s + t.amount, 0);
  })();

  const catDef = (cat: string) => categories.find(c => c.id === cat);

  return (
    <div className="space-y-4 pb-6 min-w-0">
      {/* Toast */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 bg-snow text-ink px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-in max-w-[calc(100vw-2rem)]">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="min-w-0">
          <h1 className="text-snow text-xl sm:text-2xl font-bold">Spending Tracker</h1>
          <p className="text-mist text-sm mt-0.5 break-words">Spent {formatMoney(totalThisMonth, profile.currency)} this month</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchRoast}
            disabled={loadingRoast || !transactions.length}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-dusk hover:bg-steel/50 border border-steel text-snow px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition-all"
          >
            <Flame size={15} />
            {loadingRoast ? 'Roasting...' : 'Roast Me'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-glow hover:bg-glow/80 text-ink px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </div>

      {/* AI Roast */}
      {roast && (
        <div className="bg-dusk border border-steel rounded-2xl p-4 relative">
          <button onClick={() => setRoast('')} className="absolute top-3 right-3 text-snow/60 hover:text-snow"><X size={14} /></button>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤣</span>
            <div>
              <div className="text-snow font-semibold text-sm mb-1">Your AI Roast</div>
              <p className="text-snow text-sm leading-relaxed">{roast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add transaction modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/80 z-40 flex items-end md:items-center justify-center p-4 pb-24 md:pb-4" onClick={() => setShowForm(false)}>
          <div className="bg-deep border border-dusk rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-snow font-semibold text-lg">Add Transaction</h2>
              <button onClick={() => setShowForm(false)} className="text-mist hover:text-snow"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Description</label>
                <div className="flex gap-2">
                  <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Bubble tea with friends"
                    className="flex-1 bg-dusk border border-steel text-snow rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent placeholder-mist"
                  />
                  <button
                    type="button"
                    onClick={handleAiCategorize}
                    disabled={aiCategorizing || !description || !amount}
                    title="AI Categorize"
                    className="bg-dusk hover:bg-steel border border-steel text-snow rounded-xl px-3 disabled:opacity-40 transition-all"
                  >
                    <Sparkles size={16} className={aiCategorizing ? 'animate-pulse' : ''} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Amount ({currencyCode(profile.currency)})</label>
                <MoneyInput
                  value={amount}
                  onChange={setAmount}
                  currency={profile.currency}
                  placeholder={currencyCode(profile.currency) === 'UGX' ? '0' : '0.00'}
                />
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Category</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${category === cat.id ? cat.color : 'bg-dusk text-mist border-steel hover:border-steel'}`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-dusk border border-steel text-snow rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !description.trim() || !amount}
                className="w-full bg-glow hover:bg-glow/80 disabled:opacity-40 text-ink font-semibold py-3 rounded-xl transition-all"
              >
                {saving ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 w-max">
        <button
          onClick={() => setFilterCat('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterCat === 'all' ? 'bg-snow/10 text-snow border-steel' : 'bg-dusk text-mist border-steel'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterCat === cat.id ? cat.color : 'bg-dusk text-mist border-steel'}`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
        </div>
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-deep border border-dusk rounded-2xl p-10 text-center">
            <p className="text-mist text-sm">No transactions yet. Add your first one!</p>
          </div>
        ) : (
          filtered.map(tx => {
            const cat = catDef(tx.category);
            return (
              <div key={tx.id} className="bg-deep border border-dusk rounded-xl px-3 py-3 flex items-start gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-dusk flex items-center justify-center text-lg flex-shrink-0">
                  {cat?.emoji || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-snow text-sm font-medium break-words">{tx.description}</span>
                    <span className="text-snow font-semibold text-sm whitespace-nowrap flex-shrink-0">
                      -{formatMoney(tx.amount, profile.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {tx.is_unnecessary && <span className="text-xs bg-steel/15 text-mist border border-steel px-1.5 py-0.5 rounded-md">wasteful</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border capitalize ${cat?.color || 'bg-steel text-snow border-steel'}`}>{cat?.label || tx.category}</span>
                    <span className="text-steel text-xs">{new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString()}</span>
                    <button onClick={() => handleDelete(tx.id)} className="ml-auto text-steel hover:text-snow transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
