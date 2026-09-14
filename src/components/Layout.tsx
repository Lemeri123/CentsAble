import { TrendingUp, LayoutDashboard, Receipt, MessageSquare, Target, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppCurrency, normalizeCurrency } from '../lib/currency';
import CurrencyToggle from './CurrencyToggle';

type Page = 'dashboard' | 'tracker' | 'coach' | 'goals' | 'settings';

interface Props {
  current: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  streakCount?: number;
  currency?: string;
  onCurrencyChange?: (currency: AppCurrency) => void;
}

const navItems: { id: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'tracker', icon: Receipt, label: 'Tracker' },
  { id: 'coach', icon: MessageSquare, label: 'AI Coach' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ current, onNavigate, children, streakCount = 0, currency, onCurrencyChange }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-base">CentsAble</span>
          </div>
        </div>

        {onCurrencyChange && (
          <div className="px-3 pt-3">
            <CurrencyToggle
              size="sm"
              value={normalizeCurrency(currency)}
              onChange={onCurrencyChange}
            />
          </div>
        )}

        {streakCount > 0 && (
          <div className="mx-3 mt-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <div className="text-orange-400 font-bold text-sm">{streakCount} day streak</div>
              <div className="text-orange-300/60 text-xs">Keep it up!</div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${current === id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {onCurrencyChange && (
          <div className="md:hidden flex items-center justify-end px-4 pt-3">
            <CurrencyToggle
              size="sm"
              value={normalizeCurrency(currency)}
              onChange={onCurrencyChange}
            />
          </div>
        )}
        <div className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
          {children}
        </div>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
                ${current === id ? 'text-emerald-400' : 'text-gray-500'}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
