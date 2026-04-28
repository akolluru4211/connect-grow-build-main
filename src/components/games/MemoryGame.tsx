import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const emojis = ["🎯", "🚀", "💡", "🎨", "🎵", "🌟", "🔥", "💎"];

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameOver) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameOver]);

  const initializeGame = () => {
    const shuffledEmojis = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setTime(0);
    setIsPlaying(false);
  };

  const handleCardClick = (id: number) => {
    if (!isPlaying) setIsPlaying(true);
    
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    const newCards = cards.map((c) =>
      c.id === id ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      
      const [first, second] = newFlipped;
      const firstCard = newCards.find((c) => c.id === first);
      const secondCard = newCards.find((c) => c.id === second);

      if (firstCard?.emoji === secondCard?.emoji) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches((prev) => {
            const newMatches = prev + 1;
            if (newMatches === emojis.length) {
              setGameOver(true);
            }
            return newMatches;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateScore = () => {
    const baseScore = 1000;
    const movePenalty = moves * 10;
    const timePenalty = time * 2;
    return Math.max(0, baseScore - movePenalty - timePenalty);
  };

  if (gameOver) {
    const score = calculateScore();
    
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <CardTitle className="text-2xl">Congratulations!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-5xl font-bold text-primary">{score}</div>
          <p className="text-muted-foreground">points earned</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{moves}</div>
              <div className="text-muted-foreground">Moves</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold text-lg">{formatTime(time)}</div>
              <div className="text-muted-foreground">Time</div>
            </div>
          </div>

          <Button onClick={initializeGame} className="gap-2">
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
          <CardTitle className="text-lg">Memory Match</CardTitle>
          <Button variant="ghost" size="sm" onClick={initializeGame}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            {moves} moves
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(time)}
          </Badge>
          <Badge variant="outline">
            {matches}/{emojis.length} pairs
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "aspect-square rounded-lg text-3xl flex items-center justify-center transition-all duration-300 transform",
                card.isFlipped || card.isMatched
                  ? "bg-primary/10 rotate-0"
                  : "bg-muted hover:bg-muted/80 cursor-pointer",
                card.isMatched && "bg-green-500/20 scale-95"
              )}
              disabled={card.isFlipped || card.isMatched}
            >
              {(card.isFlipped || card.isMatched) ? card.emoji : "?"}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
