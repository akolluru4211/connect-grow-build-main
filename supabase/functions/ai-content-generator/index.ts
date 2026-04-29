/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { corsHeaders, callAIWithFallback, parseAIJSON } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contentType } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const prompts: Record<string, string> = {
      blog: `You are an expert career advisor and educational content writer. Generate a helpful, engaging blog post for college students about career development, skill building, or professional growth. Include: A catchy, SEO-friendly title, 3-4 paragraphs of valuable content, practical tips and actionable advice, encouraging and motivational tone. Format your response as JSON: {"title": "...", "content": "..."}`,
      job_update: `You are a career advisor. Generate a daily job market update for college students and fresh graduates. Include: Current trending job roles, Skills in demand, Industry insights, Tips for job seekers. Format your response as JSON: {"title": "...", "content": "..."}`,
      hackathon_update: `You are a tech community manager. Generate an informative update about upcoming hackathons and coding competitions. Format your response as JSON: {"title": "...", "content": "..."}`,
      internship_update: `You are an internship advisor. Generate helpful content about internship opportunities and how to land them. Format your response as JSON: {"title": "...", "content": "..."}`
    };

    const systemPrompt = prompts[contentType] || prompts.blog;

    const aiResponse = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate fresh content for today: ${new Date().toLocaleDateString()}. Make it relevant and timely.` }
      ],
    });

    if (!aiResponse.ok) {
      return aiResponse;
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    let parsedContent;
    try {
      parsedContent = parseAIJSON(rawContent);
    } catch {
      parsedContent = { title: "Daily Update", content: rawContent };
    }

    const { data, error } = await supabase.from("ai_generated_content").insert({
      content_type: contentType,
      title: parsedContent.title,
      content: parsedContent.content,
      is_published: true,
      published_at: new Date().toISOString(),
      metadata: { generated_at: new Date().toISOString() }
    }).select().single();

    if (error) { console.error("Database error:", error); throw error; }

    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Content generation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});



