// Edworld co. branding profile utility
import edworldProfile from "@/assets/edworld-profile.png";

export const EDWORLD_DISPLAY_NAME = "Edworld co.";
export const EDWORLD_PROFILE_IMAGE = edworldProfile;

// Edworld co. founder profile information
export const EDWORLD_PROFILE_INFO = {
  full_name: "Adarsh Kolluru",
  headline: "EdTech Founder & CS Student | Building AI-Driven Learning Products at Edworld",
  location: "Hyderabad, Telangana, India",
  bio: `I'm a B.Tech 2nd-year student in Computer Science and Engineering, passionate about Artificial Intelligence, Robotics, and modern learning technologies. I'm also the Founder & CEO of Eden Sol, an EdTech startup dedicated to reimagining education through AI-powered teaching, coding platforms, and interactive learning systems.

At Eden Sol, I'm building tools that make learning smarter, faster, and more engaging — helping students develop real-world tech skills while enjoying the process. My goal is to bridge the gap between technology and education, empowering the next generation of learners to think creatively and build fearlessly.

I'm always eager to collaborate with innovators, educators, and developers who share the vision of using technology to make education more impactful and accessible.`,
  phone: "9546954631",
  linkedin_url: "https://www.linkedin.com/in/adarsh-kolluru-84115a376",
  website: "https://edworld.co.in",
  skills: ["Product Development", "Social Media Marketing", "HTML", "AI", "Robotics"],
  education: [
    {
      institution: "GITAM Deemed University",
      degree: "Bachelor of Technology - BTech",
      field: "Computer Science",
      years: "2024 - 2028"
    },
    {
      institution: "Diviseema Polytechnic College",
      degree: "Diploma",
      field: "Computer Science",
      years: "October 2021 - May 2025"
    }
  ],
  experience: [
    {
      company: "EdWorld.co.in",
      role: "Founder",
      period: "January 2026 - Present"
    },
    {
      company: "EdWorld.co.in",
      role: "Founder & CEO",
      period: "December 2024 - Present"
    },
    {
      company: "EdWorld.co.in",
      role: "Marketing Staff",
      period: "October 2025 - January 2026"
    }
  ]
};

/**
 * Check if a user name matches Edworld co. branding
 */
export function isEdworldUser(name: string | null | undefined): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase().trim();
  return normalized === "edworld" || normalized === "edwold" || normalized === "edworld co." || normalized === "edworld co" || normalized === "adarsh kolluru";
}

/**
 * Get display name for a user (falls back to Edworld co.)
 */
export function getDisplayName(fullName: string | null | undefined): string {
  if (!fullName) return EDWORLD_DISPLAY_NAME;
  if (isEdworldUser(fullName)) return EDWORLD_DISPLAY_NAME;
  return fullName;
}

/**
 * Get avatar URL for a user (uses Edworld profile for Edworld users)
 */
export function getDisplayAvatar(fullName: string | null | undefined, avatarUrl: string | null | undefined): string | undefined {
  if (isEdworldUser(fullName)) return EDWORLD_PROFILE_IMAGE;
  return avatarUrl || undefined;
}
