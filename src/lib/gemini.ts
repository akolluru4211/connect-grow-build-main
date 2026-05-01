import { supabase } from "@/integrations/supabase/client";

/**
 * Safely invokes a Supabase Edge Function and handles errors.
 * Extracts detailed error messages from the response body if available.
 */
/**
 * Safely invokes a Supabase Edge Function and handles errors.
 * Extracts detailed error messages from the response body if available.
 */
/**
 * Safely invokes a Supabase Edge Function and handles errors with exponential backoff retries.
 */
export async function safeInvoke<T = any>(
  functionName: string, 
  body: any, 
  maxRetries = 2
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoff = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoff));
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        console.error(`Edge Function Attempt ${attempt + 1} Error (${functionName}):`, error);
        
        let isRetryable = false;
        let errorMessage = "The AI service encountered an issue. Please try again.";
        
        if (error.name === 'FunctionsHttpError') {
          const status = error.context.status;
          
          // Map common error codes to student-friendly language
          if (status === 402) {
            errorMessage = "AI credits for the day have been exhausted. Please try again tomorrow.";
          } else if (status === 429) {
            errorMessage = "The AI is currently receiving too many requests. Retrying...";
            isRetryable = true;
          } else if (status === 500 || status === 503 || status === 504) {
            errorMessage = "Our AI engine is busy. Retrying...";
            isRetryable = true;
          } else if (status === 404) {
            errorMessage = "The AI service is temporarily unavailable.";
          }

          try {
            const responseBody = await error.context.json();
            errorMessage = responseBody.error || responseBody.message || errorMessage;
          } catch (e) {
            // Fallback to established message
          }
        } else {
          // Network errors or generic failures
          isRetryable = true;
          errorMessage = error.message || errorMessage;
        }

        if (isRetryable && attempt < maxRetries) {
          lastError = new Error(errorMessage);
          continue;
        }

        if (errorMessage.includes("non-2xx error")) {
          errorMessage = "AI Connectivity Issue: The service is currently unstable. Please try again.";
        }

        throw new Error(errorMessage);
      }

      // Handle standardized error structure from our updated Edge Functions
      if (data && data.success === false) {
        // If the AI model itself failed, we might want to retry as well if it's a transient model error
        if (data.retryable && attempt < maxRetries) {
          continue;
        }
        throw new Error(data.error || "The AI returned an error structure without a message.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error("Failed after multiple attempts");
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

