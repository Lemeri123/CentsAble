import { useState } from 'react';
import { StudentProfile } from '../lib/supabase';
import { canIAfford, getBudgetAdvice } from '../lib/aiCoach';
import { formatMoney, amountFromInput } from '../lib/currency';
import { getBudgetCategories } from '../lib/budgets';
import MoneyInput from '../components/MoneyInput';
import { Send, DollarSign, MessageSquare, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  profile: StudentProfile;
}

const QUICK_PROMPTS = [
  { label: 'Budget advice', text: 'Give me tips to improve my budget this month.' },
  { label: 'Save more', text: 'How can I save more money as a student?' },
  { label: 'Side hustle', text: 'What are good side hustles for students?' },
  { label: 'Emergency fund', text: 'How do I build an emergency fund on a student budget?' },
];

export default function AICoach({ profile }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hey${profile.name ? ` ${profile.name}` : ''}! 👋 I'm your AI financial coach. Ask me anything about your money — like "Can I afford AirPods?" or "How do I save for a trip?" You can also use the affordability checker below!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Affordability checker
  const [showAfford, setShowAfford] = useState(true);
  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [affordResult, setAffordResult] = useState('');
  const [checkingAfford, setCheckingAfford] = useState(false);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await getBudgetAdvice(profile, msg);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message || "I couldn't generate advice right now. Try again!",
      };
      setMessages(prev => [...prev, reply]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setLoading(false);
  }

  async function checkAffordability() {
    if (!itemName.trim() || !itemCost) return;
    setCheckingAfford(true);
    setAffordResult('');
    try {
      const result = await canIAfford({ name: itemName.trim(), cost: amountFromInput(itemCost) }, profile);
      setAffordResult(result.message || 'Unable to determine affordability.');
    } catch {
      setAffordResult('Could not check affordability. Try again.');
    }
    setCheckingAfford(false);
  }

  const totalIncome = profile.monthly_allowance + profile.monthly_side_income;
  const topBudgets = getBudgetCategories(profile).filter(b => b.amount > 0).slice(0, 2);

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 md:pb-4">
      <div>
        <h1 className="text-white text-2xl font-bold">AI Coach</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your personal student finance advisor</p>
      </div>

      {/* Income summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center col-span-3 sm:col-span-1">
          <div className="text-gray-500 text-xs mb-1">Income</div>
          <div className="text-emerald-400 font-bold text-sm">{formatMoney(totalIncome, profile.currency)}/mo</div>
        </div>
        {topBudgets.map(b => (
          <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-gray-500 text-xs mb-1">{b.name}</div>
            <div className="text-white font-bold text-sm">{formatMoney(b.amount, profile.currency)}</div>
          </div>
        ))}
      </div>

      {/* Can I Afford This? */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowAfford(!showAfford)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" />
            <span className="text-white font-semibold">Can I Afford This?</span>
          </div>
          {showAfford ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>

        {showAfford && (
          <div className="px-5 pb-5 space-y-3 border-t border-gray-800 pt-4">
            <div className="flex gap-3">
              <input
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="What do you want to buy?"
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500"
              />
              <MoneyInput
                value={itemCost}
                onChange={setItemCost}
                currency={profile.currency}
                placeholder="0"
                className="w-32 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500"
              />
            </div>
            <button
              onClick={checkAffordability}
              disabled={checkingAfford || !itemName.trim() || !itemCost}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              {checkingAfford ? 'Checking...' : 'Check Affordability'}
            </button>
            {affordResult && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm leading-relaxed">{affordResult}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col flex-1 min-h-0" style={{ minHeight: '320px' }}>
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-800">
          <MessageSquare size={15} className="text-emerald-400" />
          <span className="text-white font-semibold text-sm">Chat with your Coach</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Sparkles size={12} className="text-emerald-400" />
                </div>
              )}
              <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-gray-800 text-gray-200 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <Sparkles size={12} className="text-emerald-400 animate-pulse" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2 border-t border-gray-800 flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.text)}
              disabled={loading}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 rounded-xl transition-all disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-800 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask your AI coach anything..."
            disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
