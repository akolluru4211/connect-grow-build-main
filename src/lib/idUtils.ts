import { Profile } from "@/hooks/useProfile";
import { UserProfile } from "@/hooks/useUserProfile";

export const generateIdNumber = (userId?: string) => {
  return userId ? userId.slice(0, 8).toUpperCase() : "XXXX-XXXX";
};

export const generateEdworldEmail = (profile: Profile | UserProfile | null, userId?: string, userEmail?: string) => {
  const name = profile?.full_name || userEmail?.split("@")[0] || "";
  if (!name) return userEmail || "";
  
  // Use userId last 3 digits as suffix for consistency
  const suffix = userId ? parseInt(userId.replace(/-/g, "").slice(-4), 16) % 900 + 100 : 100;
  const parts = name.trim().split(/\s+/);
  
  if (parts.length > 1) {
    const firstName = parts[0];
    const surname = parts[parts.length - 1];
    return `${surname.toLowerCase()}${firstName.charAt(0).toLowerCase()}${suffix}@edworld.co.in`.replace(/[^a-z0-9@.]/g, "");
  }
  return `${parts[0].toLowerCase()}${suffix}@edworld.co.in`.replace(/[^a-z0-9@.]/g, "");
};
