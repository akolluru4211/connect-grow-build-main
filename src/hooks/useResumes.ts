import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  template: string | null;
  personal_info: Record<string, unknown> | null;
  summary: string | null;
  experience: Array<Record<string, unknown>> | null;
  education: Array<Record<string, unknown>> | null;
  skills: string[] | null;
  certifications: Array<Record<string, unknown>> | null;
  projects: Array<Record<string, unknown>> | null;
  custom_sections: Array<Record<string, unknown>> | null;
  ats_score: number | null;
  is_primary: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeData {
  title: string;
  template?: string;
  personal_info?: {
    full_name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  experience?: Array<{
    company: string;
    title: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    start_date?: string;
    end_date?: string;
    gpa?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    link?: string;
  }>;
  ats_score?: number;
}

export function useResumes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["resumes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Resume[];
    },
    enabled: !!user?.id,
  });
}

export function useResume(id: string) {
  return useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Resume;
    },
    enabled: !!id,
  });
}

export function useCreateResume() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ResumeData) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data: resume, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: data.title,
          template: data.template || "professional",
          personal_info: data.personal_info,
          summary: data.summary,
          experience: data.experience,
          education: data.education,
          skills: data.skills,
          certifications: data.certifications,
          projects: data.projects,
        })
        .select()
        .single();
      if (error) throw error;
      return resume;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume created!");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ResumeData> & { id: string }) => {
      const { error } = await supabase
        .from("resumes")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resume", id] });
      toast.success("Resume updated!");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resumes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function calculateATSScore(resume: ResumeData): number {
  let score = 0;
  const maxScore = 100;

  // Personal info completeness (20 points)
  if (resume.personal_info) {
    const info = resume.personal_info;
    if (info.full_name) score += 5;
    if (info.email) score += 5;
    if (info.phone) score += 5;
    if (info.location) score += 3;
    if (info.linkedin) score += 2;
  }

  // Summary (15 points)
  if (resume.summary && resume.summary.length >= 50) {
    score += 15;
  } else if (resume.summary && resume.summary.length > 0) {
    score += 8;
  }

  // Experience (30 points)
  if (resume.experience && resume.experience.length > 0) {
    score += Math.min(resume.experience.length * 8, 24);
    const hasDescriptions = resume.experience.some(e => e.description && e.description.length > 20);
    if (hasDescriptions) score += 6;
  }

  // Education (15 points)
  if (resume.education && resume.education.length > 0) {
    score += Math.min(resume.education.length * 8, 15);
  }

  // Skills (15 points)
  if (resume.skills && resume.skills.length > 0) {
    score += Math.min(resume.skills.length * 2, 15);
  }

  // Projects/Certifications (5 points)
  if ((resume.projects && resume.projects.length > 0) || 
      (resume.certifications && resume.certifications.length > 0)) {
    score += 5;
  }

  return Math.min(score, maxScore);
}
