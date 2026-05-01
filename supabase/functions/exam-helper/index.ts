import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIWithFallback, parseAIJSON, corsHeaders, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting exam helper request`);

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

    const { action, subject, topic, currentLevel, inputData } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_questions") {
      systemPrompt = `You are an expert exam preparation assistant. Generate 5 high-quality multiple choice questions for ${subject} on the topic of "${topic}".
      Target level: ${currentLevel || "intermediate"}.
      Return a JSON array of objects with fields: question, options (array of 4 strings), correctAnswer (index 0-3), explanation.`;
      userPrompt = `Generate 5 questions about ${topic}.`;
    } else if (action === "evaluate_answer") {
      systemPrompt = `Evaluate the following student answer for ${subject}. 
      Topic: ${topic}
      Question: ${inputData.question}
      Student Answer: ${inputData.answer}
      Return a JSON object with: isCorrect (boolean), feedback (string), modelAnswer (string), score (0-100).`;
      userPrompt = `Evaluate this answer: "${inputData.answer}" for question: "${inputData.question}"`;
    } else {
      systemPrompt = `You are an expert ${subject} tutor. Provide a brief explanation of "${topic}" with 3 key points.
      Return a JSON object with: explanation (string), keyPoints (array of strings), summary (string).`;
      userPrompt = `Explain ${topic} in the context of ${subject}.`;
    }

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    if (!response.ok) {
      console.error(`[${requestId}] AI provider error:`, response.status);
      return response;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const result = parseAIJSON(content);

    console.log(`[${requestId}] Exam helper request successful`);
    return createStandardResponse(result, requestId);
  } catch (error: any) {
    console.error(`[${requestId}] Error in exam-helper:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : String(error),
      500,
      requestId,
      true,
      error instanceof Error ? error.stack : undefined
    );
  }
};

serve(handler);
