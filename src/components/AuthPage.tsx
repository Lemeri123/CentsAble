import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, DollarSign, Target, Zap } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Branding */}
        <div className="text-snow space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-glow rounded-xl flex items-center justify-center">
              <TrendingUp size={22} className="text-ink" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">Pace Money</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            Your AI Financial<br />
            <span className="text-glow">Coach</span>
          </h1>
          <p className="text-mist text-lg leading-relaxed">
            Budget smarter, save faster, and get roasted for buying too many snacks.
          </p>
        </div>

        {/* Right: Auth form */}
        <div className="bg-deep border border-dusk rounded-2xl p-8 shadow-2xl">
          <h2 className="text-snow text-2xl font-semibold mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Get started free'}
          </h2>
          <p className="text-mist text-sm mb-6">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your free account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-snow text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@university.edu"
                className="w-full bg-dusk border border-steel text-snow rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent placeholder-mist"
              />
            </div>
            <div>
              <label className="block text-snow text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-dusk border border-steel text-snow rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent placeholder-mist"
              />
            </div>

            {error && (
              <div className="bg-dusk border border-steel text-snow rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-glow hover:bg-glow/80 disabled:opacity-50 text-ink font-semibold py-3 rounded-xl transition-all duration-150 text-sm"
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-mist text-sm mt-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-snow hover:text-mist font-medium transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
