/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, callAIWithFallback } from "../_shared/ai-utils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create admin client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Service key for admin bypass
    );

    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('roles')
      .eq('id', userData.user.id)
      .single();

    if (!profile?.roles?.includes('admin')) {
      return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403, headers: corsHeaders });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Call Gemini API using shared utility
    const response = await callAIWithFallback(GEMINI_API_KEY, {
      messages: [
        {
          role: "system",
          content: "You are the EdWorld AI Admin Controller. You parse human requests to create Jobs or Internships. You must output raw JSON using function calling. If creating a job, target 'create_job'. If creating an internship, target 'create_internship'."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "execute_admin_action",
            description: "Executes an action in the database based on the human prompt",
            parameters: {
              type: "object",
              properties: {
                action_type: { type: "string", enum: ["create_job", "create_internship", "unknown"] },
                title: { type: "string" },
                company_id: { type: "string", description: "Use a mock UUID like '00000000-0000-0000-0000-000000000000'" },
                location: { type: "string" },
                description: { type: "string" },
                salary_range: { type: "string" },
                stipend: { type: "string" },
                requirements: { type: "array", items: { type: "string" } }
              },
              required: ["action_type", "title", "description"]
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    if (!response.ok) {
      return response; // Handled by utility
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ 
        message: "Gemini could not determine a valid database action from your prompt.",
        raw: aiData.choices?.[0]?.message?.content
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const args = JSON.parse(toolCall.function.arguments);
    let resultMessage = "";

    if (args.action_type === "create_job") {
      const { error: dbError } = await supabaseClient.from("jobs").insert({
        title: args.title,
        company_id: null,
        location: args.location || "Remote",
        description: args.description,
        salary_range: args.salary_range || null,
        requirements: args.requirements || [],
        job_type: "Full-time"
      });
      if (dbError) throw dbError;
      resultMessage = `Successfully created Job: ${args.title}`;
    } else if (args.action_type === "create_internship") {
      const { error: dbError } = await supabaseClient.from("internships").insert({
        title: args.title,
        company_id: null, 
        location: args.location || "Remote",
        description: args.description,
        stipend: args.stipend || "Unpaid",
        requirements: args.requirements || [],
        duration: "3 Months"
      });
      if (dbError) throw dbError;
      resultMessage = `Successfully created Internship: ${args.title}`;
    } else {
      resultMessage = "Action not supported or parsed correctly.";
    }

    return new Response(JSON.stringify({ success: true, message: resultMessage, data: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Gemini Admin Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});

