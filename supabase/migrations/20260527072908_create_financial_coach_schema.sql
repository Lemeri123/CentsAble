/*
  # AI Financial Coach for Students - Initial Schema

  ## Tables
  1. `student_profiles` - Student financial profile (income, allowance, budget settings)
  2. `transactions` - Manual spending entries with AI-generated categories
  3. `savings_goals` - Student savings goals with progress tracking
  4. `achievements` - Gamification achievements unlocked by students
  5. `streaks` - Daily/weekly savings streak tracking

  ## Security
  - RLS enabled on all tables
  - Policies scoped to authenticated users by user_id
*/

-- Student financial profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  monthly_allowance numeric(10,2) DEFAULT 0,
  monthly_side_income numeric(10,2) DEFAULT 0,
  monthly_budget_food numeric(10,2) DEFAULT 0,
  monthly_budget_transport numeric(10,2) DEFAULT 0,
  monthly_budget_entertainment numeric(10,2) DEFAULT 0,
  monthly_budget_education numeric(10,2) DEFAULT 0,
  monthly_budget_other numeric(10,2) DEFAULT 0,
  budget_categories jsonb DEFAULT NULL,
  currency text DEFAULT 'USD',
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON student_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions / spending entries
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'other',
  ai_roast text DEFAULT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  is_unnecessary boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  target_amount numeric(10,2) NOT NULL DEFAULT 0,
  current_amount numeric(10,2) DEFAULT 0,
  deadline date DEFAULT NULL,
  emoji text DEFAULT '🎯',
  color text DEFAULT '#3B82F6',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  icon text DEFAULT '🏆',
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_log_date date DEFAULT NULL,
  total_days_logged integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
