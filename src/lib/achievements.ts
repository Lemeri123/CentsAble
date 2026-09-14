import { supabase } from './supabase';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: 'first_transaction', title: 'First Entry', description: 'Logged your first transaction', icon: '📝' },
  { key: 'first_goal', title: 'Dream Starter', description: 'Created your first savings goal', icon: '🎯' },
  { key: 'goal_complete', title: 'Goal Crusher', description: 'Completed a savings goal', icon: '🏆' },
  { key: 'streak_3', title: '3-Day Streak', description: 'Logged spending 3 days in a row', icon: '🔥' },
  { key: 'streak_7', title: 'Week Warrior', description: 'Logged spending 7 days in a row', icon: '⚡' },
  { key: 'streak_30', title: 'Monthly Master', description: 'Logged spending 30 days in a row', icon: '👑' },
  { key: 'under_budget', title: 'Budget Ninja', description: 'Stayed under budget for a month', icon: '🥷' },
  { key: 'ten_transactions', title: 'Tracking Pro', description: 'Logged 10 transactions', icon: '📊' },
  { key: 'saved_100', title: 'Century Saver', description: 'Saved $100 across all goals', icon: '💯' },
];

export async function unlockAchievement(userId: string, key: string) {
  const def = ACHIEVEMENT_DEFS.find(a => a.key === key);
  if (!def) return null;

  const { data, error } = await supabase.from('achievements').upsert({
    user_id: userId,
    achievement_key: key,
    title: def.title,
    description: def.description,
    icon: def.icon,
  }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true }).select().maybeSingle();

  if (error) return null;
  return data;
}

export async function updateStreak(userId: string): Promise<{ streak: number; newRecord: boolean }> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_log_date: today,
      total_days_logged: 1,
    });
    return { streak: 1, newRecord: true };
  }

  if (existing.last_log_date === today) {
    return { streak: existing.current_streak, newRecord: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = existing.last_log_date === yesterdayStr ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, existing.longest_streak);

  await supabase.from('streaks').update({
    current_streak: newStreak,
    longest_streak: newLongest,
    last_log_date: today,
    total_days_logged: existing.total_days_logged + 1,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId);

  return { streak: newStreak, newRecord: newStreak > existing.longest_streak };
}
