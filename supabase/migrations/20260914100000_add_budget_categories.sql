ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS budget_categories jsonb DEFAULT NULL;
