import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Briefcase,
  MessageSquare,
  Calendar,
  Award,
  Users,
  Settings,
  CheckCheck,
  Filter,
  BookOpen,
  ThumbsUp,
  Sparkles,
  Trash2,
  Check,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const notificationTypes = [
  { value: "all", label: "All", icon: Bell },
  { value: "message", label: "Messages", icon: MessageSquare },
  { value: "job_application", label: "Jobs", icon: Briefcase },
  { value: "connection", label: "Connections", icon: Users },
  { value: "endorsement", label: "Endorsements", icon: ThumbsUp },
  { value: "blog", label: "Blog", icon: BookOpen },
  { value: "event", label: "Events", icon: Calendar },
  { value: "badge", label: "Badges", icon: Award },
];

const typeIcons: Record<string, typeof Bell> = {
  job_application: Briefcase,
  message: MessageSquare,
  event: Calendar,
  badge: Award,
  connection: Users,
  endorsement: ThumbsUp,
  blog: BookOpen,
  system: Settings,
};

const typeColors: Record<string, string> = {
  job_application: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  message: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  event: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  connection: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  endorsement: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  blog: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  system: "bg-muted text-muted-foreground",
};

function NotificationCard({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || typeColors.system;

  return (
    <div
      onClick={() => onClick(notification)}
      className={cn(
        "group relative flex gap-4 p-4 cursor-pointer transition-all duration-200 rounded-xl border",
        !notification.is_read
          ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
          : "bg-card border-border/50 hover:bg-accent/50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
          colorClass
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground line-clamp-1">
            {notification.title}
          </h4>
          {!notification.is_read && (
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </span>
          <Badge variant="secondary" className="text-xs capitalize">
            {notification.type.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Quick actions */}
      {!notification.is_read && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onRead(notification.id);
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border/50">
      <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesType =
      activeFilter === "all" || notification.type === activeFilter;
    const matchesRead = !showUnreadOnly || !notification.is_read;
    return matchesType && matchesRead;
  });

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const date = format(new Date(notification.created_at), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      const yesterday = format(
        new Date(Date.now() - 86400000),
        "yyyy-MM-dd"
      );

      let label = format(new Date(notification.created_at), "MMMM d, yyyy");
      if (date === today) label = "Today";
      else if (date === yesterday) label = "Yesterday";

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(notification);
      return groups;
    },
    {} as Record<string, Notification[]>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary">
                  <Bell className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Notifications
                  </h1>
                  <p className="text-muted-foreground">
                    Stay updated with your latest activities
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => markAllAsRead()}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <Sparkles className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter((n) => n.type === "message").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter((n) => n.type === "connection").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <ScrollArea className="w-full md:w-auto">
                  <div className="flex gap-2 pb-2 md:pb-0">
                    {notificationTypes.map((type) => {
                      const Icon = type.icon;
                      const count =
                        type.value === "all"
                          ? notifications.length
                          : notifications.filter((n) => n.type === type.value)
                              .length;
                      return (
                        <Button
                          key={type.value}
                          variant={
                            activeFilter === type.value ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setActiveFilter(type.value)}
                          className="gap-2 shrink-0"
                        >
                          <Icon className="h-4 w-4" />
                          {type.label}
                          <Badge
                            variant={
                              activeFilter === type.value
                                ? "secondary"
                                : "outline"
                            }
                            className="ml-1"
                          >
                            {count}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <Button
                  variant={showUnreadOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className="gap-2 shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  Unread only
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <NotificationSkeleton key={i} />
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                    <Bell className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No notifications
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    {showUnreadOnly
                      ? "You've read all your notifications. Great job staying on top of things!"
                      : "When you receive notifications, they'll appear here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedNotifications).map(
                    ([date, notifications]) => (
                      <div key={date}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-card py-2">
                          {date}
                        </h3>
                        <div className="space-y-3">
                          {notifications.map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              onRead={markAsRead}
                              onClick={handleClick}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
