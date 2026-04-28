import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

async function callAIWithFallback(apiKey: string, body: any): Promise<Response> {
  let lastError = "";
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`Attempting AI request with model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey 
        },
        body: JSON.stringify({ ...body, model }),
      });

      if (response.ok) {
        console.log(`AI Success with model: ${model}`);
        return response;
      }

      const errStatus = response.status;
      const errText = await response.text();
      lastError = `${model} (Status ${errStatus}): ${errText}`;
      console.warn(`Model ${model} failed:`, lastError);
      
      if (errStatus === 402 || errStatus === 429) return response;
      
    } catch (e) {
      lastError = `${model}: ${e instanceof Error ? e.message : "Network/Connection error"}`;
      console.warn(`Model ${model} execution error:`, e);
    }
  }
  throw new Error(`AI Service Unavailable. Details: ${lastError}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goal, subjects, examDate, hoursPerDay } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const today = new Date().toISOString().split("T")[0];
    const prompt = `Create a detailed study plan with the following details:
- Goal: ${goal}
- Subjects: ${subjects?.join(", ") || "General"}
- Exam/Target Date: ${examDate || "No specific date"}
- Available study hours per day: ${hoursPerDay || 3}
- Today's date: ${today}

Return a structured JSON study plan using this exact format (no markdown, just raw JSON):
{
  "title": "Plan title",
  "weeklySchedule": [
    {
      "week": 1,
      "theme": "Week focus area",
      "days": [
        {
          "day": "Monday",
          "tasks": [
            { "subject": "Subject name", "topic": "Specific topic", "duration": "1.5 hours", "type": "study|practice|review" }
          ]
        }
      ]
    }
  ],
  "tips": ["tip1", "tip2", "tip3"],
  "milestones": [
    { "week": 1, "milestone": "What to achieve by end of week 1" }
  ]
}

Generate a 4-week plan. Be specific with topics. Keep it realistic and achievable.`;

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: "You are an expert academic study planner. Return ONLY valid JSON, no markdown formatting." },
        { role: "user", content: prompt },
      ],
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      plan = { title: "Study Plan", rawContent: content };
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study-planner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


