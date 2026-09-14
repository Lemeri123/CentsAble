import { useEffect, useState } from 'react';
import { supabase, StudentProfile } from '../lib/supabase';
import { AppCurrency, formatMoney, normalizeCurrency } from '../lib/currency';
import CurrencyToggle from '../components/CurrencyToggle';
import { Save } from 'lucide-react';

interface Props {
  profile: StudentProfile;
  onUpdate: (updated: StudentProfile) => void;
}

export default function Settings({ profile, onUpdate }: Props) {
  const [name, setName] = useState(profile.name);
  const [allowance, setAllowance] = useState(String(profile.monthly_allowance));
  const [sideIncome, setSideIncome] = useState(String(profile.monthly_side_income));
  const [budgetFood, setBudgetFood] = useState(String(profile.monthly_budget_food));
  const [budgetTransport, setBudgetTransport] = useState(String(profile.monthly_budget_transport));
  const [budgetEntertainment, setBudgetEntertainment] = useState(String(profile.monthly_budget_entertainment));
  const [budgetEducation, setBudgetEducation] = useState(String(profile.monthly_budget_education));
  const [currency, setCurrency] = useState<AppCurrency>(normalizeCurrency(profile.currency));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCurrency(normalizeCurrency(profile.currency));
  }, [profile.currency]);

  async function persistCurrency(next: AppCurrency) {
    setCurrency(next);
    await supabase.from('student_profiles').update({
      currency: next,
      updated_at: new Date().toISOString(),
    }).eq('user_id', profile.user_id);
    onUpdate({ ...profile, currency: next });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updates = {
      name,
      monthly_allowance: parseFloat(allowance) || 0,
      monthly_side_income: parseFloat(sideIncome) || 0,
      monthly_budget_food: parseFloat(budgetFood) || 0,
      monthly_budget_transport: parseFloat(budgetTransport) || 0,
      monthly_budget_entertainment: parseFloat(budgetEntertainment) || 0,
      monthly_budget_education: parseFloat(budgetEducation) || 0,
      currency,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('student_profiles').update(updates).eq('user_id', profile.user_id);
    onUpdate({ ...profile, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalIncome = (parseFloat(allowance) || 0) + (parseFloat(sideIncome) || 0);
  const totalBudget = (parseFloat(budgetFood) || 0) + (parseFloat(budgetTransport) || 0) +
    (parseFloat(budgetEntertainment) || 0) + (parseFloat(budgetEducation) || 0);
  const remaining = totalIncome - totalBudget;

  return (
    <div className="space-y-6 pb-24 md:pb-6 max-w-lg">
      <div>
        <h1 className="text-white text-2xl font-bold">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Update your profile and budget settings.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Currency</h2>
          <p className="text-gray-400 text-sm">Switch how amounts are shown across the app.</p>
          <CurrencyToggle value={currency} onChange={persistCurrency} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Profile</h2>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1.5">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Monthly Income</h2>
          {[
            { label: `Allowance (${currency})`, value: allowance, set: setAllowance },
            { label: `Side Income / Part-time (${currency})`, value: sideIncome, set: setSideIncome },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                min="0"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          ))}
          {totalIncome > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-emerald-400 text-sm font-medium">
              Total income: {formatMoney(totalIncome, currency)}/month
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Monthly Budgets</h2>
          {[
            { label: `Food & Meals (${currency})`, value: budgetFood, set: setBudgetFood },
            { label: `Transport (${currency})`, value: budgetTransport, set: setBudgetTransport },
            { label: `Entertainment (${currency})`, value: budgetEntertainment, set: setBudgetEntertainment },
            { label: `Education / Books (${currency})`, value: budgetEducation, set: setBudgetEducation },
          ].map(({ label, value, set }) => (
            <div key={label}>
              <label className="block text-gray-300 text-sm font-medium mb-1.5">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                min="0"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          ))}
          {totalIncome > 0 && (
            <div className={`rounded-xl px-4 py-2.5 text-sm font-medium border ${remaining >= 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {remaining >= 0
                ? `${formatMoney(remaining, currency)} unbudgeted (potential savings)`
                : `Over-budgeted by ${formatMoney(Math.abs(remaining), currency)}`}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all text-sm ${
            saved ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-white'
          } disabled:opacity-40`}
        >
          <Save size={15} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
