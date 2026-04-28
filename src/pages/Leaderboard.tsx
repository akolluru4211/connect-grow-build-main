import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamificationLeaderboard } from "@/hooks/useGamification";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Medal, Flame, Star, TrendingUp, Crown, Zap } from "lucide-react";

const RANK_STYLES = [
  { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: Crown, iconColor: "text-warning" },
  { bg: "bg-muted", border: "border-border", icon: Medal, iconColor: "text-muted-foreground" },
  { bg: "bg-amber-600/10", border: "border-amber-600/30", icon: Medal, iconColor: "text-amber-600" },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = useGamificationLeaderboard(50);

  const currentUserRank = leaderboard?.findIndex((entry) => entry.user_id === user?.id);
  const currentUserEntry = currentUserRank !== undefined && currentUserRank >= 0 ? leaderboard?.[currentUserRank] : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const LeaderboardEntry = ({
    entry,
    rank,
    isCurrentUser,
  }: {
    entry: NonNullable<typeof leaderboard>[number];
    rank: number;
    isCurrentUser: boolean;
  }) => {
    const rankStyle = rank < 3 ? RANK_STYLES[rank] : null;
    const RankIcon = rankStyle?.icon;

    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
          isCurrentUser
            ? "bg-primary/10 border-2 border-primary"
            : rankStyle
            ? `${rankStyle.bg} border ${rankStyle.border}`
            : "border hover:bg-muted/50"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center">
          {RankIcon ? (
            <RankIcon className={`h-8 w-8 ${rankStyle?.iconColor}`} />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">#{rank + 1}</span>
          )}
        </div>

        <Avatar className="h-12 w-12 border-2 border-background shadow">
          <AvatarImage src={entry.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(entry.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{entry.full_name}</p>
            {isCurrentUser && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-warning" />
              {entry.current_streak} day streak
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Best: {entry.longest_streak}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold text-primary">
            <Zap className="h-5 w-5" />
            {entry.total_points.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">points</p>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trophy className="h-8 w-8 text-warning" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Top performers ranked by points and activity streaks
          </p>
        </div>

        {/* Current User Rank Card */}
        {currentUserEntry && currentUserRank !== undefined && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-2xl font-bold">#{currentUserRank + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold text-primary">
                    {currentUserEntry.total_points.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <Flame className="h-5 w-5 text-warning" />
                    {currentUserEntry.current_streak} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="points">
          <TabsList>
            <TabsTrigger value="points" className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> By Points
            </TabsTrigger>
            <TabsTrigger value="streaks" className="flex items-center gap-2">
              <Flame className="h-4 w-4" /> By Streaks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="points" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" /> Top Performers
                </CardTitle>
                <CardDescription>Users ranked by total points earned</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : leaderboard?.length === 0 ? (
                  <div className="py-12 text-center">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Rankings Yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to earn points by completing activities!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard?.map((entry, index) => (
                      <LeaderboardEntry
                        key={entry.user_id}
                        entry={entry}
                        rank={index}
                        isCurrentUser={entry.user_id === user?.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-warning" /> Streak Champions
                </CardTitle>
                <CardDescription>Users ranked by their current activity streak</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard
                      ?.slice()
                      .sort((a, b) => b.current_streak - a.current_streak)
                      .map((entry, index) => (
                        <LeaderboardEntry
                          key={entry.user_id}
                          entry={entry}
                          rank={index}
                          isCurrentUser={entry.user_id === user?.id}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
