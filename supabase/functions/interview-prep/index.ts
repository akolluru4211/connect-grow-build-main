/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, callAIWithFallback, parseAIJSON } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobTitle, jobDescription, company, difficulty = "medium", questionCount = 5 } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an expert interview coach with 20+ years of experience helping candidates prepare for job interviews. Generate realistic, challenging interview questions that would actually be asked for this role. Include a mix of behavioral, technical, and situational questions. For each question, provide:
1. The question itself
2. The type of question (behavioral, technical, situational, or culture-fit)
3. Tips on how to answer effectively
4. An example strong answer framework

Difficulty level: ${difficulty}
Questions to generate: ${questionCount}`;

    const userPrompt = `Generate ${questionCount} interview questions for this position:

Job Title: ${jobTitle}
Company: ${company || "Not specified"}
Job Description: ${jobDescription}

Make the questions specific to this role and company culture. Include questions that test both technical skills and soft skills relevant to the position.`;

    const toolDef = {
      type: "function",
      function: {
        name: "generate_interview_questions",
        description: "Generate interview preparation questions",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  type: { type: "string", enum: ["behavioral", "technical", "situational", "culture-fit"] },
                  tips: { type: "array", items: { type: "string" } },
                  example_answer: { type: "string" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                },
                required: ["question", "type", "tips", "example_answer"],
                additionalProperties: false
              }
            },
            general_tips: { type: "array", items: { type: "string" } },
            company_research_tips: { type: "array", items: { type: "string" } }
          },
          required: ["questions", "general_tips"],
          additionalProperties: false
        }
      }
    };

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [toolDef],
      tool_choice: { type: "function", function: { name: "generate_interview_questions" } }
    });

    if (!response.ok) {
      return response;
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const rawContent = toolCall?.function?.arguments || aiResult.choices?.[0]?.message?.content || "";
    
    if (!rawContent) throw new Error("Invalid AI response format");

    const result = parseAIJSON(rawContent);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Interview prep error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



