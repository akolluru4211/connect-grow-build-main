/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logoUrl = "https://scwliaddydtnadqvkahk.supabase.co/storage/v1/object/public/email-assets/edworld-logo.png";

const features = [
  { icon: "🎯", title: "AI Resume Builder & ATS Checker", description: "Build professional resumes with AI-powered content generation, tailored to specific job descriptions. Our ATS Health Checker ensures your resume passes automated screening systems.", link: "/resume" },
  { icon: "🤖", title: "AI Mock Interview Simulator", description: "Practice interviews with AI-generated questions based on your target role and experience. Get instant feedback on your answers with improvement suggestions.", link: "/mock-interview" },
  { icon: "💼", title: "Smart Job & Internship Matching", description: "Our AI analyzes your skills, experience, and preferences to match you with the most relevant jobs and internships. Get real-time notifications for new matches.", link: "/job-recommendations" },
  { icon: "📚", title: "AI Career Counselor", description: "Chat with our AI career counselor for personalized guidance on career paths, skill development, and industry insights tailored to your goals.", link: "/career-counseling" },
  { icon: "🎓", title: "Courses & Skill Assessments", description: "Access curated courses across multiple domains. Take skill assessments to validate your knowledge and earn badges that showcase your expertise.", link: "/courses" },
  { icon: "💡", title: "AI Project Idea Generator", description: "Get personalized project ideas based on your branch (CSE, ECE, etc.), semester, and interests — complete with tech stacks, roadmaps, and resource links.", link: "/project-ideas" },
  { icon: "📄", title: "AI Research Paper Summarizer", description: "Paste any research paper and get structured summaries, key findings, methodology breakdowns, and even ELI5 explanations instantly.", link: "/paper-summarizer" },
  { icon: "📊", title: "AI Presentation Generator", description: "Convert your notes into professional slide decks with themes, speaker notes, and PDF export. Preview slides in-app with fullscreen mode.", link: "/presentation-generator" },
  { icon: "✍️", title: "AI Cover Letter Writer", description: "Generate tailored cover letters for any job posting. Our AI crafts compelling narratives highlighting your relevant experience and skills.", link: "/cover-letter" },
  { icon: "🗺️", title: "AI Learning Roadmap Creator", description: "Get personalized learning roadmaps for any skill or career path — with milestones, timelines, and curated resources.", link: "/roadmap-creator" },
  { icon: "🌐", title: "Professional Networking", description: "Connect with peers, mentors, and industry professionals. Send connection requests, follow thought leaders, and grow your professional network.", link: "/network" },
  { icon: "📝", title: "Blog & Knowledge Sharing", description: "Write and share articles, tutorials, and insights. Engage with the community through likes, comments, and social sharing.", link: "/blogs" },
  { icon: "🏆", title: "Gamification & Achievements", description: "Earn points, badges, and climb the leaderboard as you learn, network, and grow. Track your streaks and compete with peers.", link: "/achievements" },
  { icon: "💬", title: "Real-time Messaging", description: "Chat with connections in real-time with encrypted messaging. Stay connected and collaborate on projects seamlessly.", link: "/messages" },
  { icon: "📅", title: "Events & Job Fairs", description: "Discover campus events, virtual job fairs, workshops, and hackathons. RSVP and never miss an opportunity.", link: "/events" },
  { icon: "🎮", title: "Educational Games", description: "Learn while having fun with coding challenges, quizzes, memory games, word scrambles, and more!", link: "/games" },
];

