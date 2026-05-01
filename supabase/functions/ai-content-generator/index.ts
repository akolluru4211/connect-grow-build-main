import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";
import { corsHeaders, callAIWithFallback, parseAIJSON, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting content generation request`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      console.error(`[${requestId}] Auth error:`, authError);
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    // Note: We use service role for DB operations that might bypass RLS or need higher permissions
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { contentType } = body;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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
      const errorText = await aiResponse.text();
      console.error(`[${requestId}] AI provider error:`, errorText);
      return createErrorResponse("AI provider error", aiResponse.status, requestId, true, errorText);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    let parsedContent;
    try {
      parsedContent = parseAIJSON(rawContent);
    } catch {
      parsedContent = { title: "Daily Update", content: rawContent };
    }

    const { data, error } = await supabaseAdmin.from("ai_generated_content").insert({
      content_type: contentType,
      title: parsedContent.title,
      content: parsedContent.content,
      is_published: true,
      published_at: new Date().toISOString(),
      metadata: { generated_at: new Date().toISOString(), requestId }
    }).select().single();

    if (error) { 
      console.error(`[${requestId}] Database error:`, error); 
      throw error; 
    }

    console.log(`[${requestId}] Content generated and saved successfully:`, data.id);
    return createStandardResponse({ data }, requestId);
  } catch (error) {
    console.error(`[${requestId}] Content generation error:`, error);
    return createErrorResponse(error instanceof Error ? error.message : String(error), 500, requestId);
  }
});



