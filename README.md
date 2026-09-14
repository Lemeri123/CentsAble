# CentsAble 💸

> An AI-powered financial coach built for students. Track spending, roast your habits, and actually save money.

---

## Features

- **Spending Tracker** — log transactions with AI auto-categorization across 8 categories
- **Roast Me** — AI humorously calls out your bad spending habits
- **AI Coach Chat** — ask anything: "Can I afford AirPods?" or "How do I save for a trip?"
- **Savings Goals** — set goals with deadlines, custom emojis, and color themes
- **Budget Tracking** — visual breakdown of spending vs. budget per category
- **Streaks & Achievements** — 9 unlockable achievements and daily logging streaks
- **Onboarding Wizard** — 3-step setup for income and budget limits

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Auth + Database | Supabase (PostgreSQL + RLS) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| Icons | Lucide React |

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then fill in your `.env`:

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon public key |
| `VITE_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free account |

### 3. Set up the database

In your Supabase project, open the **SQL Editor** and run the contents of:

```
supabase/migrations/20260527072908_create_financial_coach_schema.sql
```

This creates all 5 tables with RLS policies:

- `student_profiles`
- `transactions`
- `savings_goals`
- `achievements`
- `streaks`

### 4. Run the app

```bash
npm run dev
```

---

## Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx       # Sign in / sign up
│   ├── Layout.tsx         # Sidebar + mobile nav
│   └── Onboarding.tsx     # 3-step setup wizard
├── pages/
│   ├── Dashboard.tsx      # Monthly overview + AI insights
│   ├── SpendingTracker.tsx# Log + manage transactions
│   ├── AICoach.tsx        # Chat + affordability checker
│   ├── SavingsGoals.tsx   # Goals + achievements
│   └── Settings.tsx       # Profile + budget settings
└── lib/
    ├── supabase.ts        # Supabase client + types
    ├── aiCoach.ts         # Groq API calls
    └── achievements.ts    # Streak + achievement logic
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```