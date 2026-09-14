import { useEffect, useState } from 'react';
import { supabase, StudentProfile, Transaction, Category } from '../lib/supabase';
import { categorizeTransaction, roastSpending } from '../lib/aiCoach';
import { unlockAchievement, updateStreak } from '../lib/achievements';
import { formatMoney, amountStep, currencyCode } from '../lib/currency';
import { Plus, Trash2, Sparkles, Flame, X } from 'lucide-react';

const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: 'food', label: 'Food', emoji: '🍕', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'transport', label: 'Transport', emoji: '🚌', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎮', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'education', label: 'Education', emoji: '📚', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'health', label: 'Health', emoji: '💊', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'snacks', label: 'Snacks', emoji: '🧋', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'other', label: 'Other', emoji: '📦', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
];

interface Props {
  profile: StudentProfile;
}

export default function SpendingTracker({ profile }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roast, setRoast] = useState('');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [toast, setToast] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');

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
      const result = await categorizeTransaction(description, parseFloat(amount));
      setCategory(result.category as Category || 'other');
      showToast('AI categorized your transaction!');
    } catch {
      // fallback silently
    }
    setAiCategorizing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSaving(true);

    const { data } = await supabase.from('transactions').insert({
      user_id: profile.user_id,
      description: description.trim(),
      amount: parseFloat(amount),
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

  const catDef = (cat: string) => CATEGORIES.find(c => c.id === cat);

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-in">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Spending Tracker</h1>
          <p className="text-gray-400 text-sm mt-0.5">Spent {formatMoney(totalThisMonth, profile.currency)} this month</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRoast}
            disabled={loadingRoast || !transactions.length}
            className="flex items-center gap-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/20 text-orange-400 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40 transition-all"
          >
            <Flame size={15} />
            {loadingRoast ? 'Roasting...' : 'Roast Me'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </div>

      {/* AI Roast */}
      {roast && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 relative">
          <button onClick={() => setRoast('')} className="absolute top-3 right-3 text-orange-400/60 hover:text-orange-400"><X size={14} /></button>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤣</span>
            <div>
              <div className="text-orange-400 font-semibold text-sm mb-1">Your AI Roast</div>
              <p className="text-orange-200 text-sm leading-relaxed">{roast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add transaction modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end md:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Add Transaction</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Description</label>
                <div className="flex gap-2">
                  <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Bubble tea with friends"
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleAiCategorize}
                    disabled={aiCategorizing || !description || !amount}
                    title="AI Categorize"
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-emerald-400 rounded-xl px-3 disabled:opacity-40 transition-all"
                  >
                    <Sparkles size={16} className={aiCategorizing ? 'animate-pulse' : ''} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Amount ({currencyCode(profile.currency)})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={currencyCode(profile.currency) === 'UGX' ? '0' : '0.00'}
                  min="0"
                  step={amountStep(profile.currency)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${category === cat.id ? cat.color : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !description.trim() || !amount}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
              >
                {saving ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterCat('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterCat === 'all' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterCat === cat.id ? cat.color : 'bg-gray-800 text-gray-500 border-gray-700'}`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">No transactions yet. Add your first one!</p>
          </div>
        ) : (
          filtered.map(tx => {
            const cat = catDef(tx.category);
            return (
              <div key={tx.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
                  {cat?.emoji || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium truncate">{tx.description}</span>
                    {tx.is_unnecessary && <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-md flex-shrink-0">wasteful</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-md border capitalize ${cat?.color || 'bg-gray-700 text-gray-300 border-gray-600'}`}>{tx.category}</span>
                    <span className="text-gray-600 text-xs">{new Date(tx.transaction_date + 'T00:00:00').toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-white font-semibold">-{formatMoney(tx.amount, profile.currency)}</span>
                  <button onClick={() => handleDelete(tx.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