const buildEmailHTML = (userName: string, greeting: string, cta: string, ctaDescription: string, siteUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 32px; text-align: center;">
      <img src="${logoUrl}" alt="Edworld" style="width: 160px; height: auto; margin-bottom: 16px;" />
      <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 8px 0; font-weight: 700;">
        Discover Everything EdWorld Has to Offer! 🚀
      </h1>
      <p style="color: #e0e7ff; font-size: 15px; margin: 0;">
        Your all-in-one career &amp; learning platform
      </p>
    </div>
    <div style="padding: 32px 32px 16px 32px;">
      <p style="font-size: 16px; color: #18181b; margin: 0 0 8px 0;">
        Hi ${userName || "there"} 👋,
      </p>
      <p style="font-size: 15px; color: #3f3f46; margin: 0; line-height: 1.6;">
        ${greeting || "We've been building powerful AI-driven tools to supercharge your career and learning journey. Here's everything you can do on EdWorld — all <strong>100% free</strong> for students!"}
      </p>
    </div>
    <div style="padding: 16px 32px 32px 32px;">
      ${features.map(f => `
        <div style="border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin-bottom: 12px;">
          <div style="font-size: 28px; margin-bottom: 8px;">${f.icon}</div>
          <h3 style="font-size: 16px; color: #18181b; margin: 0 0 6px 0; font-weight: 600;">${f.title}</h3>
          <p style="font-size: 13px; color: #52525b; margin: 0 0 12px 0; line-height: 1.5;">${f.description}</p>
          <a href="${siteUrl}${f.link}" 
             style="display: inline-block; background: #2563eb; color: #ffffff; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">
            Try Now →
          </a>
        </div>
      `).join("")}
    </div>
    <div style="background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #e4e4e7;">
      <h2 style="font-size: 20px; color: #18181b; margin: 0 0 12px 0;">${cta || "Ready to level up? 🎯"}</h2>
      <p style="font-size: 14px; color: #52525b; margin: 0 0 20px 0;">
        ${ctaDescription || "Log in now and explore all these features — built for students, powered by AI."}
      </p>
      <a href="${siteUrl}/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    <div style="padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
      <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
        © ${new Date().getFullYear()} EDWORLD CO. — Empowering students, one feature at a time.
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured. Missing RESEND_API_KEY." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = Deno.env.get("SITE_URL") || "https://edworldco.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customSubject = "🚀 Discover All the Powerful Features on EdWorld!";
    let customGreeting = "";
    let customCta = "";
    let customCtaDescription = "";
    try {
      const body = await req.json();
      if (body.subject) customSubject = body.subject;
      if (body.greeting) customGreeting = body.greeting;
      if (body.cta) customCta = body.cta;
      if (body.ctaDescription) customCtaDescription = body.ctaDescription;
    } catch (_) { /* use defaults */ }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name");

    if (profilesError || !profiles) {
      throw new Error("Failed to fetch profiles: " + profilesError?.message);
    }

    const usersWithEmail = profiles.filter((p: any) => p.email);
    console.log(`Sending feature announcement to ${usersWithEmail.length} users`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < usersWithEmail.length; i += 10) {
      const batch = usersWithEmail.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(async (profile: any) => {
          const { data: settings } = await supabase
            .from("user_settings")
            .select("email_notifications")
            .eq("user_id", profile.id)
            .maybeSingle();

          if (settings?.email_notifications === false) {
            console.log(`Skipping ${profile.email} - notifications disabled`);
            return { skipped: true };
          }

          const emailResponse = await resend.emails.send({
            from: "EDWORLD CO. <onboarding@resend.dev>",
            to: [profile.email!],
            subject: customSubject,
            html: buildEmailHTML(profile.full_name || "", customGreeting, customCta, customCtaDescription, siteUrl),
          });

          await supabase.from("email_notifications").insert({
            user_id: profile.id,
            email_type: "feature_announcement",
            recipient_email: profile.email!,
            subject: customSubject,
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          return emailResponse;
        })
      );

      results.forEach((r: any, idx: number) => {
        if (r.status === "fulfilled" && !(r.value as any)?.skipped) {
          sent++;
        } else if (r.status === "rejected") {
          failed++;
          errors.push(`${batch[idx].email}: ${r.reason}`);
        }
      });

      if (i + 10 < usersWithEmail.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Feature announcement sent: ${sent} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: usersWithEmail.length, errors: errors.slice(0, 5) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in feature-announcement:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
