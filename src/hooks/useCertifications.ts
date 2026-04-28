import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useCertifications(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetUserId = userId || user?.id;

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["certifications", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("user_id", targetUserId)
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data as Certification[];
    },
    enabled: !!targetUserId,
  });

  const addCertification = useMutation({
    mutationFn: async (cert: Omit<Certification, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("certifications")
        .insert({ ...cert, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success("Certification added");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateCertification = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Certification> & { id: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("certifications")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success("Certification updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteCertification = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("certifications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certifications"] });
      toast.success("Certification deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return { certifications, isLoading, addCertification, updateCertification, deleteCertification };
}
