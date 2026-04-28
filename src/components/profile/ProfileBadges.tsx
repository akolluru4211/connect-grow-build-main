import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Award, Medal, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileBadgesProps {
  userId: string;
  isOwnProfile?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  award: Award,
  medal: Medal,
  target: Target,
  zap: Zap,
};

const categoryColors: Record<string, string> = {
  resume: "bg-blue-500/10 text-blue-600 border-blue-200",
  interview: "bg-purple-500/10 text-purple-600 border-purple-200",
  engagement: "bg-green-500/10 text-success border-green-200",
  learning: "bg-amber-500/10 text-amber-600 border-amber-200",
  networking: "bg-pink-500/10 text-pink-600 border-pink-200",
  games: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

export function ProfileBadges({ userId, isOwnProfile = false }: ProfileBadgesProps) {
  const { data: earnedAchievements, isLoading } = useQuery({
    queryKey: ["user-achievements", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          id,
          earned_at,
          achievement:achievements (
            id,
            name,
            description,
            icon,
            points,
            category
          )
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-32 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const achievements = earnedAchievements || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Achievements
          {achievements.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {achievements.length}
            </Badge>
          )}
        </CardTitle>
        {isOwnProfile && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/achievements">View All</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              {isOwnProfile
                ? "Complete activities to earn your first achievement!"
                : "No achievements earned yet"}
            </p>
            {isOwnProfile && (
              <Button variant="link" size="sm" asChild className="mt-2">
                <Link to="/achievements">Explore Achievements</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {achievements.slice(0, 6).map((item) => {
              const achievement = item.achievement as {
                id: string;
                name: string;
                description: string;
                icon: string;
                points: number;
                category: string;
              };
              const IconComponent = iconMap[achievement.icon] || Trophy;
              const colorClass = categoryColors[achievement.category] || "bg-muted text-muted-foreground";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105 cursor-default",
                    colorClass
                  )}
                  title={`${achievement.description} (+${achievement.points} pts)`}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {achievement.name}
                  </span>
                </div>
              );
            })}
            {achievements.length > 6 && (
              <Link
                to={isOwnProfile ? "/achievements" : "#"}
                className="flex items-center justify-center px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <span className="text-sm font-medium">+{achievements.length - 6} more</span>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
