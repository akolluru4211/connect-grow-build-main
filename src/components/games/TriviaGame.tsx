import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, BookOpen, Clock, Zap, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TriviaQuestion {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

const allQuestions: TriviaQuestion[] = [
  { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Management Language"], correct: 0, category: "Web Development" },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, category: "Science" },
  { question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], correct: 1, category: "Programming" },
  { question: "Who invented the World Wide Web?", options: ["Bill Gates", "Steve Jobs", "Tim Berners-Lee", "Mark Zuckerberg"], correct: 2, category: "Technology" },
  { question: "What is the capital of Japan?", options: ["Beijing", "Seoul", "Tokyo", "Bangkok"], correct: 2, category: "Geography" },
  { question: "Which programming language is known as 'the language of the web'?", options: ["Python", "Java", "C++", "JavaScript"], correct: 3, category: "Programming" },
  { question: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"], correct: 1, category: "Web Development" },
  { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Array", "Linked List"], correct: 1, category: "Programming" },
  { question: "What year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], correct: 2, category: "Technology" },
  { question: "Which company developed the React library?", options: ["Google", "Facebook/Meta", "Microsoft", "Amazon"], correct: 1, category: "Web Development" },
  { question: "What does API stand for?", options: ["Application Programming Interface", "Applied Programming Integration", "Advanced Program Interaction", "Application Process Interface"], correct: 0, category: "Programming" },
  { question: "Which language is used for Android development?", options: ["Swift", "Kotlin", "Ruby", "Dart"], correct: 1, category: "Technology" },
  { question: "What is the smallest unit of data in a computer?", options: ["Byte", "Bit", "Nibble", "Word"], correct: 1, category: "Technology" },
  { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Question Language", "System Query Logic", "Sequential Query Language"], correct: 0, category: "Programming" },
  { question: "Who is the CEO of Tesla?", options: ["Jeff Bezos", "Elon Musk", "Tim Cook", "Sundar Pichai"], correct: 1, category: "Technology" },
  { question: "Which protocol is used for secure web browsing?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], correct: 2, category: "Web Development" },
  { question: "What does RAM stand for?", options: ["Random Access Memory", "Read Access Memory", "Rapid Access Memory", "Runtime Access Module"], correct: 0, category: "Technology" },
  { question: "What is Git primarily used for?", options: ["Web hosting", "Version control", "Database management", "Testing"], correct: 1, category: "Programming" },
  { question: "What is the boiling point of water in Celsius?", options: ["90°C", "95°C", "100°C", "110°C"], correct: 2, category: "Science" },
  { question: "Which sorting algorithm has the best average time complexity?", options: ["Bubble Sort", "Merge Sort", "Selection Sort", "Insertion Sort"], correct: 1, category: "Programming" },
];

export function TriviaGame() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [streak, setStreak] = useState(0);

  const startGame = () => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    setTimeLeft(15);
    setStreak(0);
  };

  useEffect(() => { startGame(); }, []);

  useEffect(() => {
    if (showResult || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, showResult, gameOver]);

  const handleTimeout = () => {
    setSelectedAnswer(-1);
    setShowResult(true);
    setStreak(0);
    setTimeout(nextQuestion, 2000);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === questions[currentQuestion].correct;
    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft / 3);
      setScore((prev) => prev + 10 + streak * 2 + timeBonus);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(nextQuestion, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 >= questions.length) {
      setGameOver(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
    }
  };

  const restartGame = () => startGame();

  if (questions.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (gameOver) {
    const percentage = Math.round((score / (questions.length * 15)) * 100);
    
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="bg-muted rounded-lg p-4">
            <div className="text-3xl font-bold">{percentage}%</div>
            <div className="text-muted-foreground">Accuracy</div>
          </div>

          <Button onClick={restartGame} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[currentQuestion];

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Trivia Challenge
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={restartGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {timeLeft}s
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            Streak: {streak}
          </Badge>
          <Badge variant="outline">Score: {score}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <Badge variant="secondary" className="text-xs">{question.category}</Badge>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        </div>

        <div className="text-center">
          <Progress 
            value={(timeLeft / 15) * 100} 
            className={cn("h-1 mb-4", timeLeft <= 5 && "bg-red-200 [&>div]:bg-red-500")} 
          />
          <h3 className="text-lg font-medium">{question.question}</h3>
        </div>

        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correct;
            const showCorrect = showResult && isCorrect;
            const showWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all border",
                  "hover:bg-muted disabled:hover:bg-background",
                  !showResult && "hover:border-primary",
                  showCorrect && "bg-green-500/20 border-green-500",
                  showWrong && "bg-red-500/20 border-red-500",
                  !showResult && isSelected && "border-primary bg-primary/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    showCorrect && "bg-green-500 text-white",
                    showWrong && "bg-red-500 text-white",
                    !showResult && "bg-muted"
                  )}>
                    {showCorrect ? <Check className="h-4 w-4" /> : 
                     showWrong ? <X className="h-4 w-4" /> : 
                     String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
