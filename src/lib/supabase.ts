import { createClient } from '@supabase/supabase-js';

function projectUrl(raw: string) {
  return raw.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
}

const supabaseUrl = projectUrl(import.meta.env.VITE_SUPABASE_URL as string);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = string;

export interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  monthly_allowance: number;
  monthly_side_income: number;
  monthly_budget_food: number;
  monthly_budget_transport: number;
  monthly_budget_entertainment: number;
  monthly_budget_education: number;
  monthly_budget_other: number;
  budget_categories?: BudgetCategory[] | null;
  currency: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: Category;
  ai_roast: string | null;
  transaction_date: string;
  is_unnecessary: boolean;
  notes: string;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  emoji: string;
  color: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  total_days_logged: number;
  created_at: string;
  updated_at: string;
}
