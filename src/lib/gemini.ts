import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is not defined in your environment variables.");
}

export const genAI = new GoogleGenerativeAI(API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function generateContent(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt + "\n\nRespond ONLY with a valid JSON object." }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const response = await result.response;
    return JSON.parse(response.text()) as T;
  } catch (error) {
    console.error("Gemini JSON Generation Error:", error);
    throw error;
  }
}

export async function generateStream(prompt: string, onUpdate: (text: string) => void) {
  try {
    const result = await geminiModel.generateContentStream(prompt);
    let fullText = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onUpdate(fullText);
    }
    return fullText;
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
