/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { paperText, summaryType, focusArea } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!paperText || paperText.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Please provide at least 50 characters of paper text." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const truncatedText = paperText.substring(0, 15000);
    const wordCount = paperText.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    const typeInstruction = summaryType === "brief" 
      ? "Provide a brief 3-4 sentence summary." 
      : summaryType === "detailed" 
        ? "Provide a comprehensive detailed summary with all sections." 
        : summaryType === "eli5"
          ? "Explain like I'm 5 - use simple language a non-expert can understand."
          : "Provide a structured summary with key points.";

    const focusInstruction = focusArea ? ` Pay special attention to: ${focusArea}.` : "";

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        {
          role: "system",
          content: `You are an expert academic research paper summarizer and critical analyst. Analyze research papers and provide clear, structured summaries with critical evaluation.`,
        },
        {
          role: "user",
          content: `${typeInstruction}${focusInstruction}

Summarize this research paper:

${truncatedText}`
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_summary",
            description: "Return the paper summary with analysis",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Detected or inferred paper title" },
                authors: { type: "string", description: "Detected authors if visible" },
                publicationYear: { type: "string", description: "Detected year if visible" },
                summary: { type: "string", description: "Main summary text" },
                keyFindings: { type: "array", items: { type: "string" }, description: "Key findings or contributions" },
                methodology: { type: "string", description: "Brief methodology description" },
                conclusions: { type: "string", description: "Main conclusions" },
                strengths: { type: "array", items: { type: "string" }, description: "Paper strengths" },
                limitations: { type: "array", items: { type: "string" }, description: "Paper limitations or weaknesses" },
                futureWork: { type: "array", items: { type: "string" }, description: "Suggested future research directions" },
                keywords: { type: "array", items: { type: "string" }, description: "Important keywords/topics" },
                researchQuestions: { type: "array", items: { type: "string" }, description: "Research questions addressed" },
                practicalImplications: { type: "string", description: "How this research can be applied practically" },
              },
              required: ["title", "summary", "keyFindings", "conclusions", "keywords", "strengths", "limitations"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_summary" } },
    });

    if (!response.ok) {
      return response;
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    result.wordCount = wordCount;
    result.estimatedReadingTime = estimatedReadingTime;

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("paper-summarizer error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


