import { supabase } from "@/integrations/supabase/client";

/**
 * Safely invokes a Supabase Edge Function and handles errors.
 * Extracts detailed error messages from the response body if available.
 */
export async function safeInvoke<T = any>(functionName: string, body: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    console.error(`Edge Function Error (${functionName}):`, error);
    
    // Attempt to extract detailed error message from the response body
    // In newer supabase-js, the error object might contain the response
    let errorMessage = "The AI service encountered an issue. Please try again.";
    
    if (error.name === 'FunctionsHttpError') {
      try {
        // FunctionsHttpError has a context property which is the Response
        const responseBody = await error.context.json();
        errorMessage = responseBody.error || responseBody.message || errorMessage;
      } catch (e) {
        // Fallback to generic message if parsing fails
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    if (errorMessage.includes("non-2xx error")) {
      errorMessage = "AI service returned an error. Please try again later.";
    }

    throw new Error(errorMessage);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function generateContent(prompt: string) {
  try {
    const data = await safeInvoke('gemini-proxy', { prompt });
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  try {
    const data = await safeInvoke('gemini-proxy', { 
      prompt,
      jsonMode: true
    });

    const content = data.choices?.[0]?.message?.content || "";
    try {
      return JSON.parse(content) as T;
    } catch (e) {
      // Fallback for cases where Gemini doesn't return clean JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]) as T;
      throw new Error("Failed to parse JSON from Gemini response");
    }
  } catch (error) {
    console.error("Gemini JSON Generation Error:", error);
    throw error;
  }
}

export async function generateStream(prompt: string, onUpdate: (text: string) => void) {
  try {
    // Note: Supabase Functions standard invocation doesn't support streaming well yet.
    // We'll fall back to a standard call but simulate the "update" behavior for UX consistency.
    const content = await generateContent(prompt);
    onUpdate(content);
    return content;
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
}

export interface DiscoveredOpportunity {
  title: string;
  organization: string;
  type: "internship" | "job";
  description: string;
  location: string;
  deadline?: string;
  stipend?: string;
  duration?: string;
  application_link: string;
  tags: string[];
}

export async function discoverOpportunities(type: "internship" | "job", industry: string = "Technology"): Promise<DiscoveredOpportunity[]> {
  const prompt = `Act as a real-time career opportunity scout. Find 5-10 highly relevant and RECENT ${type} opportunities in the ${industry} industry. 
  Focus on major companies and reputable startups. Ensure the information is as up-to-date as possible (simulated based on your knowledge of 2024-2025 hiring cycles).
  
  For each opportunity, provide:
  - title (the specific role name)
  - organization (the company name)
  - type (either "internship" or "job")
  - description (a concise 2-3 sentence summary)
  - location (city, country or 'Remote')
  - deadline (if known, in YYYY-MM-DD format)
  - stipend/salary (estimated or official)
  - duration (for internships, e.g., '12 weeks')
  - application_link (a direct link to the company's career page or specific job listing if known)
  - tags (3-5 relevant skills or categories)

  Respond with a JSON array of objects in this format:
  [
    {
      "title": "...",
      "organization": "...",
      "type": "...",
      "description": "...",
      "location": "...",
      "deadline": "...",
      "stipend": "...",
      "duration": "...",
      "application_link": "...",
      "tags": ["...", "..."]
    }
  ]`;

  return await generateJSON<DiscoveredOpportunity[]>(prompt);
}

