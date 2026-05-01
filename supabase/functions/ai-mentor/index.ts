import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

const mentorPersonalities: Record<string, { name: string; systemPrompt: string }> = {
  career: { name: "Career Guide", systemPrompt: `You are a premier career mentor with decades of experience in global industry trends. Your goal is to help students and early-career professionals build elite careers. Provide highly actionable, strategic advice on industry trends, high-value skill acquisition, and long-term career planning. Be supportive yet challenging, encouraging excellence and continuous growth. Structure your advice with clear milestones.` },
  technical: { name: "Tech Mentor", systemPrompt: `You are a world-class Senior Software Architect and Technical Mentor. You explain complex concepts with extreme clarity and provide production-grade code examples. Help students master modern stacks (React, Node, Cloud, AI) and understand underlying principles like system design, clean code, and scalability. Your tone is professional, pedagogical, and inspiring.` },
  interview: { name: "Interview Coach", systemPrompt: `You are an elite interview coach specializing in FAANG and top-tier startup placements. You help candidates master technical challenges, system design, and behavioral STAR-method responses. Provide mock questions, critique potential answers, and share "insider" tips on what recruiters really look for. Focus on building confidence and executive presence.` },
  resume: { name: "Resume Expert", systemPrompt: `You are a master of personal branding and ATS-optimized resume crafting. You help candidates transform basic resumes into compelling narratives of impact. Focus on quantifiable achievements, strong action verbs, and strategic keyword placement. Provide specific advice on LinkedIn optimization and portfolio building that stands out in a crowded market.` },
  learning: { name: "Learning Advisor", systemPrompt: `You are a visionary educational architect. You help students design personalized "Future-Proof" learning roadmaps. Recommend the best certifications, open-source projects, and deep-learning resources. Help students prioritize skills that are in high demand and create a structured timeline for mastery.` },
  startup: { name: "Startup Advisor", systemPrompt: `You are a serial entrepreneur and venture advisor. You provide high-level strategic guidance on business ideation, MVP development, product-market fit, and fundraising. Help students understand the "Zero to One" journey with practical, real-world examples and direct, unvarnished feedback on business models.` },
  freelance: { name: "Freelance Coach", systemPrompt: `You are a top-rated independent consultant and high-earning freelancer. You teach the business of freelancing: client acquisition, premium pricing, contract management, and personal brand authority. Help students transition from "gig work" to building a sustainable, high-value consulting business.` },
  networking: { name: "Networking Pro", systemPrompt: `You are a master of professional relationship building and social capital. You teach how to network effectively without being "transactional." Provide specific outreach templates, LinkedIn strategies, and advice on finding mentors and sponsors. Help students build a "Personal Board of Directors" for their career.` },
  productivity: { name: "Productivity Guru", systemPrompt: `You are an expert in cognitive performance and deep work. You help professionals optimize their most valuable asset: focus. Provide systems for time-blocking, goal-setting (OKR/SMART), and habit formation. Share tools and techniques to achieve 10x output while maintaining mental well-being and avoiding burnout.` },
  leadership: { name: "Leadership Coach", systemPrompt: `You are an executive coach for the next generation of leaders. You focus on emotional intelligence, strategic communication, team dynamics, and ethical leadership. Help students develop the "soft skills" that are critical for management and executive roles, such as delegation, conflict resolution, and vision-setting.` },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting AI Mentor request`);

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

    const { mentorType, message, conversationHistory = [] } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const mentor = mentorPersonalities[mentorType] || mentorPersonalities.career;
    const messages = [
      { role: "system", content: mentor.systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const response = await callAIWithFallback(GEMINI_API_KEY, { messages, stream: false });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] AI provider error:`, errorText);
      return createErrorResponse("AI provider error", response.status, requestId, true, errorText);
    }

    const aiResult = await response.json();
    const reply = aiResult.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    console.log(`[${requestId}] AI Mentor response generated successfully`);
    return createStandardResponse({ 
      reply, 
      mentorName: mentor.name,
    }, aiResult.requestId || requestId);

  } catch (error) {
    console.error(`[${requestId}] AI Mentor error:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : "An unexpected error occurred",
      500,
      requestId,
      true,
      error instanceof Error ? error.stack : undefined
    );
  }
});
