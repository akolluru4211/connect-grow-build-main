import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { jobTitle, jobDescription, companyName, userProfile, tone } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an expert career coach and professional cover letter writer. 
Create compelling, personalized cover letters that highlight the candidate's relevant experience and enthusiasm for the role.
The cover letter should be professional yet personable, and tailored to the specific job and company.`;

    const userPrompt = `Create a personalized cover letter for the following:

Job Title: ${jobTitle}
Company: ${companyName || 'the company'}
Job Description: ${jobDescription}

Candidate Profile:
- Name: ${userProfile?.name || 'the candidate'}
- Current Role: ${userProfile?.headline || 'Not specified'}
- Bio: ${userProfile?.bio || 'Not specified'}
- Skills: ${userProfile?.skills?.join(', ') || 'Not specified'}
- Experience Summary: ${userProfile?.experience || 'Not specified'}

Tone: ${tone || 'professional'}

Generate a compelling cover letter that:
1. Opens with an attention-grabbing introduction
2. Highlights relevant experience and skills that match the job requirements
3. Shows enthusiasm for the company and role
4. Includes a strong call to action
5. Is approximately 300-400 words`;

    const toolDef = {
      type: "function",
      function: {
        name: "generate_cover_letter",
        description: "Generate a personalized cover letter",
        parameters: {
          type: "object",
          properties: {
            cover_letter: { type: "string" },
            key_highlights: { type: "array", items: { type: "string" } },
            customization_tips: { type: "array", items: { type: "string" } },
            word_count: { type: "number" }
          },
          required: ["cover_letter", "key_highlights", "customization_tips", "word_count"]
        }
      }
    };

    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [toolDef],
      tool_choice: { type: "function", function: { name: "generate_cover_letter" } }
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI request failed");
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "AI request failed");

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No response from AI");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    console.error("Cover letter generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate cover letter";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


