import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useInterviewPrep, InterviewQuestion } from "@/hooks/useInterviewPrep";
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  Target,
  BookOpen,
  ChevronRight,
  Building2,
  Briefcase,
  Brain,
  Users,
  Zap,
} from "lucide-react";

const QUESTION_TYPE_CONFIG = {
  behavioral: { label: "Behavioral", icon: Users, color: "bg-blue-500/10 text-blue-600" },
  technical: { label: "Technical", icon: Brain, color: "bg-purple-500/10 text-purple-600" },
  situational: { label: "Situational", icon: Target, color: "bg-orange-500/10 text-orange-600" },
  "culture-fit": { label: "Culture Fit", icon: Building2, color: "bg-green-500/10 text-success" },
};

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", color: "bg-green-500/10 text-success" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-warning" },
  hard: { label: "Hard", color: "bg-red-500/10 text-destructive" },
};

export default function InterviewPrep() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);

  const interviewPrep = useInterviewPrep();

  const handleGenerate = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) return;
    interviewPrep.mutate({ jobTitle, jobDescription, company, difficulty, questionCount });
  };

  const QuestionCard = ({ question, index }: { question: InterviewQuestion; index: number }) => {
    const typeConfig = QUESTION_TYPE_CONFIG[question.type];
    const difficultyConfig = DIFFICULTY_CONFIG[question.difficulty || "medium"];
    const TypeIcon = typeConfig.icon;

    return (
      <AccordionItem value={`q-${index}`} className="border rounded-lg px-4 mb-3">
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-start gap-4 text-left w-full pr-4">
            <div className={`p-2 rounded-lg ${typeConfig.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{question.question}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className={typeConfig.color}>
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline" className={difficultyConfig.color}>
                  {difficultyConfig.label}
                </Badge>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-2 pb-4">
          <div className="space-y-4 pl-14">
            <div>
              <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
                <Lightbulb className="h-4 w-4" /> Tips for Answering
              </h4>
              <ul className="space-y-1">
                {question.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
                <BookOpen className="h-4 w-4" /> Example Answer Framework
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                {question.example_answer}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Interview Prep
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate personalized interview questions based on job descriptions
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Job Details
              </CardTitle>
              <CardDescription>Enter the job information to generate tailored questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g., Google, TCS, Infosys"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Questions</Label>
                  <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="8">8 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={!jobTitle.trim() || !jobDescription.trim() || interviewPrep.isPending}
              >
                {interviewPrep.isPending ? (
                  <>Generating Questions...</>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Generate Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {interviewPrep.isPending ? (
              <Card>
                <CardContent className="py-8">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : interviewPrep.data ? (
              <Tabs defaultValue="questions">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="questions" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Questions ({interviewPrep.data.questions.length})
                  </TabsTrigger>
                  <TabsTrigger value="tips" className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" /> Tips
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    {interviewPrep.data.questions.map((q, i) => (
                      <QuestionCard key={i} question={q} index={i} />
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="tips" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Interview Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3">Preparation Tips</h4>
                        <ul className="space-y-2">
                          {interviewPrep.data.general_tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {interviewPrep.data.company_research_tips && (
                        <div>
                          <h4 className="font-medium mb-3">Company Research</h4>
                          <ul className="space-y-2">
                            {interviewPrep.data.company_research_tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Questions Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Enter a job title and description, then click "Generate Questions" to get personalized interview prep.
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
