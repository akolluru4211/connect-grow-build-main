import { useUserStreak, useActivityHistory, ACTIVITY_POINTS, calculateProfileCompletion } from "@/hooks/useGamification";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Trophy, Target, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function GamificationWidget() {
  const { data: streak, isLoading: loadingStreak } = useUserStreak();
  const { data: activities = [], isLoading: loadingActivities } = useActivityHistory(5);
  const { profile } = useProfile();

  const profileCompletion = calculateProfileCompletion(profile);

  if (loadingStreak) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-warning" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Points & Streak Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.total_points || 0}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <Flame className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" /> Profile Completion
            </span>
            <span className="font-medium">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
          {profileCompletion < 100 && (
            <p className="text-xs text-muted-foreground">
              Complete your profile to earn bonus points!
            </p>
          )}
        </div>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Zap className="h-4 w-4" /> Recent Activity
            </p>
            <div className="space-y-1">
              {activities.slice(0, 3).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground capitalize">
                    {activity.activity_type.replace(/_/g, " ")}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    +{activity.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Longest Streak */}
        {streak?.longest_streak && streak.longest_streak > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>Longest Streak</span>
            <span className="font-medium">{streak.longest_streak} days 🔥</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
