import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to generate content");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let parsedContent;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedContent = JSON.parse(jsonMatch[0]);
      else parsedContent = { title: "Daily Update", content: rawContent };
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


