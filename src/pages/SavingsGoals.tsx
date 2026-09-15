import { useEffect, useState } from 'react';
import { supabase, StudentProfile, SavingsGoal, Achievement } from '../lib/supabase';
import { unlockAchievement } from '../lib/achievements';
import { ACHIEVEMENT_DEFS } from '../lib/achievements';
import { formatMoney, amountFromInput, currencyCode } from '../lib/currency';
import MoneyInput from '../components/MoneyInput';
import { Plus, X, CheckCircle, PlusCircle, MinusCircle } from 'lucide-react';

const GOAL_EMOJIS = ['🎯', '✈️', '💻', '📱', '🎒', '🎓', '🏋️', '🎮', '🏠', '🚗', '💰', '📸'];
const GOAL_COLORS = ['#CCD0CF', '#9BA8AB', '#4A5C6A', '#253745', '#11212D', '#9BA8AB', '#CCD0CF', '#4A5C6A'];

interface Props {
  profile: StudentProfile;
}

export default function SavingsGoals({ profile }: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState('#CCD0CF');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'active' | 'completed' | 'achievements'>('active');
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [goalsRes, achieveRes] = await Promise.all([
      supabase.from('savings_goals').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }),
      supabase.from('achievements').select('*').eq('user_id', profile.user_id).order('unlocked_at', { ascending: false }),
    ]);
    setGoals(goalsRes.data || []);
    setAchievements(achieveRes.data || []);
  }

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !target) return;
    setSaving(true);
    await supabase.from('savings_goals').insert({
      user_id: profile.user_id,
      title: title.trim(),
      target_amount: amountFromInput(target),
      current_amount: 0,
      deadline: deadline || null,
      emoji,
      color,
    });
    await unlockAchievement(profile.user_id, 'first_goal');
    setTitle(''); setTarget(''); setDeadline(''); setEmoji('🎯'); setColor('#CCD0CF');
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  async function handleDeposit(goalId: string, add: boolean) {
    const amt = amountFromInput(depositAmounts[goalId] || '0');
    if (!amt || amt <= 0) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = add
      ? Math.min(goal.current_amount + amt, goal.target_amount)
      : Math.max(goal.current_amount - amt, 0);

    const completed = newAmount >= goal.target_amount;

    await supabase.from('savings_goals').update({
      current_amount: newAmount,
      completed,
      updated_at: new Date().toISOString(),
    }).eq('id', goalId);

    if (completed) {
      await unlockAchievement(profile.user_id, 'goal_complete');
      // check total saved
      const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0) + amt;
      if (totalSaved >= 100) await unlockAchievement(profile.user_id, 'saved_100');
    }

    setDepositAmounts(prev => ({ ...prev, [goalId]: '' }));
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from('savings_goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  const unlockedKeys = new Set(achievements.map(a => a.achievement_key));

  return (
    <div className="space-y-5 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-snow text-2xl font-bold">Goals & Achievements</h1>
          <p className="text-mist text-sm mt-0.5">{activeGoals.length} active goals · {achievements.length} achievements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-glow hover:bg-glow/80 text-ink px-3 py-2 rounded-xl text-sm font-semibold transition-all"
        >
          <Plus size={15} />
          New Goal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-deep border border-dusk rounded-xl p-1">
        {(['active', 'completed', 'achievements'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-glow text-ink' : 'text-mist hover:text-snow'}`}
          >
            {t === 'achievements' ? '🏆 Achievements' : t === 'completed' ? `✅ Done (${completedGoals.length})` : `Active (${activeGoals.length})`}
          </button>
        ))}
      </div>

      {/* Active Goals */}
      {tab === 'active' && (
        <div className="space-y-3">
          {activeGoals.length === 0 ? (
            <div className="bg-deep border border-dusk rounded-2xl p-10 text-center">
              <p className="text-mist text-sm mb-3">No active goals yet.</p>
              <button onClick={() => setShowForm(true)} className="text-snow text-sm hover:text-mist">Create your first goal →</button>
            </div>
          ) : (
            activeGoals.map(goal => {
              const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={goal.id} className="bg-deep border border-dusk rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: goal.color + '20', border: `1px solid ${goal.color}30` }}>
                        {goal.emoji}
                      </div>
                      <div>
                        <div className="text-snow font-semibold">{goal.title}</div>
                        {daysLeft !== null && (
                          <div className={`text-xs mt-0.5 ${daysLeft < 14 ? 'text-mist' : 'text-mist'}`}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(goal.id)} className="text-steel hover:text-snow transition-colors">
                      <X size={15} />
                    </button>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-mist">{formatMoney(goal.current_amount, profile.currency)} saved</span>
                      <span className="text-mist">{formatMoney(goal.target_amount, profile.currency)} goal</span>
                    </div>
                    <div className="h-3 bg-dusk rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: '#c9873f'}}
                      />
                    </div>
                    <div className="text-right text-xs mt-1" style={{ color: goal.color }}>{pct.toFixed(0)}%</div>
                  </div>

                  <div className="flex gap-2">
                    <MoneyInput
                      value={depositAmounts[goal.id] || ''}
                      onChange={raw => setDepositAmounts(prev => ({ ...prev, [goal.id]: raw }))}
                      currency={profile.currency}
                      placeholder="Amount"
                      className="flex-1 bg-dusk border border-steel text-snow rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent placeholder-mist"
                    />
                    <button
                      onClick={() => handleDeposit(goal.id, true)}
                      disabled={!depositAmounts[goal.id]}
                      className="flex items-center gap-1 bg-snow/10 hover:bg-snow/20 border border-steel text-snow px-3 py-2 rounded-xl text-sm disabled:opacity-40 transition-all"
                    >
                      <PlusCircle size={14} /> Add
                    </button>
                    <button
                      onClick={() => handleDeposit(goal.id, false)}
                      disabled={!depositAmounts[goal.id]}
                      className="flex items-center gap-1 bg-dusk hover:bg-steel/40 border border-steel text-mist px-3 py-2 rounded-xl text-sm disabled:opacity-40 transition-all"
                    >
                      <MinusCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Completed Goals */}
      {tab === 'completed' && (
        <div className="space-y-3">
          {completedGoals.length === 0 ? (
            <div className="bg-deep border border-dusk rounded-2xl p-10 text-center">
              <p className="text-mist text-sm">No completed goals yet. Keep saving!</p>
            </div>
          ) : (
            completedGoals.map(goal => (
              <div key={goal.id} className="bg-deep border border-steel rounded-2xl p-5 opacity-80">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{goal.emoji}</div>
                  <div className="flex-1">
                    <div className="text-snow font-medium flex items-center gap-2">
                      {goal.title}
                      <CheckCircle size={14} className="text-snow" />
                    </div>
                    <div className="text-snow text-sm">{formatMoney(goal.target_amount, profile.currency)} achieved!</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Achievements */}
      {tab === 'achievements' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ACHIEVEMENT_DEFS.map(def => {
            const unlocked = unlockedKeys.has(def.key);
            return (
              <div
                key={def.key}
                className={`rounded-2xl p-4 border text-center transition-all ${
                  unlocked
                    ? 'bg-dusk border-steel shadow-sm'
                    : 'bg-deep border-dusk opacity-40 grayscale'
                }`}
              >
                <div className="text-3xl mb-2">{def.icon}</div>
                <div className={`font-semibold text-sm ${unlocked ? 'text-snow' : 'text-mist'}`}>{def.title}</div>
                <div className="text-mist text-xs mt-1 leading-relaxed">{def.description}</div>
                {unlocked && <div className="text-mist text-xs mt-1.5">Unlocked ✓</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* New Goal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/80 z-40 flex items-end md:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-deep border border-dusk rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-snow font-semibold text-lg">New Savings Goal</h2>
              <button onClick={() => setShowForm(false)} className="text-mist hover:text-snow"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Goal Name</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. New Laptop, Europe Trip"
                  className="w-full bg-dusk border border-steel text-snow rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent placeholder-mist"
                />
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Target Amount ({currencyCode(profile.currency)})</label>
                <MoneyInput
                  value={target}
                  onChange={setTarget}
                  currency={profile.currency}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Deadline (optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-dusk border border-steel text-snow rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-lg transition-all ${emoji === e ? 'bg-snow/10 border-2 border-snow' : 'bg-dusk border border-steel hover:border-mist'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-snow text-sm font-medium mb-1.5">Color</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-snow ring-offset-2 ring-offset-deep' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || !title.trim() || !target}
                className="w-full bg-glow hover:bg-glow/80 disabled:opacity-40 text-ink font-semibold py-3 rounded-xl transition-all"
              >
                {saving ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
