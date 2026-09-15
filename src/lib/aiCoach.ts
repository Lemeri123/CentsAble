import { Transaction, StudentProfile } from './supabase';
import { supabase } from './supabase';
import { formatMoney, currencyCode } from './currency';
import { getBudgetCategories } from './budgets';

function buildProfile(profile: StudentProfile) {
  return {
    name: profile.name,
    monthly_income: profile.monthly_allowance + profile.monthly_side_income,
    currency: currencyCode(profile.currency),
    budgets: Object.fromEntries(getBudgetCategories(profile).map(b => [b.name, b.amount])),
  };
}

async function callEdge(body: object): Promise<{ message?: string; category?: string; is_unnecessary?: boolean }> {
  const { data, error } = await supabase.functions.invoke('ai-financial-coach', { body });
  if (error) throw new Error(error.message);
  return data;
}

export async function categorizeTransaction(description: string, amount: number, allowed?: string[]) {
  try {
    const result = await callEdge({
      action: 'categorize_transaction',
      transaction: { description, amount },
      allowed_categories: allowed,
    });
    return { category: result.category ?? 'other', is_unnecessary: result.is_unnecessary ?? false };
  } catch {
    return { category: 'other', is_unnecessary: false };
  }
}

export async function roastSpending(transactions: Transaction[], profile: StudentProfile) {
  const p = buildProfile(profile);
  const result = await callEdge({
    action: 'roast_spending',
    transactions: transactions.map(t => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
      transaction_date: t.transaction_date,
    })),
    profile: p,
  });
  return { message: result.message ?? '' };
}

export async function canIAfford(item: { name: string; cost: number }, profile: StudentProfile, question?: string) {
  const p = buildProfile(profile);
  const result = await callEdge({
    action: 'can_i_afford',
    item: { name: item.name, cost: formatMoney(item.cost, p.currency) },
    profile: p,
    question,
  });
  return { message: result.message ?? '' };
}

export async function analyzeSpending(transactions: Transaction[], profile: StudentProfile) {
  const p = buildProfile(profile);
  const result = await callEdge({
    action: 'analyze_spending',
    transactions: transactions.map(t => ({
      description: t.description,
      amount: t.amount,
      category: t.category,
      transaction_date: t.transaction_date,
    })),
    profile: p,
  });
  return { message: result.message ?? '' };
}

export async function getBudgetAdvice(profile: StudentProfile, question?: string) {
  const p = buildProfile(profile);
  const result = await callEdge({
    action: 'get_budget_advice',
    profile: p,
    question,
  });
  return { message: result.message ?? '' };
}
