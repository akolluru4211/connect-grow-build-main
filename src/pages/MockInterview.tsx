import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useEvaluateResponse } from "@/hooks/useMockInterview";
import { useInterviewPrep } from "@/hooks/useInterviewPrep";
import { useCheckAndAwardAchievements } from "@/hooks/useAchievements";
import { Video, Sparkles, ThumbsUp, AlertCircle, Lightbulb, RefreshCw, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { InterviewQuestion } from "@/hooks/useInterviewPrep";

export default function MockInterview() {
  const [jobTitle, setJobTitle] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    improved_answer: string;
    tips: string[];
    star_analysis?: {
      situation?: string;
      task?: string;
      action?: string;
      result?: string;
    };
  } | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const generateQuestionsMutation = useInterviewPrep();
  const evaluateMutation = useEvaluateResponse();
  const checkAchievements = useCheckAndAwardAchievements();

  const startInterview = async () => {
    if (!jobTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }

    const data = await generateQuestionsMutation.mutateAsync({
      jobTitle,
      jobDescription: `Preparing for ${jobTitle} role`,
      questionCount: 5,
    });

    if (data.questions?.length) {
      setQuestions(data.questions);
      setCurrentQuestion(data.questions[0]);
      setQuestionIndex(0);
      setIsInterviewStarted(true);
      setFeedback(null);
      setUserAnswer("");
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion) {
      toast.error("Please provide an answer");
      return;
    }

    const data = await evaluateMutation.mutateAsync({
      question: currentQuestion.question,
      answer: userAnswer,
      jobTitle,
      questionType: currentQuestion.type as "behavioral" | "technical" | "situational",
    });

    setFeedback(data);
    
    // Award achievement on first mock interview
    if (questionIndex === 0) {
      checkAchievements.mutate("mock_interview");
    }
  };

  const nextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setCurrentQuestion(questions[nextIndex]);
      setUserAnswer("");
      setFeedback(null);
    }
  };

  const resetInterview = () => {
    setIsInterviewStarted(false);
    setQuestions([]);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setUserAnswer("");
    setFeedback(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Mock Interview Simulator</h1>
            <p className="text-muted-foreground">
              Practice answering interview questions with AI feedback
            </p>
          </div>
        </div>

        {!isInterviewStarted ? (
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Start Your Practice Session</CardTitle>
              <CardDescription>
                Enter the job role you're preparing for to get relevant interview questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  placeholder="e.g., Frontend Developer, Product Manager"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <Button
                onClick={startInterview}
                disabled={generateQuestionsMutation.isPending}
                className="w-full"
              >
                {generateQuestionsMutation.isPending ? (
                  <>Generating Questions...</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Mock Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Question {questionIndex + 1} of {questions.length}
                  </span>
                  <Button variant="ghost" size="sm" onClick={resetInterview}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Restart
                  </Button>
                </div>
                <Progress value={((questionIndex + 1) / questions.length) * 100} />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Question & Answer */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentQuestion?.type}</Badge>
                    <Badge variant="secondary">{currentQuestion?.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-xl mt-2">
                    {currentQuestion?.question}
                  </CardTitle>
                  <CardDescription>
                    💡 {currentQuestion?.tips?.[0] || "Answer thoroughly and provide specific examples"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Answer</Label>
                    <Textarea
                      placeholder="Type your answer here... Try to be specific and use examples from your experience."
                      className="min-h-[200px]"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={!!feedback}
                    />
                  </div>

                  {!feedback ? (
                    <Button
                      onClick={submitAnswer}
                      disabled={evaluateMutation.isPending}
                      className="w-full"
                    >
                      {evaluateMutation.isPending ? (
                        <>Evaluating...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Get AI Feedback
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={nextQuestion}
                      disabled={questionIndex >= questions.length - 1}
                      className="w-full"
                    >
                      {questionIndex >= questions.length - 1
                        ? "Interview Complete!"
                        : "Next Question →"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Feedback */}
              <div className="space-y-4">
                {feedback ? (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <span>Your Score</span>
                          <span className={`text-4xl font-bold ${getScoreColor(feedback.score)}`}>
                            {feedback.score}/10
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress
                          value={feedback.score * 10}
                          className="h-3"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <Tabs defaultValue="feedback">
                          <TabsList className="mb-4">
                            <TabsTrigger value="feedback">Feedback</TabsTrigger>
                            <TabsTrigger value="improved">Better Answer</TabsTrigger>
                            {feedback.star_analysis && (
                              <TabsTrigger value="star">STAR Analysis</TabsTrigger>
                            )}
                          </TabsList>

                          <TabsContent value="feedback" className="space-y-4">
                            <div>
                              <h4 className="font-medium text-success flex items-center gap-1 mb-2">
                                <ThumbsUp className="h-4 w-4" /> Strengths
                              </h4>
                              <ul className="space-y-1">
                                {feedback.strengths.map((s, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium text-amber-600 flex items-center gap-1 mb-2">
                                <AlertCircle className="h-4 w-4" /> Areas to Improve
                              </h4>
                              <ul className="space-y-1">
                                {feedback.improvements.map((s, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-medium text-blue-600 flex items-center gap-1 mb-2">
                                <Lightbulb className="h-4 w-4" /> Tips
                              </h4>
                              <ul className="space-y-1">
                                {feedback.tips.map((t, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2">
                                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TabsContent>

                          <TabsContent value="improved">
                            <div className="bg-muted/50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">Suggested Improved Answer</h4>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {feedback.improved_answer}
                              </p>
                            </div>
                          </TabsContent>

                          {feedback.star_analysis && (
                            <TabsContent value="star">
                              <Accordion type="single" collapsible className="w-full">
                                {Object.entries(feedback.star_analysis).map(([key, value]) => (
                                  value && (
                                    <AccordionItem key={key} value={key}>
                                      <AccordionTrigger className="capitalize">
                                        {key}
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <p className="text-sm">{value}</p>
                                      </AccordionContent>
                                    </AccordionItem>
                                  )
                                ))}
                              </Accordion>
                            </TabsContent>
                          )}
                        </Tabs>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="h-full flex items-center justify-center min-h-[300px]">
                    <CardContent className="text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Answer the question and submit to get AI feedback</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
