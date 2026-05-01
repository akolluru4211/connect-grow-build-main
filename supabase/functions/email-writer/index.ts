import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

interface EmailRequest {
  purpose: string;
  tone: "professional" | "friendly" | "formal" | "casual";
  recipient?: string;
  context?: string;
  keyPoints?: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting email generation request`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error(`[${requestId}] Auth error:`, authError);
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const { purpose, tone, recipient, context, keyPoints } = await req.json() as EmailRequest;
    if (!purpose) {
      return createErrorResponse("Purpose is required", 400, requestId);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const toneDescriptions: Record<string, string> = {
      professional: "professional and business-appropriate, maintaining formality while being approachable",
      friendly: "warm, personable, and conversational while still being respectful",
      formal: "highly formal, traditional, and respectful with proper business etiquette",
      casual: "relaxed, informal, and conversational like talking to a colleague",
    };

    const systemPrompt = `You are an expert email writer who creates humanized, natural-sounding emails. Your emails should:
- Sound like they were written by a real person, not AI
- Include natural transitions and conversational elements
- Be clear, concise, and purposeful
- Match the requested tone perfectly
Generate ONLY the email content (subject line on first line, then blank line, then email body).`;

    const userPrompt = `Write an email with the following details:
Purpose: ${purpose}
Tone: ${toneDescriptions[tone]}
${recipient ? `Recipient: ${recipient}` : ""}
${context ? `Additional Context: ${context}` : ""}
${keyPoints && keyPoints.length > 0 ? `Key Points to Include:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""}`;

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    if (!response.ok) {
      return response; 
    }

    const data = await response.json();
    const emailContent = data.choices?.[0]?.message?.content || "";

    const lines = emailContent.trim().split("\n");
    let subject = "";
    let body = emailContent;

    if (lines[0].toLowerCase().startsWith("subject:")) {
      subject = lines[0].replace(/^subject:\s*/i, "").trim();
      body = lines.slice(2).join("\n").trim();
    } else if (lines.length > 2 && lines[1] === "" && lines[0].length < 100) {
      subject = lines[0];
      body = lines.slice(2).join("\n").trim();
    }

    console.log(`[${requestId}] Email generation successful`);
    return createStandardResponse({ subject, body, fullContent: emailContent }, requestId);
  } catch (error: unknown) {
    console.error(`[${requestId}] Error in email-writer function:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : String(error),
      500,
      requestId,
      true,
      error instanceof Error ? error.stack : undefined
    );
  }
});


