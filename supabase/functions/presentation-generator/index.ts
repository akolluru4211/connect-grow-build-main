/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
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
      return response;
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



