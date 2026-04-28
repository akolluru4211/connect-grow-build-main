import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePostAnalytics } from "@/hooks/usePostAnalytics";
import { Eye, Heart, MessageCircle, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";

const chartConfig = {
  views: { label: "Views", color: "hsl(var(--primary))" },
  likes: { label: "Likes", color: "hsl(var(--destructive))" },
  comments: { label: "Comments", color: "hsl(var(--accent))" },
};

function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
}) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-muted-foreground";
    return change > 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{Math.abs(change)}% {changeLabel || "vs last week"}</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PostAnalyticsDashboard() {
  const { data: analytics, isLoading } = usePostAnalytics(30);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalPosts === 0) {
    return (
      <Card className="py-12 text-center border-dashed">
        <CardContent>
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Create your first post to start seeing analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Views"
          value={analytics.totalViews}
          icon={Eye}
          change={analytics.weeklyChange.views}
        />
        <StatCard
          title="Total Likes"
          value={analytics.totalLikes}
          icon={Heart}
          change={analytics.weeklyChange.likes}
        />
        <StatCard
          title="Total Comments"
          value={analytics.totalComments}
          icon={MessageCircle}
          change={analytics.weeklyChange.comments}
        />
        <StatCard
          title="Total Posts"
          value={analytics.totalPosts}
          icon={FileText}
        />
      </div>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engagement Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={analytics.engagementOverTime}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorViews)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="likes"
                stroke="hsl(var(--destructive))"
                fillOpacity={1}
                fill="url(#colorLikes)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="flex-shrink-0">
                  {post.views + post.likes * 2 + post.comments * 3} pts
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
