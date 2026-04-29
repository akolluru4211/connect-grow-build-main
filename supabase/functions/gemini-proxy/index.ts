/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase Edge Function secrets.");
    }

    // Verify authentication (optional but recommended)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("Missing Authorization header in proxy request");
      // throw new Error("Missing Authorization header"); // Enable if you want to enforce auth
    }

    const { prompt, systemPrompt, jsonMode, stream, messages: customMessages } = await req.json();

    if (!prompt && (!customMessages || customMessages.length === 0)) {
      throw new Error("Prompt or messages are required");
    }

    let messages = customMessages || [];
    if (messages.length === 0) {
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });
    }

    const body: any = {
      messages,
      stream: stream || false,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    console.log(`Calling Gemini via proxy...`);

    const response = await callAIWithFallback(GEMINI_API_KEY, body);

    if (!response.ok) {
      return response;
    }

    // If it's a stream, return the body directly
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
