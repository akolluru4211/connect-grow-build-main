import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Briefcase,
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  LogOut,
  Settings,
  User,
  Search,
  Home,
  Gamepad2,
  Glasses,
  FileText,
  Building2,
  Trophy,
  Menu,
  MessageSquare,
  FolderKanban,
  Sparkles,
  ChevronDown,
  Map,
  Bot,
  Rocket,
  Code2,
  Crown,
  HelpCircle,
  BrainCircuit,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import logo from "@/assets/logo.png";

import { NotificationDropdown } from "@/components/NotificationDropdown";
import { MessageDropdown } from "@/components/MessageDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MobileSearch } from "@/components/MobileSearch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCareerVelocity } from "@/hooks/useCareerVelocity";
import { Zap } from "lucide-react";


const navGroups = [
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
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/help", label: "Help Center", icon: Bot, description: "Guides & FAQs" },
      { href: "/contact", label: "Contact Us", icon: MessageSquare, description: "Get support" },
      { href: "/feedback", label: "Feedback", icon: FileText, description: "Share your thoughts" },
    ],
  },
];

export function Header() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { counts } = useUnreadCounts();
  const { score } = useCareerVelocity();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const totalBadgeCount = counts.jobs + counts.courses + counts.events;

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block sticky top-0 z-50 w-full border-b border-primary/20 backdrop-blur-3xl bg-white/70">
      <div className="container flex h-14 items-center gap-4 md:h-16">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img
            src={logo}
            alt="EdWorld"
            width={120}
            height={30}
            className="h-8 w-auto object-contain md:h-9"
            loading="eager"
            fetchPriority="high"
          />
        </Link>

        {/* Desktop Navigation Menu */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive("/") && location.pathname === "/"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
            </NavigationMenuItem>

            {navGroups.slice(0, 4).map((group) => (
              <NavigationMenuItem key={group.title}>
                <NavigationMenuTrigger className="h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                  {group.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="flex w-[500px] md:w-[600px] lg:w-[700px] overflow-hidden rounded-2xl border border-primary/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                    {/* Left Accent Panel */}
                    <div className="hidden md:flex w-[220px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 flex-col justify-between border-r border-primary/10">
                      <div>
                        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/20 p-2.5">
                          <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="text-xl font-bold text-foreground mb-2">{group.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Discover tools and resources carefully curated for your {group.title.toLowerCase()} journey.
                        </p>
                      </div>
                      <div className="mt-auto">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          Explore All
                        </Badge>
                      </div>
                    </div>
                    {/* Right Links Grid */}
                    <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-background/50">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={item.href}
                              className={cn(
                                "group flex items-start gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-primary/5 hover:shadow-sm border border-transparent hover:border-primary/10",
                                isActive(item.href) && "bg-primary/10 border-primary/20"
                              )}
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border border-border group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                <item.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}

            {/* More dropdown for remaining items */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                More
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[320px] p-2 overflow-hidden rounded-2xl border border-primary/10 bg-background/95 backdrop-blur-xl shadow-2xl">
                  <div className="mb-2 px-3 py-2">
                    <h4 className="text-sm font-bold text-foreground">More Features</h4>
                    <p className="text-xs text-muted-foreground">Everything else you need</p>
                  </div>
                  <ul className="grid grid-cols-1 gap-1">
                    {navGroups.slice(4).flatMap(group => group.items).map((item) => (
                      <li key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-300 hover:bg-primary/5 hover:pl-4",
                              isActive(item.href) && "bg-primary/10 text-primary"
                            )}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                              <item.icon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                            </div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="hidden sm:flex sm:max-w-xs md:max-w-sm">
          <GlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {user && (
            <div 
              onClick={() => navigate('/dashboard')}
              className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer group"
            >
              <div className="relative">
                <Zap className="h-4 w-4 text-primary fill-current group-hover:animate-pulse" />
                <div className="absolute inset-0 bg-primary blur-lg opacity-20 group-hover:opacity-40 animate-pulse" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Career Velocity</span>
                <span className="text-sm font-black text-foreground">{score}%</span>
              </div>
            </div>
          )}


          {user ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate("/help")} className="text-muted-foreground hover:text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help Center</TooltipContent>
              </Tooltip>
              <NotificationDropdown />
              <MessageDropdown />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded w-fit">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/id")}>
                    <Crown className="mr-2 h-4 w-4" />
                    Digital ID Card
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/followers")}>
                    <Users className="mr-2 h-4 w-4" />
                    Followers & Following
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate("/help")} className="text-muted-foreground hover:text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help Center</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate("/auth?mode=signup")}>
                Join Now
              </Button>
            </div>
          )}

          {/* Hamburger Menu - Visible on ALL devices */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative shrink-0 rounded-lg border border-border bg-background hover:bg-accent h-10 w-10"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
              </TooltipTrigger>
              <TooltipContent>Browse all features</TooltipContent>
            </Tooltip>
            <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0 border-l border-primary/20 bg-background/95 backdrop-blur-3xl">
              <SheetHeader className="border-b border-border px-4 py-4">
                <SheetTitle className="flex items-center gap-2 text-left text-lg font-semibold text-primary">
                  <img src={logo} alt="EdWorld" className="h-8 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="p-4">
                  {/* Auth buttons for non-logged in users */}
                  {!user && (
                    <div className="mb-6 flex gap-3 rounded-xl bg-accent/50 p-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/auth");
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/auth?mode=signup");
                        }}
                      >
                        Join Free
                      </Button>
                    </div>
                  )}

                  {/* Home Link */}
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="mb-2 flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Home className="h-5 w-5" />
                    Home
                  </Link>
                  
                  {/* ID Card Link for Mobile */}
                  {user && (
                    <Link
                      to="/id"
                      onClick={() => setMenuOpen(false)}
                      className="mb-4 flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3 font-medium text-amber-500 transition-colors hover:bg-amber-500/20"
                    >
                      <Crown className="h-5 w-5" />
                      Digital ID Card
                    </Link>
                  )}

                  {/* Navigation Groups - Bento Style */}
                  {navGroups.map((group) => (
                    <div key={group.title} className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-border" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/70">
                          {group.title}
                        </h3>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {group.items.map((item) => {
                          const IconComponent = item.icon;
                          
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setMenuOpen(false)}
                              className="group flex flex-col items-start gap-2.5 rounded-2xl p-4 bg-accent/40 border border-transparent hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm transition-all duration-300"
                            >
                              <div className="p-2 rounded-xl bg-background shadow-sm border border-border/50 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                <IconComponent className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                                <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{item.description}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <MobileSearch open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </header>
  );
}