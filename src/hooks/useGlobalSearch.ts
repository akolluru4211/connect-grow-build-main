import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  type: "job" | "internship" | "course" | "user" | "company" | "event" | "blog";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  extra?: string;
}

export interface SearchFilters {
  types?: ("job" | "internship" | "course" | "user" | "company" | "event" | "blog")[];
  location?: string;
  jobType?: string;
  experienceLevel?: string;
}

export function useGlobalSearch(query: string, filters?: SearchFilters) {
  return useQuery({
    queryKey: ["globalSearch", query, filters],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];

      const results: SearchResult[] = [];
      const typesToSearch = filters?.types || ["job", "internship", "course", "user", "company", "event", "blog"];
      
      // Build safe pattern for ilike - just wrap with wildcards
      const searchPattern = `%${query}%`;
      const locationPattern = filters?.location ? `%${filters.location}%` : '';

      const promises: Promise<void>[] = [];

      if (typesToSearch.includes("job")) {
        promises.push(
          (async () => {
            let jobQuery = supabase
              .from("jobs")
              .select("id, title, location, job_type, companies(name)")
              .eq("is_active", true)
              .limit(8);

            // Use textSearch or multiple ilike conditions properly
            const { data: titleMatches } = await jobQuery.ilike("title", searchPattern);
            const { data: descMatches } = await supabase
              .from("jobs")
              .select("id, title, location, job_type, companies(name)")
              .eq("is_active", true)
              .ilike("description", searchPattern)
              .limit(8);

            // Combine and dedupe results
            const allJobs = [...(titleMatches || []), ...(descMatches || [])];
            const uniqueJobs = allJobs.filter((job, index, self) => 
              index === self.findIndex(j => j.id === job.id)
            );

            // Apply additional filters
            let filteredJobs = uniqueJobs;
            if (locationPattern) {
              filteredJobs = filteredJobs.filter(job => 
                job.location?.toLowerCase().includes(filters?.location?.toLowerCase() || '')
              );
            }
            if (filters?.jobType) {
              filteredJobs = filteredJobs.filter(job => job.job_type === filters.jobType);
            }
            if (filters?.experienceLevel) {
              filteredJobs = filteredJobs.filter(job => (job as any).experience_level === filters.experienceLevel);
            }

            filteredJobs.slice(0, 8).forEach((job) => {
              results.push({
                id: job.id,
                type: "job",
                title: job.title,
                subtitle: (job.companies as { name: string } | null)?.name || undefined,
                extra: job.location || job.job_type || undefined,
              });
            });
          })()
        );
      }

      if (typesToSearch.includes("internship")) {
        promises.push(
          (async () => {
            const { data: titleMatches } = await supabase
              .from("internships")
              .select("id, title, location, internship_type, companies(name)")
              .eq("is_active", true)
              .ilike("title", searchPattern)
              .limit(8);

            const { data: descMatches } = await supabase
              .from("internships")
              .select("id, title, location, internship_type, companies(name)")
              .eq("is_active", true)
              .ilike("description", searchPattern)
              .limit(8);

            const allInternships = [...(titleMatches || []), ...(descMatches || [])];
            const uniqueInternships = allInternships.filter((item, index, self) => 
              index === self.findIndex(i => i.id === item.id)
            );

            let filteredInternships = uniqueInternships;
            if (locationPattern) {
              filteredInternships = filteredInternships.filter(item => 
                item.location?.toLowerCase().includes(filters?.location?.toLowerCase() || '')
              );
            }

            filteredInternships.slice(0, 8).forEach((internship) => {
              results.push({
                id: internship.id,
                type: "internship",
                title: internship.title,
                subtitle: (internship.companies as { name: string } | null)?.name || undefined,
                extra: internship.location || internship.internship_type || undefined,
              });
            });
          })()
        );
      }

      if (typesToSearch.includes("course")) {
        promises.push(
          (async () => {
            const { data: titleMatches } = await supabase
              .from("courses")
              .select("id, title, category, difficulty, thumbnail_url, instructor_name")
              .eq("is_published", true)
              .ilike("title", searchPattern)
              .limit(8);

            const { data: descMatches } = await supabase
              .from("courses")
              .select("id, title, category, difficulty, thumbnail_url, instructor_name")
              .eq("is_published", true)
              .ilike("description", searchPattern)
              .limit(8);

            const { data: catMatches } = await supabase
              .from("courses")
              .select("id, title, category, difficulty, thumbnail_url, instructor_name")
              .eq("is_published", true)
              .ilike("category", searchPattern)
              .limit(8);

            const allCourses = [...(titleMatches || []), ...(descMatches || []), ...(catMatches || [])];
            const uniqueCourses = allCourses.filter((item, index, self) => 
              index === self.findIndex(i => i.id === item.id)
            );

            uniqueCourses.slice(0, 8).forEach((course) => {
              results.push({
                id: course.id,
                type: "course",
                title: course.title,
                subtitle: course.instructor_name || course.category,
                extra: course.difficulty,
                imageUrl: course.thumbnail_url || undefined,
              });
            });
          })()
        );
      }

      if (typesToSearch.includes("user")) {
        promises.push(
          (async () => {
            const { data: nameMatches } = await supabase
              .from("profiles_public")
              .select("id, full_name, headline, avatar_url")
              .ilike("full_name", searchPattern)
              .limit(8);

            const { data: headlineMatches } = await supabase
              .from("profiles_public")
              .select("id, full_name, headline, avatar_url")
              .ilike("headline", searchPattern)
              .limit(8);

            const allUsers = [...(nameMatches || []), ...(headlineMatches || [])];
            const uniqueUsers = allUsers.filter((item, index, self) => 
              index === self.findIndex(i => i.id === item.id)
            );

            uniqueUsers.slice(0, 8).forEach((user) => {
              if (user.full_name) {
                results.push({
                  id: user.id!,
                  type: "user",
                  title: user.full_name,
                  subtitle: user.headline || undefined,
                  imageUrl: user.avatar_url || undefined,
                });
              }
            });
          })()
        );
      }

      if (typesToSearch.includes("company")) {
        promises.push(
          (async () => {
            const { data: nameMatches } = await supabase
              .from("companies")
              .select("id, name, industry, location, logo_url, company_size")
              .ilike("name", searchPattern)
              .limit(8);

            const { data: descMatches } = await supabase
              .from("companies")
              .select("id, name, industry, location, logo_url, company_size")
              .ilike("description", searchPattern)
              .limit(8);

            const { data: industryMatches } = await supabase
              .from("companies")
              .select("id, name, industry, location, logo_url, company_size")
              .ilike("industry", searchPattern)
              .limit(8);

            const allCompanies = [...(nameMatches || []), ...(descMatches || []), ...(industryMatches || [])];
            const uniqueCompanies = allCompanies.filter((item, index, self) => 
              index === self.findIndex(i => i.id === item.id)
            );

            uniqueCompanies.slice(0, 8).forEach((company) => {
              results.push({
                id: company.id,
                type: "company",
                title: company.name,
                subtitle: company.industry || undefined,
                extra: company.location || company.company_size || undefined,
                imageUrl: company.logo_url || undefined,
              });
            });
          })()
        );
      }

      if (typesToSearch.includes("event")) {
        promises.push(
          (async () => {
            const { data: titleMatches } = await supabase
              .from("events")
              .select("id, title, event_type, location, start_date, cover_image_url")
              .gte("start_date", new Date().toISOString())
              .ilike("title", searchPattern)
              .order("start_date", { ascending: true })
              .limit(6);

            const { data: descMatches } = await supabase
              .from("events")
              .select("id, title, event_type, location, start_date, cover_image_url")
              .gte("start_date", new Date().toISOString())
              .ilike("description", searchPattern)
              .order("start_date", { ascending: true })
              .limit(6);

            const allEvents = [...(titleMatches || []), ...(descMatches || [])];
            const uniqueEvents = allEvents.filter((item, index, self) => 
              index === self.findIndex(i => i.id === item.id)
            );

            uniqueEvents.slice(0, 6).forEach((event) => {
              const eventDate = new Date(event.start_date).toLocaleDateString();
              results.push({
                id: event.id,
                type: "event",
                title: event.title,
                subtitle: event.event_type,
                extra: `${eventDate} • ${event.location || "Online"}`,
                imageUrl: event.cover_image_url || undefined,
              });
            });
          })()
        );
      }

      if (typesToSearch.includes("blog")) {
        promises.push(
          (async () => {
            const { data: titleMatches } = await supabase
              .from("blog_posts")
              .select("id, title, excerpt, slug, cover_image_url, created_at")
              .eq("is_published", true)
              .ilike("title", searchPattern)
              .order("created_at", { ascending: false })
              .limit(6);

            const { data: contentMatches } = await supabase
              .from("blog_posts")
              .select("id, title, excerpt, slug, cover_image_url, created_at")
              .eq("is_published", true)
              .ilike("content", searchPattern)
              .order("created_at", { ascending: false })
              .limit(6);

            const { data: excerptMatches } = await supabase
              .from("blog_posts")
              .select("id, title, excerpt, slug, cover_image_url, created_at")
              .eq("is_published", true)
              .ilike("excerpt", searchPattern)
              .order("created_at", { ascending: false })
              .limit(6);

            const allPosts = [...(titleMatches || []), ...(contentMatches || []), ...(excerptMatches || [])];
            const uniquePosts = allPosts.filter((item, index, self) => 
              index === self.findIndex(i => i.id === item.id)
            );

            uniquePosts.slice(0, 6).forEach((post) => {
              results.push({
                id: post.id,
                type: "blog",
                title: post.title,
                subtitle: post.excerpt || undefined,
                imageUrl: post.cover_image_url || undefined,
              });
            });
          })()
        );
      }

      await Promise.all(promises);
      return results;
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
}
