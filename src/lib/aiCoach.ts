import { Transaction, StudentProfile } from './supabase';
import { formatMoney, currencyCode } from './currency';
import { getBudgetCategories } from './budgets';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not set');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function buildProfile(profile: StudentProfile) {
  return {
    name: profile.name,
    monthly_income: profile.monthly_allowance + profile.monthly_side_income,
    currency: currencyCode(profile.currency),
    budgets: Object.fromEntries(getBudgetCategories(profile).map(b => [b.name, b.amount])),
  };
}

export async function categorizeTransaction(description: string, amount: number, allowed?: string[]) {
  const options = (allowed && allowed.length ? allowed : ['food', 'transport', 'entertainment', 'education', 'shopping', 'health', 'snacks', 'other']).join(', ');
  const system = `You are a financial categorization assistant for students.
Categorize transactions into one of: ${options}.
Also determine if it's an "unnecessary" purchase.
Respond in JSON only: {"category": "...", "is_unnecessary": true/false}`;

  const content = await callGroq(system, `Categorize: "${description}" for ${amount}`);
  try {
    return JSON.parse(content);
  } catch {
    return { category: 'other', is_unnecessary: false };
  }
}

export async function roastSpending(transactions: Transaction[], profile: StudentProfile) {
  const system = `You are a witty but supportive financial coach for students.
Humorously roast bad spending habits while still being encouraging.
Be funny and use relatable student references. Keep it under 2 sentences.`;

  const totals: Record<string, number> = {};
  for (const t of transactions) totals[t.category] = (totals[t.category] || 0) + t.amount;

  const message = await callGroq(system,
    `Roast these monthly spending totals: ${JSON.stringify(totals)}. Student name: ${profile.name}`
  );
  return { message };
}

export async function canIAfford(item: { name: string; cost: number }, profile: StudentProfile, question?: string) {
  const p = buildProfile(profile);
  const system = `You are a friendly, practical AI financial coach for students.
Give honest, simple advice about whether they can afford something.
Be encouraging but realistic. Keep response under 100 words. No jargon.`;

  const message = await callGroq(system,
    `Can I afford ${item.name} that costs ${formatMoney(item.cost, p.currency)}?
My monthly income is ${formatMoney(p.monthly_income, p.currency)}.
My budgets: ${JSON.stringify(p.budgets)}.
Currency: ${p.currency}.
${question ? `Also: ${question}` : ''}`
  );
  return { message };
}

export async function analyzeSpending(transactions: Transaction[], profile: StudentProfile) {
  const p = buildProfile(profile);
  const system = `You are an AI financial coach for students. Analyze spending patterns and give 3 specific, actionable tips.
Be encouraging, use simple language. Format as a short paragraph followed by 3 bullet points.`;

  const totals: Record<string, number> = {};
  let total = 0;
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
    total += t.amount;
  }

  const message = await callGroq(system,
    `Analyze spending for ${p.name}. Monthly income: ${formatMoney(p.monthly_income, p.currency)}.
This month spent ${formatMoney(total, p.currency)} total. Breakdown: ${JSON.stringify(totals)}.
Currency: ${p.currency}.
Give personalized advice.`
  );
  return { message };
}

export async function getBudgetAdvice(profile: StudentProfile, question?: string) {
  const p = buildProfile(profile);
  const system = `You are a friendly AI financial coach for students. Create a simple, practical budget plan.
Use the 50/30/20 rule adapted for students. Be encouraging and specific. Keep it under 150 words.`;

  const message = await callGroq(system,
    `Create a budget plan for ${p.name}. Monthly income: ${formatMoney(p.monthly_income, p.currency)}.
Current budgets: ${JSON.stringify(p.budgets)}.
Currency: ${p.currency}.
${question || 'Give me advice on how to budget better.'}`
  );
  return { message };
}
