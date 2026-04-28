import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, X, BadgeCheck } from "lucide-react";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface PersonCardProps {
  person: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    banner_url?: string | null;
  };
  onConnect: (id: string) => void;
  onDismiss?: (id: string) => void;
  isConnecting?: boolean;
  mutualConnections?: number;
  showVerified?: boolean;
}

export function PersonCard({
  person,
  onConnect,
  onDismiss,
  isConnecting,
  mutualConnections = 0,
  showVerified = true,
}: PersonCardProps) {
  const navigate = useNavigate();
  const displayName = getDisplayName(person.full_name);
  const displayAvatar = getDisplayAvatar(person.full_name, person.avatar_url);

  const handleViewProfile = () => {
    navigate(`/profile?id=${person.id}`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Dismiss button */}
      {onDismiss && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onDismiss(person.id)}
              className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10 h-6 w-6 md:h-8 md:w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-sm border border-border/50"
              aria-label="Dismiss suggestion"
            >
              <X className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Not interested</TooltipContent>
        </Tooltip>
      )}

      {/* Cover/Banner Image - Clickable */}
      <button
        onClick={handleViewProfile}
        className="w-full h-12 md:h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 relative overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View ${displayName}'s profile`}
      >
        {person.banner_url ? (
          <img
            src={person.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30" />
        )}
      </button>

      <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4">
        {/* Avatar - Clickable with tooltip */}
        <div className="flex justify-center -mt-6 md:-mt-10 mb-2 md:mb-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleViewProfile}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`View ${displayName}'s profile`}
              >
                <Avatar className="h-12 w-12 md:h-20 md:w-20 border-2 md:border-4 border-background shadow-lg hover:ring-2 hover:ring-primary transition-all cursor-pointer">
                  <AvatarImage src={displayAvatar} className="object-cover" />
                  <AvatarFallback className="text-base md:text-xl font-semibold bg-primary/10 text-primary">
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
            {showVerified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <BadgeCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>Verified member</TooltipContent>
              </Tooltip>
            )}
          </button>
        </div>

        {/* Headline */}
        <p className="text-xs md:text-sm text-muted-foreground text-center line-clamp-2 min-h-[32px] md:min-h-[40px] mb-2 md:mb-3">
          {person.headline || "Member of Edworld"}
        </p>

        {/* Mutual connections */}
        {mutualConnections > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-2 md:mb-3 text-[10px] md:text-xs text-muted-foreground cursor-help">
                <div className="flex -space-x-1.5 md:-space-x-2">
                  <Avatar className="h-4 w-4 md:h-5 md:w-5 border-2 border-background">
                    <AvatarFallback className="text-[6px] md:text-[8px] bg-muted">U</AvatarFallback>
                  </Avatar>
                </div>
                <span>{mutualConnections} mutual</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>People you both know</TooltipContent>
          </Tooltip>
        )}

        {/* Connect button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 md:h-11 text-xs md:text-sm border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
              onClick={() => onConnect(person.id)}
              disabled={isConnecting}
              aria-label={`Send connection request to ${displayName}`}
            >
              <UserPlus className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
              Connect
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send a connection request</TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
