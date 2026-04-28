import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserMinus, UserPlus, BadgeCheck } from "lucide-react";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface FollowCardProps {
  person: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  isFollowing: boolean;
  onToggleFollow: (id: string) => void;
  isLoading?: boolean;
  variant?: "follower" | "following";
}

export function FollowCard({
  person,
  isFollowing,
  onToggleFollow,
  isLoading,
  variant = "follower",
}: FollowCardProps) {
  const navigate = useNavigate();
  const displayName = getDisplayName(person.full_name);
  const displayAvatar = getDisplayAvatar(person.full_name, person.avatar_url);

  const handleViewProfile = () => {
    navigate(`/profile?id=${person.id}`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Cover/Banner Image - Clickable */}
      <button
        onClick={handleViewProfile}
        className={`w-full h-10 md:h-16 relative overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          variant === "following" 
            ? "bg-gradient-to-br from-blue-500/20 via-primary/10 to-secondary/20" 
            : "bg-gradient-to-br from-purple-500/20 via-primary/10 to-secondary/20"
        }`}
        aria-label={`View ${displayName}'s profile`}
      >
        <div className={`absolute inset-0 ${
          variant === "following"
            ? "bg-gradient-to-br from-blue-500/30 via-accent/20 to-secondary/30"
            : "bg-gradient-to-br from-purple-500/30 via-accent/20 to-secondary/30"
        }`} />
      </button>

      <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4">
        {/* Avatar - Clickable with tooltip */}
        <div className="flex justify-center -mt-5 md:-mt-8 mb-1.5 md:mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleViewProfile}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`View ${displayName}'s profile`}
              >
                <Avatar className="h-10 w-10 md:h-16 md:w-16 border-2 md:border-4 border-background shadow-lg hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                  <AvatarImage src={displayAvatar} className="object-cover" />
                  <AvatarFallback className={`text-sm md:text-lg font-semibold ${
                    variant === "following" 
                      ? "bg-blue-500/10 text-blue-600" 
                      : "bg-purple-500/10 text-purple-600"
                  }`}>
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent>View profile</TooltipContent>
          </Tooltip>
        </div>

        {/* Name with verified badge - Clickable */}
        <div className="text-center mb-1">
          <button
            onClick={handleViewProfile}
            className="inline-flex items-center justify-center gap-1 hover:text-primary transition-colors focus:outline-none focus-visible:underline"
            aria-label={`View ${displayName}'s profile`}
          >
            <h3 className="font-semibold text-sm md:text-base text-foreground truncate max-w-[140px] md:max-w-[180px]">
              {displayName}
            </h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <BadgeCheck className={`h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 ${
                  variant === "following" ? "text-blue-500" : "text-purple-500"
                }`} />
              </TooltipTrigger>
              <TooltipContent>{variant === "following" ? "You follow them" : "Follows you"}</TooltipContent>
            </Tooltip>
          </button>
        </div>

        {/* Headline */}
        <p className="text-[10px] md:text-xs text-muted-foreground text-center line-clamp-2 min-h-[24px] md:min-h-[32px] mb-2 md:mb-3">
          {person.headline || "Member of Edworld"}
        </p>

        {/* Follow/Unfollow button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={`w-full h-8 md:h-11 text-xs md:text-sm transition-colors font-medium ${
                isFollowing 
                  ? "border-muted-foreground/50 hover:border-destructive hover:text-destructive" 
                  : "bg-primary hover:bg-primary/90"
              }`}
              onClick={() => onToggleFollow(person.id)}
              disabled={isLoading}
              aria-label={isFollowing ? `Unfollow ${displayName}` : `Follow ${displayName}`}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
                  Follow
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFollowing ? "Stop following this person" : "Follow to see their updates"}</TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
