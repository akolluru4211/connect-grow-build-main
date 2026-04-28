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
    const { careerGoal, currentSkills, timeframe, experienceLevel } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an expert career advisor and learning path architect. Create detailed, actionable learning roadmaps tailored to individual career goals.`;

    const userPrompt = `Create a comprehensive learning roadmap for someone who wants to become a ${careerGoal}.

Current Skills: ${currentSkills || "None specified"}
Experience Level: ${experienceLevel || "Beginner"}
Timeframe: ${timeframe || "6 months"}

Provide a structured roadmap with:
1. Clear phases/milestones with weekly breakdowns
2. Specific skills to learn in order
3. Recommended resources (free and paid)
4. Projects to build for portfolio
5. Certifications to consider
6. Interview preparation tips
7. Salary expectations at different levels`;

    const toolDef = {
      type: "function",
      function: {
        name: "generate_roadmap",
        description: "Generate a structured learning roadmap",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            totalDuration: { type: "string" },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  duration: { type: "string" },
                  description: { type: "string" },
                  skills: { type: "array", items: { type: "object", properties: { name: { type: "string" }, priority: { type: "string", enum: ["essential", "important", "nice-to-have"] }, resources: { type: "array", items: { type: "string" } } }, required: ["name", "priority"], additionalProperties: false } },
                  projects: { type: "array", items: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] } }, required: ["name", "description"], additionalProperties: false } },
                  milestones: { type: "array", items: { type: "string" } }
                },
                required: ["name", "duration", "skills"],
                additionalProperties: false
              }
            },
            certifications: { type: "array", items: { type: "object", properties: { name: { type: "string" }, provider: { type: "string" }, cost: { type: "string" }, difficulty: { type: "string" } }, required: ["name", "provider"], additionalProperties: false } },
            salaryExpectations: { type: "object", properties: { entry: { type: "string" }, mid: { type: "string" }, senior: { type: "string" } }, additionalProperties: false },
            interviewTips: { type: "array", items: { type: "string" } }
          },
          required: ["title", "summary", "phases"],
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
      tool_choice: { type: "function", function: { name: "generate_roadmap" } }
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("Invalid AI response format");

    const roadmap = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(roadmap), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Roadmap generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


