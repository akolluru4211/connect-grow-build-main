import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders, callAIWithFallback, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting gemini-proxy request`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in Supabase Edge Function secrets.");
    }

    // Initialize Supabase Client with user auth
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error(`[${requestId}] Auth error:`, authError);
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    // Fetch latest context (daily updates, jobs, hackathons)
    // We use a separate service client or just use the user client if it has access
    const { data: recentContent } = await supabase
      .from("ai_generated_content")
      .select("content_type, title, content")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(5);

    let contextString = "";
    if (recentContent && recentContent.length > 0) {
      contextString = "\n\nCURRENT STUDENT CONTEXT & OPPORTUNITIES:\n" + 
        recentContent.map((c: any) => `[${c.content_type.toUpperCase()}] ${c.title}: ${c.content.substring(0, 200)}...`).join("\n");
    }

    const { prompt, systemPrompt, jsonMode, stream, messages: customMessages } = await req.json();

    if (!prompt && (!customMessages || customMessages.length === 0)) {
      throw new Error("Prompt or messages are required");
    }

    const defaultSystemPrompt = `You are EdWorld Elite AI, the core intelligence of the EdWorld Career Operating System. 
Your goal is to provide world-class, premium career guidance, education planning, and professional optimization for high-achieving students.
Key Principles:
1. Precision: Provide specific, actionable advice rather than generic tips.
2. Structure: Use neat markdown formatting, bold headers, and bullet points.
3. Foresight: Anticipate the student's next steps and provide guidance for them.
4. Professionalism: Maintain a tone that is encouraging yet highly professional and sophisticated.
5. Real-time Awareness: Utilize the context provided about jobs, internships, and hackathons to give relevant advice.`;

    let messages = customMessages || [];
    if (messages.length === 0) {
      messages.push({ 
        role: "system", 
        content: (systemPrompt || defaultSystemPrompt) + contextString 
      });
      messages.push({ role: "user", content: prompt });
    } else {
      // If messages exist, inject context into the system message or first user message
      const systemMessage = messages.find((m: any) => m.role === "system");
      if (systemMessage) {
        systemMessage.content += contextString;
      } else {
        messages.unshift({ role: "system", content: (systemPrompt || defaultSystemPrompt) + contextString });
      }
    }

    const body: any = {
      messages,
      stream: stream || false,
      temperature: 0.7,
      max_tokens: 2000,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
      // Append strict instruction to ensure JSON output
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        lastMessage.content += "\n\nCRITICAL: You must return only valid JSON code. No explanatory text before or after the JSON block.";
      }
    }

    console.log(`[${requestId}] Calling Gemini via proxy with ${recentContent?.length || 0} context items...`);

    const response = await callAIWithFallback(GEMINI_API_KEY, body);

    if (stream) {
      console.log(`[${requestId}] Proxy response started (streaming)`);
      return response;
    }

    const aiData = await response.json();
    console.log(`[${requestId}] Proxy request successful`);
    return createStandardResponse(aiData, aiData.requestId || requestId);

  } catch (error) {
    console.error(`[${requestId}] Proxy error:`, error);
    return createErrorResponse(error, 500, requestId);
  }
});

