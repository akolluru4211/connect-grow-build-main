import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, parseAIJSON, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting mock-interview request`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const { question, answer, jobTitle, questionType } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an expert interview coach providing constructive feedback on interview responses.
Be encouraging but honest. Focus on actionable improvements while highlighting strengths.
Consider the STAR method (Situation, Task, Action, Result) for behavioral questions.
For technical questions, evaluate accuracy and communication clarity.`;

    const userPrompt = `Evaluate this interview response:

Job Role: ${jobTitle || 'General'}
Question Type: ${questionType || 'behavioral'}
Interview Question: ${question}

Candidate's Answer:
"${answer}"

Provide detailed feedback including:
1. Overall score (1-10)
2. Strengths in the response
3. Areas for improvement
4. A suggested improved answer
5. Specific tips for similar questions`;

    const toolDef = {
      type: "function",
      function: {
        name: "evaluate_interview_response",
        description: "Evaluate an interview response and provide feedback",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
            improved_answer: { type: "string" },
            tips: { type: "array", items: { type: "string" } },
            star_analysis: {
              type: "object",
              properties: {
                situation: { type: "string" },
                task: { type: "string" },
                action: { type: "string" },
                result: { type: "string" }
              }
            }
          },
          required: ["score", "strengths", "improvements", "improved_answer", "tips"],
          additionalProperties: false
        }
      }
    };

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [toolDef],
      tool_choice: { type: "function", function: { name: "evaluate_interview_response" } }
    });

    if (!response.ok) {
      console.error(`[${requestId}] AI provider error:`, response.status);
      return response;
    }

    const data = await response.json();
    let result;
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      result = parseAIJSON(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      result = parseAIJSON(content);
    }

    return createStandardResponse(result, requestId);
  } catch (error) {
    console.error(`[${requestId}] Mock interview error:`, error);
    return createErrorResponse(error instanceof Error ? error.message : String(error), 500, requestId);
  }
});



