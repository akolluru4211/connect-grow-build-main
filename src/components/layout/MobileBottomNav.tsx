import { Link, useLocation } from "react-router-dom";
import { Home, Briefcase, BookOpen, Users, Menu, X, Settings, Bell, User, LogOut, ChevronRight, HelpCircle, LayoutDashboard, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  GraduationCap,
  Calendar,
  FileText,
  Gamepad2,
  Glasses,
  Trophy,
  Building2,
  MessageSquare,
  FolderKanban,
  Sparkles,
  Map,
  Bot,
  Award,
  Rocket,
  BrainCircuit,
} from "lucide-react";

const mainNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/courses", label: "Learn", icon: BookOpen },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
];

const sidebarNavGroups = [
  {
    title: "Opportunities",
    items: [
      { href: "/jobs", label: "Jobs", icon: Briefcase, description: "Find your dream career" },
      { href: "/internships", label: "Internships", icon: GraduationCap, description: "Start your career" },
      { href: "/job-fairs", label: "Job Fairs", icon: Calendar, description: "Virtual job events" },
      { href: "/job-recommendations", label: "Job Match", icon: Sparkles, description: "AI-powered matching" },
    ],
  },
  {
    title: "Learning",
    items: [
      { href: "/courses", label: "Courses", icon: BookOpen, description: "Professional development" },
      { href: "/knowledge-center", label: "Knowledge Center", icon: BookOpen, description: "Books & PDFs" },
      { href: "/exam-helper", label: "Exam Helper", icon: FileText, description: "AI PDF study tool" },
      { href: "/study-planner", label: "AI Study Planner", icon: Sparkles, description: "AI study schedules" },
      { href: "/habit-tracker", label: "Habit Tracker", icon: GraduationCap, description: "Track your progress" },
      { href: "/assessments", label: "Assessments", icon: GraduationCap, description: "Test your knowledge" },
      { href: "/resource-library", label: "Resource Library", icon: BookOpen, description: "Shared study materials" },
      { href: "/roadmap-creator", label: "AI Roadmap", icon: Map, description: "Plan your learning" },
      { href: "/ai-mentors", label: "AI Mentors", icon: Bot, description: "Get AI guidance" },
      { href: "/project-ideas", label: "Project Ideas", icon: Rocket, description: "AI project generator" },
      { href: "/paper-summarizer", label: "Paper Summarizer", icon: FileText, description: "Summarize research papers" },
      { href: "/presentation-generator", label: "Presentations", icon: Sparkles, description: "Create AI presentations" },
      { href: "/ai-flashcards", label: "AI Flashcards", icon: BrainCircuit, description: "Study with AI cards" },
    ],
  },
  {
    title: "Career",
    items: [
      { href: "/resume", label: "Resume Builder", icon: FileText, description: "Create your resume" },
      { href: "/cover-letter", label: "Cover Letter", icon: FileText, description: "Write cover letters" },
      { href: "/interview-prep", label: "Interview Prep", icon: MessageSquare, description: "Prepare for interviews" },
      { href: "/mock-interview", label: "Mock Interview", icon: Glasses, description: "Practice interviews" },
      { href: "/career-counseling", label: "Career Counseling", icon: Sparkles, description: "AI career guidance" },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban, description: "Showcase your work" },
      { href: "/study-groups", label: "Study Groups", icon: BookOpen, description: "Collaborate with peers" },
      { href: "/network", label: "Network", icon: Users, description: "Connect with peers" },
      { href: "/mentorship", label: "Mentorship", icon: Users, description: "Find a mentor" },
      { href: "/blogs", label: "Blogs", icon: FileText, description: "Read & write blogs" },
      { href: "/events", label: "Events", icon: Calendar, description: "Upcoming events" },
      { href: "/campus-events", label: "Campus Events", icon: GraduationCap, description: "College events & clubs" },
      { href: "/companies", label: "Companies", icon: Building2, description: "Explore companies" },
      { href: "/games", label: "Games", icon: Gamepad2, description: "Play & learn" },
    ],
  },
  {
    title: "Achievements",
    items: [
      { href: "/achievements", label: "Achievements", icon: Trophy, description: "Your achievements" },
      { href: "/leaderboard", label: "Leaderboard", icon: Trophy, description: "Top performers" },
      { href: "/id", label: "My ID Card", icon: CreditCard, description: "View digital identity" },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/help", label: "Help Center", icon: HelpCircle, description: "Guides & FAQs" },
      { href: "/contact", label: "Contact Us", icon: MessageSquare, description: "Get support" },
      { href: "/feedback", label: "Feedback", icon: FileText, description: "Share your thoughts" },
    ],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { counts } = useUnreadCounts();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const totalBadgeCount = counts.jobs + counts.courses + counts.events;

  const handleNavClick = (href: string) => {
    setSidebarOpen(false);
    navigate(href);
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden safe-area-pb">
      <div className="flex h-16 items-center justify-around px-2 glass-card border border-primary/20 shadow-xl rounded-full bg-white/90 backdrop-blur-xl">
        {mainNavItems.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 transition-all active:scale-95 px-4 h-12 rounded-full",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(234,179,8,0.4)] transform -translate-y-1"
                    : "text-slate-400 hover:text-primary/60"
                )}
                aria-label={item.label}
              >
                <item.icon className={cn("h-5 w-5", isActive(item.href) && "text-primary-foreground")} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="mb-2">
              Go to {item.label}
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Sidebar Trigger */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 transition-all active:scale-95 px-4 h-12 rounded-full",
                    sidebarOpen 
                      ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(234,179,8,0.4)] transform -translate-y-1" 
                      : "text-slate-400 hover:text-primary/60"
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                  <span className="text-[10px] font-semibold">More</span>
                </button>
              </SheetTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="mb-2">
              All features & settings
            </TooltipContent>
          </Tooltip>
          
          {/* Side Drawer */}
          <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0 flex flex-col bg-background/95 backdrop-blur-3xl border-r border-primary/20">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border-b border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Menu className="h-24 w-24" />
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded w-fit truncate">
                      {profile?.full_name || "Welcome!"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.headline || user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Welcome!</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9"
                      onClick={() => handleNavClick("/auth")}
                    >
                      Sign In
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => handleNavClick("/auth?mode=signup")}
                    >
                      Join
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {user && (
              <>
                <div className="flex items-center justify-around py-2 border-b">
                  <button
                    onClick={() => handleNavClick("/profile")}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Profile</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("/notifications")}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors relative"
                  >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Alerts</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("/messages")}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Messages</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("/id")}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">ID Card</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("/settings")}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Settings</span>
                  </button>
                </div>
              </>
            )}

            {/* Navigation Groups - Bento Style */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {sidebarNavGroups.map((group) => (
                  <div key={group.title} className="mb-2">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="h-px flex-1 bg-border" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                        {group.title}
                      </h3>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className={cn(
                            "group flex flex-col items-start gap-2 rounded-2xl p-3 border border-transparent hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm transition-all duration-300 text-left",
                            isActive(item.href)
                              ? "bg-primary/10 border-primary/20"
                              : "bg-accent/40"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-xl shadow-sm border border-border/50 transition-all duration-300 group-hover:scale-110",
                            isActive(item.href) ? "bg-primary text-primary-foreground border-primary" : "bg-background group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground"
                          )}>
                            <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-primary-foreground" : "text-primary group-hover:text-primary-foreground transition-colors")} />
                          </div>
                          <span className={cn(
                            "text-xs font-semibold mt-1 transition-colors leading-tight line-clamp-2",
                            isActive(item.href) ? "text-primary" : "text-foreground group-hover:text-primary"
                          )}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            {user && (
              <div className="border-t p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut();
                    setSidebarOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
