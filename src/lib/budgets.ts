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

const CATEGORY_COLOR = 'bg-glow text-snow border-steel';

export const SPENDING_CATEGORY_STYLES: { id: string; label: string; emoji: string; color: string }[] = [
  { id: 'food',          label: 'Food',          emoji: '🍕', color: CATEGORY_COLOR },
  { id: 'transport',     label: 'Transport',     emoji: '🚌', color: CATEGORY_COLOR },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎮', color: CATEGORY_COLOR },
  { id: 'education',     label: 'Education',     emoji: '📚', color: CATEGORY_COLOR },
  { id: 'shopping',      label: 'Shopping',      emoji: '🛍️', color: CATEGORY_COLOR },
  { id: 'health',        label: 'Health',        emoji: '💊', color: CATEGORY_COLOR },
  { id: 'snacks',        label: 'Snacks',        emoji: '🧋', color: CATEGORY_COLOR },
  { id: 'other',         label: 'Other',         emoji: '📦', color: CATEGORY_COLOR },
];

// Keyword → emoji map. Checked against category id + name (lowercase).
const EMOJI_KEYWORDS: [string[], string][] = [
  [['food', 'meal', 'lunch', 'dinner', 'breakfast', 'eat', 'restaurant', 'groceri', 'grocery'], '🍕'],
  [['snack', 'bubble', 'tea', 'coffee', 'drink', 'juice', 'boba'], '🧋'],
  [['transport', 'bus', 'taxi', 'uber', 'bolt', 'boda', 'matatu', 'fuel', 'petrol', 'fare', 'commut', 'ride'], '🚌'],
  [['entertain', 'movie', 'cinema', 'game', 'fun', 'party', 'club', 'bar', 'concert', 'sport', 'netflix', 'stream'], '🎮'],
  [['educat', 'school', 'book', 'tuition', 'course', 'class', 'learn', 'studi', 'study', 'exam', 'uni', 'college'], '📚'],
  [['shop', 'cloth', 'fashion', 'outfit', 'wear', 'shoe', 'bag', 'mall'], '🛍️'],
  [['health', 'medic', 'hospital', 'pharmacy', 'drug', 'doctor', 'clinic', 'gym', 'fitness', 'wellness'], '💊'],
  [['rent', 'house', 'home', 'accommodat', 'hostel', 'flat', 'apartment', 'lodge'], '🏠'],
  [['electric', 'water', 'utility', 'bill', 'power', 'gas', 'internet', 'wifi', 'data', 'airtime', 'airtel', 'mtn', 'safaricom'], '💡'],
  [['phone', 'mobile', 'device', 'laptop', 'computer', 'tech', 'gadget', 'subscript'], '📱'],
  [['gift', 'present', 'donat', 'charity', 'tithe', 'church', 'mosque', 'offering'], '🎁'],
  [['travel', 'trip', 'vacation', 'holiday', 'flight', 'hotel', 'tour'], '✈️'],
  [['saving', 'invest', 'goal', 'piggy', 'wallet', 'budget'], '💰'],
  [['personal', 'care', 'beauty', 'hair', 'salon', 'barber', 'cosmetic', 'makeup', 'hygiene'], '💄'],
  [['family', 'parent', 'sibling', 'kid', 'child', 'baby', 'relative'], '👨‍👩‍👧'],
  [['pet', 'dog', 'cat', 'animal', 'vet'], '🐾'],
  [['sport', 'football', 'basketball', 'workout', 'swim', 'run', 'yoga'], '🏋️'],
  [['music', 'spotify', 'concert', 'instrument', 'audio'], '🎵'],
  [['stationary', 'pen', 'paper', 'notebook', 'print'], '✏️'],
];

export function emojiForCategory(id: string, name: string): string {
  const haystack = `${id} ${name}`.toLowerCase();
  for (const [keywords, emoji] of EMOJI_KEYWORDS) {
    if (keywords.some(k => haystack.includes(k))) return emoji;
  }
  return '📦'; // fallback
}

export function getSpendingCategories(profile: StudentProfile) {
  const known = new Set(SPENDING_CATEGORY_STYLES.map(c => c.id));
  const extras = getBudgetCategories(profile)
    .filter(b => !known.has(b.id))
    .map(b => ({
      id: b.id,
      label: b.name,
      emoji: emojiForCategory(b.id, b.name),
      color: CATEGORY_COLOR,
    }));
  return [...SPENDING_CATEGORY_STYLES, ...extras];
}
