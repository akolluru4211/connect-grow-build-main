import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: "internship" | "hackathon";
  description: string | null;
  location: string | null;
  deadline: string | null;
  stipend: string | null;
  duration: string | null;
  application_link: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const FALLBACK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "f1",
    title: "Software Engineering Intern, Summer 2025",
    organization: "Google",
    type: "internship",
    description: "Develop the next generation of Google services and technologies.",
    location: "USA / Europe / Remote",
    deadline: "2024-12-15",
    stipend: "Competitive + Benefits",
    duration: "12-14 Weeks",
    application_link: "https://www.google.com/about/careers/applications/jobs/results/?q=software%20engineering%20intern",
    tags: ["Cloud", "AI", "Infrastructure"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "f2",
    title: "Deep Learning Software Intern",
    organization: "NVIDIA",
    type: "internship",
    description: "Working at the intersection of AI hardware and software.",
    location: "Santa Clara, CA",
    deadline: "2025-01-10",
    stipend: "Top-Tier Pay",
    duration: "4 Months",
    application_link: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern",
    tags: ["CUDA", "PyTorch", "C++"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "f3",
    title: "MLH 2024 Global Hackathon Season",
    organization: "Major League Hacking",
    type: "hackathon",
    description: "Join thousands of builders across the globe for the 2024 season.",
    location: "Global / Hybrid",
    deadline: "2024-12-31",
    stipend: "$10,000+ Prizes",
    duration: "Various",
    application_link: "https://mlh.io/seasons/2024/events",
    tags: ["Hackathon", "Networking", "Learning"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "f4",
    title: "Software Development Engineer Intern",
    organization: "Amazon",
    type: "internship",
    description: "Build distributed systems at global scale.",
    location: "Seattle / Austin / Remote",
    deadline: "2024-11-30",
    stipend: "High Salary + Relocation",
    duration: "12 Weeks",
    application_link: "https://www.amazon.jobs/en/search?base_query=software+development+engineer+intern",
    tags: ["AWS", "Java", "High Scale"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "f5",
    title: "ETH Global: San Francisco",
    organization: "ETH Global",
    type: "hackathon",
    description: "The world's largest web3 hackathon series comes to SF.",
    location: "San Francisco, CA",
    deadline: "2024-11-05",
    stipend: "$50k Prize Pool",
    duration: "3 Days",
    application_link: "https://ethglobal.com/",
    tags: ["Solidity", "Web3", "Blockchain"],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useOpportunities = (type?: "internship" | "hackathon", searchQuery?: string) => {
  return useQuery({
    queryKey: ["opportunities", type, searchQuery],
    queryFn: async () => {
      let results: Opportunity[] = [];
      
      try {
        let query = supabase
          .from("opportunities")
          .select("*")
          .eq("is_active", true)
          .order("deadline", { ascending: true });

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error } = await query;
        if (error) throw error;
        results = data as Opportunity[];
      } catch (e) {
        console.warn("Supabase fetch failed, using fallback records:", e);
      }

      // If no results from DB, use high-quality fallbacks
      if (results.length === 0) {
        results = FALLBACK_OPPORTUNITIES;
      }

      // Apply filters
      if (type) {
        results = results.filter(item => item.type === type);
      }

      if (searchQuery && searchQuery.trim()) {
        const lowerSearch = searchQuery.toLowerCase().trim();
        results = results.filter(item => 
          item.title.toLowerCase().includes(lowerSearch) ||
          item.organization.toLowerCase().includes(lowerSearch) ||
          (item.description?.toLowerCase().includes(lowerSearch) ?? false)
        );
      }

      return results;
    },
  });
};

export const useNewsletterSubscribe = () => {
  const subscribe = async (email: string) => {
    // First, insert into newsletter_subscribers table
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      if (error.code === "23505") {
        throw new Error("This email is already subscribed!");
      }
      throw error;
    }

    // Send welcome email via edge function
    try {
      await supabase.functions.invoke("newsletter-welcome", {
        body: { email },
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't throw - subscription was successful even if email fails
    }

    return true;
  };

  return { subscribe };
};
