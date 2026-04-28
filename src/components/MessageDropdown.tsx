import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useMessages";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function MessageDropdown() {
  const navigate = useNavigate();
  const { conversations, isLoading } = useConversations();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  // Calculate total unread count
  const totalUnread = conversations?.reduce((acc, conv) => acc + (conv.unread_count || 0), 0) || 0;

  // Trigger animation when new message arrives
  useEffect(() => {
    if (totalUnread > prevUnreadCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevUnreadCount(totalUnread);
  }, [totalUnread, prevUnreadCount]);

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages?conversation=${conversationId}`);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <MessageSquare
            className={cn(
              "h-5 w-5 transition-all",
              isAnimating && "text-primary"
            )}
          />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center",
                isAnimating && "animate-pulse scale-110"
              )}
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </Badge>
          )}
          {isAnimating && (
            <span className="absolute inset-0 rounded-md animate-ping bg-primary/20" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Messages</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={() => navigate("/messages")}
          >
            <Send className="mr-1 h-3 w-3" />
            New message
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="flex flex-col h-32 items-center justify-center text-sm text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col h-32 items-center justify-center text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 text-muted-foreground/50" />
              <p>No conversations yet</p>
              <Button
                variant="link"
                size="sm"
                className="mt-2 text-primary"
                onClick={() => navigate("/network")}
              >
                Connect with people
              </Button>
            </div>
          ) : (
            conversations.slice(0, 10).map((conversation) => {
              const hasUnread = (conversation.unread_count || 0) > 0;
              return (
                <DropdownMenuItem
                  key={conversation.id}
                  className={cn(
                    "flex cursor-pointer gap-3 p-3 transition-colors",
                    hasUnread
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-accent"
                  )}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                    <AvatarFallback className={cn(
                      hasUnread ? "bg-primary/20 text-primary" : "bg-muted"
                    )}>
                      {getInitials(conversation.other_user?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden space-y-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={cn(
                          "text-sm leading-none truncate",
                          hasUnread ? "font-semibold" : "font-medium"
                        )}
                      >
                        {conversation.other_user?.full_name || "Unknown User"}
                      </p>
                      {hasUnread && (
                        <Badge
                          variant="default"
                          className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center shrink-0"
                        >
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {conversation.last_message.content}
                      </p>
                    )}
                    {conversation.last_message_at && (
                      <p className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center hover:bg-primary/10 hover:text-primary"
            onClick={() => navigate("/messages")}
          >
            View all messages
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
