import { useEffect, useState } from 'react';
import { supabase, StudentProfile, Transaction, SavingsGoal, Streak } from '../lib/supabase';
import { analyzeSpending } from '../lib/aiCoach';
import { formatMoney } from '../lib/currency';
import { TrendingDown, TrendingUp, Target, Zap, Sparkles, RefreshCw } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-amber-500',
  transport: 'bg-blue-500',
  entertainment: 'bg-pink-500',
  education: 'bg-emerald-500',
  shopping: 'bg-violet-500',
  health: 'bg-red-500',
  snacks: 'bg-orange-500',
  other: 'bg-gray-500',
};

interface Props {
  profile: StudentProfile;
  onNavigate: (page: 'dashboard' | 'tracker' | 'coach' | 'goals' | 'settings') => void;
}

export default function Dashboard({ profile, onNavigate }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const totalIncome = profile.monthly_allowance + profile.monthly_side_income;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const [txRes, goalRes, streakRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', profile.user_id).gte('transaction_date', startOfMonth).order('transaction_date', { ascending: false }),
      supabase.from('savings_goals').select('*').eq('user_id', profile.user_id).eq('completed', false).order('created_at', { ascending: false }),
      supabase.from('streaks').select('*').eq('user_id', profile.user_id).maybeSingle(),
    ]);

    setTransactions(txRes.data || []);
    setGoals(goalRes.data || []);
    setStreak(streakRes.data);
  }

  async function fetchInsight() {
    if (!transactions.length) return;
    setLoadingInsight(true);
    try {
      const result = await analyzeSpending(transactions, profile);
      setAiInsight(result.message || '');
    } catch {
      setAiInsight('Unable to fetch AI insights right now.');
    }
    setLoadingInsight(false);
  }

  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
  const remaining = totalIncome - totalSpent;

  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  }
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  const budgetCategories = [
    { key: 'food', label: 'Food', budget: profile.monthly_budget_food },
    { key: 'transport', label: 'Transport', budget: profile.monthly_budget_transport },
    { key: 'entertainment', label: 'Entertainment', budget: profile.monthly_budget_entertainment },
    { key: 'education', label: 'Education', budget: profile.monthly_budget_education },
  ].filter(c => c.budget > 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Hey{profile.name ? `, ${profile.name}` : ''}! 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">Here's your financial snapshot for this month.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Monthly Income" value={formatMoney(totalIncome, profile.currency)} icon={<TrendingUp size={18} className="text-emerald-400" />} color="emerald" />
        <StatCard label="Spent This Month" value={formatMoney(totalSpent, profile.currency)} icon={<TrendingDown size={18} className="text-red-400" />} color="red" />
        <StatCard label="Remaining" value={formatMoney(remaining, profile.currency)} icon={<Zap size={18} className="text-blue-400" />} color={remaining >= 0 ? 'blue' : 'red'} />
        <StatCard label="Active Goals" value={String(goals.length)} icon={<Target size={18} className="text-amber-400" />} color="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Spending breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Spending Breakdown</h2>
            <span className="text-gray-500 text-xs">{new Date().toLocaleString('default', { month: 'long' })}</span>
          </div>
          {sortedCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No transactions yet</p>
              <button onClick={() => onNavigate('tracker')} className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 transition-colors">
                Add your first transaction →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 capitalize">{cat}</span>
                    <span className="text-white font-medium">{formatMoney(amount, profile.currency)}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-500'} transition-all duration-500`}
                      style={{ width: `${Math.min((amount / totalSpent) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget usage */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Budget Usage</h2>
          {budgetCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No budgets set</p>
              <button onClick={() => onNavigate('settings')} className="mt-3 text-emerald-400 text-sm hover:text-emerald-300 transition-colors">
                Set up budgets →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetCategories.map(({ key, label, budget }) => {
                const spent = categoryTotals[key] || 0;
                const pct = Math.min((spent / budget) * 100, 100);
                const over = spent > budget;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-300">{label}</span>
                      <span className={over ? 'text-red-400 font-medium' : 'text-gray-400'}>
                        {formatMoney(spent, profile.currency)} / {formatMoney(budget, profile.currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Streak + Goals preview */}
      <div className="grid md:grid-cols-2 gap-5">
        {streak && streak.current_streak > 0 && (
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔥</span>
              <div>
                <div className="text-white font-bold text-xl">{streak.current_streak} Day Streak!</div>
                <div className="text-orange-300/70 text-sm">Best: {streak.longest_streak} days</div>
              </div>
            </div>
            <p className="text-orange-200/60 text-sm">You've logged spending {streak.total_days_logged} days total. Keep going!</p>
          </div>
        )}

        {goals.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Top Goal</h2>
              <button onClick={() => onNavigate('goals')} className="text-emerald-400 text-xs hover:text-emerald-300">View all →</button>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{goals[0].emoji}</span>
                <span className="text-white font-medium">{goals[0].title}</span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-400">{formatMoney(goals[0].current_amount, profile.currency)} saved</span>
                <span className="text-gray-400">{formatMoney(goals[0].target_amount, profile.currency)} goal</span>
              </div>
              <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((goals[0].current_amount / goals[0].target_amount) * 100, 100)}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {Math.round((goals[0].current_amount / goals[0].target_amount) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" />
            <h2 className="text-white font-semibold">AI Insights</h2>
          </div>
          <button
            onClick={fetchInsight}
            disabled={loadingInsight || transactions.length === 0}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-medium disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={13} className={loadingInsight ? 'animate-spin' : ''} />
            {loadingInsight ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {aiInsight ? (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{aiInsight}</p>
        ) : (
          <p className="text-gray-500 text-sm">
            {transactions.length === 0
              ? 'Add some transactions first, then click Analyze for personalized AI insights.'
              : 'Click Analyze to get personalized spending insights from your AI coach.'}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const bg: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className={`${bg[color]} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-gray-400 text-xs">{label}</span></div>
      <div className="text-white text-xl font-bold">{value}</div>
    </div>
  );
}
