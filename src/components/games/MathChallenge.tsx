import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, Timer, Calculator, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  num1: number;
  num2: number;
  operator: string;
  answer: number;
  options: number[];
}

export function MathChallenge() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const generateQuestion = useCallback((): Question => {
    const operators = ["+", "-", "×"];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1: number, num2: number, answer: number;
    
    switch (operator) {
      case "+":
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        break;
      case "-":
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 - num2;
        break;
      case "×":
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    const wrongAnswers = new Set<number>();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrong = answer + offset;
      if (wrong !== answer && wrong > 0) {
        wrongAnswers.add(wrong);
      }
    }

    const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);

    return { num1, num2, operator, answer, options };
  }, []);

  const startGame = () => {
    setQuestion(generateQuestion());
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameStarted(true);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setQuestionsAnswered(0);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  const handleAnswer = (answer: number) => {
    if (!question || selectedAnswer !== null) return;

    setSelectedAnswer(answer);
    const correct = answer === question.answer;
    setIsCorrect(correct);
    setQuestionsAnswered((prev) => prev + 1);

    if (correct) {
      const streakBonus = Math.min(streak, 5);
      setScore((prev) => prev + 10 + streakBonus * 2);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setQuestion(generateQuestion());
      setSelectedAnswer(null);
      setIsCorrect(null);
    }, 800);
  };

  if (gameOver) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">Time's Up!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{questionsAnswered}</div>
              <div className="text-muted-foreground">Questions</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{streak}</div>
              <div className="text-muted-foreground">Best Streak</div>
            </div>
          </div>

          <Button onClick={startGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!gameStarted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Calculator className="h-16 w-16 mx-auto text-primary mb-4" />
          <CardTitle className="text-2xl">Math Challenge</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Solve as many math problems as you can in 60 seconds!
            Build streaks for bonus points.
          </p>
          <Button onClick={startGame} size="lg" className="gap-2">
            <Calculator className="h-5 w-5" />
            Start Challenge
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
            <Calculator className="h-5 w-5" />
            Math Challenge
          </CardTitle>
          <Badge 
            variant={timeLeft <= 10 ? "destructive" : "secondary"} 
            className="gap-1"
          >
            <Timer className="h-3 w-3" />
            {timeLeft}s
          </Badge>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline">Score: {score}</Badge>
          {streak > 0 && (
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
              🔥 {streak} streak
            </Badge>
          )}
        </div>
        <Progress value={(timeLeft / 60) * 100} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {question && (
          <>
            <div className="text-center py-6">
              <div className="text-4xl font-bold">
                {question.num1} {question.operator} {question.num2} = ?
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isAnswer = option === question.answer;
                
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-16 text-xl font-semibold transition-all",
                      isSelected && isCorrect && "border-green-500 bg-green-500/10 text-success",
                      isSelected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                      selectedAnswer !== null && isAnswer && !isSelected && "border-green-500 bg-green-500/10"
                    )}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                  >
                    {option}
                    {selectedAnswer !== null && isAnswer && (
                      <CheckCircle2 className="h-5 w-5 ml-2 text-green-500" />
                    )}
                    {isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 ml-2 text-destructive" />
                    )}
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
