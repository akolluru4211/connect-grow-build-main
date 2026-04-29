/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { branch, semester, difficulty, interests, projectType, teamSize } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        {
          role: "system",
          content: `You are an expert academic project advisor for engineering and science students in India. Generate creative, feasible, and industry-relevant project ideas that can impress in college submissions, hackathons, and job interviews. Include real-world applications and implementation guidance.`,
        },
        {
          role: "user",
          content: `Generate 5 unique ${projectType || "final year"} project ideas for a ${branch} student${semester ? ` in semester ${semester}` : ""}${difficulty ? ` at ${difficulty} level` : ""}${interests ? ` interested in ${interests}` : ""}${teamSize ? ` for a team of ${teamSize}` : ""}.

For each project, provide comprehensive details:
- title: Clear, professional project title
- description: 3-4 sentence description with real-world application
- techStack: Array of specific technologies/tools/frameworks needed
- difficulty: "Beginner", "Intermediate", or "Advanced"
- duration: Estimated completion time
- skills: Array of skills the student will learn
- implementationSteps: Array of 5-6 high-level steps to build it
- realWorldUse: One sentence on how this applies in industry
- githubSearchQuery: A search query to find similar repos on GitHub
- youtubeSearchQuery: A search query to find tutorials on YouTube
- estimatedCost: "Free", "Low (<â‚¹500)", or "Moderate (â‚¹500-2000)"
- uniqueSellingPoint: What makes this project stand out`
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_projects",
            description: "Return project ideas",
            parameters: {
              type: "object",
              properties: {
                projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      techStack: { type: "array", items: { type: "string" } },
                      difficulty: { type: "string" },
                      duration: { type: "string" },
                      skills: { type: "array", items: { type: "string" } },
                      implementationSteps: { type: "array", items: { type: "string" } },
                      realWorldUse: { type: "string" },
                      githubSearchQuery: { type: "string" },
                      youtubeSearchQuery: { type: "string" },
                      estimatedCost: { type: "string" },
                      uniqueSellingPoint: { type: "string" },
                    },
                    required: ["title", "description", "techStack", "difficulty", "duration", "skills", "implementationSteps", "realWorldUse", "githubSearchQuery", "youtubeSearchQuery", "estimatedCost", "uniqueSellingPoint"],
                  },
                },
              },
              required: ["projects"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_projects" } },
    });

    if (!response.ok) {
      return response;
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { projects: [] };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("project-ideas error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});



