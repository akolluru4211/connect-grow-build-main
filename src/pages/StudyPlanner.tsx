import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Sparkles, BookOpen, Clock, Trash2, Plus, Loader2, Target, Lightbulb } from "lucide-react";
import { useStudyPlanner } from "@/hooks/useStudyPlanner";

export default function StudyPlanner() {
  const { plans, isLoading, generatePlan, deletePlan } = useStudyPlanner();
  const [goal, setGoal] = useState("");
  const [subjects, setSubjects] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("3");
  const [activeTab, setActiveTab] = useState("create");

  const handleGenerate = () => {
    if (!goal.trim()) return;
    generatePlan.mutate({
      goal: goal.trim(),
      subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
      examDate: examDate || undefined,
      hoursPerDay: Number(hoursPerDay) || 3,
    });
    setActiveTab("plans");
  };

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Study Planner</h1>
          </div>
          <p className="text-muted-foreground">
            Generate personalized study schedules powered by AI based on your goals and timeline.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" /> Create Plan
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <BookOpen className="h-4 w-4" /> My Plans ({plans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Create Study Plan
                </CardTitle>
                <CardDescription>Tell us your goal and we'll create a personalized schedule.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="goal">What's your study goal?</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., Prepare for AWS Cloud Practitioner exam"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                  <Input
                    id="subjects"
                    placeholder="e.g., Cloud Computing, Networking, Security"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="examDate">Exam/Target Date (optional)</Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours">Study hours per day</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      max="12"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={!goal.trim() || generatePlan.isPending} className="w-full gap-2">
                  {generatePlan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generatePlan.isPending ? "Generating..." : "Generate Study Plan"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-6 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No study plans yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first AI-powered study plan!</p>
                  <Button onClick={() => setActiveTab("create")}>Create Plan</Button>
                </CardContent>
              </Card>
            ) : (
              plans.map((plan: any) => {
                const schedule = plan.schedule || {};
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{plan.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            {plan.goal && <span>{plan.goal}</span>}
                            {plan.exam_date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(plan.exam_date).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePlan.mutate(plan.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {plan.subjects?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.subjects.map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {/* Weekly Schedule */}
                      {schedule.weeklySchedule?.map((week: any) => (
                        <div key={week.week} className="mb-6">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Badge variant="outline">Week {week.week}</Badge>
                            {week.theme}
                          </h4>
                          <div className="grid gap-2">
                            {week.days?.map((day: any) => (
                              <div key={day.day} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                                <span className="text-xs font-medium text-primary w-16 shrink-0 pt-0.5">{day.day}</span>
                                <div className="flex flex-wrap gap-1">
                                  {day.tasks?.map((task: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {task.subject}: {task.topic} ({task.duration})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Tips */}
                      {schedule.tips?.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" /> Study Tips
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {schedule.tips.map((tip: string, i: number) => (
                              <li key={i}>• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
