import { BudgetCategory, StudentProfile } from './supabase';

export const DEFAULT_BUDGET_CATEGORIES: Omit<BudgetCategory, 'amount'>[] = [
  { id: 'food', name: 'Food & Meals' },
  { id: 'transport', name: 'Transport' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'education', name: 'Education / Books' },
];

export function getBudgetCategories(profile: StudentProfile): BudgetCategory[] {
  if (Array.isArray(profile.budget_categories)) {
    return profile.budget_categories.map(item => ({
      id: String(item.id),
      name: String(item.name || item.id),
      amount: Number(item.amount) || 0,
    }));
  }

  return DEFAULT_BUDGET_CATEGORIES.map(item => ({
    ...item,
    amount: Number(profile[`monthly_budget_${item.id}` as keyof StudentProfile]) || 0,
  }));
}

export function legacyBudgetFields(categories: BudgetCategory[]) {
  const byId = Object.fromEntries(categories.map(c => [c.id, c.amount]));
  return {
    monthly_budget_food: byId.food || 0,
    monthly_budget_transport: byId.transport || 0,
    monthly_budget_entertainment: byId.entertainment || 0,
    monthly_budget_education: byId.education || 0,
    monthly_budget_other: byId.other || 0,
  };
}

export function slugifyCategory(name: string, existingIds: string[]): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'custom';
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

export const SPENDING_CATEGORY_STYLES: { id: string; label: string; emoji: string; color: string }[] = [
  { id: 'food', label: 'Food', emoji: '🍕', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'transport', label: 'Transport', emoji: '🚌', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎮', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'education', label: 'Education', emoji: '📚', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'health', label: 'Health', emoji: '💊', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'snacks', label: 'Snacks', emoji: '🧋', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'other', label: 'Other', emoji: '📦', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
];

const CUSTOM_STYLES = [
  { emoji: '🏠', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { emoji: '💡', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { emoji: '📱', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { emoji: '👕', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { emoji: '🎁', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
];

export function getSpendingCategories(profile: StudentProfile) {
  const known = new Set(SPENDING_CATEGORY_STYLES.map(c => c.id));
  const extras = getBudgetCategories(profile)
    .filter(b => !known.has(b.id))
    .map((b, i) => ({
      id: b.id,
      label: b.name,
      ...CUSTOM_STYLES[i % CUSTOM_STYLES.length],
    }));
  return [...SPENDING_CATEGORY_STYLES, ...extras];
}
