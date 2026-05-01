/// <reference lib="deno.ns" />

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const FALLBACK_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-pro-exp",
  "gemini-1.5-pro-002",
  "gemini-1.5-flash-002",
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
  const requestId = crypto.randomUUID();
  
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`[${requestId}] Attempting AI request with model: ${model}`);
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
        if (body.stream) {
          console.log(`[${requestId}] AI Streaming Success with model: ${model}`);
          const newHeaders = new Headers(response.headers);
          for (const [key, value] of Object.entries(corsHeaders)) {
            newHeaders.set(key, value);
          }
          newHeaders.set("Content-Type", "text/event-stream");
          newHeaders.set("X-Request-ID", requestId);
          return new Response(response.body, {
            status: 200,
            headers: newHeaders
          });
        }

        const responseData = await response.json();
        
        if (responseData.choices && responseData.choices.length > 0) {
          console.log(`[${requestId}] AI Success with model: ${model}`);
          return new Response(JSON.stringify({
            success: true,
            requestId,
            ...responseData
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId }
          });
        } else {
          console.warn(`[${requestId}] Model ${model} returned empty choices.`);
          lastError = `Model ${model}: No completion choices returned`;
          continue;
        }
      }

      lastStatus = response.status;
      const errText = await response.text();
      lastError = `Model ${model} (Status ${lastStatus}): ${errText}`;
      console.warn(`[${requestId}] ${lastError}`);
      
      // If it's a non-retryable error (auth, billing), return immediately
      if ([401, 402, 403].includes(lastStatus)) {
        let userMessage = "AI service authentication or quota issue.";
        if (lastStatus === 402) userMessage = "AI credits exhausted.";
        if (lastStatus === 401 || lastStatus === 403) userMessage = "Invalid API configuration.";

        return new Response(JSON.stringify({ 
          success: false,
          requestId,
          retryable: false,
          error: userMessage,
          details: errText
        }), { 
          status: lastStatus, 
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } 
        });
      }
      
      // For 429 or 5xx, we continue the loop to try another model
      // but we mark it as retryable for the client if all models fail
    } catch (e) {
      lastError = `Model ${model} error: ${e instanceof Error ? e.message : String(e)}`;
      console.warn(`[${requestId}] ${lastError}`);
    }
  }
  
  return new Response(JSON.stringify({ 
    success: false,
    requestId,
    retryable: true,
    error: "AI service is currently overloaded or unavailable. Please try again.", 
    details: lastError 
  }), { 
    status: lastStatus, 
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId } 
  });
}

/**
 * Robust JSON parser that handles cases where LLM might wrap JSON in code blocks
 */
export function parseAIJSON(content: string) {
  if (!content) throw new Error("AI returned empty content");
  
  // Clean up any potential markdown formatting
  let cleanContent = content.trim();
  
  // Handle markdown blocks
  if (cleanContent.includes("```")) {
    const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      cleanContent = jsonMatch[1].trim();
    }
  }

  try {
    return JSON.parse(cleanContent);
  } catch (e) {
    // Aggressive regex fallback for partial or malformed JSON
    const objectMatch = cleanContent.match(/\{[\s\S]*\}/);
    const arrayMatch = cleanContent.match(/\[[\s\S]*\]/);
    
    const candidate = objectMatch ? objectMatch[0] : (arrayMatch ? arrayMatch[0] : null);
    
    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch (innerE) {
        console.error("Regex candidate failed to parse:", candidate);
      }
    }
    
  throw new Error("Failed to parse structured response from AI. Content: " + cleanContent.substring(0, 100) + "...");
  }
}

/**
 * Creates a standardized success response.
 */
export function createStandardResponse(data: any, requestId?: string): Response {
  return new Response(JSON.stringify({
    success: true,
    requestId: requestId || crypto.randomUUID(),
    ...data
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId || "" }
  });
}

/**
 * Creates a standardized error response.
 */
export function createErrorResponse(error: string, status = 500, requestId?: string, retryable = true, details?: any): Response {
  return new Response(JSON.stringify({
    success: false,
    requestId: requestId || crypto.randomUUID(),
    retryable,
    error,
    details
  }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-ID": requestId || "" }
  });
}


