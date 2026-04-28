import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Company } from "./useJobs";
import { escapeSearchQuery } from "@/lib/searchUtils";

export interface Internship {
  id: string;
  company_id: string | null;
  title: string;
  description: string;
  requirements: string[] | null;
  location: string | null;
  internship_type: string;
  duration_months: number | null;
  stipend_amount: number | null;
  stipend_currency: string | null;
  is_active: boolean | null;
  start_date: string | null;
  application_url: string | null;
  created_at: string;
  companies: Company | null;
}

export interface InternshipFilters {
  search?: string;
  location?: string;
  internshipType?: string;
  durationMax?: number;
}

export function useInternships(filters?: InternshipFilters) {
  return useQuery({
    queryKey: ["internships", filters],
    queryFn: async () => {
      let query = supabase
        .from("internships")
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
      if (filters?.internshipType) {
        query = query.eq("internship_type", filters.internshipType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let results = data as Internship[];

      if (results.length === 0) {
        // Fallback mock internships if none exist in the database
        results = [
          {
            id: "mock-intern-1",
            company_id: "mock-company-1",
            title: "Software Engineering Intern",
            description: "Work with our diverse team on scaling backend infrastructure for millions of users.",
            requirements: ["Python", "Docker", "SQL"],
            location: "San Francisco, CA",
            internship_type: "summer",
            duration_months: 3,
            stipend_amount: 8000,
            stipend_currency: "$",
            start_date: "2024-06-01",
            is_active: true,
            created_at: new Date().toISOString(),
            application_url: "https://example.com/apply",
            companies: {
              id: "mock-company-1",
              name: "CloudScale Inc",
              description: "A fast-growing cloud tech startup",
              logo_url: null,
              location: "San Francisco, CA",
              industry: "Cloud Infrastructure",
              company_size: "50-200",
              culture_values: ["Innovation", "Collaboration"],
              work_environment: "Hybrid"
            }
          },
          {
            id: "mock-intern-2",
            company_id: "mock-company-3",
            title: "Data Science Intern",
            description: "Process large datasets and build predictive models to improve user experience.",
            requirements: ["Python", "Pandas", "Machine Learning"],
            location: "Remote",
            internship_type: "part-time",
            duration_months: 6,
            stipend_amount: 5000,
            stipend_currency: "$",
            start_date: "2024-05-15",
            is_active: true,
            created_at: new Date().toISOString(),
            application_url: "https://example.com/apply3",
            companies: {
              id: "mock-company-3",
              name: "DataMinds",
              description: "AI and Data Science platform",
              logo_url: null,
              location: "London, UK",
              industry: "Artificial Intelligence",
              company_size: "10-50",
              culture_values: ["Curiosity", "Impact"],
              work_environment: "Remote first"
            }
          }
        ];
      }

      // Re-apply client-side filters on mock data if needed
      if (filters?.internshipType) {
        results = results.filter(i => i.internship_type === filters.internshipType);
      }
      
      return results;
    },
  });
}

export function useInternship(id: string) {
  return useQuery({
    queryKey: ["internship", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internships")
        .select(`
          *,
          companies (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Internship;
    },
    enabled: !!id,
  });
}

export function useSavedInternships() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["savedInternships", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("saved_internships")
        .select("internship_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(s => s.internship_id);
    },
    enabled: !!user?.id,
  });
}

export function useSaveInternship() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ internshipId, save }: { internshipId: string; save: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");

      if (save) {
        const { error } = await supabase
          .from("saved_internships")
          .insert({ internship_id: internshipId, user_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_internships")
          .delete()
          .eq("internship_id", internshipId)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, { save }) => {
      queryClient.invalidateQueries({ queryKey: ["savedInternships"] });
      toast.success(save ? "Internship saved!" : "Internship removed from saved");
    },
    onError: (error) => {
      toast.error("Failed to save internship: " + error.message);
    },
  });
}

export function useApplyToInternship() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ internshipId, coverLetter }: { internshipId: string; coverLetter?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("internship_applications")
        .insert({
          internship_id: internshipId,
          user_id: user.id,
          cover_letter: coverLetter,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internshipApplications"] });
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      if (error.message.includes("duplicate")) {
        toast.error("You've already applied to this internship");
      } else {
        toast.error("Failed to apply: " + error.message);
      }
    },
  });
}
