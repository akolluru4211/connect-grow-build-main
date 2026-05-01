import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting blog AI suggestions request`);

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

    const { content, excerpt, type } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "title") {
      systemPrompt = `You are a professional content strategist. Generate 3 compelling, SEO-friendly blog post titles based on the content provided.`;
      userPrompt = `Based on this blog post content, suggest 3 great titles:\n\n${content || excerpt || "A blog post about professional topics"}`;
    } else if (type === "tags") {
      systemPrompt = `You are a content tagging specialist. Generate 5-8 relevant tags/hashtags for blog posts.`;
      userPrompt = `Based on this blog post content, suggest relevant tags:\n\n${content || excerpt || "A blog post about professional topics"}`;
    } else if (type === "improve") {
      systemPrompt = `You are a professional editor. Provide 2-3 brief, actionable suggestions to improve this blog post's engagement and readability.`;
      userPrompt = `Review this blog post and suggest improvements:\n\nTitle: ${excerpt || "Untitled"}\n\nContent: ${content || "No content yet"}`;
    }

    const body: any = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    };

    if (type === "title") {
      body.tools = [{ type: "function", function: { name: "suggest_titles", description: "Return 3 compelling blog post title suggestions.", parameters: { type: "object", properties: { titles: { type: "array", items: { type: "string" } } }, required: ["titles"], additionalProperties: false } } }];
      body.tool_choice = { type: "function", function: { name: "suggest_titles" } };
    } else if (type === "tags") {
      body.tools = [{ type: "function", function: { name: "suggest_tags", description: "Return 5-8 relevant tags.", parameters: { type: "object", properties: { tags: { type: "array", items: { type: "string" } } }, required: ["tags"], additionalProperties: false } } }];
      body.tool_choice = { type: "function", function: { name: "suggest_tags" } };
    } else if (type === "improve") {
      body.tools = [{ type: "function", function: { name: "suggest_improvements", description: "Return 2-3 improvement suggestions.", parameters: { type: "object", properties: { suggestions: { type: "array", items: { type: "object", properties: { area: { type: "string" }, suggestion: { type: "string" } }, required: ["area", "suggestion"], additionalProperties: false } } }, required: ["suggestions"], additionalProperties: false } } }];
      body.tool_choice = { type: "function", function: { name: "suggest_improvements" } };
    }

    const response = await callAIWithFallback(GEMINI_API_KEY, body);

    if (!response.ok) {
      console.error(`[${requestId}] AI provider error:`, response.status);
      return response;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      console.log(`[${requestId}] Blog suggestions successful (tool call)`);
      return createStandardResponse(result, requestId);
    }

    const content_response = data.choices?.[0]?.message?.content;
    console.log(`[${requestId}] Blog suggestions successful (content)`);
    return createStandardResponse({ raw: content_response }, requestId);
  } catch (error) {
    console.error(`[${requestId}] Error in blog-ai-suggestions:`, error);
    return createErrorResponse(error, 500, requestId);
  }
});


