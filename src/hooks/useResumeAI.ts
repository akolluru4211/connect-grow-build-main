import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateJSON } from "@/lib/gemini";

interface SummaryInput {
  name?: string;
  currentRole?: string;
  yearsExperience?: string;
  skills?: string[];
  industry?: string;
}

interface ExperienceInput {
  title: string;
  company: string;
  description?: string;
  responsibilities?: string;
}

interface SkillsInput {
  currentSkills?: string[];
  targetRole?: string;
  industry?: string;
  experience?: string;
}

interface SummaryResult {
  summary: string;
  keywords: string[];
}

interface ExperienceResult {
  bullets: string[];
  impact_metrics?: string[];
}

interface SkillsResult {
  technical_skills: string[];
  soft_skills: string[];
  certifications?: string[];
}

export function useGenerateSummary() {
  return useMutation({
    mutationFn: async (data: SummaryInput): Promise<SummaryResult> => {
      const prompt = `As a professional resume writer, generate a compelling, high-impact professional summary and a list of relevant keywords based on the following details:
      Name: ${data.name || 'N/A'}
      Current Role: ${data.currentRole || 'N/A'}
      Years of Experience: ${data.yearsExperience || 'N/A'}
      Skills: ${data.skills?.join(', ') || 'N/A'}
      Industry: ${data.industry || 'N/A'}

      The summary should be about 3-4 sentences, highlighting achievements and key value propositions.
      
      Respond with a JSON object in this format:
      {
        "summary": "Your professional summary text here",
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
      }`;

      return await generateJSON<SummaryResult>(prompt);
    },
    onError: (error: any) => {
      toast.error("Failed to generate summary: " + (error.message || "Unknown error"));
    },
  });
}

export function useImproveExperience() {
  return useMutation({
    mutationFn: async (data: ExperienceInput): Promise<ExperienceResult> => {
      const prompt = `As an expert career coach, improve the following job experience description into high-impact, result-oriented bullet points using the STAR method (Situation, Task, Action, Result).
      Job Title: ${data.title}
      Company: ${data.company}
      Current Description: ${data.description || 'N/A'}
      Responsibilities: ${data.responsibilities || 'N/A'}

      Focus on quantifiable achievements and strong action verbs.
      
      Respond with a JSON object in this format:
      {
        "bullets": ["Improved bullet point 1", "Improved bullet point 2", ...],
        "impact_metrics": ["Quantifiable metric 1 (e.g., Increased sales by 20%)", "Quantifiable metric 2", ...]
      }`;

      return await generateJSON<ExperienceResult>(prompt);
    },
    onError: (error: any) => {
      toast.error("Failed to improve experience: " + (error.message || "Unknown error"));
    },
  });
}

export function useSuggestSkills() {
  return useMutation({
    mutationFn: async (data: SkillsInput): Promise<SkillsResult> => {
      const prompt = `Based on the following profile and target role, suggest the most relevant technical and soft skills, along with potential certifications to enhance the candidate's resume.
      Current Skills: ${data.currentSkills?.join(', ') || 'N/A'}
      Target Role: ${data.targetRole || 'N/A'}
      Industry: ${data.industry || 'N/A'}
      Experience Summary: ${data.experience || 'N/A'}

      Respond with a JSON object in this format:
      {
        "technical_skills": ["Skill 1", "Skill 2", ...],
        "soft_skills": ["Skill 1", "Skill 2", ...],
        "certifications": ["Certification 1", "Certification 2", ...]
      }`;

      return await generateJSON<SkillsResult>(prompt);
    },
    onError: (error: any) => {
      toast.error("Failed to suggest skills: " + (error.message || "Unknown error"));
    },
  });
}

