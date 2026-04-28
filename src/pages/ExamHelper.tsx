import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Lightbulb, Star, Target, BookOpen, Brain, BarChart3, Globe, Code, 
  Shield, Zap, Gamepad2, NotebookPen, Network, BookA, Presentation, 
  Upload, FileText, FileType, Sparkles, Loader2, Trophy, RotateCcw, 
  CheckCircle2, XCircle, ArrowRight, Eye, EyeOff, ChevronRight, 
  ChevronLeft, ClipboardList, Link2, Search, HelpCircle, Image as LucideImage 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import { generateJSON } from "@/lib/gemini";

type Mode = "quiz" | "games" | "infographics" | "slides" | "notes" | "mindmap" | "keyterms";

const iconMap: Record<string, any> = {
  lightbulb: Lightbulb, star: Star, target: Target, book: BookOpen,
  brain: Brain, chart: BarChart3, globe: Globe, code: Code, shield: Shield, zap: Zap,
};

const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.csv,.md,.html,.docx,.pptx,.xlsx,.doc,.ppt,.xls,.rtf";

const branchColors: Record<string, string> = {
  blue: "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300",
  green: "bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-300",
  purple: "bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300",
  orange: "bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300",
  red: "bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300",
  teal: "bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300",
};

export default function ExamHelper() {
  const [contentText, setContentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>("quiz");
  const [results, setResults] = useState<Record<string, any>>({});

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Games state
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({});
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [shuffledRight, setShuffledRight] = useState<number[]>([]);

  // Slides state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Notes state
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  // Key terms state
  const [termFilter, setTermFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [revealedTerms, setRevealedTerms] = useState<Set<number>>(new Set());

  const extractTextFromFile = async (file: File): Promise<string> => {
    const type = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (type === "application/pdf" || ext === "pdf") {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const maxPages = Math.min(pdf.numPages, 200);
      const textParts: string[] = [];
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        textParts.push(content.items.map((item: any) => item.str).join(" "));
      }
      if (pdf.numPages > maxPages) toast.info(`Processed first ${maxPages} of ${pdf.numPages} pages.`);
      return textParts.join("\n\n").slice(0, 30000);
    }

    if (type.startsWith("image/")) {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(`[Image uploaded: ${file.name}]\n\nBase64 image data available for AI analysis.\n\nImage data (first 5000 chars): ${base64?.slice(0, 5000)}`);
        };
        reader.readAsDataURL(file);
      });
    }

    if (type.startsWith("text/") || ["csv", "md", "txt", "html", "rtf"].includes(ext || "")) {
      return (await file.text()).slice(0, 30000);
    }

    if (type.includes("wordprocessingml") || ext === "docx") {
      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const docXml = await zip.file("word/document.xml")?.async("string");
        if (docXml) return docXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 30000);
      } catch {}
      return `[DOCX file: ${file.name}]`;
    }

    if (type.includes("presentationml") || ext === "pptx") {
      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const textParts: string[] = [];
        const slideFiles = Object.keys(zip.files).filter(f => f.startsWith("ppt/slides/slide") && f.endsWith(".xml")).sort();
        for (const sf of slideFiles.slice(0, 100)) {
          const xml = await zip.file(sf)?.async("string");
          if (xml) textParts.push(xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
        }
        return textParts.join("\n\n").slice(0, 30000);
      } catch {}
      return `[PPTX file: ${file.name}]`;
    }

    if (type.includes("spreadsheetml") || ext === "xlsx") {
      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const shared = await zip.file("xl/sharedStrings.xml")?.async("string");
        if (shared) return shared.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 30000);
      } catch {}
      return `[XLSX file: ${file.name}]`;
    }

    try {
      return (await file.text()).replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 30000);
    } catch {
      return `[File: ${file.name}] — Unable to extract.`;
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 * 1024) { toast.error("File too large. Max 2GB."); return; }
    setFileName(file.name);
    setExtracting(true);
    toast.info(`Processing ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);
    try {
      const text = await extractTextFromFile(file);
      if (text.length < 30) { toast.error("Could not extract enough content."); setExtracting(false); return; }
      setContentText(text);
      setResults({});
      setQuizComplete(false);
      setCurrentQ(0);
      setScore(0);
      toast.success(`${text.length.toLocaleString()} characters extracted`);
    } catch { toast.error("Failed to read file."); }
    finally { setExtracting(false); }
  }, []);

  const navigate = useNavigate();

  const generateContent = async (mode: Mode) => {
    if (!contentText) { toast.error("Upload a file first"); return; }
    setLoading(true);
    setActiveMode(mode);
    try {
      let prompt = "";
      const text = contentText.substring(0, 8000);

      if (mode === "quiz") {
        prompt = `Generate a quiz based on this text:
        ${text}
        Format: { "title": "...", "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." } ] }`;
      } else if (mode === "games") {
        prompt = `Generate study games data based on this text:
        ${text}
        Format: { "flashcards": [ { "term": "...", "definition": "..." } ], "matchPairs": [ { "left": "Term", "right": "Definition" } ], "fillBlanks": [ { "sentence": "... ____ ...", "answer": "..." } ] }`;
      } else if (mode === "notes") {
        prompt = `Generate study notes based on this text:
        ${text}
        Format: { "title": "...", "sections": [ { "heading": "...", "content": "...", "keyPoints": ["...", "..."], "example": "..." } ], "quickRevision": ["...", "..."], "mnemonics": [ { "topic": "...", "mnemonic": "...", "explanation": "..." } ] }`;
      } else if (mode === "mindmap") {
        prompt = `Generate mind map data based on this text:
        ${text}
        Format: { "title": "...", "branches": [ { "label": "...", "color": "blue/green/purple/orange/red/teal", "children": [ { "label": "...", "detail": "...", "children": [ { "label": "...", "detail": "..." } ] } ] } ], "connections": [ { "from": "...", "to": "...", "relation": "..." } ] }`;
      } else if (mode === "keyterms") {
        prompt = `Generate key terms and definitions based on this text:
        ${text}
        Format: { "categories": ["Category 1", "Category 2"], "terms": [ { "term": "...", "definition": "...", "category": "...", "example": "...", "related": ["Term A", "Term B"] } ] }`;
      } else if (mode === "infographics") {
        prompt = `Generate infographic data based on this text:
        ${text}
        Format: { "title": "...", "summary": "...", "keyConcepts": [ { "title": "...", "description": "...", "icon": "lightbulb/star/target/book/brain/chart/globe/code/shield/zap" } ], "timeline": [ { "label": "...", "description": "..." } ], "statistics": [ { "label": "...", "value": "...", "description": "..." } ] }`;
      } else if (mode === "slides") {
        prompt = `Generate presentation slides based on this text:
        ${text}
        Format: { "title": "...", "slides": [ { "title": "...", "bullets": ["...", "..."], "notes": "..." } ] }`;
      }

      const data = await generateJSON<any>(prompt);
      setResults((prev) => ({ ...prev, [mode]: data }));
      
      if (mode === "quiz") { setCurrentQ(0); setSelectedAnswer(null); setShowExplanation(false); setScore(0); setQuizComplete(false); }
      if (mode === "slides") setCurrentSlide(0);
      if (mode === "games") {
        setFlippedCards(new Set()); setFillAnswers({}); setMatchedPairs(new Set()); setSelectedLeft(null);
        if (data?.matchPairs) setShuffledRight([...Array(data.matchPairs.length).keys()].sort(() => Math.random() - 0.5));
      }
      if (mode === "notes") setExpandedSections(new Set([0]));
      if (mode === "keyterms") { setTermFilter(""); setActiveCategory("all"); setRevealedTerms(new Set()); }
      
      toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} generated!`);
    } catch (e: any) { 
      console.error("Exam Helper Error:", e);
      toast.error(e.message || "Failed to generate"); 
    }
    finally { setLoading(false); }
  };

  const handleQuizAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === results.quiz?.questions?.[currentQ]?.correctAnswer) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= (results.quiz?.questions?.length || 0)) setQuizComplete(true);
    else { setCurrentQ((c) => c + 1); setSelectedAnswer(null); setShowExplanation(false); }
  };

  const handleMatchClick = (rightIdx: number) => {
    if (selectedLeft === null || matchedPairs.has(selectedLeft)) return;
    const pairs = results.games?.matchPairs;
    if (!pairs) return;
    const actualRight = shuffledRight[rightIdx];
    if (selectedLeft === actualRight) {
      setMatchedPairs(prev => new Set([...prev, selectedLeft]));
      toast.success("Matched! 🎉");
    } else {
      toast.error("Try again!");
    }
    setSelectedLeft(null);
  };

  const modes: { key: Mode; label: string; icon: any; desc: string }[] = [
    { key: "quiz", label: "Quiz", icon: Brain, desc: "Test knowledge" },
    { key: "games", label: "Games", icon: Gamepad2, desc: "Flashcards & matching" },
    { key: "notes", label: "Notes", icon: NotebookPen, desc: "Study notes" },
    { key: "mindmap", label: "Mind Map", icon: Network, desc: "Visual connections" },
    { key: "keyterms", label: "Key Terms", icon: BookA, desc: "Glossary" },
    { key: "infographics", label: "Infographics", icon: BarChart3, desc: "Visual summary" },
    { key: "slides", label: "Slides", icon: Presentation, desc: "Presentation" },
  ];

  const getFileIcon = () => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (!ext) return <Upload className="h-8 w-8 text-primary" />;
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return <LucideImage className="h-8 w-8 text-primary" />;
    if (ext === "pdf") return <FileText className="h-8 w-8 text-primary" />;
    return <FileType className="h-8 w-8 text-primary" />;
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Exam Helper - AI Study Tool | EdWorld</title>
        <meta name="description" content="Upload documents and let AI create quizzes, games, notes, mind maps, glossaries, infographics, and slides." />
      </Helmet>

      <div className="container max-w-6xl py-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" /> Exam Helper
          </h1>
           <p className="text-muted-foreground max-w-lg mx-auto">
            Upload any file and AI transforms it into 7 different study formats
          </p>
        </div>

        {/* Upload */}
        <Card className="border-dashed border-2">
          <CardContent className="py-8">
            <label htmlFor="file-upload" className="flex flex-col items-center gap-3 cursor-pointer group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {extracting ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : fileName ? getFileIcon() : <Upload className="h-8 w-8 text-primary" />}
              </div>
              <div className="text-center">
                {extracting ? (
                  <><p className="font-semibold">Processing {fileName}...</p><p className="text-sm text-muted-foreground">Extracting content</p></>
                ) : fileName ? (
                  <><p className="font-semibold">{fileName}</p><p className="text-sm text-muted-foreground">{contentText.length.toLocaleString()} chars extracted • Click to change</p></>
                ) : (
                  <><p className="font-semibold">Click to upload any file</p><p className="text-sm text-muted-foreground">PDF, Images, DOCX, PPTX, XLSX, TXT, CSV, MD • Up to 2GB</p></>
                )}
              </div>
              <input id="file-upload" type="file" accept={ACCEPTED_EXTENSIONS} className="hidden" onChange={handleFileUpload} />
            </label>
          </CardContent>
        </Card>

        {/* Mode Selection */}
        {contentText && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {modes.map((m) => (
              <Button
                key={m.key}
                variant={activeMode === m.key && results[m.key] ? "default" : "outline"}
                className="h-auto py-3 flex flex-col gap-1 relative"
                onClick={() => generateContent(m.key)}
                disabled={loading}
              >
                {loading && activeMode === m.key ? <Loader2 className="h-5 w-5 animate-spin" /> : <m.icon className="h-5 w-5" />}
                <span className="text-xs font-semibold">{m.label}</span>
                {results[m.key] && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500" />}
              </Button>
            ))}
          </div>
        )}

        {/* Results */}
        {results[activeMode] && (
          <div className="space-y-4">

            {/* QUIZ */}
            {activeMode === "quiz" && results.quiz?.questions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />{results.quiz.title || "Quiz"}</CardTitle>
                  <CardDescription>Question {currentQ + 1} of {results.quiz.questions.length} • Score: {score}</CardDescription>
                  <Progress value={((currentQ + 1) / results.quiz.questions.length) * 100} className="h-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {quizComplete ? (
                    <div className="text-center py-8 space-y-4">
                      <Trophy className="h-16 w-16 text-amber-500 mx-auto" />
                      <h3 className="text-2xl font-bold">Quiz Complete!</h3>
                      <p className="text-4xl font-bold text-primary">{score} / {results.quiz.questions.length}</p>
                      <Progress value={(score / results.quiz.questions.length) * 100} className="h-3 max-w-xs mx-auto" />
                      <p className="text-muted-foreground">
                        {score === results.quiz.questions.length ? "Perfect score! 🎉" : score >= results.quiz.questions.length * 0.7 ? "Great job! 💪" : "Keep practicing! 📚"}
                      </p>
                      <Button onClick={() => { setCurrentQ(0); setScore(0); setQuizComplete(false); setSelectedAnswer(null); setShowExplanation(false); }}>
                        <RotateCcw className="h-4 w-4 mr-2" /> Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-medium">{results.quiz.questions[currentQ]?.question}</p>
                      <div className="grid gap-2">
                        {results.quiz.questions[currentQ]?.options?.map((opt: string, i: number) => {
                          const isCorrect = i === results.quiz.questions[currentQ].correctAnswer;
                          const isSelected = selectedAnswer === i;
                          return (
                            <button key={i} onClick={() => handleQuizAnswer(i)} disabled={selectedAnswer !== null}
                              className={cn(
                                "w-full text-left p-4 rounded-xl border-2 transition-all",
                                selectedAnswer === null && "hover:border-primary hover:bg-primary/5 cursor-pointer",
                                isSelected && isCorrect && "border-green-500 bg-green-500/10",
                                isSelected && !isCorrect && "border-destructive bg-destructive/10",
                                !isSelected && selectedAnswer !== null && isCorrect && "border-green-500 bg-green-500/5",
                                selectedAnswer !== null && !isSelected && !isCorrect && "opacity-40"
                              )}>
                              <div className="flex items-center gap-3">
                                <span className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0">{String.fromCharCode(65 + i)}</span>
                                <span className="flex-1">{opt}</span>
                                {selectedAnswer !== null && isCorrect && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                                {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {showExplanation && results.quiz.questions[currentQ]?.explanation && (
                        <div className="p-4 rounded-xl bg-muted/50 border flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                          <p className="text-sm">{results.quiz.questions[currentQ].explanation}</p>
                        </div>
                      )}
                      {selectedAnswer !== null && (
                        <Button onClick={nextQuestion} className="w-full">
                          {currentQ + 1 >= results.quiz.questions.length ? "View Results" : "Next Question"} <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* GAMES */}
            {activeMode === "games" && results.games && (
              <Tabs defaultValue="flashcards" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="flashcards">Flashcards ({results.games.flashcards?.length || 0})</TabsTrigger>
                  <TabsTrigger value="match">Match ({matchedPairs.size}/{results.games.matchPairs?.length || 0})</TabsTrigger>
                  <TabsTrigger value="fill">Fill Blanks</TabsTrigger>
                </TabsList>
                <TabsContent value="flashcards">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-muted-foreground">{flippedCards.size} of {results.games.flashcards?.length} revealed</p>
                    <Button size="sm" variant="outline" onClick={() => setFlippedCards(new Set())}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {results.games.flashcards?.map((card: any, i: number) => (
                      <div key={i} onClick={() => { const n = new Set(flippedCards); n.has(i) ? n.delete(i) : n.add(i); setFlippedCards(n); }}
                        className={cn("cursor-pointer p-5 rounded-xl border-2 min-h-[120px] flex items-center justify-center text-center transition-all hover:shadow-md",
                          flippedCards.has(i) ? "bg-primary/10 border-primary" : "hover:border-primary/50"
                        )}>
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {flippedCards.has(i) ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{flippedCards.has(i) ? "Definition" : "Term"}</span>
                          </div>
                          <p className={cn("font-semibold", flippedCards.has(i) && "text-primary text-sm")}>{flippedCards.has(i) ? card.definition : card.term}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="match">
                  {matchedPairs.size === (results.games.matchPairs?.length || 0) && matchedPairs.size > 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <Trophy className="h-12 w-12 text-amber-500 mx-auto" />
                      <h3 className="text-xl font-bold">All Matched! 🎉</h3>
                      <Button size="sm" onClick={() => { setMatchedPairs(new Set()); setSelectedLeft(null); setShuffledRight([...Array(results.games.matchPairs.length).keys()].sort(() => Math.random() - 0.5)); }}>
                        <RotateCcw className="h-4 w-4 mr-1" /> Play Again
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Terms (click to select)</h4>
                        {results.games.matchPairs?.map((pair: any, i: number) => (
                          <button key={i} onClick={() => !matchedPairs.has(i) && setSelectedLeft(i)}
                            className={cn("w-full text-left p-3 rounded-lg border text-sm font-medium transition-all",
                              matchedPairs.has(i) && "bg-green-500/10 border-green-500 line-through opacity-60",
                              selectedLeft === i && "border-primary bg-primary/10 ring-2 ring-primary/30",
                              !matchedPairs.has(i) && selectedLeft !== i && "hover:border-primary/50 cursor-pointer"
                            )}>
                            {i + 1}. {pair.left}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Definitions (click to match)</h4>
                        {shuffledRight.map((actualIdx, displayIdx) => {
                          const pair = results.games.matchPairs?.[actualIdx];
                          return (
                            <button key={displayIdx} onClick={() => handleMatchClick(displayIdx)}
                              className={cn("w-full text-left p-3 rounded-lg border bg-muted/50 text-sm transition-all",
                                matchedPairs.has(actualIdx) && "bg-green-500/10 border-green-500 opacity-60",
                                !matchedPairs.has(actualIdx) && selectedLeft !== null && "hover:border-primary/50 cursor-pointer"
                              )}>
                              {pair?.right}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="fill">
                  <div className="space-y-4">
                    {results.games.fillBlanks?.map((item: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="pt-4 space-y-2">
                          <p className="text-sm">{item.sentence}</p>
                          <div className="flex items-center gap-2">
                            <input type="text" placeholder="Your answer..." value={fillAnswers[i] || ""}
                              onChange={(e) => setFillAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                              className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm" />
                            <Button size="sm" variant="outline" onClick={() => {
                              if (fillAnswers[i]?.toLowerCase().trim() === item.answer.toLowerCase().trim()) toast.success("Correct! 🎉");
                              else toast.error(`Answer: ${item.answer}`);
                            }}>Check</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* NOTES */}
            {activeMode === "notes" && results.notes && (
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-primary/5 to-muted/30">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-1">{results.notes.title}</h3>
                    <p className="text-sm text-muted-foreground">Click sections to expand/collapse</p>
                  </CardContent>
                </Card>

                {/* Sections */}
                {results.notes.sections?.map((section: any, i: number) => (
                  <Card key={i} className="overflow-hidden">
                    <button onClick={() => { const n = new Set(expandedSections); n.has(i) ? n.delete(i) : n.add(i); setExpandedSections(n); }}
                      className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{i + 1}</span>
                        <h4 className="font-semibold">{section.heading}</h4>
                      </div>
                      <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform", expandedSections.has(i) && "rotate-90")} />
                    </button>
                    {expandedSections.has(i) && (
                      <CardContent className="pt-0 space-y-3 border-t">
                        <p className="text-sm leading-relaxed mt-4">{section.content}</p>
                        {section.keyPoints?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Points</p>
                            {section.keyPoints.map((point: string, j: number) => (
                              <div key={j} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.example && (
                          <div className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary text-sm">
                            <span className="font-semibold">Example: </span>{section.example}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}

                {/* Quick Revision */}
                {results.notes.quickRevision?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Quick Revision</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {results.notes.quickRevision.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30">
                            <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mnemonics */}
                {results.notes.mnemonics?.length > 0 && (
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" /> Memory Aids</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.notes.mnemonics.map((m: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                          <p className="font-semibold text-sm">{m.topic}</p>
                          <p className="text-primary font-bold mt-1">{m.mnemonic}</p>
                          <p className="text-xs text-muted-foreground mt-1">{m.explanation}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* MIND MAP */}
            {activeMode === "mindmap" && results.mindmap && (
              <div className="space-y-4">
                <Card className="text-center bg-gradient-to-br from-primary/10 to-muted/30">
                  <CardContent className="py-6">
                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-lg">
                      <Network className="h-5 w-5" /> {results.mindmap.title}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {results.mindmap.branches?.map((branch: any, i: number) => {
                    const colorClass = branchColors[branch.color] || branchColors.blue;
                    return (
                      <Card key={i} className={cn("border-2", colorClass)}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{branch.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {branch.children?.map((child: any, j: number) => (
                              <div key={j} className="p-3 rounded-lg bg-background/60 border space-y-1">
                                <p className="font-semibold text-sm">{child.label}</p>
                                {child.detail && <p className="text-xs text-muted-foreground">{child.detail}</p>}
                                {child.children?.map((leaf: any, k: number) => (
                                  <div key={k} className="ml-3 pl-2 border-l-2 border-current/20 text-xs mt-1">
                                    <span className="font-medium">{leaf.label}</span>
                                    {leaf.detail && <span className="text-muted-foreground"> — {leaf.detail}</span>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {results.mindmap.connections?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Cross-Connections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {results.mindmap.connections.map((conn: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{conn.from}</Badge>
                            <span className="text-muted-foreground">— {conn.relation} →</span>
                            <Badge variant="outline">{conn.to}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* KEY TERMS */}
            {activeMode === "keyterms" && results.keyterms && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Search terms..." value={termFilter}
                      onChange={(e) => setTermFilter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm" />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" variant={activeCategory === "all" ? "default" : "outline"} onClick={() => setActiveCategory("all")}>All</Button>
                    {results.keyterms.categories?.map((cat: string) => (
                      <Button key={cat} size="sm" variant={activeCategory === cat ? "default" : "outline"} onClick={() => setActiveCategory(cat)}>{cat}</Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {results.keyterms.terms?.filter((t: any) => {
                    const matchesSearch = !termFilter || t.term.toLowerCase().includes(termFilter.toLowerCase()) || t.definition.toLowerCase().includes(termFilter.toLowerCase());
                    const matchesCat = activeCategory === "all" || t.category === activeCategory;
                    return matchesSearch && matchesCat;
                  }).map((term: any, i: number) => (
                    <Card key={i} className="overflow-hidden">
                      <button onClick={() => { const n = new Set(revealedTerms); n.has(i) ? n.delete(i) : n.add(i); setRevealedTerms(n); }}
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary">{term.term}</span>
                          <Badge variant="secondary" className="text-[10px]">{term.category}</Badge>
                        </div>
                        {revealedTerms.has(i) ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {revealedTerms.has(i) && (
                        <CardContent className="pt-0 border-t space-y-2 pb-3">
                          <p className="text-sm mt-3">{term.definition}</p>
                          {term.example && (
                            <p className="text-xs text-muted-foreground italic">Example: {term.example}</p>
                          )}
                          {term.related?.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">Related:</span>
                              {term.related.map((r: string, j: number) => (
                                <Badge key={j} variant="outline" className="text-[10px]">{r}</Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* INFOGRAPHICS */}
            {activeMode === "infographics" && results.infographics && (
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-2">{results.infographics.title}</h3>
                    <p className="text-muted-foreground">{results.infographics.summary}</p>
                  </CardContent>
                </Card>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Key Concepts</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {results.infographics.keyConcepts?.map((concept: any, i: number) => {
                      const Icon = iconMap[concept.icon] || Lightbulb;
                      return (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-primary" /></div>
                              <div><h4 className="font-semibold text-sm">{concept.title}</h4><p className="text-xs text-muted-foreground mt-1">{concept.description}</p></div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><ArrowRight className="h-5 w-5 text-primary" /> Timeline / Flow</h3>
                  <div className="space-y-3">
                    {results.infographics.timeline?.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{i + 1}</div>
                          {i < (results.infographics.timeline?.length || 0) - 1 && <div className="w-0.5 h-8 bg-border mt-1" />}
                        </div>
                        <div className="pb-4"><h4 className="font-semibold text-sm">{item.label}</h4><p className="text-xs text-muted-foreground">{item.description}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                {results.infographics.statistics?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Key Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {results.infographics.statistics?.map((stat: any, i: number) => (
                        <Card key={i} className="text-center">
                          <CardContent className="pt-4">
                            <p className="text-2xl font-bold text-primary">{stat.value}</p>
                            <p className="text-sm font-medium">{stat.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SLIDES */}
            {activeMode === "slides" && results.slides?.slides && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Presentation className="h-5 w-5 text-primary" />{results.slides.title}</CardTitle>
                    <Badge variant="secondary">{currentSlide + 1} / {results.slides.slides.length}</Badge>
                  </div>
                  <Progress value={((currentSlide + 1) / results.slides.slides.length) * 100} className="h-1.5" />
                </CardHeader>
                <CardContent>
                  <div className="min-h-[300px] p-6 rounded-xl bg-gradient-to-br from-primary/5 to-muted/50 border space-y-6">
                    <h2 className="text-2xl font-bold">{results.slides.slides[currentSlide]?.title}</h2>
                    <ul className="space-y-3">
                      {results.slides.slides[currentSlide]?.bullets?.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-3"><ChevronRight className="h-5 w-5 text-primary mt-0.5 shrink-0" /><span>{b}</span></li>
                      ))}
                    </ul>
                    {results.slides.slides[currentSlide]?.notes && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground border-l-2 border-primary">
                        <strong>Notes:</strong> {results.slides.slides[currentSlide].notes}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))} disabled={currentSlide === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button onClick={() => setCurrentSlide((s) => Math.min(results.slides.slides.length - 1, s + 1))} disabled={currentSlide >= results.slides.slides.length - 1}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!contentText && (
          <Card className="py-12">
            <CardContent className="text-center space-y-4">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">7 Ways to Learn from Any File</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-4xl mx-auto text-xs text-muted-foreground">
                {modes.map((m) => (
                  <div key={m.key} className="space-y-1">
                    <m.icon className="h-7 w-7 mx-auto text-primary" />
                    <p className="font-medium text-foreground">{m.label}</p>
                    <p>{m.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
