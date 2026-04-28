import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizGame } from "@/components/games/QuizGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { PatternGame } from "@/components/games/PatternGame";
import { MathChallenge } from "@/components/games/MathChallenge";
import { WordScramble } from "@/components/games/WordScramble";
import { TypingSpeed } from "@/components/games/TypingSpeed";
import { TriviaGame } from "@/components/games/TriviaGame";
import { EmojiDecoder } from "@/components/games/EmojiDecoder";
import { CodeDebugger } from "@/components/games/CodeDebugger";
import { ReactionSpeed } from "@/components/games/ReactionSpeed";
import { SpotDifference } from "@/components/games/SpotDifference";
import { 
  Gamepad2, 
  Brain, 
  HelpCircle, 
  Calculator, 
  Sparkles,
  Trophy,
  Target,
  Zap,
  Type,
  Keyboard,
  BookOpen,
  Smile,
  Bug,
  Eye
} from "lucide-react";

const games = [
  {
    id: "quiz",
    name: "Knowledge Quiz",
    description: "Test your general knowledge with timed questions",
    icon: HelpCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Medium",
  },
  {
    id: "memory",
    name: "Memory Match",
    description: "Find matching pairs to train your memory",
    icon: Brain,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Easy",
  },
  {
    id: "pattern",
    name: "Pattern Memory",
    description: "Remember and repeat growing color patterns",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Hard",
  },
  {
    id: "math",
    name: "Math Challenge",
    description: "Solve math problems against the clock",
    icon: Calculator,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Medium",
  },
  {
    id: "word",
    name: "Word Scramble",
    description: "Unscramble tech words and learn vocabulary",
    icon: Type,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Medium",
  },
  {
    id: "typing",
    name: "Typing Speed",
    description: "Test and improve your typing speed",
    icon: Keyboard,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Easy",
  },
  {
    id: "trivia",
    name: "Trivia Challenge",
    description: "Answer tech and general knowledge trivia",
    icon: BookOpen,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Hard",
  },
  {
    id: "emoji",
    name: "Emoji Decoder",
    description: "Guess the tech term from emoji clues",
    icon: Smile,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Easy",
  },
  {
    id: "debug",
    name: "Code Debugger",
    description: "Find bugs in JavaScript code snippets",
    icon: Bug,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Hard",
  },
  {
    id: "reaction",
    name: "Reaction Speed",
    description: "Test your reflexes — click when it turns green!",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Easy",
  },
  {
    id: "spot",
    name: "Spot the Difference",
    description: "Find the odd emoji in a growing grid",
    icon: Eye,
    color: "text-primary",
    bgColor: "bg-primary/10",
    difficulty: "Medium",
  },
];

export default function Games() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const renderGame = () => {
    switch (selectedGame) {
      case "quiz":
        return <QuizGame />;
      case "memory":
        return <MemoryGame />;
      case "pattern":
        return <PatternGame />;
      case "math":
        return <MathChallenge />;
      case "word":
        return <WordScramble />;
      case "typing":
        return <TypingSpeed />;
      case "trivia":
        return <TriviaGame />;
      case "emoji":
        return <EmojiDecoder />;
      case "debug":
        return <CodeDebugger />;
      case "reaction":
        return <ReactionSpeed />;
      case "spot":
        return <SpotDifference />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Games & Challenges</h1>
          </div>
          <p className="text-muted-foreground">
            Train your brain with fun games and earn points for the leaderboard!
          </p>
        </div>

        <Tabs defaultValue="play" className="space-y-6">
          <TabsList>
            <TabsTrigger value="play" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Play Games
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              Your Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="space-y-6">
            {selectedGame ? (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedGame(null)}
                  className="mb-4"
                >
                  ← Back to Games
                </Button>
                {renderGame()}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {games.map((game) => (
                  <Card 
                    key={game.id} 
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 rounded-xl ${game.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <game.icon className={`h-6 w-6 ${game.color}`} />
                      </div>
                      <CardTitle className="text-lg">{game.name}</CardTitle>
                      <CardDescription>{game.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{game.difficulty}</Badge>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!selectedGame && (
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Earn Points While Playing!</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete games to earn points and climb the leaderboard. Higher scores mean more points!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="achievements">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-10 w-10 mx-auto text-amber-500 mb-3" />
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Games Played</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="h-10 w-10 mx-auto text-green-500 mb-3" />
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Brain className="h-10 w-10 mx-auto text-purple-500 mb-3" />
                  <div className="text-3xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">Best Streak</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Zap className="h-10 w-10 mx-auto text-blue-500 mb-3" />
                  <div className="text-3xl font-bold">--</div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Game History</CardTitle>
                <CardDescription>Your recent game sessions will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No games played yet. Start playing to see your history!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
