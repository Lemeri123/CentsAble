import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppCurrency, amountFromInput, formatMoney } from '../lib/currency';
import { DEFAULT_BUDGET_CATEGORIES } from '../lib/budgets';
import CurrencyToggle from './CurrencyToggle';
import MoneyInput from './MoneyInput';
import { TrendingUp } from 'lucide-react';

interface Props {
  userId: string;
  displayName?: string;
  onComplete: () => void;
}

export default function Onboarding({ userId, displayName, onComplete }: Props) {
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState<AppCurrency>('UGX');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const monthlyIncome = amountFromInput(income);
    const { error: insertError } = await supabase.from('student_profiles').upsert({
      user_id: userId,
      name: displayName?.trim() || '',
      monthly_allowance: monthlyIncome,
      monthly_side_income: 0,
      monthly_budget_food: 0,
      monthly_budget_transport: 0,
      monthly_budget_entertainment: 0,
      monthly_budget_education: 0,
      monthly_budget_other: 0,
      budget_categories: DEFAULT_BUDGET_CATEGORIES.map(item => ({ ...item, amount: 0 })),
      currency,
      onboarded: true,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onComplete();
  }

  const amount = amountFromInput(income);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-glow rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-ink" />
          </div>
          <span className="text-snow font-semibold text-lg tracking-tight">Pace Money</span>
        </div>

        <div className="bg-deep border border-dusk rounded-2xl p-8">
          <form onSubmit={handleFinish} className="space-y-5">
            <div>
              <h2 className="text-snow text-2xl font-bold mb-1">Monthly income</h2>
              <p className="text-mist text-sm">How much do you get each month? You can change currency anytime.</p>
            </div>

            <div>
              <label className="block text-snow text-sm font-medium mb-1.5">Currency</label>
              <CurrencyToggle value={currency} onChange={setCurrency} />
            </div>

            <div>
              <label className="block text-snow text-sm font-medium mb-1.5">
                Monthly income ({currency})
              </label>
              <MoneyInput
                value={income}
                onChange={setIncome}
                currency={currency}
                placeholder={currency === 'UGX' ? '500,000' : '500'}
                required
                className="w-full bg-dusk border border-steel text-snow rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent placeholder-mist"
              />
            </div>

            {amount > 0 && (
              <div className="bg-snow/10 border border-steel rounded-xl px-4 py-3 text-snow text-sm font-medium">
                {formatMoney(amount, currency)} / month
              </div>
            )}

            {error && (
              <div className="bg-steel/10 border border-steel rounded-xl px-4 py-3 text-mist text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !income}
              className="w-full bg-glow hover:bg-glow/80 disabled:opacity-40 text-ink font-semibold py-3 rounded-xl transition-all text-sm"
            >
              {saving ? 'Saving...' : "Let's Go!"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
