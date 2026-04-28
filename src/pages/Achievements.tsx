import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { useUserStreak } from "@/hooks/useGamification";
import { Trophy, Star, Flame, Lock, CheckCircle2, Award, UserCheck, FileText, Briefcase, Mic, Mail, Video, Users, PenTool, Calendar, Zap, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "user-check": UserCheck,
  "file-text": FileText,
  "briefcase": Briefcase,
  "mic": Mic,
  "mail": Mail,
  "video": Video,
  "flame": Flame,
  "award": Award,
  "users": Users,
  "pen-tool": PenTool,
  "calendar": Calendar,
  "star": Star,
  "trophy": Trophy,
  "zap": Zap,
  "target": Target,
};

const CATEGORY_COLORS: Record<string, string> = {
  profile: "bg-primary/10 text-primary",
  resume: "bg-green-500/10 text-success",
  jobs: "bg-accent/10 text-accent-foreground",
  interview: "bg-warning/10 text-warning",
  engagement: "bg-destructive/10 text-destructive",
  learning: "bg-primary/10 text-primary",
  social: "bg-accent/10 text-accent-foreground",
  events: "bg-yellow-500/10 text-warning",
  games: "bg-success/10 text-success",
  general: "bg-muted text-muted-foreground",
};

export default function Achievements() {
  const { data: achievements = [], isLoading: loadingAchievements } = useAchievements();
  const { data: userAchievements = [], isLoading: loadingUserAchievements } = useUserAchievements();
  const { data: streak } = useUserStreak();

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const earnedPoints = userAchievements.reduce(
    (sum, ua) => sum + (ua.achievement?.points || 0),
    0
  );

  const categories = [...new Set(achievements.map((a) => a.category))];

  if (loadingAchievements || loadingUserAchievements) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-warning/10">
            <Trophy className="h-8 w-8 text-warning" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Achievements</h1>
            <p className="text-muted-foreground">
              Unlock badges by completing milestones
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {earnedCount}/{totalCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Achievements Earned</p>
                </div>
              </div>
              <Progress
                value={(earnedCount / totalCount) * 100}
                className="mt-4"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-warning/10">
                  <Star className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{earnedPoints}</p>
                  <p className="text-sm text-muted-foreground">Points from Badges</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <Flame className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak?.current_streak || 0}</p>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements by Category */}
        <Tabs defaultValue="all">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => {
                const isEarned = earnedIds.has(achievement.id);
                const userAchievement = userAchievements.find(
                  (ua) => ua.achievement_id === achievement.id
                );
                const IconComponent = ICON_MAP[achievement.icon] || Trophy;

                return (
                  <Card
                    key={achievement.id}
                    className={`relative overflow-hidden transition-all ${
                      isEarned
                        ? "border-primary/50 bg-primary/5"
                        : "opacity-60 grayscale"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-full ${
                            isEarned ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          <IconComponent
                            className={`h-6 w-6 ${
                              isEarned ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {achievement.name}
                            </h3>
                            {isEarned ? (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={CATEGORY_COLORS[achievement.category]}
                            >
                              {achievement.category}
                            </Badge>
                            <Badge variant="outline">
                              +{achievement.points} pts
                            </Badge>
                          </div>
                          {userAchievement && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Earned {format(new Date(userAchievement.earned_at), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements
                  .filter((a) => a.category === cat)
                  .map((achievement) => {
                    const isEarned = earnedIds.has(achievement.id);
                    const userAchievement = userAchievements.find(
                      (ua) => ua.achievement_id === achievement.id
                    );
                    const IconComponent = ICON_MAP[achievement.icon] || Trophy;

                    return (
                      <Card
                        key={achievement.id}
                        className={`relative overflow-hidden transition-all ${
                          isEarned
                            ? "border-primary/50 bg-primary/5"
                            : "opacity-60 grayscale"
                        }`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-3 rounded-full ${
                                isEarned ? "bg-primary/20" : "bg-muted"
                              }`}
                            >
                              <IconComponent
                                className={`h-6 w-6 ${
                                  isEarned ? "text-primary" : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">
                                  {achievement.name}
                                </h3>
                                {isEarned ? (
                                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                                ) : (
                                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {achievement.description}
                              </p>
                              <Badge variant="outline">
                                +{achievement.points} pts
                              </Badge>
                              {userAchievement && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Earned {format(new Date(userAchievement.earned_at), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
