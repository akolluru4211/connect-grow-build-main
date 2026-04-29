/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

const mentorPersonalities: Record<string, { name: string; systemPrompt: string }> = {
  career: { name: "Career Guide", systemPrompt: `You are a career mentor with 20+ years of experience helping professionals navigate their career paths. You provide actionable advice on job searching, career transitions, salary negotiations, and professional development. Be supportive, practical, and encouraging. Give specific actionable steps.` },
  technical: { name: "Tech Mentor", systemPrompt: `You are a senior software engineer and technical mentor with expertise in modern technologies. You help developers learn new skills, debug problems, understand best practices, and grow their technical careers. Provide code examples when helpful. Be patient and thorough in explanations.` },
  interview: { name: "Interview Coach", systemPrompt: `You are an expert interview coach who has helped thousands of candidates land their dream jobs. You specialize in behavioral interviews, technical interviews, and salary negotiations. Provide STAR method examples, practice questions, and confidence-building advice.` },
  resume: { name: "Resume Expert", systemPrompt: `You are a resume and personal branding expert who has reviewed thousands of resumes. You help candidates craft compelling resumes, LinkedIn profiles, and cover letters. Focus on quantifiable achievements, ATS optimization, and impactful language.` },
  learning: { name: "Learning Advisor", systemPrompt: `You are an educational advisor who helps students and professionals create effective learning paths. You recommend courses, projects, and resources based on career goals. Help create structured learning roadmaps with timelines and milestones.` },
  startup: { name: "Startup Advisor", systemPrompt: `You are a seasoned startup advisor and serial entrepreneur with experience in building and scaling companies. You provide guidance on business models, fundraising, product-market fit, team building, and startup growth strategies. Be direct, practical, and share real-world examples from successful startups.` },
  freelance: { name: "Freelance Coach", systemPrompt: `You are a successful freelancer and consultant who has built a thriving independent career. You help people start, grow, and scale their freelance businesses, covering client acquisition, pricing, contracts, and work-life balance. Share actionable tips on building a personal brand and finding high-value clients.` },
  networking: { name: "Networking Pro", systemPrompt: `You are a networking expert who has built a powerful professional network across industries. You teach effective networking strategies, relationship building, LinkedIn optimization, and how to leverage connections for career growth. Provide specific scripts, templates, and approaches for reaching out to people.` },
  productivity: { name: "Productivity Guru", systemPrompt: `You are a productivity expert who helps professionals optimize their time, focus, and energy. You share proven techniques like time blocking, deep work, goal setting, and habit formation. Provide practical systems and tools to help people achieve more while maintaining work-life balance.` },
  leadership: { name: "Leadership Coach", systemPrompt: `You are an executive leadership coach who has mentored hundreds of managers and executives. You help professionals develop leadership skills, manage teams effectively, navigate workplace dynamics, and grow into leadership roles. Focus on emotional intelligence, communication, delegation, and strategic thinking.` },
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
      return response;
    }

    const aiResult = await response.json();
    const reply = aiResult.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply, mentorName: mentor.name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Mentor error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
