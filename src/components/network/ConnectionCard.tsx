import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, UserX, BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

interface ConnectionCardProps {
  connection: {
    id: string;
    profile?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      headline: string | null;
      banner_url?: string | null;
    };
  };
  onMessage: (userId: string) => void;
  onRemove: (connectionId: string) => void;
}

export function ConnectionCard({ connection, onMessage, onRemove }: ConnectionCardProps) {
  const navigate = useNavigate();
  const profile = connection.profile;
  if (!profile) return null;

  const displayName = getDisplayName(profile.full_name);
  const displayAvatar = getDisplayAvatar(profile.full_name, profile.avatar_url);

  const handleViewProfile = () => {
    navigate(`/profile?id=${profile.id}`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      {/* Cover/Banner Image - Clickable */}
      <button
        onClick={handleViewProfile}
        className="w-full h-12 md:h-20 bg-gradient-to-br from-emerald-500/20 via-primary/10 to-secondary/20 relative overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View ${displayName}'s profile`}
      >
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-accent/20 to-secondary/30" />
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
                  <AvatarFallback className="text-base md:text-xl font-semibold bg-emerald-500/10 text-emerald-600">
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
                <BadgeCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>Connected</TooltipContent>
            </Tooltip>
          </button>
        </div>

        {/* Headline */}
        <p className="text-xs md:text-sm text-muted-foreground text-center line-clamp-2 min-h-[32px] md:min-h-[40px] mb-2 md:mb-3">
          {profile.headline || "Connected member"}
        </p>

        {/* Action buttons */}
        <div className="flex gap-1.5 md:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 md:h-11 text-xs md:text-sm border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                onClick={() => onMessage(profile.id)}
                aria-label={`Send message to ${displayName}`}
              >
                <MessageSquare className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
                Message
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start a conversation</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 md:h-11 md:w-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(connection.id)}
                aria-label={`Remove ${displayName} from connections`}
              >
                <UserX className="h-3.5 w-3.5 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove connection</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
