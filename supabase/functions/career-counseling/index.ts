/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        {
          role: "system",
          content: `You are an expert career counselor for students and young professionals on the EdWorld platform. Your role is to provide personalized career guidance including:
- Career path recommendations based on skills and interests
- Resume and interview tips
- Industry insights and trends
- Skill development advice
- Job market analysis
- Higher education guidance
- Networking strategies

Be encouraging, specific, and actionable. Use markdown formatting for readability. Keep responses focused and under 500 words unless the user asks for detail.`,
        },
        ...messages,
      ],
      stream: true,
    });

    if (!response.ok) {
      return response;
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("career-counseling error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


