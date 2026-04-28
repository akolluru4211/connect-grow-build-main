import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizGame } from "@/components/games/QuizGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { PatternGame } from "@/components/games/PatternGame";
import { MathChallenge } from "@/components/games/MathChallenge";
import { WordScramble } from "@/components/games/WordScramble";
import { TypingSpeed } from "@/components/games/TypingSpeed";
import { TriviaGame } from "@/components/games/TriviaGame";
import {
  Gamepad2,
  Brain,
  HelpCircle,
  Calculator,
  Target,
  Zap,
  Keyboard,
  BookOpen,
  GraduationCap,
  Sparkles,
  Trophy,
  Rocket,
  Palette,
  FlaskConical,
  Globe,
  Lightbulb,
  Map,
  FileText,
  Users,
  Star,
  ArrowRight,
  Compass,
  Microscope,
  Atom,
  Binary,
  Music,
  PenTool,
  ChevronLeft,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Subject cards for class 6-10
const subjects = [
  { name: "Mathematics", icon: Calculator, color: "from-blue-500 to-cyan-400", description: "Algebra, Geometry, Statistics & more" },
  { name: "Science", icon: FlaskConical, color: "from-green-500 to-emerald-400", description: "Physics, Chemistry, Biology" },
  { name: "English", icon: BookOpen, color: "from-purple-500 to-violet-400", description: "Grammar, Writing, Literature" },
  { name: "Social Studies", icon: Globe, color: "from-orange-500 to-amber-400", description: "History, Geography, Civics" },
  { name: "Computer Science", icon: Binary, color: "from-pink-500 to-rose-400", description: "Coding, Digital Literacy" },
  { name: "General Knowledge", icon: Lightbulb, color: "from-yellow-500 to-amber-300", description: "Current Affairs & Trivia" },
];

// Fun games for kids
const kidGames = [
  { id: "quiz", name: "Knowledge Quiz", description: "Test what you know!", icon: HelpCircle, difficulty: "Easy" },
  { id: "memory", name: "Memory Match", description: "Train your brain!", icon: Brain, difficulty: "Easy" },
  { id: "pattern", name: "Pattern Game", description: "Remember the sequence!", icon: Target, difficulty: "Medium" },
  { id: "math", name: "Math Challenge", description: "Quick math problems!", icon: Calculator, difficulty: "Medium" },
  { id: "word", name: "Word Scramble", description: "Unscramble the words!", icon: Type, difficulty: "Easy" },
  { id: "typing", name: "Typing Speed", description: "How fast can you type?", icon: Keyboard, difficulty: "Easy" },
  { id: "trivia", name: "Trivia Time", description: "Fun trivia questions!", icon: BookOpen, difficulty: "Hard" },
];

// Career exploration for kids
const careerPaths = [
  { name: "Engineer", icon: Atom, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", description: "Build things, solve problems" },
  { name: "Doctor", icon: Microscope, color: "bg-success/10 dark:bg-green-900/30 text-success dark:text-green-400", description: "Help people stay healthy" },
  { name: "Artist", icon: Palette, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", description: "Create beautiful things" },
  { name: "Scientist", icon: FlaskConical, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", description: "Discover new things" },
  { name: "Writer", icon: PenTool, color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400", description: "Tell amazing stories" },
  { name: "Musician", icon: Music, color: "bg-yellow-100 dark:bg-yellow-900/30 text-warning dark:text-yellow-400", description: "Create music & melodies" },
  { name: "Programmer", icon: Binary, color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400", description: "Build apps & websites" },
  { name: "Explorer", icon: Compass, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", description: "Travel & discover" },
];

// Quick links to platform features
const quickLinks = [
  { label: "Exam Helper", href: "/exam-helper", icon: FileText, description: "Upload your PDFs & get study material" },
  { label: "AI Study Planner", href: "/study-planner", icon: Sparkles, description: "Get a personalized study schedule" },
  { label: "AI Roadmap", href: "/roadmap-creator", icon: Map, description: "Plan your learning journey" },
  { label: "Courses", href: "/courses", icon: GraduationCap, description: "Learn new skills with courses" },
  { label: "Study Groups", href: "/study-groups", icon: Users, description: "Study together with friends" },
  { label: "Knowledge Center", href: "/knowledge-center", icon: BookOpen, description: "Books, guides & resources" },
  { label: "Assessments", href: "/assessments", icon: Target, description: "Test your knowledge" },
  { label: "Resource Library", href: "/resource-library", icon: FileText, description: "Notes, papers & more" },
  { label: "Habit Tracker", href: "/habit-tracker", icon: Star, description: "Build good study habits" },
  { label: "Games & Challenges", href: "/games", icon: Gamepad2, description: "Learn while having fun" },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy, description: "See top performers" },
  { label: "AI Mentors", href: "/ai-mentors", icon: Sparkles, description: "Get AI guidance" },
];

// Daily tips
const dailyTips = [
  "📚 Read for 20 minutes every day to boost your vocabulary!",
  "🧮 Practice 5 math problems before school starts!",
  "✍️ Write a short paragraph about your day to improve writing!",
  "🔬 Ask 'why' about things you see around you — that's how scientists think!",
  "🎯 Set a small goal every morning and try to achieve it!",
  "💡 Teaching someone else what you learned helps you remember it better!",
];

export default function KidsHub() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number>(6);
  const randomTip = dailyTips[Math.floor(Math.random() * dailyTips.length)];

  const renderGame = () => {
    switch (selectedGame) {
      case "quiz": return <QuizGame />;
      case "memory": return <MemoryGame />;
      case "pattern": return <PatternGame />;
      case "math": return <MathChallenge />;
      case "word": return <WordScramble />;
      case "typing": return <TypingSpeed />;
      case "trivia": return <TriviaGame />;
      default: return null;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + i * 0.5}s`,
                }}
              >
                {i % 3 === 0 ? <Star className="h-6 w-6 text-primary" /> : 
                 i % 3 === 1 ? <Sparkles className="h-6 w-6 text-primary" /> : 
                 <Rocket className="h-6 w-6 text-primary" />}
              </div>
            ))}
          </div>

          <div className="container py-8 md:py-12 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="flex-1 text-center md:text-left">
                <Badge variant="secondary" className="mb-3 gap-1.5 text-sm px-3 py-1">
                  <Rocket className="h-3.5 w-3.5" />
                  Class 6-10 Students
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    Kids Learning Hub
                  </span>
                  {" "}🚀
                </h1>
                <p className="text-muted-foreground text-base md:text-lg max-w-xl">
                  Learn, play, and explore your future — all in one place! Made specially for students like you.
                </p>
              </div>

              {/* Class Selector */}
              <Card className="shrink-0 w-full md:w-auto">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2 text-center">Select Your Class</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[6, 7, 8, 9, 10].map((cls) => (
                      <Button
                        key={cls}
                        size="sm"
                        variant={selectedClass === cls ? "default" : "outline"}
                        className={cn("min-w-[48px] font-bold", selectedClass === cls && "shadow-md")}
                        onClick={() => setSelectedClass(cls)}
                      >
                        {cls}th
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Tip */}
            <Card className="mt-6 border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <Lightbulb className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm font-medium">{randomTip}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-6 md:py-8">
          <Tabs defaultValue="study" className="space-y-6">
            <TabsList className="flex w-full overflow-x-auto gap-1 h-auto flex-wrap">
              <TabsTrigger value="study" className="gap-1.5 text-xs sm:text-sm">
                <BookOpen className="h-4 w-4" />
                Study Tools
              </TabsTrigger>
              <TabsTrigger value="games" className="gap-1.5 text-xs sm:text-sm">
                <Gamepad2 className="h-4 w-4" />
                Fun & Games
              </TabsTrigger>
              <TabsTrigger value="career" className="gap-1.5 text-xs sm:text-sm">
                <Compass className="h-4 w-4" />
                Career Explorer
              </TabsTrigger>
              <TabsTrigger value="explore" className="gap-1.5 text-xs sm:text-sm">
                <Rocket className="h-4 w-4" />
                Explore All
              </TabsTrigger>
            </TabsList>

            {/* STUDY TOOLS TAB */}
            <TabsContent value="study" className="space-y-8">
              {/* Subjects Grid */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Subjects for Class {selectedClass}
                </h2>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                  {subjects.map((subject) => (
                    <Card
                      key={subject.name}
                      className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.03] overflow-hidden"
                      onClick={() => navigate("/exam-helper")}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform", subject.color)}>
                          <subject.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{subject.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{subject.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Study Features */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Study Superpowers
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { title: "📄 Exam Helper", desc: "Upload your textbook PDF and get quizzes, flashcards, notes & more!", href: "/exam-helper", cta: "Try Now" },
                    { title: "📅 AI Study Planner", desc: "Get a personalized 4-week study plan made just for you!", href: "/study-planner", cta: "Plan Now" },
                    { title: "🗺️ Learning Roadmap", desc: "See the step-by-step path to master any subject!", href: "/roadmap-creator", cta: "Create Roadmap" },
                    { title: "📝 Assessments", desc: "Take quizzes and tests to check how much you've learned!", href: "/assessments", cta: "Take Test" },
                    { title: "📚 Resource Library", desc: "Find notes, past papers, and study materials shared by others!", href: "/resource-library", cta: "Browse" },
                    { title: "✅ Habit Tracker", desc: "Build daily study habits and track your streaks!", href: "/habit-tracker", cta: "Start Tracking" },
                  ].map((item) => (
                    <Card key={item.title} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(item.href)}>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-base mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                        <Button variant="outline" size="sm" className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {item.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* FUN & GAMES TAB */}
            <TabsContent value="games" className="space-y-6">
              {selectedGame ? (
                <div className="space-y-4">
                  <Button variant="ghost" onClick={() => setSelectedGame(null)} className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Back to Games
                  </Button>
                  {renderGame()}
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                      Brain Games 🎮
                    </h2>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {kidGames.map((game) => (
                        <Card
                          key={game.id}
                          className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.03] group"
                          onClick={() => setSelectedGame(game.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                              <game.icon className="h-7 w-7 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{game.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">{game.description}</p>
                            <Badge variant="secondary" className="text-[10px]">{game.difficulty}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Points Banner */}
                  <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardContent className="flex items-center gap-4 py-5">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">Earn Points While Playing! 🏆</h3>
                        <p className="text-sm text-muted-foreground">
                          Complete games to earn points and climb the leaderboard. Challenge your friends!
                        </p>
                      </div>
                      <Button variant="outline" className="shrink-0 hidden sm:flex" onClick={() => navigate("/leaderboard")}>
                        Leaderboard
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* CAREER EXPLORER TAB */}
            <TabsContent value="career" className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  What Do You Want to Be? 🌟
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  Explore different careers and find out what interests you the most!
                </p>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  {careerPaths.map((career) => (
                    <Card key={career.name} className="cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all group">
                      <CardContent className="p-5 text-center">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform", career.color)}>
                          <career.icon className="h-7 w-7" />
                        </div>
                        <h3 className="font-bold text-sm mb-1">{career.name}</h3>
                        <p className="text-xs text-muted-foreground">{career.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Career Tools for Kids */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Career Discovery Tools
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { title: "🤖 AI Career Guide", desc: "Chat with AI to discover careers that match your interests!", href: "/career-counseling" },
                    { title: "🗺️ Career Roadmap", desc: "See the subjects and skills you need for your dream job!", href: "/roadmap-creator" },
                    { title: "🎯 Skill Assessment", desc: "Find out what you're good at with fun assessments!", href: "/assessments" },
                    { title: "👩‍🏫 AI Mentors", desc: "Get guidance from AI mentors who know everything!", href: "/ai-mentors" },
                    { title: "🏢 Explore Companies", desc: "Learn about cool companies and what they do!", href: "/companies" },
                    { title: "📰 AI Updates", desc: "Stay updated with the latest technology news!", href: "/ai-updates" },
                  ].map((item) => (
                    <Card key={item.title} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(item.href)}>
                      <CardContent className="p-5">
                        <h3 className="font-bold text-base mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                        <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Explore <ArrowRight className="h-3 w-3" />
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* EXPLORE ALL TAB */}
            <TabsContent value="explore" className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Everything You Need 🎒
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickLinks.map((link) => (
                  <Card
                    key={link.href}
                    className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                    onClick={() => navigate(link.href)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{link.label}</h3>
                        <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
