import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WorkExperience {
  id: string;
  user_id: string;
  company_name: string;
  title: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useWorkExperience() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["workExperience", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("work_experience")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as WorkExperience[];
    },
    enabled: !!user?.id,
  });

  const addExperience = useMutation({
    mutationFn: async (experience: Omit<WorkExperience, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("work_experience")
        .insert({ ...experience, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workExperience"] });
      toast.success("Experience added");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateExperience = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkExperience> & { id: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("work_experience")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workExperience"] });
      toast.success("Experience updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteExperience = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("work_experience")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workExperience"] });
      toast.success("Experience deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return { experiences, isLoading, addExperience, updateExperience, deleteExperience };
}

export function useEducation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: education = [], isLoading } = useQuery({
    queryKey: ["education", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("education")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as Education[];
    },
    enabled: !!user?.id,
  });

  const addEducation = useMutation({
    mutationFn: async (edu: Omit<Education, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("education")
        .insert({ ...edu, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education"] });
      toast.success("Education added");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateEducation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Education> & { id: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("education")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education"] });
      toast.success("Education updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteEducation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("education")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["education"] });
      toast.success("Education deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return { education, isLoading, addEducation, updateEducation, deleteEducation };
}
