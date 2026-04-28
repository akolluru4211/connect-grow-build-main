import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAssessments, useAssessmentQuestions, useSubmitAssessment, useUserBadges, useLeaderboard, Assessment, Question } from "@/hooks/useAssessments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Clock, Trophy, CheckCircle, XCircle, ArrowRight, Medal, Star } from "lucide-react";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

const difficultyColors = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  expert: "bg-destructive/10 text-destructive",
};

export default function Assessments() {
  const { data: assessments, isLoading: loadingAssessments } = useAssessments();
  const { data: badges = [] } = useUserBadges();
  const { data: leaderboard = [] } = useLeaderboard();

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const { data: questions = [] } = useAssessmentQuestions(selectedAssessment?.id || "");
  const submitAssessment = useSubmitAssessment();

  const startAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowQuiz(true);
    setCurrentQuestion(0);
    setAnswers({});
    setStartTime(Date.now());
    setShowResults(false);
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    if (!selectedAssessment) return;

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });

    const finalScore = Math.round((correct / questions.length) * 100);
    const passed = finalScore >= (selectedAssessment.passing_score || 70);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    setScore(finalScore);
    setShowResults(true);

    submitAssessment.mutate({
      assessmentId: selectedAssessment.id,
      answers,
      score: finalScore,
      passed,
      timeTaken,
      skillId: selectedAssessment.skill_id || "",
      difficulty: selectedAssessment.difficulty,
    });
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setSelectedAssessment(null);
    setShowResults(false);
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Skill Assessments</h1>
          <p className="mt-2 text-muted-foreground">
            Prove your expertise and earn verified skill badges
          </p>
        </div>

        <Tabs defaultValue="assessments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="badges">My Badges ({badges.length})</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="assessments">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingAssessments ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="mb-4 h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                assessments?.map((assessment) => {
                  const hasBadge = badges.some(
                    (b) => b.skill_id === assessment.skill_id && b.badge_level === assessment.difficulty
                  );
                  return (
                    <Card key={assessment.id} className="transition-all hover:shadow-soft">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{assessment.title}</CardTitle>
                            <CardDescription>{assessment.skills?.name}</CardDescription>
                          </div>
                          {hasBadge && (
                            <Badge className="bg-success text-success-foreground">
                              <Award className="mr-1 h-3 w-3" /> Earned
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-sm text-muted-foreground">{assessment.description}</p>
                        <div className="mb-4 flex flex-wrap gap-2">
                          <Badge className={difficultyColors[assessment.difficulty as keyof typeof difficultyColors]}>
                            {assessment.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" /> {assessment.time_limit_minutes} min
                          </Badge>
                          <Badge variant="secondary">
                            {assessment.questions_count} questions
                          </Badge>
                        </div>
                        <Button className="w-full" onClick={() => startAssessment(assessment)}>
                          {hasBadge ? "Retake" : "Start"} Assessment <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="badges">
            {badges.length === 0 ? (
              <Card>
                <CardContent className="flex h-48 flex-col items-center justify-center">
                  <Award className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No badges earned yet. Take an assessment!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((badge) => (
                  <Card key={badge.id} className="text-center">
                    <CardContent className="pt-6">
                      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${difficultyColors[badge.badge_level as keyof typeof difficultyColors]}`}>
                        <Award className="h-8 w-8" />
                      </div>
                      <h3 className="font-semibold">{badge.skills?.name}</h3>
                      <p className="text-sm capitalize text-muted-foreground">{badge.badge_level} Level</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Earned {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" /> Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No rankings yet. Be the first!</p>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.user_id} className="flex items-center gap-4 rounded-lg border p-4">
                        <div className="flex h-10 w-10 items-center justify-center">
                          {index === 0 ? (
                            <Medal className="h-8 w-8 text-yellow-500" />
                          ) : index === 1 ? (
                            <Medal className="h-8 w-8 text-muted-foreground" />
                          ) : index === 2 ? (
                            <Medal className="h-8 w-8 text-amber-600" />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          )}
                        </div>
                        <Avatar>
                          <AvatarImage src={getDisplayAvatar(entry.full_name, entry.avatar_url)} />
                          <AvatarFallback>{getDisplayName(entry.full_name)[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{getDisplayName(entry.full_name)}</p>
                          <p className="text-sm text-muted-foreground">{entry.badge_count} badges</p>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="h-4 w-4" />
                          <span className="font-semibold">{entry.total_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quiz Dialog */}
        <Dialog open={showQuiz} onOpenChange={closeQuiz}>
          <DialogContent className="max-w-2xl">
            {!showResults ? (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedAssessment?.title}</DialogTitle>
                  <DialogDescription>
                    Question {currentQuestion + 1} of {questions.length}
                  </DialogDescription>
                </DialogHeader>
                <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mb-4" />
                
                {questions[currentQuestion] && (
                  <div className="space-y-6 py-4">
                    <h3 className="text-lg font-medium">{questions[currentQuestion].question}</h3>
                    <RadioGroup
                      value={answers[questions[currentQuestion].id]?.toString()}
                      onValueChange={(value) =>
                        handleAnswer(questions[currentQuestion].id, parseInt(value))
                      }
                    >
                      {questions[currentQuestion].options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent">
                          <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <DialogFooter>
                  {currentQuestion < questions.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      disabled={answers[questions[currentQuestion]?.id] === undefined}
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={answers[questions[currentQuestion]?.id] === undefined}
                    >
                      Submit Assessment
                    </Button>
                  )}
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Assessment Complete!</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center py-8">
                  {score >= (selectedAssessment?.passing_score || 70) ? (
                    <>
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle className="h-10 w-10 text-success" />
                      </div>
                      <h2 className="text-2xl font-bold text-success">Congratulations!</h2>
                      <p className="text-muted-foreground">You passed and earned a badge!</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-10 w-10 text-destructive" />
                      </div>
                      <h2 className="text-2xl font-bold">Keep Practicing!</h2>
                      <p className="text-muted-foreground">You need {selectedAssessment?.passing_score}% to pass.</p>
                    </>
                  )}
                  <div className="mt-6 text-center">
                    <p className="text-4xl font-bold">{score}%</p>
                    <p className="text-muted-foreground">Your Score</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={closeQuiz}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
