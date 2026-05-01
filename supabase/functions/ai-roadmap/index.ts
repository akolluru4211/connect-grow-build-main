/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, parseAIJSON, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting AI Roadmap request`);

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
      const errorText = await response.text();
      console.error(`[${requestId}] AI provider error:`, errorText);
      return createErrorResponse("AI provider error", response.status, requestId, true, errorText);
    }

    const aiResult = await response.json();
    let roadmap;
    
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const content = aiResult.choices?.[0]?.message?.content || "";

    try {
      if (toolCall?.function?.arguments) {
        roadmap = JSON.parse(toolCall.function.arguments);
      } else {
        roadmap = parseAIJSON(content);
      }
    } catch (e) {
      console.error(`[${aiResult.requestId || requestId}] Failed to parse AI response:`, content);
      return createErrorResponse("Malformed AI response", 500, aiResult.requestId || requestId, true, content.substring(0, 500));
    }

    console.log(`[${requestId}] AI Roadmap generated successfully`);
    return createStandardResponse(roadmap, aiResult.requestId || requestId);
  } catch (error) {
    console.error(`[${requestId}] Roadmap generation error:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500,
      requestId,
      true,
      error instanceof Error ? error.stack : undefined
    );
  }
});


