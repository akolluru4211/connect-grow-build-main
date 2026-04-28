import { Suspense, lazy, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { HelmetProvider } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingBar } from "@/components/layout/LoadingBar";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import logo from "@/assets/logo.png";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";



// Lazy load all page components
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Admin = lazy(() => import("./pages/Admin"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Courses = lazy(() => import("./pages/Courses"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Internships = lazy(() => import("./pages/Internships"));
const Assessments = lazy(() => import("./pages/Assessments"));
const Resume = lazy(() => import("./pages/Resume"));
const Events = lazy(() => import("./pages/Events"));
const Mentorship = lazy(() => import("./pages/Mentorship"));
const Messages = lazy(() => import("./pages/Messages"));
const Network = lazy(() => import("./pages/Network"));
const Settings = lazy(() => import("./pages/Settings"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const Install = lazy(() => import("./pages/Install"));
const JobRecommendations = lazy(() => import("./pages/JobRecommendations"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Followers = lazy(() => import("./pages/Followers"));
const JobFairs = lazy(() => import("./pages/JobFairs"));
const InterviewPrep = lazy(() => import("./pages/InterviewPrep"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const CoverLetter = lazy(() => import("./pages/CoverLetter"));
const MockInterview = lazy(() => import("./pages/MockInterview"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Games = lazy(() => import("./pages/Games"));
const Projects = lazy(() => import("./pages/Projects"));
const AIMentors = lazy(() => import("./pages/AIMentors"));
const RoadmapCreator = lazy(() => import("./pages/RoadmapCreator"));
const KnowledgeCenter = lazy(() => import("./pages/KnowledgeCenter"));
const StudyGroups = lazy(() => import("./pages/StudyGroups"));
const CampusEvents = lazy(() => import("./pages/CampusEvents"));
const ResourceLibrary = lazy(() => import("./pages/ResourceLibrary"));
const CareerCounseling = lazy(() => import("./pages/CareerCounseling"));
const StudyPlanner = lazy(() => import("./pages/StudyPlanner"));
const HabitTracker = lazy(() => import("./pages/HabitTracker"));
const ExamHelper = lazy(() => import("./pages/ExamHelper"));
const ProjectIdeaGenerator = lazy(() => import("./pages/ProjectIdeaGenerator"));
const PaperSummarizer = lazy(() => import("./pages/PaperSummarizer"));
const PresentationGenerator = lazy(() => import("./pages/PresentationGenerator"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIProfileAnalyzer = lazy(() => import("./pages/AIProfileAnalyzer"));
const AIFlashcards = lazy(() => import("./pages/AIFlashcards"));
const Help = lazy(() => import("./pages/Help"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Contact = lazy(() => import("./pages/Contact"));
const IdCard = lazy(() => import("./pages/IdCard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="relative flex flex-col items-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-8 border border-slate-100 rounded-full"
        />
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <img src={logo} alt="EdWorld" className="h-16 w-auto object-contain" />
        </motion.div>
        <div className="mt-8 flex flex-col items-center gap-2">
           <div className="flex gap-1.5">
             {[0, 1, 2].map((i) => (
               <motion.div
                 key={i}
                 animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                 className="h-1.5 w-1.5 rounded-full bg-primary"
               />
             ))}
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Booting OS</span>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RouteDelay({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isTransitioning) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/internships" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
        <Route path="/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
        <Route path="/resume" element={<ProtectedRoute><Resume /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
        <Route path="/companies/:id" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
        <Route path="/install" element={<Install />} />
        <Route path="/job-recommendations" element={<ProtectedRoute><JobRecommendations /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/followers" element={<ProtectedRoute><Followers /></ProtectedRoute>} />
        <Route path="/job-fairs" element={<ProtectedRoute><JobFairs /></ProtectedRoute>} />
        <Route path="/interview-prep" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
        <Route path="/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/ai-mentors" element={<ProtectedRoute><AIMentors /></ProtectedRoute>} />
        <Route path="/roadmap-creator" element={<ProtectedRoute><RoadmapCreator /></ProtectedRoute>} />
        <Route path="/knowledge-center" element={<ProtectedRoute><KnowledgeCenter /></ProtectedRoute>} />
        <Route path="/study-groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
        <Route path="/campus-events" element={<ProtectedRoute><CampusEvents /></ProtectedRoute>} />
        <Route path="/resource-library" element={<ProtectedRoute><ResourceLibrary /></ProtectedRoute>} />
        <Route path="/career-counseling" element={<ProtectedRoute><CareerCounseling /></ProtectedRoute>} />
        <Route path="/study-planner" element={<ProtectedRoute><StudyPlanner /></ProtectedRoute>} />
        <Route path="/habit-tracker" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
        <Route path="/exam-helper" element={<ProtectedRoute><ExamHelper /></ProtectedRoute>} />
        <Route path="/project-ideas" element={<ProtectedRoute><ProjectIdeaGenerator /></ProtectedRoute>} />
        <Route path="/paper-summarizer" element={<ProtectedRoute><PaperSummarizer /></ProtectedRoute>} />
        <Route path="/presentation-generator" element={<ProtectedRoute><PresentationGenerator /></ProtectedRoute>} />
        <Route path="/ai-profile-analyzer" element={<ProtectedRoute><AIProfileAnalyzer /></ProtectedRoute>} />
        <Route path="/ai-flashcards" element={<ProtectedRoute><AIFlashcards /></ProtectedRoute>} />
        <Route path="/help" element={<Help />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/id" element={<ProtectedRoute><IdCard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="edworld-theme">
        <TooltipProvider>
          <Analytics />
          <SpeedInsights />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LoadingBar />
            <AuthProvider>
              <SecurityProvider>
                <RouteDelay>
                  <AppRoutes />
                </RouteDelay>
              </SecurityProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
