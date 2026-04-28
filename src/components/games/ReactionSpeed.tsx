import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Trophy, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

type Phase = "waiting" | "ready" | "go" | "result" | "early" | "done";

export function ReactionSpeed() {
  const TOTAL_ROUNDS = 5;
  const [phase, setPhase] = useState<Phase>("waiting");
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const start = useCallback(() => {
    setPhase("ready");
    const delay = 1500 + Math.random() * 3500;
    timerRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase("go");
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === "ready") {
      clearTimeout(timerRef.current);
      setPhase("early");
      return;
    }
    if (phase === "go") {
      const rt = Date.now() - startRef.current;
      setCurrentTime(rt);
      const newTimes = [...times, rt];
      setTimes(newTimes);
      setPhase(newTimes.length >= TOTAL_ROUNDS ? "done" : "result");
      return;
    }
  }, [phase, times]);

  const nextRound = () => {
    setPhase("ready");
    const delay = 1500 + Math.random() * 3500;
    timerRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setPhase("go");
    }, delay);
  };

  const restart = () => {
    setTimes([]);
    setCurrentTime(0);
    setPhase("waiting");
    clearTimeout(timerRef.current);
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best = times.length ? Math.min(...times) : 0;

  const getRating = (ms: number) => {
    if (ms < 200) return { label: "⚡ Lightning!", color: "text-amber-500" };
    if (ms < 300) return { label: "🔥 Fast!", color: "text-green-500" };
    if (ms < 400) return { label: "👍 Good", color: "text-blue-500" };
    return { label: "🐢 Keep practicing", color: "text-muted-foreground" };
  };

  if (phase === "done") {
    const rating = getRating(avg);
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-10 space-y-4">
          <Trophy className="h-16 w-16 mx-auto text-amber-500" />
          <h2 className="text-2xl font-bold">Results</h2>
          <p className="text-4xl font-extrabold text-primary">{avg}ms</p>
          <p className={`text-lg font-semibold ${rating.color}`}>{rating.label}</p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div>Best: <span className="font-bold text-foreground">{best}ms</span></div>
            <div>Rounds: <span className="font-bold text-foreground">{times.length}</span></div>
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            {times.map((t, i) => (
              <Badge key={i} variant="secondary">R{i + 1}: {t}ms</Badge>
            ))}
          </div>
          <Button onClick={restart} size="lg"><RotateCcw className="h-4 w-4 mr-2" />Play Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Reaction Speed
        </CardTitle>
        <Badge variant="secondary">{times.length}/{TOTAL_ROUNDS}</Badge>
      </CardHeader>
      <CardContent>
        {phase === "waiting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 py-8">
            <div className="text-6xl">⚡</div>
            <p className="text-muted-foreground">Click as fast as you can when the screen turns green!</p>
            <Button size="lg" onClick={start}>Start Test</Button>
          </motion.div>
        )}

        {phase === "ready" && (
          <motion.div
            className="rounded-xl bg-destructive/20 border-2 border-destructive/30 cursor-pointer flex items-center justify-center min-h-[250px]"
            onClick={handleClick}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🔴</div>
              <p className="text-xl font-bold text-destructive">Wait for green...</p>
            </div>
          </motion.div>
        )}

        {phase === "go" && (
          <motion.div
            className="rounded-xl bg-green-500/20 border-2 border-green-500/40 cursor-pointer flex items-center justify-center min-h-[250px]"
            onClick={handleClick}
            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🟢</div>
              <p className="text-xl font-bold text-success dark:text-green-400">CLICK NOW!</p>
            </div>
          </motion.div>
        )}

        {phase === "early" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-8">
            <div className="text-5xl">😅</div>
            <p className="text-xl font-bold text-destructive">Too early!</p>
            <p className="text-muted-foreground">Wait for the green signal.</p>
            <Button onClick={nextRound}>Try Again</Button>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 py-8">
            <div className={`text-4xl font-extrabold ${getRating(currentTime).color}`}>{currentTime}ms</div>
            <p className="text-lg">{getRating(currentTime).label}</p>
            <Button onClick={nextRound}>Next Round →</Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
