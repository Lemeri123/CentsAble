// Edge Runtime types are automatically available

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FinancialCoachRequest {
  action: "analyze_spending" | "can_i_afford" | "get_budget_advice" | "categorize_transaction" | "roast_spending";
  profile?: {
    name: string;
    monthly_income: number;
    budgets: Record<string, number>;
  };
  transactions?: Array<{
    description: string;
    amount: number;
    category: string;
    transaction_date: string;
  }>;
  question?: string;
  item?: {
    name: string;
    cost: number;
  };
  transaction?: {
    description: string;
    amount: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: FinancialCoachRequest = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured. Please add your GROQ_API_KEY secret." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userMessage = "";

    if (body.action === "categorize_transaction" && body.transaction) {
      systemPrompt = `You are a financial categorization assistant for students.
      Categorize transactions into one of: food, transport, entertainment, education, shopping, health, snacks, other.
      Also determine if it's an "unnecessary" purchase.
      Respond in JSON only: {"category": "...", "is_unnecessary": true/false}`;
      userMessage = `Categorize this transaction: "${body.transaction.description}" for $${body.transaction.amount}`;
    } else if (body.action === "roast_spending" && body.transactions) {
      systemPrompt = `You are a witty but supportive financial coach for students.
      Your job is to humorously roast bad spending habits while still being encouraging.
      Be funny and use relatable student references. Keep it under 2 sentences.
      Example: "You spent more on bubble tea than on books this month — your wallet is crying harder than you during finals."`;

      const categoryTotals: Record<string, number> = {};
      for (const t of body.transactions) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
      userMessage = `Roast these monthly spending totals: ${JSON.stringify(categoryTotals)}. Student name: ${body.profile?.name || "Student"}`;
    } else if (body.action === "can_i_afford" && body.item && body.profile) {
      systemPrompt = `You are a friendly, practical AI financial coach for students.
      Give honest, simple advice about whether they can afford something.
      Consider their monthly income and typical expenses.
      Be encouraging but realistic. Keep response under 100 words.
      Use simple language, no jargon.`;
      userMessage = `Can I afford ${body.item.name} that costs $${body.item.cost}?
      My monthly income is $${body.profile.monthly_income}.
      My budgets: ${JSON.stringify(body.profile.budgets)}.
      ${body.question ? `Also: ${body.question}` : ""}`;
    } else if (body.action === "analyze_spending" && body.transactions && body.profile) {
      systemPrompt = `You are an AI financial coach for students. Analyze spending patterns and give 3 specific, actionable tips.
      Be encouraging, use simple language. Format as a short paragraph followed by 3 bullet points.`;

      const categoryTotals: Record<string, number> = {};
      let total = 0;
      for (const t of body.transactions) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        total += t.amount;
      }
      userMessage = `Analyze spending for ${body.profile.name}. Monthly income: $${body.profile.monthly_income}.
      This month spent $${total} total. Breakdown: ${JSON.stringify(categoryTotals)}.
      Give personalized advice.`;
    } else if (body.action === "get_budget_advice" && body.profile) {
      systemPrompt = `You are a friendly AI financial coach for students. Create a simple, practical budget plan.
      Use the 50/30/20 rule adapted for students. Be encouraging and specific. Keep it under 150 words.`;
      userMessage = `Create a budget plan for ${body.profile.name}. Monthly income: $${body.profile.monthly_income}.
      Current budgets: ${JSON.stringify(body.profile.budgets)}.
      ${body.question || "Give me advice on how to budget better."}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action or missing data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    if (body.action === "categorize_transaction") {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ category: "other", is_unnecessary: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ message: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
