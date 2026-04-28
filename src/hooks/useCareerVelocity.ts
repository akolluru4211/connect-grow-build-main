import { useMemo } from "react";
import { useResumes } from "@/hooks/useResumes";
import { useUserStreak } from "@/hooks/useGamification";
import { useMyProjects } from "@/hooks/useProjects";
import { useProfile } from "@/hooks/useProfile";

export function useCareerVelocity() {
  const { data: resumes = [] } = useResumes();
  const { data: streak } = useUserStreak();
  const { data: projects = [] } = useMyProjects();
  const { profile } = useProfile();

  const velocityData = useMemo(() => {
    const points = streak?.total_points || 0;
    // Simple level calculation based on points
    const level = Math.floor(points / 100) + 1;

    // ─── CALCULATE SCORES (0-100 scale) ───
    
    // 1. Technical Power: GitHub + Projects (30%)
    const projectScore = Math.min(projects.length * 20, 80);
    const githubBonus = profile?.github_url ? 20 : 0;
    const technicalPower = Math.min(projectScore + githubBonus, 100);
    
    // 2. Network Power: LinkedIn + Connections (20% - integrated into consistency or new)
    const linkedinBonus = profile?.linkedin_url ? 50 : 0;
    const networkPower = Math.min(linkedinBonus, 100);

    // 3. Resume Precision (30%)
    const avgAtsScore = resumes.length > 0 
      ? resumes.reduce((acc, r) => acc + (r.ats_score || 0), 0) / resumes.length
      : 0;
    const resumeScore = Math.min(avgAtsScore, 100);

    // 4. Consistency & Engagement (20%)
    const consistencyScore = Math.min((level * 15) + (points / 400), 100);

    // ─── FINAL AGGREGATE ───
    const totalScore = Math.round(
      (technicalPower * 0.35) + 
      (resumeScore * 0.25) + 
      (networkPower * 0.20) +
      (consistencyScore * 0.20)
    );

    const isTrendingUp = totalScore > 50;

    return {
      score: totalScore,
      technicalPower,
      resumeScore,
      networkPower,
      consistencyScore,
      status: totalScore > 80 ? "Elite" : totalScore > 60 ? "Competitive" : "Emerging",
      trend: isTrendingUp ? "up" : "stable",
      nextMilestone: totalScore < 100 ? Math.ceil((totalScore + 10) / 10) * 10 : 100
    };
  }, [resumes, projects, streak, profile]);

  return velocityData;
}
