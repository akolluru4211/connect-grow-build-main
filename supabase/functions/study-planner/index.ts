import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, parseAIJSON, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting study plan generation request`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

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
      console.error(`[${requestId}] AI provider error:`, response.status);
      return response;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let plan;
    try {
      plan = parseAIJSON(content);
    } catch {
      plan = { title: "Study Plan", rawContent: content };
    }

    console.log(`[${requestId}] Study plan generation successful`);
    return createStandardResponse({ plan }, requestId);
  } catch (e) {
    console.error(`[${requestId}] Study planner error:`, e);
    return createErrorResponse(
      e instanceof Error ? e.message : String(e),
      500,
      requestId,
      true,
      e instanceof Error ? e.stack : undefined
    );
  }
});



