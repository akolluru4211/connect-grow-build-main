/// <reference lib="deno.ns" />

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const FALLBACK_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

/**
 * Calls Gemini API with fallback models.
 * Centralizes error handling and model rotation.
 */
export async function callAIWithFallback(apiKey: string, body: any): Promise<Response> {
  let lastError = "";
  let lastStatus = 500;
  
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`Attempting AI request with model: ${model}`);
      // Using OpenAI compatibility endpoint for Gemini
      const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ ...body, model }),
      });

      if (response.ok) {
        console.log(`AI Success with model: ${model}`);
        return response;
      }

      lastStatus = response.status;
      const errText = await response.text();
      lastError = `Model ${model} (Status ${lastStatus}): ${errText}`;
      console.warn(lastError);
      
      // If it's a rate limit or billing error, return immediately as other models will likely fail too
      if (lastStatus === 429 || lastStatus === 402) {
        return new Response(JSON.stringify({ 
          error: lastStatus === 429 ? "Rate limit exceeded. Please try again in a few minutes." : "AI credits exhausted.",
          details: errText
        }), { 
          status: lastStatus, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
    } catch (e) {
      lastError = `Model ${model} error: ${e instanceof Error ? e.message : String(e)}`;
      console.warn(lastError);
    }
  }
  
  return new Response(JSON.stringify({ 
    error: "AI service is currently overloaded or unavailable.", 
    details: lastError 
  }), { 
    status: lastStatus, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}

/**
 * Robust JSON parser that handles cases where LLM might wrap JSON in code blocks
 */
export function parseAIJSON(content: string) {
  try {
    return JSON.parse(content);
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        console.error("Regex match found but failed to parse:", jsonMatch[0]);
      }
    }
    throw new Error("Failed to parse structured response from AI: " + content.substring(0, 100) + "...");
  }
}
