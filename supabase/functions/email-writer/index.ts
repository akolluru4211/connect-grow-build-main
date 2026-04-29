/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

interface EmailRequest {
  purpose: string;
  tone: "professional" | "friendly" | "formal" | "casual";
  recipient?: string;
  context?: string;
  keyPoints?: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { purpose, tone, recipient, context, keyPoints } = await req.json() as EmailRequest;
    if (!purpose) {
      return new Response(JSON.stringify({ error: "Purpose is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return response; // callAIWithFallback already returns a structured error Response
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

    return new Response(JSON.stringify({ subject, body, fullContent: emailContent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error in email-writer function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});


