import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows, useUserFollowStats } from "@/hooks/useFollows";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  MessageSquare,
  Search,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  location: string | null;
}

function UserCard({
  user,
  showFollowButton = true,
  onMessage,
}: {
  user: UserProfile;
  showFollowButton?: boolean;
  onMessage?: (userId: string) => void;
}) {
  const navigate = useNavigate();
  const { isFollowing, toggleFollow } = useFollows();
  const { user: currentUser } = useAuth();
  const following = isFollowing(user.id);
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar
            className="h-14 w-14 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all cursor-pointer"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <AvatarImage src={getDisplayAvatar(user.full_name, user.avatar_url)} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
              {getDisplayName(user.full_name).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer truncate"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              {getDisplayName(user.full_name)}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {user.headline || "No headline"}
            </p>
            {user.location && (
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                📍 {user.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {showFollowButton && !isOwnProfile && (
            <Button
              variant={following ? "secondary" : "default"}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => toggleFollow.mutate(user.id)}
              disabled={toggleFollow.isPending}
            >
              {following ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Follow
                </>
              )}
            </Button>
          )}
          {onMessage && !isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => onMessage(user.id)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UserCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Followers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "followers";
  const { following, followers, followingLoading, followersLoading } = useFollows();
  const { stats } = useUserFollowStats(user?.id);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch profiles for followers - using profiles_public view for privacy
  const { data: followerProfiles, isLoading: followerProfilesLoading } = useQuery({
    queryKey: ["follower-profiles", followers],
    queryFn: async () => {
      if (!followers || followers.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles_public")
        .select("id, full_name, headline, avatar_url")
        .in("id", followers);
      if (error) throw error;
      return (data || []).map(p => ({ ...p, id: p.id!, location: null })) as UserProfile[];
    },
    enabled: !!followers && followers.length > 0,
  });

  // Fetch profiles for following - using profiles_public view for privacy
  const { data: followingProfiles, isLoading: followingProfilesLoading } = useQuery({
    queryKey: ["following-profiles", following],
    queryFn: async () => {
      if (!following || following.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles_public")
        .select("id, full_name, headline, avatar_url")
        .in("id", following);
      if (error) throw error;
      return (data || []).map(p => ({ ...p, id: p.id!, location: null })) as UserProfile[];
    },
    enabled: !!following && following.length > 0,
  });

  const filteredFollowers = followerProfiles?.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowing = followingProfiles?.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading =
    followingLoading || followersLoading || followerProfilesLoading || followingProfilesLoading;

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Your Network
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your followers and people you follow
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold text-primary">
                  {stats?.followersCount || 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Followers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/50 to-accent border-accent/20">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold text-primary">
                  {stats?.followingCount || 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Following</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="gap-2">
              <Users className="h-4 w-4" />
              Followers
              <Badge variant="secondary" className="ml-1">
                {stats?.followersCount || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Following
              <Badge variant="secondary" className="ml-1">
                {stats?.followingCount || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-4">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredFollowers?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">No followers yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {searchQuery
                      ? "No followers match your search"
                      : "When people follow you, they'll appear here. Share great content to attract followers!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredFollowers?.map((profile) => (
                  <UserCard key={profile.id} user={profile} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredFollowing?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">Not following anyone</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {searchQuery
                      ? "No users match your search"
                      : "Follow people to see their posts in your feed and stay updated with their content."}
                  </p>
                  <Button className="mt-4" onClick={() => navigate("/")}>
                    Discover People
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredFollowing?.map((profile) => (
                  <UserCard key={profile.id} user={profile} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
