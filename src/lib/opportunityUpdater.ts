import { supabase } from "@/integrations/supabase/client";
import { discoverOpportunities, DiscoveredOpportunity } from "./gemini";
import { toast } from "sonner";

export async function syncDiscoveredOpportunities(type: "internship" | "job", industry: string = "Technology") {
  try {
    const opportunities = await discoverOpportunities(type, industry);
    
    if (!opportunities || opportunities.length === 0) {
      return { success: false, message: "No opportunities found." };
    }

    let syncedCount = 0;
    let skippedCount = 0;

    for (const opp of opportunities) {
      // 1. Find or create company
      let companyId: string | null = null;
      
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", opp.organization)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: opp.organization,
            location: opp.location,
            industry: industry,
            description: `${opp.organization} is a leading organization in the ${industry} sector.`
          })
          .select("id")
          .single();

        if (!companyError && newCompany) {
          companyId = newCompany.id;
        }
      }

      // 2. Check for duplicate opportunity
      const table = opp.type === "internship" ? "internships" : "jobs";
      const { data: duplicate } = await supabase
        .from(table)
        .select("id")
        .eq("title", opp.title)
        .eq("company_id", companyId)
        .maybeSingle();

      if (duplicate) {
        skippedCount++;
        continue;
      }

      // 3. Insert opportunity
      if (opp.type === "internship") {
        const { error } = await supabase.from("internships").insert({
          company_id: companyId,
          title: opp.title,
          description: opp.description,
          location: opp.location,
          internship_type: "full-time", // Default
          stipend_amount: opp.stipend ? parseFloat(opp.stipend.replace(/[^0-9.]/g, "")) || null : null,
          stipend_currency: opp.stipend?.includes("$") ? "$" : "₹",
          duration_months: opp.duration ? parseInt(opp.duration.replace(/[^0-9]/g, "")) || 3 : 3,
          application_url: opp.application_link,
          is_active: true,
          requirements: opp.tags
        });
        if (!error) syncedCount++;
      } else {
        const { error } = await supabase.from("jobs").insert({
          company_id: companyId,
          title: opp.title,
          description: opp.description,
          location: opp.location,
          job_type: "full-time",
          experience_level: "entry",
          salary_min: opp.stipend ? parseFloat(opp.stipend.replace(/[^0-9.]/g, "")) || null : null,
          salary_currency: opp.stipend?.includes("$") ? "$" : "₹",
          application_url: opp.application_link,
          is_active: true,
          requirements: opp.tags
        });
        if (!error) syncedCount++;
      }
    }

    return { 
      success: true, 
      syncedCount, 
      skippedCount,
      message: `Successfully synced ${syncedCount} new opportunities. Skipped ${skippedCount} duplicates.`
    };
  } catch (error: any) {
    console.error("Sync error:", error);
    return { success: false, message: error.message };
  }
}
