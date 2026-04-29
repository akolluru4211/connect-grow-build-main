/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    if (!response.ok) {
      return response; // callAIWithFallback already returns a structured error Response
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("code-explainer error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Unknown error",
      details: e instanceof Error ? e.stack : undefined
    }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


