import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI request failed");
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "AI request failed");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    console.error("Mock interview error:", error);
    const message = error instanceof Error ? error.message : "Failed to evaluate response";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


