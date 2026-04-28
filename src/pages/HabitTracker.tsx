import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Flame,
  Plus,
  Check,
  Trophy,
  Calendar,
  Target,
  Trash2,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { format, subDays } from "date-fns";

const COLORS = [
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Cyan", value: "cyan", class: "bg-cyan-500" },
];

export default function HabitTracker() {
  const { habits, completions, streak, isLoading, createHabit, toggleCompletion, deleteHabit } = useHabits();
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitDesc, setNewHabitDesc] = useState("");
  const [newHabitColor, setNewHabitColor] = useState("blue");
  const [dialogOpen, setDialogOpen] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE"), dayNum: format(d, "d") };
  });

  const isCompleted = (habitId: string, date: string) =>
    completions.some((c: any) => c.habit_id === habitId && c.completed_date === date);

  const todayCompletedCount = habits.filter((h: any) => isCompleted(h.id, today)).length;
  const todayProgress = habits.length > 0 ? (todayCompletedCount / habits.length) * 100 : 0;

  const handleCreate = () => {
    if (!newHabitName.trim()) return;
    createHabit.mutate({ name: newHabitName.trim(), description: newHabitDesc.trim() || undefined, color: newHabitColor });
    setNewHabitName("");
    setNewHabitDesc("");
    setNewHabitColor("blue");
    setDialogOpen(false);
  };

  const getColorClass = (color: string) => {
    const c = COLORS.find((cl) => cl.value === color);
    return c?.class || "bg-blue-500";
  };

  return (
    <MainLayout>
      <div className="container py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Habit Tracker</h1>
          </div>
          <p className="text-muted-foreground">Build consistent study habits and maintain your learning streak.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardContent className="pt-6 text-center">
              <Flame className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <div className="text-3xl font-bold">{streak?.current_streak || 0}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <div className="text-3xl font-bold">{streak?.longest_streak || 0}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-3xl font-bold">{streak?.total_active_days || 0}</div>
              <div className="text-sm text-muted-foreground">Total Active Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Progress */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={todayProgress} className="flex-1" />
              <span className="text-sm font-medium text-muted-foreground">
                {todayCompletedCount}/{habits.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Habits Grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Habits</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Habit Name</Label>
                  <Input
                    placeholder="e.g., Read 30 minutes"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="e.g., Read a technical book daily"
                    value={newHabitDesc}
                    onChange={(e) => setNewHabitDesc(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setNewHabitColor(c.value)}
                        className={`h-8 w-8 rounded-full ${c.class} transition-all ${
                          newHabitColor === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-60 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={!newHabitName.trim()} className="w-full">
                  Create Habit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {habits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No habits yet</h3>
              <p className="text-muted-foreground mb-4">Start building positive habits today!</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Habit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {habits.map((habit: any) => (
              <Card key={habit.id} className="overflow-hidden">
                <div className={`h-1 ${getColorClass(habit.color || "blue")}`} />
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-xs text-muted-foreground">{habit.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteHabit.mutate(habit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* 7-day view */}
                  <div className="flex gap-2 justify-between">
                    {last7Days.map((day) => {
                      const done = isCompleted(habit.id, day.date);
                      return (
                        <button
                          key={day.date}
                          onClick={() => toggleCompletion.mutate({ habitId: habit.id, date: day.date, completed: done })}
                          className="flex flex-col items-center gap-1"
                        >
                          <span className="text-[10px] text-muted-foreground">{day.label}</span>
                          <div
                            className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                              done
                                ? `${getColorClass(habit.color || "blue")} text-white scale-105`
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {done ? <Check className="h-4 w-4" /> : day.dayNum}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
