import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Company, Job } from "./useJobs";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

export function useCompanyJobs(companyId: string) {
  return useQuery({
    queryKey: ["companyJobs", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(`*, companies(*)`)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyData: {
      name: string;
      description?: string;
      logo_url?: string;
      location?: string;
      industry?: string;
      company_size?: string;
      website?: string;
      culture_values?: string[];
      work_environment?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company profile created!");
    },
    onError: (error) => {
      toast.error("Failed to create company: " + error.message);
    },
  });
}

export function useUpdateCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...companyData
    }: {
      id: string;
      name?: string;
      description?: string;
      logo_url?: string;
      location?: string;
      industry?: string;
      company_size?: string;
      website?: string;
      culture_values?: string[];
      work_environment?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .update(companyData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", data.id] });
      toast.success("Company profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to update company: " + error.message);
    },
  });
}

export function useCreateJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: {
      company_id: string;
      title: string;
      description: string;
      requirements?: string[];
      responsibilities?: string[];
      location?: string;
      job_type: string;
      experience_level: string;
      salary_min?: number;
      salary_max?: number;
      salary_currency?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          ...jobData,
          posted_by: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["companyJobs", data.company_id] });
      toast.success("Job posted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to post job: " + error.message);
    },
  });
}

export function useUpdateJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...jobData
    }: {
      id: string;
      title?: string;
      description?: string;
      requirements?: string[];
      responsibilities?: string[];
      location?: string;
      job_type?: string;
      experience_level?: string;
      salary_min?: number;
      salary_max?: number;
      is_active?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("jobs")
        .update(jobData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job updated!");
    },
    onError: (error) => {
      toast.error("Failed to update job: " + error.message);
    },
  });
}
