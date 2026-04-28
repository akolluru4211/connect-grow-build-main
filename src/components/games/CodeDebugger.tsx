import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bug, Trophy, Clock, Zap, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CodePuzzle {
  code: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const PUZZLES: CodePuzzle[] = [
  {
    code: `for (let i = 0; i <= 10; i++) {\n  if (i = 5) {\n    console.log("Found 5!");\n  }\n}`,
    question: "What's the bug?",
    options: ["Missing semicolon", "Assignment instead of comparison (= vs ==)", "Wrong loop range", "Missing break"],
    correctIndex: 1,
    explanation: "'i = 5' assigns 5 to i instead of comparing. Use '===' for comparison.",
  },
  {
    code: `const arr = [1, 2, 3];\narr.forEach((item) => {\n  if (item > 1) return;\n  console.log(item);\n});`,
    question: "What does this print?",
    options: ["1 2 3", "1", "Nothing", "Error"],
    correctIndex: 1,
    explanation: "'return' in forEach only skips that iteration, not the whole loop. It prints 1.",
  },
  {
    code: `let x = "5";\nlet y = 2;\nconsole.log(x + y);`,
    question: "What is the output?",
    options: ["7", "52", "NaN", "Error"],
    correctIndex: 1,
    explanation: "String + number results in string concatenation: '5' + 2 = '52'.",
  },
  {
    code: `const person = { name: "Alex" };\nperson.name = "Sam";\nconsole.log(person.name);`,
    question: "What happens?",
    options: ["Error: const can't change", "Prints 'Alex'", "Prints 'Sam'", "Prints undefined"],
    correctIndex: 2,
    explanation: "const prevents reassignment of the variable, but object properties can still be modified.",
  },
  {
    code: `setTimeout(() => console.log("A"), 0);\nconsole.log("B");\nPromise.resolve().then(() => console.log("C"));`,
    question: "What's the output order?",
    options: ["A B C", "B A C", "B C A", "C B A"],
    correctIndex: 2,
    explanation: "Sync code runs first (B), then microtasks/promises (C), then macrotasks/setTimeout (A).",
  },
  {
    code: `const nums = [1, 2, 3, 4, 5];\nconst result = nums.filter(n => n % 2).map(n => n * 2);`,
    question: "What is result?",
    options: ["[2, 4, 6, 8, 10]", "[2, 6, 10]", "[4, 8]", "[1, 3, 5]"],
    correctIndex: 1,
    explanation: "filter keeps odd numbers (1,3,5), then map doubles them: [2, 6, 10].",
  },
  {
    code: `let a = [1, 2, 3];\nlet b = a;\nb.push(4);\nconsole.log(a.length);`,
    question: "What is logged?",
    options: ["3", "4", "Error", "undefined"],
    correctIndex: 1,
    explanation: "Arrays are passed by reference. b points to the same array as a, so push affects both.",
  },
  {
    code: `function greet(name = "World") {\n  return \`Hello, \${name}!\`;\n}\nconsole.log(greet(undefined));`,
    question: "What is logged?",
    options: ["Hello, undefined!", "Hello, World!", "Hello, !", "Error"],
    correctIndex: 1,
    explanation: "Passing undefined triggers the default parameter value.",
  },
  {
    code: `console.log(typeof null);`,
    question: "What is the output?",
    options: ["null", "undefined", "object", "Error"],
    correctIndex: 2,
    explanation: "This is a famous JavaScript bug — typeof null returns 'object'.",
  },
  {
    code: `const x = { a: 1 };\nconst y = { a: 1 };\nconsole.log(x === y);`,
    question: "What is logged?",
    options: ["true", "false", "Error", "undefined"],
    correctIndex: 1,
    explanation: "Objects are compared by reference, not value. x and y are different objects.",
  },
  {
    code: `const fn = () => arguments;\nfn(1, 2, 3);`,
    question: "What happens?",
    options: ["Returns [1,2,3]", "Returns Arguments object", "ReferenceError", "Returns undefined"],
    correctIndex: 2,
    explanation: "Arrow functions don't have their own 'arguments' object. This throws a ReferenceError.",
  },
  {
    code: `"use strict";\nlet obj = { x: 1 };\nObject.freeze(obj);\nobj.x = 2;`,
    question: "What happens?",
    options: ["obj.x becomes 2", "TypeError thrown", "obj.x stays 1 silently", "SyntaxError"],
    correctIndex: 1,
    explanation: "In strict mode, modifying a frozen object throws a TypeError.",
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function CodeDebugger() {
  const ROUNDS = 7;
  const TIME_PER_ROUND = 30;

  const [puzzles] = useState(() => shuffleArray(PUZZLES).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver || selected !== null) return;
    if (timeLeft <= 0) {
      setSelected(-1); // time out
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver, selected]);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === puzzles[round].correctIndex) {
      setScore((s) => s + 10 + Math.floor(timeLeft / 3));
    }
  };

  const next = () => {
    if (round + 1 >= ROUNDS) {
      setGameOver(true);
    } else {
      setRound((r) => r + 1);
      setSelected(null);
      setTimeLeft(TIME_PER_ROUND);
    }
  };

  const restart = () => {
    setRound(0);
    setScore(0);
    setSelected(null);
    setTimeLeft(TIME_PER_ROUND);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-10 space-y-4">
          <Trophy className="h-16 w-16 mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold">Debugging Complete!</h2>
          <p className="text-4xl font-extrabold text-primary">{score} pts</p>
          <p className="text-muted-foreground">You squashed {ROUNDS} code bugs 🐛</p>
          <Button onClick={restart} size="lg">Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  const current = puzzles[round];
  const answered = selected !== null;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" /> Code Debugger
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{round + 1}/{ROUNDS}</Badge>
          <Badge className="gap-1"><Zap className="h-3 w-3" />{score}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!answered && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <Progress value={(timeLeft / TIME_PER_ROUND) * 100} className="flex-1" />
            <span className="font-mono w-6 text-right">{timeLeft}s</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={round} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto font-mono whitespace-pre-wrap border">
              {current.code}
            </pre>
            <p className="font-semibold mt-4 mb-3">{current.question}</p>
          </motion.div>
        </AnimatePresence>

        <div className="grid gap-2">
          {current.options.map((opt, idx) => {
            let variant: "outline" | "default" | "destructive" | "secondary" = "outline";
            if (answered) {
              if (idx === current.correctIndex) variant = "default";
              else if (idx === selected) variant = "destructive";
            }
            return (
              <Button
                key={idx}
                variant={variant}
                className="justify-start text-left h-auto py-3 whitespace-normal"
                onClick={() => handleSelect(idx)}
                disabled={answered}
              >
                <span className="mr-2 shrink-0">
                  {answered && idx === current.correctIndex && <CheckCircle className="h-4 w-4 text-primary-foreground inline" />}
                  {answered && idx === selected && idx !== current.correctIndex && <XCircle className="h-4 w-4 inline" />}
                  {!answered && <span className="text-muted-foreground">{String.fromCharCode(65 + idx)}.</span>}
                </span>
                {opt}
              </Button>
            );
          })}
        </div>

        {answered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium text-primary mb-1">Explanation:</p>
              <p className="text-muted-foreground">{current.explanation}</p>
            </div>
            <Button onClick={next} className="w-full">
              {round + 1 >= ROUNDS ? "See Results" : "Next Challenge →"}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
