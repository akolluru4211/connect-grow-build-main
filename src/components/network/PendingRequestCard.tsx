import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, UserX, BadgeCheck, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

interface PendingRequestCardProps {
  request: {
    id: string;
    profile?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      headline: string | null;
    };
  };
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

export function PendingRequestCard({ request, onAccept, onDecline }: PendingRequestCardProps) {
  const navigate = useNavigate();
  const profile = request.profile;
  if (!profile) return null;

  const displayName = getDisplayName(profile.full_name);
  const displayAvatar = getDisplayAvatar(profile.full_name, profile.avatar_url);

  const handleViewProfile = () => {
    navigate(`/profile?id=${profile.id}`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 border-l-4 border-l-amber-500">
      {/* Pending indicator */}
      <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-amber-500/20 text-amber-600 text-[10px] md:text-xs font-medium">
              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
              Pending
            </div>
          </TooltipTrigger>
          <TooltipContent>Waiting for your response</TooltipContent>
        </Tooltip>
      </div>

      {/* Cover/Banner Image - Clickable */}
      <button
        onClick={handleViewProfile}
        className="w-full h-10 md:h-16 bg-gradient-to-br from-amber-500/20 via-orange-400/10 to-secondary/20 relative overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View ${displayName}'s profile`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-accent/20 to-secondary/30" />
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
                  <AvatarFallback className="text-sm md:text-lg font-semibold bg-amber-500/10 text-amber-600">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent>View profile</TooltipContent>
          </Tooltip>
        </div>

        {/* Name with badge - Clickable */}
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
                <BadgeCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-500 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>Connection request</TooltipContent>
            </Tooltip>
          </button>
        </div>

        {/* Headline */}
        <p className="text-[10px] md:text-xs text-muted-foreground text-center line-clamp-2 mb-2 md:mb-3">
          {profile.headline || "Wants to connect with you"}
        </p>

        {/* Action buttons */}
        <div className="flex gap-1.5 md:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="flex-1 h-8 md:h-11 text-xs md:text-sm bg-primary hover:bg-primary/90 font-medium"
                onClick={() => onAccept(request.id)}
                aria-label={`Accept connection request from ${displayName}`}
              >
                <UserCheck className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
                Accept
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept this connection</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 md:h-11 text-xs md:text-sm font-medium hover:border-destructive hover:text-destructive"
                onClick={() => onDecline(request.id)}
                aria-label={`Decline connection request from ${displayName}`}
              >
                <UserX className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
                Decline
              </Button>
            </TooltipTrigger>
            <TooltipContent>Decline this request</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
