import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.40.0";
import { corsHeaders, callAIWithFallback, parseAIJSON, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

// AI blog author configuration
const AI_AUTHOR_NAME = "Edworld co.";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting auto-blog generation request`);

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

    // Use service role for author profile management and blog insertion
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Find or use an existing user as the AI author
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("full_name", AI_AUTHOR_NAME)
      .single();

    let authorId: string;
    
    if (existingProfile) {
      authorId = existingProfile.id;
    } else {
      // Get the first available user to use as the AI author (fallback)
      const { data: firstUser, error: userError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .limit(1)
        .single();
      
      if (userError || !firstUser) {
        throw new Error("No users available to post as");
      }
      
      // Update this profile to be the edwold AI author
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: AI_AUTHOR_NAME, headline: "AI Content Creator" })
        .eq("id", firstUser.id);
      
      authorId = firstUser.id;
    }

    const topics = [
      "resume tips for fresh graduates",
      "interview preparation strategies",
      "building a personal brand on LinkedIn",
      "top programming skills in demand",
      "remote work productivity tips",
      "networking for career growth",
      "transitioning to a new career",
      "soft skills for workplace success",
      "time management for professionals",
      "building a professional portfolio",
      "mastering technical interviews",
      "career development roadmaps",
      "freelancing tips for beginners",
      "work-life balance strategies",
      "upskilling in the digital age",
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const systemPrompt = `You are an expert career advisor writing engaging blog posts for a professional development platform. Write about the given topic in a helpful, practical way that provides real value to readers seeking career advice.

Your writing style should be:
- Professional but friendly
- Actionable with specific tips
- Well-structured with clear sections
- Engaging and motivational

Format your response as JSON with these exact fields:
{
  "title": "An engaging, SEO-friendly title (under 60 chars)",
  "excerpt": "A compelling 1-2 sentence summary (under 160 chars)",
  "content": "The full blog post in HTML format with <h2>, <p>, <ul>, <li> tags. Include 3-5 main sections with practical advice.",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Write a blog post about: ${randomTopic}. Make it practical and valuable for professionals and job seekers. Current date: ${new Date().toLocaleDateString()}.` }
      ],
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] AI provider error:`, errorText);
      return createErrorResponse("AI provider error", response.status, requestId, true, errorText);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response from AI
    let parsedContent;
    try {
      parsedContent = parseAIJSON(rawContent);
    } catch (e) {
      console.error(`[${requestId}] Failed to parse AI response:`, rawContent);
      parsedContent = {
        title: `Career Tips: ${randomTopic}`,
        excerpt: `Learn valuable insights about ${randomTopic} to advance your career.`,
        content: `<p>${rawContent}</p>`,
        tags: ["career", "tips", "professional-development"],
      };
    }

    // Generate unique slug
    const slug = parsedContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Date.now();

    // Insert the blog post
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        author_id: authorId,
        title: parsedContent.title,
        slug,
        content: parsedContent.content,
        excerpt: parsedContent.excerpt,
        tags: parsedContent.tags || [],
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] Database error:`, error);
      throw error;
    }

    console.log(`[${requestId}] Auto-generated blog post successfully:`, data.id);
    return createStandardResponse({ data }, requestId);
  } catch (error) {
    console.error(`[${requestId}] Auto blog generation error:`, error);
    return createErrorResponse(error instanceof Error ? error.message : String(error), 500, requestId);
  }
});
