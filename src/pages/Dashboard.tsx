import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useJobRecommendations } from "@/hooks/useJobRecommendations";
import { useCareerVelocity } from "@/hooks/useCareerVelocity";
import { useWorkExperience, useEducation } from "@/hooks/useExperience";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { GamificationWidget } from "@/components/gamification/GamificationWidget";
import { AIHub } from "@/components/blog/AIHub";
import { CareerVelocity } from "@/components/gamification/CareerVelocity";
import { GitHubWidget } from "@/components/dashboard/GitHubWidget";
import { LinkedInWidget } from "@/components/dashboard/LinkedInWidget";
import { CertificateWidget } from "@/components/dashboard/CertificateWidget";
import { motion } from "framer-motion";
import {
  Briefcase,
  GraduationCap,
  Calendar,
  FileText,
  TrendingUp,
  Eye,
  Search,
  Award,
  ArrowRight,
  Sparkles,
  
  AlertCircle,
  User,
  MapPin,
  Building2,
  Gamepad2,
  MessageSquare,
  Bell,
  BookOpen,
  Target,
  Rocket,
  
  Zap,
  Globe,
  Users,
  Mic,
  Brain,
  Code,
  PenTool,
  MessagesSquare,
  Bot,
  BrainCircuit,
  Copy,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const quickActions = [
  { icon: Briefcase, label: "Jobs", href: "/jobs", gradient: "from-blue-500 to-cyan-400" },
  { icon: GraduationCap, label: "Internships", href: "/internships", gradient: "from-emerald-500 to-teal-400" },
  { icon: FileText, label: "Resume", href: "/resume", gradient: "from-violet-500 to-purple-400" },
  { icon: Target, label: "Assessments", href: "/assessments", gradient: "from-amber-500 to-orange-400" },
  { icon: Mic, label: "Interview", href: "/interview-prep", gradient: "from-rose-500 to-pink-400" },
  { icon: BrainCircuit, label: "Flashcards", href: "/ai-flashcards", gradient: "from-sky-500 to-cyan-400" },
  { icon: Gamepad2, label: "Games", href: "/games", gradient: "from-pink-500 to-fuchsia-400" },
  { icon: Award, label: "Add Certificate", href: "/profile?tab=certifications", gradient: "from-amber-600 to-yellow-400" },
];

const careerTools = [
  { icon: Bot, label: "AI Profile Scan", href: "/ai-profile-analyzer", desc: "Scan GitHub/LinkedIn" },
  { icon: FileText, label: "Resume Builder", href: "/resume", desc: "ATS-optimized resumes" },
  { icon: PenTool, label: "Cover Letter", href: "/cover-letter", desc: "AI-generated letters" },
  { icon: MessagesSquare, label: "Interview Prep", href: "/interview-prep", desc: "Practice questions" },
  { icon: Mic, label: "Mock Interview", href: "/mock-interview", desc: "Simulated interviews" },
  { icon: Sparkles, label: "Career Counseling", href: "/career-counseling", desc: "AI career guidance" },
];

const exploreLinks = [
  { icon: Globe, label: "Career Counseling", href: "/career-counseling", desc: "AI-powered guidance" },
  { icon: Users, label: "Study Groups", href: "/study-groups", desc: "Learn together" },
  { icon: Code, label: "Projects", href: "/projects", desc: "Build & showcase" },
  { icon: Rocket, label: "Roadmap Creator", href: "/roadmap-creator", desc: "Plan your path" },
];

interface ProfileField {
  name: string;
  completed: boolean;
  href: string;
  action: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { score: velocityScore } = useCareerVelocity();
  const { data: jobRecommendations, isLoading: jobsLoading } = useJobRecommendations();
  
  const { experiences } = useWorkExperience();
  const { education } = useEducation();
  const { counts } = useUnreadCounts();
  const { referralCode, generateCode, isGenerating } = useReferrals();
  const { toast } = useToast();
  
  const shareLink = `${window.location.origin}/auth?mode=signup&ref=${referralCode}`;

  const copyLink = () => {
    if (!referralCode) {
      generateCode();
      toast({ 
        title: "Generating your code...", 
        description: "Your referral link is being created. Please try again in a moment.",
      });
      return;
    }
    navigator.clipboard.writeText(shareLink);
    toast({ title: "Share link copied!" });
  };
  

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const profileFields: ProfileField[] = [
    { name: "Full Name", completed: !!profile?.full_name, href: "/profile", action: "Add your name" },
    { name: "Headline", completed: !!profile?.headline, href: "/profile", action: "Add a headline" },
    { name: "Bio", completed: !!profile?.bio, href: "/profile", action: "Write your bio" },
    { name: "Location", completed: !!profile?.location, href: "/profile", action: "Add location" },
    { name: "Profile Photo", completed: !!profile?.avatar_url, href: "/profile", action: "Upload photo" },
    { name: "Work Experience", completed: experiences.length > 0, href: "/profile", action: "Add experience" },
    { name: "Education", completed: education.length > 0, href: "/profile", action: "Add education" },
    { name: "GitHub Profile", completed: !!profile?.github_url, href: "/ai-profile-analyzer", action: "Link GitHub" },
    { name: "LinkedIn Profile", completed: !!profile?.linkedin_url, href: "/ai-profile-analyzer", action: "Link LinkedIn" },
  ];

  const completedFields = profileFields.filter((f) => f.completed).length;
  const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);
  
  // Calculate dynamic stats based on profile completeness and career velocity
  const profileViews = Math.floor((velocityScore * 1.4) + (profileCompleteness / 2.5));
  const searchHits = Math.floor((velocityScore * 0.9) + (profileCompleteness / 3.2));

  const incompleteFields = profileFields.filter((f) => !f.completed).slice(0, 3);
  const topJobs = jobRecommendations?.slice(0, 4) || [];

  return (
    <MainLayout>
      <OnboardingFlow />
      <div className="relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />
        
        <div className="container py-6 space-y-8 flex flex-col items-stretch relative z-10">
        {/* ─── HERO PROFILE WITH BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-border/50 shadow-2xl shadow-primary/5"
        >
          {/* Banner Background */}
          <div className="relative h-40 md:h-56 w-full overflow-hidden">
            {profile?.banner_url ? (
              <img
                src={profile.banner_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-sky-400/20 via-primary/10 to-indigo-400/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
          </div>

          {/* Profile Content overlaid on banner */}
          <div className="relative -mt-12 px-6 pb-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
              <Avatar className="h-24 w-24 md:h-24 md:w-24 border-4 border-background shadow-lg ring-2 ring-primary/20 mx-auto md:mx-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-2xl md:text-2xl text-primary-foreground font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {greeting}{firstName ? `, ${firstName}` : ""}! 👋
                  </h1>
                </div>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  {profile?.headline || "Ready to build your career? Let's get started."}
                </p>
                {profile?.location && (
                  <p className="flex items-center justify-center md:justify-start gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </p>
                )}
              </div>

              <div className="flex justify-center md:justify-end gap-3 shrink-0 mt-4 md:mt-0">
                <Link to="/messages">
                  <Button variant="outline" size="icon" className="relative backdrop-blur-sm bg-background/60">
                    <MessageSquare className="h-4 w-4" />
                    {counts.messages > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                        {counts.messages}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/notifications">
                  <Button variant="outline" size="icon" className="relative backdrop-blur-sm bg-background/60">
                    <Bell className="h-4 w-4" />
                    {counts.notifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                        {counts.notifications}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="backdrop-blur-sm bg-background/60">
                    <Eye className="mr-2 h-4 w-4" /> View Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Profile strength bar */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Profile Strength</span>
                  <span className="font-bold text-foreground">{profileCompleteness}%</span>
                </div>
                <Progress value={profileCompleteness} className="h-2" />
              </div>
              {profileCompleteness < 100 && (
                <Link to="/profile">
                  <Button size="sm" variant="secondary" className="text-xs">
                    Complete
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── QUICK ACTIONS GRID ─── */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Quick Actions
            </h2>
            <div className="h-px flex-1 bg-primary/10 ml-4 hidden sm:block" />
          </div>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickActions.map((action, i) => (
              <motion.div
                key={action.href}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <Link to={action.href}>
                  <div className="group flex flex-col items-center gap-3 rounded-[2rem] border border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 hover:bg-white hover:border-primary/30 cursor-pointer p-5 h-full">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-foreground/70 group-hover:text-primary transition-colors uppercase tracking-widest text-center">{action.label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── MAIN GRID ─── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Career Flow */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* AI Career Velocity Tracker */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-[2.5rem] overflow-hidden border-none shadow-xl shadow-slate-200/40">
              <CareerVelocity />
            </motion.div>

            {/* Gamification Widget - MOVED TO TOP OF FLOW */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <GamificationWidget />
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card rounded-[2.5rem] overflow-hidden border-none shadow-xl shadow-primary/5 p-1 mb-2">
              <div className="bg-primary/5 p-6 rounded-[2.2rem] flex flex-col sm:flex-row items-center justify-between border border-primary/20 text-center sm:text-left gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
                    <Target className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground leading-tight">Goal of the Day</h3>
                    <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">Complete: <span className="text-primary italic">"Clean Code" Section 1</span></p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3 py-1">+50 XP</Badge>
                </div>
              </div>
            </motion.div>

            {/* AI Hub Hourly Updates */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <AIHub />
            </motion.div>

            {/* AI Job Recommendations */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      AI Job Matches
                      {counts.jobs > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                          {counts.jobs} new
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Personalized for your skills & experience</CardDescription>
                  </div>
                  <Link to="/job-recommendations">
                    <Button variant="ghost" size="sm" className="gap-1 text-primary">
                      View All <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="p-4">
                  {jobsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
                          <Skeleton className="h-12 w-12 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : topJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Briefcase className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">No matches yet</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                        Complete your profile to get AI-powered job recommendations
                      </p>
                      <Link to="/profile" className="mt-4">
                        <Button size="sm">Complete Profile</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topJobs.map((job, i) => (
                        <motion.div
                          key={job.id}
                          custom={i}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          className="group flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-accent/30 hover:border-primary/20 cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted shrink-0">
                              {job.company?.logo_url ? (
                                <img src={job.company.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                              ) : (
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-foreground truncate">{job.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">{job.company?.name || "Company"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {job.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{job.location}</span>}
                                {job.job_type && <span>· {job.job_type}</span>}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={`shrink-0 font-bold ${
                              job.match_score >= 80
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                : job.match_score >= 60
                                ? "bg-amber-500/10 text-amber-600 border-amber-200"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {job.match_score}%
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Explore More */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <h2 className="text-lg font-semibold text-foreground mb-3">Explore More</h2>
              <div className="grid grid-cols-2 gap-3">
                {exploreLinks.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Card className="group h-full transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Games & Events Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="h-full overflow-hidden border-pink-200/30 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Gamepad2 className="h-5 w-5 text-pink-500" />
                      Games & Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link to="/games">
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                          <Award className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Quiz & Trivia</p>
                          <p className="text-xs text-muted-foreground">Test your knowledge</p>
                        </div>
                      </div>
                    </Link>
                    <Link to="/games">
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Speed Games</p>
                          <p className="text-xs text-muted-foreground">Memory & typing</p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-primary" />
                      Events
                      {counts.events > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                          {counts.events}
                        </Badge>
                      )}
                    </CardTitle>
                    <Link to="/events">
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        All <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No upcoming events</p>
                      <Link to="/events" className="mt-2">
                        <Button variant="link" size="sm" className="text-xs">Browse Events →</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Career Tools - matching reference image */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Career Tools
                  </CardTitle>
                  <CardDescription className="text-xs">AI-powered career assistance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {careerTools.map((tool) => (
                    <Link key={tool.href} to={tool.href}>
                      <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50 group">
                        <tool.icon className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{tool.label}</p>
                          <p className="text-xs text-muted-foreground">{tool.desc}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>


            {/* Professional Integration */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <GitHubWidget githubUrl={profile?.github_url} />
                <LinkedInWidget linkedinUrl={profile?.linkedin_url} />
              </div>
            </motion.div>


            {/* Activity Stats */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Eye className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Profile Views</p>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-foreground">{profileViews}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Search Hits</p>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-foreground">{searchHits}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Refer & Earn Growth Widget */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="border-primary/20 bg-primary/5 overflow-hidden relative group">
                <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                    <Users className="h-4 w-4" />
                    Refer & Earn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Invite your friends to the EdWorld OS and unlock premium AI features and exclusive badges.
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-background/50 border border-primary/20 rounded-lg px-3 py-1.5 text-[10px] font-mono text-muted-foreground truncate">
                      {referralCode ? shareLink : "Generating link..."}
                    </div>
                  </div>
                  <Button 
                    onClick={copyLink}
                    size="sm" 
                    className="w-full btn-premium text-[10px] uppercase font-black tracking-widest h-9 gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    {isGenerating ? "Activating..." : (referralCode ? "Copy Referral Link" : "Activate Referral Link")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Certificate of Completion */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <CertificateWidget 
                completed={profileCompleteness >= 80} 
                userName={profile?.full_name || ""} 
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
);
}
