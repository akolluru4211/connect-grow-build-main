import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, parseAIJSON, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();

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

    const { jobTitle, jobDescription, companyName, userProfile, tone } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // ... (rest of prompts and toolDef)
    const systemPrompt = `You are an expert career coach and professional cover letter writer. 
Create compelling, personalized cover letters that highlight the candidate's relevant experience and enthusiasm for the role.
The cover letter should be professional yet personable, and tailored to the specific job and company.`;

    const userPrompt = `Create a personalized cover letter for the following:

Job Title: ${jobTitle}
Company: ${companyName || 'the company'}
Job Description: ${jobDescription}

Candidate Profile:
- Name: ${userProfile?.name || 'the candidate'}
- Current Role: ${userProfile?.headline || 'Not specified'}
- Bio: ${userProfile?.bio || 'Not specified'}
- Skills: ${userProfile?.skills?.join(', ') || 'Not specified'}
- Experience Summary: ${userProfile?.experience || 'Not specified'}

Tone: ${tone || 'professional'}

Generate a compelling cover letter that:
1. Opens with an attention-grabbing introduction
2. Highlights relevant experience and skills that match the job requirements
3. Shows enthusiasm for the company and role
4. Includes a strong call to action
5. Is approximately 300-400 words`;

    const toolDef = {
      type: "function",
      function: {
        name: "generate_cover_letter",
        description: "Generate a personalized cover letter",
        parameters: {
          type: "object",
          properties: {
            cover_letter: { type: "string" },
            key_highlights: { type: "array", items: { type: "string" } },
            customization_tips: { type: "array", items: { type: "string" } },
            word_count: { type: "number" }
          },
          required: ["cover_letter", "key_highlights", "customization_tips", "word_count"]
        }
      }
    };

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [toolDef],
      tool_choice: { type: "function", function: { name: "generate_cover_letter" } }
    });

    if (!response.ok) {
      return response;
    }

    const aiResult = await response.json();
    let result;

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const content = aiResult.choices?.[0]?.message?.content || "";

    try {
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        result = parseAIJSON(content);
      }
    } catch (e) {
      console.error(`[${aiResult.requestId || requestId}] Failed to parse AI response:`, content);
      return createErrorResponse("Malformed AI response", 500, aiResult.requestId || requestId, true, content.substring(0, 500));
    }

    return createStandardResponse(result, aiResult.requestId || requestId);
  } catch (error: unknown) {
    console.error(`[${requestId}] Cover letter generation error:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500,
      requestId,
      true,
      error instanceof Error ? error.stack : undefined
    );
  }
});


