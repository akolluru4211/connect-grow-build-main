import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trophy, RotateCcw, Zap } from "lucide-react";
import { motion } from "framer-motion";

const EMOJIS = ["🍎","🍊","🍋","🍇","🍉","🍓","🫐","🥝","🍑","🥭","🍒","🍌","🌶️","🥑","🥕","🧅","🌽","🥦","🍆","🍅","🥒","🫑","🧄","🥬"];

function generateGrid(size: number): { grid: string[][]; diffRow: number; diffCol: number; original: string; different: string } {
  const base = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  let diff: string;
  do {
    diff = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  } while (diff === base);

  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => base)
  );
  const diffRow = Math.floor(Math.random() * size);
  const diffCol = Math.floor(Math.random() * size);
  grid[diffRow][diffCol] = diff;

  return { grid, diffRow, diffCol, original: base, different: diff };
}

export function SpotDifference() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState(false);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const MAX_WRONG = 3;
  const MAX_LEVEL = 10;

  const gridSize = Math.min(3 + Math.floor(level / 2), 8);
  const puzzle = useMemo(() => generateGrid(gridSize), [level]);

  const handleClick = (r: number, c: number) => {
    if (found || gameOver) return;
    if (r === puzzle.diffRow && c === puzzle.diffCol) {
      setFound(true);
      setScore((s) => s + (10 + level * 2) - wrongClicks);
    } else {
      const next = wrongClicks + 1;
      setWrongClicks(next);
      if (next >= MAX_WRONG) {
        setGameOver(true);
      }
    }
  };

  const nextLevel = () => {
    if (level >= MAX_LEVEL) {
      setGameOver(true);
      return;
    }
    setLevel((l) => l + 1);
    setFound(false);
    setWrongClicks(0);
  };

  const restart = () => {
    setLevel(1);
    setScore(0);
    setFound(false);
    setWrongClicks(0);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-10 space-y-4">
          <Trophy className="h-16 w-16 mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold">{level >= MAX_LEVEL ? "All Levels Complete!" : "Game Over!"}</h2>
          <p className="text-4xl font-extrabold text-primary">{score} pts</p>
          <p className="text-muted-foreground">You reached level {level}</p>
          <Button onClick={restart} size="lg"><RotateCcw className="h-4 w-4 mr-2" />Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" /> Spot the Difference
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Lv {level}</Badge>
          <Badge className="gap-1"><Zap className="h-3 w-3" />{score}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Find the odd emoji!</span>
          <span className="text-destructive font-medium">❌ {wrongClicks}/{MAX_WRONG}</span>
        </div>

        <div
          className="grid gap-1 mx-auto w-fit"
          style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
        >
          {puzzle.grid.map((row, ri) =>
            row.map((emoji, ci) => {
              const isDiff = ri === puzzle.diffRow && ci === puzzle.diffCol;
              return (
                <motion.button
                  key={`${ri}-${ci}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleClick(ri, ci)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl rounded-lg flex items-center justify-center transition-all cursor-pointer
                    ${found && isDiff ? "bg-green-500/20 ring-2 ring-green-500 scale-110" : "bg-muted/50 hover:bg-muted"}`}
                >
                  {emoji}
                </motion.button>
              );
            })
          )}
        </div>

        {found && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
            <p className="text-lg font-bold text-green-500">🎉 Found it!</p>
            <Button onClick={nextLevel}>
              {level >= MAX_LEVEL ? "See Results" : "Next Level →"}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
