/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content_response = data.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ raw: content_response }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in blog-ai-suggestions:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


