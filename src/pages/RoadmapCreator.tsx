import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIRoadmap, AIRoadmap } from "@/hooks/useAIRoadmap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Sparkles, Target, BookOpen, Trophy, DollarSign, 
  CheckCircle, Clock, Star, ChevronRight, GraduationCap,
  Briefcase, Award, Lightbulb
} from "lucide-react";

const popularCareerPaths = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Product Manager",
  "UX Designer",
  "Cloud Architect",
  "Cybersecurity Analyst",
];

export default function RoadmapCreator() {
  const [careerGoal, setCareerGoal] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const [timeframe, setTimeframe] = useState("6 months");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [roadmap, setRoadmap] = useState<AIRoadmap | null>(null);

  const roadmapMutation = useAIRoadmap();

  const generateRoadmap = async () => {
    if (!careerGoal.trim()) return;

    const result = await roadmapMutation.mutateAsync({
      careerGoal,
      currentSkills,
      timeframe,
      experienceLevel,
    });

    setRoadmap(result);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "essential": return "bg-red-500/10 text-destructive border-red-500/20";
      case "important": return "bg-yellow-500/10 text-warning border-yellow-500/20";
      default: return "bg-green-500/10 text-success border-green-500/20";
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500/10 text-success";
      case "intermediate": return "bg-yellow-500/10 text-warning";
      case "advanced": return "bg-red-500/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
            <Map className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Roadmap Creator</h1>
            <p className="text-muted-foreground">
              Generate personalized learning paths for your career goals
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Form */}
          <Card className="lg:sticky lg:top-4 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Career Goal
              </CardTitle>
              <CardDescription>
                Tell us what you want to become and we'll create a personalized roadmap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Career Goal *</Label>
                <Input
                  placeholder="e.g., Full Stack Developer"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {popularCareerPaths.slice(0, 5).map((path) => (
                    <Badge
                      key={path}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => setCareerGoal(path)}
                    >
                      {path}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Skills</Label>
                <Textarea
                  placeholder="HTML, CSS, Basic JavaScript..."
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="9 months">9 months</SelectItem>
                      <SelectItem value="12 months">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as typeof experienceLevel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                onClick={generateRoadmap}
                disabled={!careerGoal.trim() || roadmapMutation.isPending}
              >
                {roadmapMutation.isPending ? (
                  <>Generating Roadmap...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Roadmap
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Roadmap Display */}
          <div className="lg:col-span-2 space-y-6">
            {roadmapMutation.isPending ? (
              <Card>
                <CardContent className="py-8">
                  <div className="space-y-6">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-20 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : roadmap ? (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5">
                    <CardContent className="py-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                          <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold">{roadmap.title}</h2>
                          <p className="text-muted-foreground mt-1">{roadmap.summary}</p>
                          {roadmap.totalDuration && (
                            <div className="flex items-center gap-2 mt-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{roadmap.totalDuration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Phases */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Learning Phases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {roadmap.phases.map((phase, index) => (
                          <AccordionItem key={index} value={`phase-${index}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-4 text-left">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-sm font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{phase.name}</p>
                                  <p className="text-sm text-muted-foreground">{phase.duration}</p>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-12 space-y-4">
                              {phase.description && (
                                <p className="text-sm text-muted-foreground">{phase.description}</p>
                              )}

                              {/* Skills */}
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Star className="h-4 w-4" /> Skills to Learn
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {phase.skills.map((skill, i) => (
                                    <Badge key={i} variant="outline" className={getPriorityColor(skill.priority)}>
                                      {skill.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Projects */}
                              {phase.projects && phase.projects.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" /> Projects
                                  </h4>
                                  <div className="space-y-2">
                                    {phase.projects.map((project, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <ChevronRight className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                                        <div>
                                          <span className="font-medium">{project.name}</span>
                                          {project.difficulty && (
                                            <Badge className={`ml-2 ${getDifficultyColor(project.difficulty)}`}>
                                              {project.difficulty}
                                            </Badge>
                                          )}
                                          <p className="text-muted-foreground">{project.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Milestones */}
                              {phase.milestones && phase.milestones.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> Milestones
                                  </h4>
                                  <ul className="space-y-1">
                                    {phase.milestones.map((milestone, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {milestone}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>

                  {/* Certifications */}
                  {roadmap.certifications && roadmap.certifications.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Recommended Certifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {roadmap.certifications.map((cert, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <Trophy className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{cert.name}</p>
                                <p className="text-xs text-muted-foreground">{cert.provider}</p>
                                {cert.cost && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    {cert.cost}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Salary Expectations */}
                  {roadmap.salaryExpectations && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Salary Expectations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Entry Level</p>
                            <p className="text-xl font-bold text-emerald-600">{roadmap.salaryExpectations.entry}</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Mid Level</p>
                            <p className="text-xl font-bold text-cyan-600">{roadmap.salaryExpectations.mid}</p>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Senior Level</p>
                            <p className="text-xl font-bold text-purple-600">{roadmap.salaryExpectations.senior}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Interview Tips */}
                  {roadmap.interviewTips && roadmap.interviewTips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Interview Preparation Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {roadmap.interviewTips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Map className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Roadmap Generated Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Enter your career goal and click "Generate Roadmap" to get a personalized learning path
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
