import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting career-counseling request`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error(`[${requestId}] Auth error:`, authError);
      return createErrorResponse("Unauthorized", 401, requestId);
    }

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

    console.log(`[${requestId}] AI response started (streaming)`);
    return response;
  } catch (e) {
    console.error(`[${requestId}] career-counseling error:`, e);
    return createErrorResponse(e, 500, requestId);
  }
});


