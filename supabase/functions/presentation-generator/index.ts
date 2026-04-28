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
    const { notes, slideCount, theme, audience, includeConclusion } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!notes || notes.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Please provide at least 20 characters of notes." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const numSlides = Math.min(Math.max(slideCount || 8, 3), 20);

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer who creates visually structured, engaging slide content. Each slide should be concise, impactful, and presentation-ready. Include a title slide, content slides, and ${includeConclusion !== false ? "a conclusion/thank you slide" : "no conclusion slide"}.`,
        },
        {
          role: "user",
          content: `Create a ${numSlides}-slide presentation from these notes.
Theme: ${theme || "professional"}
Target audience: ${audience || "general"}
${includeConclusion !== false ? "Include a conclusion/Q&A slide at the end." : ""}

Notes:
${notes.substring(0, 12000)}`
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_slides",
            description: "Return presentation slides",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Presentation title" },
                subtitle: { type: "string", description: "Subtitle or tagline" },
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      slideNumber: { type: "number" },
                      title: { type: "string" },
                      layout: { type: "string", enum: ["title", "content", "two-column", "quote", "conclusion"], description: "Slide layout type" },
                      bullets: { type: "array", items: { type: "string" } },
                      speakerNotes: { type: "string" },
                      keyTakeaway: { type: "string", description: "One-line takeaway for this slide" },
                    },
                    required: ["slideNumber", "title", "bullets", "layout"],
                  },
                },
              },
              required: ["title", "slides"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_slides" } },
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI request failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { title: "Presentation", slides: [] };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("presentation-generator error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


