import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { escapeSearchQuery } from "@/lib/searchUtils";

export interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  location: string | null;
  industry: string | null;
  company_size: string | null;
  culture_values: string[] | null;
  work_environment: string | null;
}

export interface Job {
  id: string;
  company_id: string | null;
  title: string;
  description: string;
  requirements: string[] | null;
  responsibilities: string[] | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  is_active: boolean | null;
  created_at: string;
  application_url: string | null;
  companies: Company | null;
  match_score?: number;
}

export interface JobFilters {
  search?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select(`
          *,
          companies (*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (filters?.search) {
        const escapedSearch = escapeSearchQuery(filters.search);
        query = query.or(`title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`);
      }
      if (filters?.location) {
        const escapedLocation = escapeSearchQuery(filters.location);
        query = query.ilike("location", `%${escapedLocation}%`);
      }
      if (filters?.jobType) {
        query = query.eq("job_type", filters.jobType);
      }
      if (filters?.experienceLevel) {
        query = query.eq("experience_level", filters.experienceLevel);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let results = data as Job[];
      
      if (results.length === 0) {
        // Fallback mock jobs if none exist in the database
        results = [
          {
            id: "mock-job-1",
            company_id: "mock-company-1",
            title: "Frontend Engineer Intern",
            description: "Join our core team to build beautiful React interfaces.",
            requirements: ["React", "TypeScript", "Tailwind CSS"],
            responsibilities: ["Build UI components", "Optimize bundle size"],
            location: "Remote",
            job_type: "internship",
            experience_level: "entry",
            salary_min: 30000,
            salary_max: 40000,
            salary_currency: "$",
            is_active: true,
            created_at: new Date().toISOString(),
            application_url: "https://example.com/apply",
            companies: {
              id: "mock-company-1",
              name: "TechNova",
              description: "A fast-growing tech startup",
              logo_url: null,
              location: "San Francisco, CA",
              industry: "Software",
              company_size: "10-50",
              culture_values: ["Innovation", "Collaboration"],
              work_environment: "Remote first"
            }
          },
          {
            id: "mock-job-2",
            company_id: "mock-company-2",
            title: "Software Engineer",
            description: "Developer scalable backend Go and Node.js systems.",
            requirements: ["Node.js", "Go", "PostgreSQL"],
            responsibilities: ["Design APIs", "Database optimization"],
            location: "New York, NY",
            job_type: "full-time",
            experience_level: "mid",
            salary_min: 100000,
            salary_max: 130000,
            salary_currency: "$",
            is_active: true,
            created_at: new Date().toISOString(),
            application_url: "https://example.com/apply2",
            companies: {
              id: "mock-company-2",
              name: "ScaleSystems",
              description: "Enterprise software solutions",
              logo_url: null,
              location: "New York, NY",
              industry: "Enterprise",
              company_size: "100-500",
              culture_values: ["Excellence", "Speed"],
              work_environment: "Hybrid"
            }
          }
        ];
      }

      // Re-apply client-side filters on mock data if needed
      if (filters?.jobType) {
        results = results.filter(j => j.job_type === filters.jobType);
      }
      if (filters?.experienceLevel) {
        results = results.filter(j => j.experience_level === filters.experienceLevel);
      }
      
      return results;
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          companies (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!id,
  });
}

export function useSavedJobs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["savedJobs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(s => s.job_id);
    },
    enabled: !!user?.id,
  });
}

export function useSaveJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, save }: { jobId: string; save: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (save) {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ job_id: jobId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("job_id", jobId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, { save }) => {
      queryClient.invalidateQueries({ queryKey: ["savedJobs"] });
      toast.success(save ? "Job saved!" : "Job removed from saved");
    },
    onError: (error) => {
      toast.error("Failed to save job: " + error.message);
    },
  });
}

export function useApplyToJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, coverLetter }: { jobId: string; coverLetter?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("job_applications")
        .insert({
          job_id: jobId,
          user_id: user.id,
          cover_letter: coverLetter,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobApplications"] });
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      if (error.message.includes("duplicate")) {
        toast.error("You've already applied to this job");
      } else {
        toast.error("Failed to apply: " + error.message);
      }
    },
  });
}

export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["jobApplications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("job_applications")
        .select("job_id, status, applied_at")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
