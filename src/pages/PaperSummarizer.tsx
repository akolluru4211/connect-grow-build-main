import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText, Loader2, Sparkles, BookOpen, Search, Tag, Copy, Check,
  Clock, AlertTriangle, ThumbsUp, Lightbulb, ArrowRight, Microscope,
  HelpCircle, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { generateJSON } from "@/lib/gemini";

interface PaperSummary {
  title: string;
  authors?: string;
  publicationYear?: string;
  summary: string;
  keyFindings: string[];
  methodology?: string;
  conclusions: string;
  strengths: string[];
  limitations: string[];
  futureWork?: string[];
  keywords: string[];
  researchQuestions?: string[];
  practicalImplications?: string;
  wordCount?: number;
  estimatedReadingTime?: number;
}

export default function PaperSummarizer() {
  const [paperText, setPaperText] = useState("");
  const [summaryType, setSummaryType] = useState("structured");
  const [focusArea, setFocusArea] = useState("");
  const [result, setResult] = useState<PaperSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const summarize = async () => {
    if (paperText.trim().length < 50) {
      toast.error("Please paste at least 50 characters of paper text");
      return;
    }
    setIsLoading(true);
    setActiveTab("summary");
    try {
      const prompt = `Summarize and analyze the following research paper text.
      Summary Type: ${summaryType}
      Focus Area: ${focusArea || "General overview"}

      Paper Text:
      ${paperText.substring(0, 8000)}

      Provide the analysis in the following JSON format:
      {
        "title": "Clear paper title",
        "authors": "Name of authors if found",
        "publicationYear": "Year of publication if found",
        "summary": "Comprehensive summary based on type",
        "keyFindings": ["Finding 1", "Finding 2", ...],
        "methodology": "Brief methodology overview",
        "conclusions": "Key conclusions",
        "strengths": ["Strength 1", "Strength 2", ...],
        "limitations": ["Limitation 1", "Limitation 2", ...],
        "futureWork": ["Future work 1", "Future work 2", ...],
        "keywords": ["Keyword 1", "Keyword 2", ...],
        "researchQuestions": ["Question 1", "Question 2", ...],
        "practicalImplications": "Brief practical implications",
        "wordCount": 1234,
        "estimatedReadingTime": 5
      }`;

      const data = await generateJSON<PaperSummary>(prompt);
      setResult(data);
      toast.success("Paper summarized!");
    } catch (err) {
      console.error("Paper Summarization Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to summarize");
    } finally {
      setIsLoading(false);
    }
  };

  const copySummary = () => {
    if (!result) return;
    const text = `📄 ${result.title}${result.authors ? `\n👤 ${result.authors}` : ""}${result.publicationYear ? ` (${result.publicationYear})` : ""}\n\n📝 Summary:\n${result.summary}\n\n🔍 Key Findings:\n${result.keyFindings.map(f => `• ${f}`).join("\n")}\n\n✅ Strengths:\n${result.strengths.map(s => `• ${s}`).join("\n")}\n\n⚠️ Limitations:\n${result.limitations.map(l => `• ${l}`).join("\n")}\n\n📌 Conclusions:\n${result.conclusions}\n\n🏷️ Keywords: ${result.keywords.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Summary copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = paperText.split(/\s+/).filter(Boolean).length;

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 space-y-8">
        <div className="text-center space-y-3">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <FileText className="h-4 w-4" />
            AI Research Paper Summarizer
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Understand Papers in Seconds</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get structured summaries with key findings, strengths, limitations, and critical analysis — perfect for literature reviews and exam prep.
          </p>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Paper Text *</label>
                <span className="text-xs text-muted-foreground">{wordCount} words • ~{Math.ceil(wordCount / 200)} min read</span>
              </div>
              <Textarea
                placeholder="Paste your research paper text here... (abstract, introduction, methodology, results, conclusion)"
                value={paperText}
                onChange={e => setPaperText(e.target.value)}
                className="min-h-[220px] text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Summary Type</label>
                <Select value={summaryType} onValueChange={setSummaryType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief (3-4 sentences)</SelectItem>
                    <SelectItem value="structured">Structured (key sections)</SelectItem>
                    <SelectItem value="detailed">Detailed (comprehensive)</SelectItem>
                    <SelectItem value="eli5">ELI5 (Simple language)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Focus Area (optional)</label>
                <Input placeholder="e.g., methodology, results, statistical analysis..." value={focusArea} onChange={e => setFocusArea(e.target.value)} />
              </div>
            </div>
            <Button onClick={summarize} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing Paper (takes ~15s)...</> : <><Sparkles className="h-4 w-4" /> Summarize & Analyze</>}
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Paper Header */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />{result.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {result.authors && <span>👤 {result.authors}</span>}
                        {result.publicationYear && <span>📅 {result.publicationYear}</span>}
                        {result.wordCount && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{result.estimatedReadingTime} min read ({result.wordCount} words)</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={copySummary}>
                      {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy All</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Results */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="findings">Findings</TabsTrigger>
                  <TabsTrigger value="meta">Meta</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4">
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">📝 Summary</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{result.summary}</p>
                      </div>

                      {result.methodology && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Microscope className="h-3.5 w-3.5" /> Methodology</h3>
                          <p className="text-sm text-muted-foreground">{result.methodology}</p>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">📌 Conclusions</h3>
                        <p className="text-sm text-muted-foreground">{result.conclusions}</p>
                      </div>

                      {result.practicalImplications && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Practical Implications</h3>
                          <p className="text-sm text-muted-foreground">{result.practicalImplications}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1.5"><ThumbsUp className="h-4 w-4 text-emerald-500" /> Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-emerald-500 shrink-0">✓</span>{s}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Limitations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.limitations.map((l, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-amber-500 shrink-0">⚠</span>{l}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {result.futureWork && result.futureWork.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-primary" /> Future Research Directions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.futureWork.map((f, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <span className="text-primary shrink-0"><ArrowRight className="h-3 w-3 mt-1" /></span>{f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="findings" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5"><Search className="h-4 w-4 text-primary" /> Key Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {result.keyFindings.map((f, i) => (
                          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {result.researchQuestions && result.researchQuestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-primary" /> Research Questions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.researchQuestions.map((q, i) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground italic">
                              <span className="text-primary font-bold shrink-0">Q{i + 1}:</span>{q}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="meta">
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      {result.keywords.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Keywords</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {result.keywords.map(k => (
                              <a key={k} href={`https://scholar.google.com/scholar?q=${encodeURIComponent(k)}`} target="_blank" rel="noopener noreferrer">
                                <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">{k}</Badge>
                              </a>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Click a keyword to search on Google Scholar</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
