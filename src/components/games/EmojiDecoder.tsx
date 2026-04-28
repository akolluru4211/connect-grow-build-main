import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Smile, Trophy, Clock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PUZZLES = [
  { emojis: "🔥🐛", answer: "firebug", hint: "A browser debugging tool" },
  { emojis: "🕸️📦", answer: "webpack", hint: "JS module bundler" },
  { emojis: "⚛️", answer: "react", hint: "A UI library by Meta" },
  { emojis: "🟢🟢🟢", answer: "node", hint: "Server-side JS runtime" },
  { emojis: "🐍", answer: "python", hint: "A popular programming language" },
  { emojis: "☕", answer: "java", hint: "Write once, run anywhere" },
  { emojis: "🦀", answer: "rust", hint: "Memory-safe systems language" },
  { emojis: "💎", answer: "ruby", hint: "A programmer's best friend" },
  { emojis: "🐳", answer: "docker", hint: "Container platform" },
  { emojis: "🔑🔒", answer: "encryption", hint: "Securing data" },
  { emojis: "☁️💻", answer: "cloud", hint: "Computing in the sky" },
  { emojis: "🐙🐱", answer: "github", hint: "Code hosting platform" },
  { emojis: "🌐🔌", answer: "api", hint: "Connects software together" },
  { emojis: "🤖🧠", answer: "ai", hint: "Artificial intelligence" },
  { emojis: "📱💨", answer: "flutter", hint: "Cross-platform app framework" },
  { emojis: "🏗️🧱", answer: "bootstrap", hint: "CSS framework" },
  { emojis: "🎯📊", answer: "analytics", hint: "Data tracking" },
  { emojis: "🔄♻️", answer: "recursion", hint: "A function calling itself" },
  { emojis: "🧪✅", answer: "testing", hint: "Quality assurance" },
  { emojis: "📡🌍", answer: "internet", hint: "Global network" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function EmojiDecoder() {
  const ROUNDS = 8;
  const TIME_PER_ROUND = 20;

  const [puzzles, setPuzzles] = useState(() => shuffleArray(PUZZLES).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) {
      handleNext(false);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver]);

  const handleNext = useCallback(
    (correct: boolean) => {
      if (correct) {
        const bonus = showHint ? 5 : 10;
        const timeBonus = Math.floor(timeLeft / 2);
        setScore((s) => s + bonus + timeBonus);
        setFeedback("correct");
      } else {
        setFeedback("wrong");
      }
      setTimeout(() => {
        setFeedback(null);
        if (round + 1 >= ROUNDS) {
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
          setInput("");
          setShowHint(false);
          setTimeLeft(TIME_PER_ROUND);
        }
      }, 800);
    },
    [round, showHint, timeLeft]
  );

  const handleSubmit = () => {
    if (!input.trim()) return;
    const correct = input.trim().toLowerCase() === puzzles[round].answer;
    handleNext(correct);
  };

  const restart = () => {
    setPuzzles(shuffleArray(PUZZLES).slice(0, ROUNDS));
    setRound(0);
    setInput("");
    setScore(0);
    setShowHint(false);
    setTimeLeft(TIME_PER_ROUND);
    setGameOver(false);
    setFeedback(null);
  };

  if (gameOver) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-10 space-y-4">
          <Trophy className="h-16 w-16 mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold">Game Over!</h2>
          <p className="text-4xl font-extrabold text-primary">{score} pts</p>
          <p className="text-muted-foreground">You decoded {ROUNDS} emoji puzzles</p>
          <Button onClick={restart} size="lg">Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  const current = puzzles[round];

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-primary" /> Emoji Decoder
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{round + 1}/{ROUNDS}</Badge>
          <Badge className="gap-1"><Zap className="h-3 w-3" />{score}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <Progress value={(timeLeft / TIME_PER_ROUND) * 100} className="flex-1" />
          <span className="font-mono w-6 text-right">{timeLeft}s</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4 py-6">{current.emojis}</div>
            <p className="text-muted-foreground text-sm mb-2">What tech term do these emojis represent?</p>
            {showHint && (
              <p className="text-sm text-primary font-medium">💡 Hint: {current.hint}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {feedback && (
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className={`text-center font-bold text-lg ${feedback === "correct" ? "text-green-500" : "text-destructive"}`}
          >
            {feedback === "correct" ? "✅ Correct!" : `❌ It was "${current.answer}"`}
          </motion.div>
        )}

        {!feedback && (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type your answer..."
              className="flex-1"
              autoFocus
            />
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        )}

        {!showHint && !feedback && (
          <Button variant="ghost" size="sm" onClick={() => setShowHint(true)} className="w-full">
            Show Hint (-5 pts)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
