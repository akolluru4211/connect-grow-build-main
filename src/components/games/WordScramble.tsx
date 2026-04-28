import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, Type, Zap, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const words = [
  { word: "JAVASCRIPT", hint: "Popular programming language" },
  { word: "ALGORITHM", hint: "Step-by-step procedure" },
  { word: "DATABASE", hint: "Organized data collection" },
  { word: "FRONTEND", hint: "Client-side development" },
  { word: "BACKEND", hint: "Server-side development" },
  { word: "VARIABLE", hint: "Data container in code" },
  { word: "FUNCTION", hint: "Reusable code block" },
  { word: "NETWORK", hint: "Connected computers" },
  { word: "SECURITY", hint: "Protection from threats" },
  { word: "DEVELOPER", hint: "Software creator" },
  { word: "INTERFACE", hint: "Point of interaction" },
  { word: "PROTOCOL", hint: "Communication rules" },
  { word: "COMPILER", hint: "Translates code to machine language" },
  { word: "TERMINAL", hint: "Command line interface" },
  { word: "FIREWALL", hint: "Network security system" },
  { word: "DEBUGGER", hint: "Tool for finding code errors" },
  { word: "FRAMEWORK", hint: "Foundation for building apps" },
  { word: "RECURSION", hint: "Function calling itself" },
  { word: "PIPELINE", hint: "Automated workflow sequence" },
  { word: "ABSTRACT", hint: "Hiding implementation details" },
  { word: "TEMPLATE", hint: "Reusable pattern or blueprint" },
  { word: "OPTIMIZE", hint: "Make more efficient" },
  { word: "ITERATOR", hint: "Object for traversing collections" },
  { word: "CALLBACK", hint: "Function passed as argument" },
];

function scrambleWord(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

export function WordScramble() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambled, setScrambled] = useState("");
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [usedWords, setUsedWords] = useState<Set<number>>(new Set());

  const getRandomWord = useCallback(() => {
    const available = words.map((_, i) => i).filter((i) => !usedWords.has(i));
    if (available.length === 0) {
      setGameOver(true);
      return null;
    }
    const randomIndex = available[Math.floor(Math.random() * available.length)];
    return randomIndex;
  }, [usedWords]);

  const setupNewWord = useCallback(() => {
    const index = getRandomWord();
    if (index === null) return;
    
    setCurrentIndex(index);
    let scrambledVersion = scrambleWord(words[index].word);
    // Make sure scrambled version is different from original
    while (scrambledVersion === words[index].word) {
      scrambledVersion = scrambleWord(words[index].word);
    }
    setScrambled(scrambledVersion);
    setGuess("");
    setFeedback(null);
    setUsedWords((prev) => new Set([...prev, index]));
  }, [getRandomWord]);

  useEffect(() => {
    setupNewWord();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;

    const isCorrect = guess.toUpperCase() === words[currentIndex].word;
    
    if (isCorrect) {
      setFeedback("correct");
      setScore((prev) => prev + 10 + streak * 5);
      setStreak((prev) => prev + 1);
      setTimeout(() => setupNewWord(), 1000);
    } else {
      setFeedback("wrong");
      setStreak(0);
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
        }
        return newLives;
      });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setLives(3);
    setGameOver(false);
    setUsedWords(new Set());
    setupNewWord();
  };

  if (gameOver) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">
            {usedWords.size === words.length ? "All Words Solved!" : "Game Over!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="text-3xl font-bold">{usedWords.size}</div>
            <div className="text-muted-foreground">Words Solved</div>
          </div>

          <Button onClick={restartGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Type className="h-5 w-5" />
            Word Scramble
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={restartGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            Streak: {streak}
          </Badge>
          <Badge variant="outline">Score: {score}</Badge>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className={cn("text-lg", i < lives ? "text-red-500" : "text-muted")}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={(usedWords.size / words.length) * 100} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {usedWords.size}/{words.length} words
          </div>
        </div>

        <div className="text-center space-y-4">
          <div
            className={cn(
              "text-3xl font-mono font-bold tracking-wider py-4 px-6 rounded-xl bg-muted/50 transition-colors",
              feedback === "correct" && "bg-green-500/20 text-success",
              feedback === "wrong" && "bg-red-500/20 text-destructive"
            )}
          >
            {scrambled}
          </div>
          
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Hint:</span> {words[currentIndex].hint}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={guess}
            onChange={(e) => setGuess(e.target.value.toUpperCase())}
            placeholder="Type your answer..."
            className="text-center text-lg font-mono uppercase"
            disabled={!!feedback}
            autoFocus
          />
          <Button type="submit" className="w-full gap-2" disabled={!guess.trim() || !!feedback}>
            {feedback === "correct" ? (
              <>
                <Check className="h-4 w-4" />
                Correct!
              </>
            ) : feedback === "wrong" ? (
              <>
                <X className="h-4 w-4" />
                Wrong! It was {words[currentIndex].word}
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
