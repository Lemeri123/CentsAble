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
  { id: 'food', label: 'Food', emoji: '🍕', color: 'bg-dusk text-snow border-steel' },
  { id: 'transport', label: 'Transport', emoji: '🚌', color: 'bg-deep text-mist border-steel' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎮', color: 'bg-steel/40 text-snow border-steel' },
  { id: 'education', label: 'Education', emoji: '📚', color: 'bg-snow/10 text-snow border-mist' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'bg-dusk text-mist border-steel' },
  { id: 'health', label: 'Health', emoji: '💊', color: 'bg-steel/30 text-mist border-steel' },
  { id: 'snacks', label: 'Snacks', emoji: '🧋', color: 'bg-deep text-snow border-mist' },
  { id: 'other', label: 'Other', emoji: '📦', color: 'bg-dusk text-mist border-steel' },
];

const CUSTOM_STYLES = [
  { emoji: '🏠', color: 'bg-dusk text-snow border-steel' },
  { emoji: '💡', color: 'bg-steel/40 text-snow border-steel' },
  { emoji: '📱', color: 'bg-deep text-mist border-mist' },
  { emoji: '👕', color: 'bg-snow/10 text-snow border-steel' },
  { emoji: '🎁', color: 'bg-dusk text-mist border-steel' },
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
