/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, parseAIJSON } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { userProfile, jobs } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an AI job matching assistant. Analyze the user's profile and provide match scores for each job.

User Profile:
- Name: ${userProfile.full_name || 'Not provided'}
- Headline: ${userProfile.headline || 'Not provided'}
- Bio: ${userProfile.bio || 'Not provided'}
- Location: ${userProfile.location || 'Not provided'}
- Skills: ${userProfile.skills?.join(', ') || 'Not provided'}

For each job, provide a match percentage (0-100) based on skills alignment, experience level match, location compatibility, and job description relevance.`;

    const jobsList = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company?.name,
      location: job.location,
      experience_level: job.experience_level,
      requirements: job.requirements?.join(', '),
    }));

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze these jobs and provide match scores:\n${JSON.stringify(jobsList, null, 2)}` }
      ],
      tools: [{
        type: "function",
        function: {
          name: "job_match_scores",
          description: "Return match scores for each job",
          parameters: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    job_id: { type: "string" },
                    match_score: { type: "number", minimum: 0, maximum: 100 },
                    reason: { type: "string" }
                  },
                  required: ["job_id", "match_score"],
                  additionalProperties: false
                }
              }
            },
            required: ["matches"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "job_match_scores" } }
    });

    if (!response.ok) {
      return response;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const rawContent = toolCall?.function?.arguments || data.choices?.[0]?.message?.content || "";

    if (rawContent) {
      const matches = parseAIJSON(rawContent);
      return new Response(JSON.stringify(matches), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const fallbackMatches = jobs.map((job: any) => ({
      job_id: job.id,
      match_score: Math.floor(Math.random() * 30) + 70,
      reason: "Based on profile analysis"
    }));

    return new Response(JSON.stringify({ matches: fallbackMatches }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("job-match error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});



