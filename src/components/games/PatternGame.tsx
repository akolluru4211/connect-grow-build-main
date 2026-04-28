import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const colors = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
];

export function PatternGame() {
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerPattern, setPlayerPattern] = useState<number[]>([]);
  const [isShowingPattern, setIsShowingPattern] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState("Press Start to begin!");

  const generatePattern = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4);
    return [...pattern, newColor];
  }, [pattern]);

  const showPattern = useCallback(async (patternToShow: number[]) => {
    setIsShowingPattern(true);
    setMessage("Watch the pattern...");

    for (let i = 0; i < patternToShow.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setActiveButton(patternToShow[i]);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setActiveButton(null);
    }

    setIsShowingPattern(false);
    setMessage("Your turn! Repeat the pattern");
  }, []);

  const startNewGame = () => {
    const initialPattern = [Math.floor(Math.random() * 4)];
    setPattern(initialPattern);
    setPlayerPattern([]);
    setLevel(1);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    showPattern(initialPattern);
  };

  const handleButtonClick = (colorIndex: number) => {
    if (isShowingPattern || gameOver) return;

    setActiveButton(colorIndex);
    setTimeout(() => setActiveButton(null), 200);

    const newPlayerPattern = [...playerPattern, colorIndex];
    setPlayerPattern(newPlayerPattern);

    const currentIndex = newPlayerPattern.length - 1;
    
    if (pattern[currentIndex] !== colorIndex) {
      setGameOver(true);
      setMessage("Game Over! Wrong pattern.");
      return;
    }

    if (newPlayerPattern.length === pattern.length) {
      const levelScore = level * 10 + pattern.length * 5;
      setScore((prev) => prev + levelScore);
      setMessage("Correct! Get ready for the next level...");
      
      setTimeout(() => {
        const newPattern = generatePattern();
        setPattern(newPattern);
        setPlayerPattern([]);
        setLevel((prev) => prev + 1);
        showPattern(newPattern);
      }, 1500);
    }
  };

  if (gameOver) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">Game Over!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="text-3xl font-bold">{level}</div>
            <div className="text-muted-foreground">Level Reached</div>
          </div>

          <Button onClick={startNewGame} className="gap-2">
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
            <Brain className="h-5 w-5" />
            Pattern Memory
          </CardTitle>
          {gameStarted && (
            <Button variant="ghost" size="sm" onClick={startNewGame}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {gameStarted && (
          <div className="flex items-center justify-between pt-2">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Level {level}
            </Badge>
            <Badge variant="outline">Score: {score}</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center text-sm text-muted-foreground">
          {message}
        </div>

        {gameStarted && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{playerPattern.length}/{pattern.length}</span>
            </div>
            <Progress 
              value={(playerPattern.length / Math.max(pattern.length, 1)) * 100} 
              className="h-2" 
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 max-w-[280px] mx-auto">
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={() => handleButtonClick(index)}
              disabled={isShowingPattern || !gameStarted}
              className={cn(
                "aspect-square rounded-xl transition-all duration-200 transform",
                color,
                activeButton === index 
                  ? "scale-95 brightness-150 ring-4 ring-white/50" 
                  : "opacity-70 hover:opacity-100",
                (isShowingPattern || !gameStarted) && "cursor-not-allowed"
              )}
            />
          ))}
        </div>

        {!gameStarted && (
          <div className="text-center pt-4">
            <Button onClick={startNewGame} size="lg" className="gap-2">
              <Brain className="h-5 w-5" />
              Start Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
