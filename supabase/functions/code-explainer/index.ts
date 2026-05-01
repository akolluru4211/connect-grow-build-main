import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting code explanation request`);

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

    const { code, language, action } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let systemPrompt = "";
    if (action === "explain") {
      systemPrompt = `You are an expert programming tutor. Explain the following ${language} code in simple terms that a beginner can understand. Break it down line by line if needed. Use examples and analogies. Format with markdown.`;
    } else if (action === "fix") {
      systemPrompt = `You are an expert ${language} developer. Find bugs and issues in the code and provide the fixed version with explanations. Format with markdown.`;
    } else if (action === "optimize") {
      systemPrompt = `You are an expert ${language} developer. Suggest optimizations for the code, explaining why each change improves performance or readability. Format with markdown.`;
    } else {
      systemPrompt = `You are a helpful ${language} programming assistant. Help the student with their code. Format with markdown.`;
    }

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: code },
      ],
      stream: true,
    });

    console.log(`[${requestId}] AI response started (streaming)`);
    return response;
  } catch (e) {
    console.error(`[${requestId}] Code explainer error:`, e);
    return createErrorResponse(e instanceof Error ? e.message : String(e), 500, requestId);
  }
});


