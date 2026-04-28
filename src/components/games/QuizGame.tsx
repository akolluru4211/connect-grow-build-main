import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Timer, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const quizQuestions: Question[] = [
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: 2, category: "Geography" },
  { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"], correctAnswer: 1, category: "Art" },
  { question: "What is the largest planet in our solar system?", options: ["Mars", "Saturn", "Jupiter", "Neptune"], correctAnswer: 2, category: "Science" },
  { question: "In what year did World War II end?", options: ["1943", "1944", "1945", "1946"], correctAnswer: 2, category: "History" },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctAnswer: 2, category: "Science" },
  { question: "Which country has the largest population?", options: ["USA", "India", "China", "Indonesia"], correctAnswer: 1, category: "Geography" },
  { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correctAnswer: 1, category: "Literature" },
  { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], correctAnswer: 0, category: "Science" },
  { question: "Which element has the atomic number 1?", options: ["Helium", "Oxygen", "Carbon", "Hydrogen"], correctAnswer: 3, category: "Science" },
  { question: "What is the tallest mountain in the world?", options: ["K2", "Kangchenjunga", "Mount Everest", "Lhotse"], correctAnswer: 2, category: "Geography" },
  { question: "Who invented the telephone?", options: ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "Guglielmo Marconi"], correctAnswer: 2, category: "History" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, category: "Geography" },
  { question: "How many bones are in the human body?", options: ["186", "206", "226", "246"], correctAnswer: 1, category: "Science" },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1, category: "Science" },
  { question: "What year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], correctAnswer: 2, category: "Technology" },
  { question: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], correctAnswer: 2, category: "Geography" },
  { question: "Who discovered penicillin?", options: ["Marie Curie", "Louis Pasteur", "Alexander Fleming", "Joseph Lister"], correctAnswer: 2, category: "Science" },
  { question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctAnswer: 2, category: "Science" },
  { question: "Which language has the most native speakers?", options: ["English", "Spanish", "Hindi", "Mandarin Chinese"], correctAnswer: 3, category: "Geography" },
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correctAnswer: 1, category: "Geography" },
  { question: "Who developed the theory of relativity?", options: ["Newton", "Einstein", "Hawking", "Bohr"], correctAnswer: 1, category: "Science" },
  { question: "What is the main ingredient in glass?", options: ["calcium", "silicon", "sand", "quartz"], correctAnswer: 2, category: "Science" },
  { question: "Which organ is the largest in the human body?", options: ["Liver", "Brain", "Skin", "Heart"], correctAnswer: 2, category: "Science" },
  { question: "In which year did India gain independence?", options: ["1945", "1946", "1947", "1948"], correctAnswer: 2, category: "History" },
  { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: 2, category: "Science" },
];

export function QuizGame() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    if (gameOver || showResult) return;
    
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
  }, [currentQuestion, gameOver, showResult]);

  const startNewGame = () => {
    const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    setShuffledQuestions(shuffled);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameOver(false);
    setTimeLeft(15);
  };

  const handleTimeout = () => {
    setShowResult(true);
    setTimeout(() => moveToNext(), 1500);
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === shuffledQuestions[currentQuestion].correctAnswer) {
      setScore((prev) => prev + 10 + timeLeft);
    }

    setTimeout(() => moveToNext(), 1500);
  };

  const moveToNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setTimeLeft(15);
    } else {
      setGameOver(true);
    }
  };

  if (shuffledQuestions.length === 0) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (gameOver) {
    const maxScore = shuffledQuestions.length * 25;
    const percentage = Math.round((score / maxScore) * 100);
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Performance</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button onClick={startNewGame} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const question = shuffledQuestions[currentQuestion];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">{question.category}</Badge>
          <div className="flex items-center gap-2 text-sm">
            <Timer className={cn("h-4 w-4", timeLeft <= 5 && "text-destructive animate-pulse")} />
            <span className={cn(timeLeft <= 5 && "text-destructive font-bold")}>{timeLeft}s</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentQuestion + 1} of {shuffledQuestions.length}</span>
          <span>Score: {score}</span>
        </div>
        <Progress value={((currentQuestion + 1) / shuffledQuestions.length) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-xl font-semibold">{question.question}</h3>
        
        <div className="grid gap-3">
          {question.options.map((option, index) => {
            const isCorrect = index === question.correctAnswer;
            const isSelected = index === selectedAnswer;
            
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  "h-auto py-4 px-4 justify-start text-left transition-all",
                  showResult && isCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                  showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                  !showResult && "hover:border-primary hover:bg-primary/5"
                )}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
              >
                <span className="flex-1">{option}</span>
                {showResult && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
