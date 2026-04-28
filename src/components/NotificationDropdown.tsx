import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, Briefcase, MessageSquare, Calendar, Award, Users, Settings, CheckCheck, ThumbsUp, BookOpen, Trophy, Gamepad2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  job_application: Briefcase,
  message: MessageSquare,
  event: Calendar,
  badge: Award,
  connection: Users,
  network: Users,
  endorsement: ThumbsUp,
  blog: BookOpen,
  system: Settings,
  achievement: Trophy,
  achievement_unlocked: Trophy,
  game: Gamepad2,
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, hasNewNotification } = useNotifications();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);

  // Trigger animation when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCount || hasNewNotification) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount, hasNewNotification]);

  const handleClick = (notification: { id: string; link: string | null; is_read: boolean | null }) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative transition-transform",
            isAnimating && "animate-bell-shake"
          )}
        >
          <Bell className={cn(
            "h-5 w-5 transition-all",
            isAnimating && "text-primary"
          )} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center",
                isAnimating && "animate-pulse scale-110"
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          {/* Ripple effect for new notifications */}
          {isAnimating && (
            <span className="absolute inset-0 rounded-md animate-ping bg-primary/20" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs hover:bg-primary/10 hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col h-32 items-center justify-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 text-muted-foreground/50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex cursor-pointer gap-3 p-3 transition-colors",
                    !notification.is_read 
                      ? "bg-primary/5 hover:bg-primary/10" 
                      : "hover:bg-accent"
                  )}
                  onClick={() => handleClick(notification)}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    !notification.is_read 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn(
                      "text-sm leading-none",
                      !notification.is_read ? "font-semibold" : "font-medium"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary animate-pulse" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-center hover:bg-primary/10 hover:text-primary" asChild>
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
