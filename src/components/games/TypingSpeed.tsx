import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, Keyboard, Clock, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const sentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Practice makes perfect when learning to type fast.",
  "Technology is best when it brings people together.",
  "Success is not final, failure is not fatal.",
  "Innovation distinguishes between a leader and a follower.",
  "Code is like humor, when you have to explain it, it's bad.",
  "First, solve the problem. Then, write the code.",
  "Programming is not about typing, it's about thinking.",
  "The best error message is the one that never shows up.",
  "Simplicity is the soul of efficiency in software design.",
];

export function TypingSpeed() {
  const [targetText, setTargetText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [errors, setErrors] = useState(0);
  const [completedSentences, setCompletedSentences] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getRandomSentence = useCallback(() => {
    return sentences[Math.floor(Math.random() * sentences.length)];
  }, []);

  const startGame = useCallback(() => {
    setTargetText(getRandomSentence());
    setTypedText("");
    setIsPlaying(true);
    setGameOver(false);
    setStartTime(Date.now());
    setEndTime(null);
    setTimeLeft(60);
    setErrors(0);
    setCompletedSentences(0);
    inputRef.current?.focus();
  }, [getRandomSentence]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setGameOver(true);
            setEndTime(Date.now());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isPlaying) return;
    
    const value = e.target.value;
    setTypedText(value);

    // Count errors
    let errorCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetText[i]) {
        errorCount++;
      }
    }
    setErrors(errorCount);

    // Check if sentence is completed correctly
    if (value === targetText) {
      setCompletedSentences((prev) => prev + 1);
      setTargetText(getRandomSentence());
      setTypedText("");
      setErrors(0);
    }
  };

  const calculateWPM = () => {
    if (!startTime || !endTime) return 0;
    const timeInMinutes = (endTime - startTime) / 60000;
    const totalChars = completedSentences > 0 ? completedSentences * 50 : typedText.length;
    const words = totalChars / 5;
    return Math.round(words / timeInMinutes);
  };

  const calculateAccuracy = () => {
    const totalTyped = typedText.length + completedSentences * 50;
    if (totalTyped === 0) return 100;
    const totalErrors = errors;
    return Math.max(0, Math.round(((totalTyped - totalErrors) / totalTyped) * 100));
  };

  if (gameOver) {
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();
    const score = Math.round(wpm * (accuracy / 100) * 10);

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">Time's Up!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{wpm}</div>
              <div className="text-muted-foreground">WPM</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{accuracy}%</div>
              <div className="text-muted-foreground">Accuracy</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{completedSentences}</div>
              <div className="text-muted-foreground">Sentences</div>
            </div>
          </div>

          <Button onClick={startGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
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
            <Keyboard className="h-5 w-5" />
            Typing Speed
          </CardTitle>
          {isPlaying && (
            <Button variant="ghost" size="sm" onClick={startGame}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isPlaying && (
          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {timeLeft}s
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              {completedSentences} done
            </Badge>
            <Badge variant={errors > 0 ? "destructive" : "outline"} className="gap-1">
              <Zap className="h-3 w-3" />
              {errors} errors
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!isPlaying && !gameOver ? (
          <div className="text-center py-8 space-y-4">
            <Keyboard className="h-16 w-16 mx-auto text-primary/50" />
            <div>
              <h3 className="font-semibold text-lg">Test Your Typing Speed</h3>
              <p className="text-sm text-muted-foreground">
                Type the sentences as fast and accurately as you can in 60 seconds!
              </p>
            </div>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Zap className="h-5 w-5" />
              Start Typing
            </Button>
          </div>
        ) : isPlaying ? (
          <div className="space-y-4">
            <Progress value={((60 - timeLeft) / 60) * 100} className="h-2" />
            
            <div className="p-4 bg-muted/50 rounded-xl text-lg leading-relaxed font-mono">
              {targetText.split("").map((char, index) => {
                let className = "text-muted-foreground";
                if (index < typedText.length) {
                  className = typedText[index] === char 
                    ? "text-success dark:text-green-400" 
                    : "text-destructive dark:text-red-400 bg-destructive/10 dark:bg-red-900/30";
                } else if (index === typedText.length) {
                  className = "bg-primary/20 text-foreground";
                }
                return (
                  <span key={index} className={className}>
                    {char}
                  </span>
                );
              })}
            </div>

            <textarea
              ref={inputRef}
              value={typedText}
              onChange={handleInput}
              className="w-full p-4 rounded-xl border bg-background font-mono text-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Start typing here..."
              autoFocus
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
