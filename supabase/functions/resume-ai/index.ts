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
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { type, data, resume, jobDescription, jobTitle } = body;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";
    let toolDef: any = null;

    if (type === "summary") {
      systemPrompt = `You are an expert resume writer. Generate a compelling professional summary based on the user's experience and skills. The summary should be 2-3 sentences, highlighting key achievements and career goals. Make it ATS-friendly with relevant keywords.`;
      userPrompt = `Generate a professional summary for:\nName: ${data.name || "Professional"}\nCurrent Role: ${data.currentRole || "Not specified"}\nYears of Experience: ${data.yearsExperience || "Not specified"}\nKey Skills: ${data.skills?.join(", ") || "Not specified"}\nIndustry: ${data.industry || "Not specified"}`;
      toolDef = { type: "function", function: { name: "generate_summary", description: "Generate a professional summary", parameters: { type: "object", properties: { summary: { type: "string" }, keywords: { type: "array", items: { type: "string" } } }, required: ["summary", "keywords"], additionalProperties: false } } };
    } else if (type === "experience") {
      systemPrompt = `You are an expert resume writer. Improve the job description bullet points to be more impactful, using action verbs and quantifiable achievements where possible. Keep the content concise and ATS-friendly.`;
      userPrompt = `Improve this job experience description:\nJob Title: ${data.title}\nCompany: ${data.company}\nCurrent Description: ${data.description || "No description provided"}\nKey Responsibilities: ${data.responsibilities || "Not specified"}`;
      toolDef = { type: "function", function: { name: "improve_experience", description: "Improve job experience description", parameters: { type: "object", properties: { bullets: { type: "array", items: { type: "string" } }, impact_metrics: { type: "array", items: { type: "string" } } }, required: ["bullets"], additionalProperties: false } } };
    } else if (type === "skills") {
      systemPrompt = `You are an expert resume writer. Suggest relevant skills based on the user's experience and target job.`;
      userPrompt = `Suggest skills for:\nCurrent Skills: ${data.currentSkills?.join(", ") || "None specified"}\nJob Title: ${data.targetRole || "Not specified"}\nIndustry: ${data.industry || "Not specified"}\nExperience: ${data.experience || "Not specified"}`;
      toolDef = { type: "function", function: { name: "suggest_skills", description: "Suggest relevant skills", parameters: { type: "object", properties: { technical_skills: { type: "array", items: { type: "string" } }, soft_skills: { type: "array", items: { type: "string" } }, certifications: { type: "array", items: { type: "string" } } }, required: ["technical_skills", "soft_skills"], additionalProperties: false } } };
    } else if (type === "tailor") {
      systemPrompt = `You are an expert resume optimization specialist. Analyze the resume against the job description and provide specific tailoring recommendations.`;
      userPrompt = `Tailor this resume for the job:\n\nRESUME:\nName: ${resume?.personal_info?.full_name || "Candidate"}\nSummary: ${resume?.summary || "No summary"}\nExperience: ${resume?.experience?.map((e: any) => `${e.title} at ${e.company}: ${e.description || ""}`).join("; ") || "None"}\nSkills: ${resume?.skills?.join(", ") || "None"}\nEducation: ${resume?.education?.map((e: any) => `${e.degree} from ${e.institution}`).join("; ") || "None"}\n\nJOB DESCRIPTION:\nTitle: ${jobTitle || "Not specified"}\nDescription: ${jobDescription || "No description"}`;
      toolDef = { type: "function", function: { name: "tailor_resume", description: "Provide tailored resume recommendations", parameters: { type: "object", properties: { match_score: { type: "number" }, keyword_matches: { type: "array", items: { type: "string" } }, tailored_summary: { type: "string" }, suggested_skills: { type: "array", items: { type: "string" } }, improvement_tips: { type: "array", items: { type: "string" } } }, required: ["match_score", "keyword_matches", "tailored_summary", "suggested_skills", "improvement_tips"], additionalProperties: false } } };
    } else if (type === "generate_from_job") {
      systemPrompt = `You are an expert resume writer. Generate a complete, ATS-optimized resume based on the job description provided.`;
      userPrompt = `Generate a tailored resume for this job:\n\nUSER PROFILE:\nName: ${data?.name || "Professional"}\nEmail: ${data?.email || ""}\nPhone: ${data?.phone || ""}\nLocation: ${data?.location || ""}\nCurrent Experience: ${data?.experience?.map((e: any) => `${e.title} at ${e.company}`).join("; ") || "Not provided"}\nCurrent Education: ${data?.education?.map((e: any) => `${e.degree} from ${e.institution}`).join("; ") || "Not provided"}\nCurrent Skills: ${data?.skills?.join(", ") || "Not provided"}\n\nJOB DESCRIPTION:\nTitle: ${jobTitle || "Not specified"}\n${jobDescription || "No description provided"}`;
      toolDef = { type: "function", function: { name: "generate_job_resume", description: "Generate a complete tailored resume from job description", parameters: { type: "object", properties: { professional_summary: { type: "string" }, keywords: { type: "array", items: { type: "string" } }, required_skills: { type: "array", items: { type: "string" } }, matching_skills: { type: "array", items: { type: "string" } }, skills_to_add: { type: "array", items: { type: "string" } }, experience_bullets: { type: "array", items: { type: "string" } }, match_score: { type: "number" }, recommendations: { type: "array", items: { type: "string" } } }, required: ["professional_summary", "keywords", "required_skills", "match_score"], additionalProperties: false } } };
    } else {
      throw new Error("Invalid request type");
    }

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [toolDef],
      tool_choice: { type: "function", function: { name: toolDef.function.name } }
    });

    if (!response.ok) {
      return response; // callAIWithFallback already returns a structured error Response
    }

    const aiData = await response.json();
    let result;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const content = aiData.choices?.[0]?.message?.content || "";

    try {
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        result = parseAIJSON(content);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // If it's just a summary and not structured JSON, we can return it as a simple object
      if (type === "summary" && content) {
        result = { summary: content, keywords: [] };
      } else {
        throw new Error("Invalid AI response format: " + content.substring(0, 100));
      }
    }

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("resume-ai error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});


