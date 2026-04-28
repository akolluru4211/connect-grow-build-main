import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNetwork } from "@/hooks/useNetwork";
import { useFollows } from "@/hooks/useFollows";
import { useConversations } from "@/hooks/useMessages";
import { useNavigate, useLocation } from "react-router-dom";
import { PersonCard } from "@/components/network/PersonCard";
import { ConnectionCard } from "@/components/network/ConnectionCard";
import { PendingRequestCard } from "@/components/network/PendingRequestCard";
import { FollowCard } from "@/components/network/FollowCard";
import { ProofOfWorkFeed } from "@/components/network/ProofOfWorkFeed";
import {
  Users,
  UserCheck,
  Search,
  Clock,
  Sparkles,
  TrendingUp,
  Heart,
  UserPlus,
  Zap,
  LayoutGrid,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QRScanner } from "@/components/profile/QRScanner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Network() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    connections,
    connectionsLoading,
    pendingRequests,
    suggestions,
    suggestionsLoading,
    allPeople,
    allPeopleLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeConnection,
  } = useNetwork();
  
  const {
    followingProfiles,
    followerProfiles,
    followingProfilesLoading,
    followerProfilesLoading,
    isFollowing,
    toggleFollow,
    followingCount,
    followersCount,
  } = useFollows();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { startConversation } = useConversations();

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (location.state?.openScanner) {
      setIsScannerOpen(true);
      // Clean up state to avoid reopening on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleMessage = async (userId: string) => {
    await startConversation.mutateAsync(userId);
    navigate(`/messages`);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleScan = (decodedText: string) => {
    setIsScannerOpen(false);
    
    try {
      const url = new URL(decodedText);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      if (pathSegments[0] === 'profile' && pathSegments[1]) {
        const profileId = pathSegments[1];
        
        if (profileId === user?.id) {
          toast({ title: "That's your own ID card! 😄" });
          return;
        }

        sendRequest.mutate(profileId);
      } else {
        toast({ 
          title: "Invalid QR Code", 
          description: "This doesn't seem to be an EdWorld profile.", 
          variant: "destructive" 
        });
      }
    } catch (e) {
      toast({ 
        title: "Invalid QR Code", 
        description: "Could not parse the scanned data.", 
        variant: "destructive" 
      });
    }
  };

  const filteredConnections = connections?.filter((conn) =>
    conn.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggestions = suggestions?.filter((s) =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !dismissedIds.has(s.id)
  );

  const filteredAllPeople = allPeople?.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !dismissedIds.has(p.id)
  );

  const filteredFollowing = followingProfiles?.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFollowers = followerProfiles?.filter((p) =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="container py-4 sm:py-6 max-w-7xl px-3 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                My Network
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                Connect with professionals and grow your network
              </p>
            </div>
          </div>


          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white/5 border-white/5 focus:border-primary/50 transition-all rounded-xl"
              />
            </div>
            <Button 
              onClick={() => setIsScannerOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/20 gap-2 shrink-0"
            >
              <Zap className="h-4 w-4" />
              Scan to Connect
            </Button>
          </div>
        </div>

        {/* Pending Requests Banner */}
        {pendingRequests && pendingRequests.length > 0 && (
          <Card className="mb-4 sm:mb-6 border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  <CardTitle className="text-base sm:text-lg">Pending Requests</CardTitle>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 text-xs">
                    {pendingRequests.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {pendingRequests.map((request) => (
                  <PendingRequestCard
                    key={request.id}
                    request={request}
                    onAccept={(id) => acceptRequest.mutate(id)}
                    onDecline={(id) => declineRequest.mutate(id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="suggestions" className="space-y-4 sm:space-y-6">
          {/* Scrollable Tabs for Mobile */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-muted/50 p-1 inline-flex w-max sm:w-auto gap-1">
              <TabsTrigger value="suggestions" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Suggestions</span>
              </TabsTrigger>
              <TabsTrigger value="feed" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 fill-amber-400/20" />
                <span>Proof & Feed</span>
                <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1.5 bg-primary/20 text-primary border-none">
                  NEW
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all-people" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>All</span>
                <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1.5">
                  {allPeople?.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Following</span>
                <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1.5">
                  {followingCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="followers" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Followers</span>
                <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1.5">
                  {followersCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="connections" className="gap-1.5 px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
                <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Connected</span>
                <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1.5">
                  {connections?.length || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Feed Tab */}
          <TabsContent value="feed" className="max-w-3xl mx-auto">
             <div className="mb-6">
               <h2 className="text-xl font-bold text-foreground">Community Proof of Work</h2>
               <p className="text-sm text-slate-400">Real-time achievements from your network</p>
             </div>
             <ProofOfWorkFeed />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                People you may know based on your activity
              </h2>
              <Button variant="link" className="text-primary">
                Show all
              </Button>
            </div>

            {suggestionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 bg-muted" />
                    <CardContent className="pt-12 pb-4">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredSuggestions?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No suggestions match your search" : "No suggestions available"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for new connection suggestions
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredSuggestions?.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onConnect={(id) => sendRequest.mutate(id)}
                    onDismiss={handleDismiss}
                    isConnecting={sendRequest.isPending}
                    mutualConnections={Math.floor(Math.random() * 30)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* All People Tab */}
          <TabsContent value="all-people">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Discover people on Edworld
              </h2>
            </div>

            {allPeopleLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 bg-muted" />
                    <CardContent className="pt-12 pb-4">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAllPeople?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No people match your search" : "No people found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAllPeople?.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onConnect={(id) => sendRequest.mutate(id)}
                    onDismiss={handleDismiss}
                    isConnecting={sendRequest.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="following">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                People you follow
              </h2>
            </div>

            {followingProfilesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-16 bg-muted" />
                    <CardContent className="pt-10 pb-4">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFollowing?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No results match your search" : "You're not following anyone yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Follow people to see their updates in your feed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFollowing?.map((person) => (
                  <FollowCard
                    key={person.id}
                    person={person}
                    isFollowing={isFollowing(person.id)}
                    onToggleFollow={(id) => toggleFollow.mutate(id)}
                    isLoading={toggleFollow.isPending}
                    variant="following"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Followers Tab */}
          <TabsContent value="followers">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                People following you
              </h2>
            </div>

            {followerProfilesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-16 bg-muted" />
                    <CardContent className="pt-10 pb-4">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFollowers?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No results match your search" : "No followers yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share your profile to get more followers
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFollowers?.map((person) => (
                  <FollowCard
                    key={person.id}
                    person={person}
                    isFollowing={isFollowing(person.id)}
                    onToggleFollow={(id) => toggleFollow.mutate(id)}
                    isLoading={toggleFollow.isPending}
                    variant="follower"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Your connections
              </h2>
            </div>

            {connectionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-20 bg-muted" />
                    <CardContent className="pt-12 pb-4">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredConnections?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No connections match your search" : "No connections yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start connecting with professionals!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredConnections?.map((conn) => (
                  <ConnectionCard
                    key={conn.id}
                    connection={conn}
                    onMessage={handleMessage}
                    onRemove={(id) => removeConnection.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Network Stats Footer */}
        <Card className="mt-6 sm:mt-8">
          <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">{connections?.length || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Connections</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">{followingCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">{followersCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{allPeople?.length || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScan} 
      />
    </MainLayout>
  );
}
