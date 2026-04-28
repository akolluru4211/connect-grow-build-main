import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Lightbulb, Loader2, Clock, Wrench, GraduationCap, Sparkles, ExternalLink,
  Copy, Check, BookmarkPlus, ChevronDown, ChevronUp,
  Star, Github, Youtube, ListChecks, Globe, Download,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { downloadDetailedProjectPDF } from "@/lib/generateProjectPDF";
import { generateJSON } from "@/lib/gemini";

interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: string;
  duration: string;
  skills: string[];
  implementationSteps: string[];
  realWorldUse: string;
  githubSearchQuery: string;
  youtubeSearchQuery: string;
  estimatedCost: string;
  uniqueSellingPoint: string;
}

const BRANCHES = [
  "Computer Science (CSE)",
  "Electronics & Communication (ECE)",
  "Electrical Engineering (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology (IT)",
  "Data Science",
  "Artificial Intelligence & ML",
  "Biotechnology",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Automobile Engineering",
  "Biomedical Engineering",
  "Environmental Engineering",
  "Cyber Security",
];

const PROJECT_TYPES = [
  "Final Year Project",
  "Mini Project",
  "Hackathon Project",
  "Research Project",
  "Startup Idea",
  "Open Source Contribution",
];

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function ProjectIdeaGenerator() {
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [interests, setInterests] = useState("");
  const [projectType, setProjectType] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savedProjects, setSavedProjects] = useState<Set<number>>(new Set());

  const generateIdeas = async () => {
    if (!branch) {
      toast.error("Please select your branch");
      return;
    }
    setIsLoading(true);
    setExpandedProject(null);
    try {
      const prompt = `Generate 3-5 unique and innovative project ideas for a student with the following profile:
      - Branch: ${branch}
      - Semester: ${semester || "Any"}
      - Difficulty: ${difficulty || "Any"}
      - Interests: ${interests || "General engineering"}
      - Project Type: ${projectType || "Any"}
      - Team Size: ${teamSize || "Any"}

      For each project, provide:
      1. title: A catchy and descriptive title
      2. description: A clear 2-3 sentence overview
      3. techStack: Array of key technologies (languages, frameworks, hardware)
      4. difficulty: "Beginner", "Intermediate", or "Advanced"
      5. duration: Estimated time to complete (e.g., "4 weeks", "3 months")
      6. skills: Array of 3-5 skills the student will learn
      7. implementationSteps: Array of 5-8 chronological steps to build it
      8. realWorldUse: A brief explanation of the practical application
      9. githubSearchQuery: A specific query to find similar projects on GitHub
      10. youtubeSearchQuery: A specific query for video tutorials
      11. estimatedCost: e.g., "Free", "Low Cost (<₹1000)", or specific amount
      12. uniqueSellingPoint: What makes this project stand out

      The response must be a JSON object with a "projects" array.`;

      const data = await generateJSON<{ projects: ProjectIdea[] }>(prompt);
      
      if (!data.projects || data.projects.length === 0) {
        throw new Error("No project ideas were generated. Please try again.");
      }

      setProjects(data.projects);
      toast.success(`Generated ${data.projects.length} project ideas!`);
    } catch (err) {
      console.error("Project Generation Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate ideas");
    } finally {
      setIsLoading(false);
    }
  };

  const copyProject = (p: ProjectIdea, idx: number) => {
    const text = `📋 ${p.title}\n\n${p.description}\n\n🛠 Tech Stack: ${p.techStack.join(", ")}\n⏱ Duration: ${p.duration}\n📊 Difficulty: ${p.difficulty}\n💰 Cost: ${p.estimatedCost}\n\n🚀 Implementation Steps:\n${p.implementationSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n🌍 Real World Use: ${p.realWorldUse}\n⭐ USP: ${p.uniqueSellingPoint}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Project details copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const saveProject = (idx: number) => {
    setSavedProjects(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
    toast.success(savedProjects.has(idx) ? "Removed from saved" : "Saved for later!");
  };

  const downloadProjectPDF = (p: ProjectIdea) => {
    downloadDetailedProjectPDF(p);
  };

  const difficultyColor = (d: string) => {
    if (d === "Beginner") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (d === "Advanced") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const costIcon = (c: string) => {
    if (c?.includes("Free")) return "🆓";
    if (c?.includes("Low")) return "💰";
    return "💎";
  };

  return (
    <MainLayout>
      <div className="container max-w-5xl py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Lightbulb className="h-4 w-4" />
            AI Project Idea Generator
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Get Winning Project Ideas</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered project ideas tailored to your branch, semester, and interests — with implementation roadmaps, GitHub references, and YouTube tutorials.
          </p>
        </div>

        {/* Input Form */}
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Branch *</label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger><SelectValue placeholder="Select your branch" /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Semester</label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger><SelectValue placeholder="Any semester" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Project Type</label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue placeholder="Any difficulty" /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Team Size</label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger><SelectValue placeholder="Any size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Solo</SelectItem>
                    <SelectItem value="2">2 members</SelectItem>
                    <SelectItem value="3-4">3-4 members</SelectItem>
                    <SelectItem value="5+">5+ members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Interests / Keywords</label>
                <Input placeholder="e.g., IoT, Web Dev, AI, Healthcare..." value={interests} onChange={e => setInterests(e.target.value)} />
              </div>
            </div>
            <Button onClick={generateIdeas} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Ideas (takes ~15s)...</> : <><Sparkles className="h-4 w-4" /> Generate Project Ideas</>}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {projects.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">🎯 {projects.length} Ideas Generated</h2>
                {savedProjects.size > 0 && (
                  <Badge variant="secondary">{savedProjects.size} saved</Badge>
                )}
              </div>

              {projects.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className={`hover:shadow-md transition-all ${savedProjects.has(i) ? "ring-1 ring-primary/30" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-primary font-mono text-sm">#{i + 1}</span>
                            {p.title}
                          </CardTitle>
                          {p.uniqueSellingPoint && (
                            <CardDescription className="flex items-center gap-1.5">
                              <Star className="h-3 w-3 text-amber-500" />
                              {p.uniqueSellingPoint}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={difficultyColor(p.difficulty)}>{p.difficulty}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{p.description}</p>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.duration}</span>
                        {p.estimatedCost && <span className="flex items-center gap-1">{costIcon(p.estimatedCost)} {p.estimatedCost}</span>}
                        {p.realWorldUse && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{p.realWorldUse}</span>}
                      </div>

                      {/* Tech Stack */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground"><Wrench className="h-3 w-3" /> Tech Stack</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.techStack.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground"><GraduationCap className="h-3 w-3" /> Skills You'll Learn</div>
                        <div className="flex flex-wrap gap-1.5">
                          {p.skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                      </div>

                      {/* Expandable section */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary"
                        onClick={() => setExpandedProject(expandedProject === i ? null : i)}
                      >
                        {expandedProject === i ? <><ChevronUp className="h-4 w-4" /> Hide Details</> : <><ChevronDown className="h-4 w-4" /> Show Implementation Steps & Resources</>}
                      </Button>

                      <AnimatePresence>
                        {expandedProject === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                            {/* Implementation Steps */}
                            {p.implementationSteps?.length > 0 && (
                              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><ListChecks className="h-4 w-4 text-primary" /> Implementation Roadmap</h4>
                                <ol className="space-y-2">
                                  {p.implementationSteps.map((step, j) => (
                                    <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{j + 1}</span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* External Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {p.githubSearchQuery && (
                                <a
                                  href={`https://github.com/search?q=${encodeURIComponent(p.githubSearchQuery)}&type=repositories`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm"
                                >
                                  <Github className="h-4 w-4 text-foreground" />
                                  <span className="flex-1 text-foreground">Find Similar on GitHub</span>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </a>
                              )}
                              {p.youtubeSearchQuery && (
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(p.youtubeSearchQuery)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm"
                                >
                                  <Youtube className="h-4 w-4 text-destructive" />
                                  <span className="flex-1 text-foreground">Watch Tutorials</span>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={() => copyProject(p, i)}>
                          {copiedIdx === i ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => saveProject(i)} className={savedProjects.has(i) ? "text-primary" : ""}>
                          <BookmarkPlus className="h-3 w-3" /> {savedProjects.has(i) ? "Saved" : "Save"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadProjectPDF(p)} className="text-primary">
                          <Download className="h-3 w-3" /> Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
