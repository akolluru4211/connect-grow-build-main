import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Presentation, Loader2, Sparkles, Download, ChevronLeft, ChevronRight,
  Maximize2, Minimize2, MessageSquare, Copy, Check, Edit3, Save,
} from "lucide-react";
import { toast } from "sonner";
import { generateJSON } from "@/lib/gemini";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

interface Slide {
  slideNumber: number;
  title: string;
  layout: string;
  bullets: string[];
  speakerNotes?: string;
  keyTakeaway?: string;
}

interface PresentationData {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

const THEMES = [
  { value: "professional", label: "Professional", titleColor: "text-primary", bgClass: "bg-card" },
  { value: "modern", label: "Modern Dark", titleColor: "text-primary", bgClass: "bg-gradient-to-br from-background to-card text-foreground" },
  { value: "academic", label: "Academic", titleColor: "text-foreground", bgClass: "bg-card" },
  { value: "creative", label: "Creative", titleColor: "text-primary", bgClass: "bg-gradient-to-br from-primary/5 via-background to-accent/5" },
  { value: "minimal", label: "Minimal Clean", titleColor: "text-foreground", bgClass: "bg-background" },
];

const AUDIENCES = [
  "General",
  "Students / Classmates",
  "Professors / Faculty",
  "Industry Professionals",
  "Investors / Judges",
  "Conference / Seminar",
];

export default function PresentationGenerator() {
  const [notes, setNotes] = useState("");
  const [slideCount, setSlideCount] = useState("8");
  const [theme, setTheme] = useState("professional");
  const [audience, setAudience] = useState("");
  const [includeConclusion, setIncludeConclusion] = useState(true);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBullets, setEditBullets] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (notes.trim().length < 20) {
      toast.error("Please enter at least 20 characters of notes");
      return;
    }
    setIsLoading(true);
    try {
      const prompt = `
        Generate a professional presentation outline from these notes:
        Notes: ${notes}
        Number of Slides: ${slideCount}
        Theme: ${theme}
        Audience: ${audience || "General"}
        Include Conclusion: ${includeConclusion}

        Return a JSON object with this structure:
        {
          "title": "Presentation Title",
          "subtitle": "Presentation Subtitle",
          "slides": [
            {
              "slideNumber": 1,
              "title": "Slide Title",
              "layout": "title" | "content" | "conclusion",
              "bullets": ["Bullet 1", "Bullet 2"],
              "speakerNotes": "Brief speaker notes",
              "keyTakeaway": "One sentence summary"
            }
          ]
        }
      `;

      const data = await generateJSON<PresentationData>(prompt);
      setPresentation(data);
      setCurrentSlide(0);
      toast.success(`Generated ${data.slides?.length || 0} slides!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!presentation) return;
    if (editingSlide !== null) return;
    if (e.key === "ArrowRight" || e.key === " ") {
      e.preventDefault();
      setCurrentSlide(c => Math.min(c + 1, presentation.slides.length - 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCurrentSlide(c => Math.max(c - 1, 0));
    } else if (e.key === "Escape") {
      setIsFullscreen(false);
    } else if (e.key === "f" || e.key === "F") {
      setIsFullscreen(f => !f);
    }
  }, [presentation, editingSlide]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const startEditing = (idx: number) => {
    if (!presentation) return;
    const slide = presentation.slides[idx];
    setEditingSlide(idx);
    setEditTitle(slide.title);
    setEditBullets(slide.bullets.join("\n"));
  };

  const saveEdit = () => {
    if (editingSlide === null || !presentation) return;
    const updated = { ...presentation };
    updated.slides = [...updated.slides];
    updated.slides[editingSlide] = {
      ...updated.slides[editingSlide],
      title: editTitle,
      bullets: editBullets.split("\n").filter(b => b.trim()),
    };
    setPresentation(updated);
    setEditingSlide(null);
    toast.success("Slide updated!");
  };

  const copyAllContent = () => {
    if (!presentation) return;
    const text = presentation.slides.map(s =>
      `Slide ${s.slideNumber}: ${s.title}\n${s.bullets.map(b => `  • ${b}`).join("\n")}${s.speakerNotes ? `\n  [Notes: ${s.speakerNotes}]` : ""}`
    ).join("\n\n");
    navigator.clipboard.writeText(`${presentation.title}\n${"=".repeat(40)}\n\n${text}`);
    setCopied(true);
    toast.success("All slides copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = () => {
    if (!presentation) return;
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [960, 540] });

    presentation.slides.forEach((slide, i) => {
      if (i > 0) pdf.addPage([960, 540], "landscape");

      const isDark = theme === "modern";

      // Background
      pdf.setFillColor(isDark ? 30 : 255, isDark ? 30 : 255, isDark ? 40 : 255);
      pdf.rect(0, 0, 960, 540, "F");

      // Accent bar
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, 960, 6, "F");

      // Layout-specific rendering
      const isTitle = slide.layout === "title" || i === 0;
      const isConclusion = slide.layout === "conclusion";

      if (isTitle) {
        // Centered title layout
        pdf.setFontSize(36);
        pdf.setTextColor(isDark ? 255 : 30);
        const titleLines = pdf.splitTextToSize(slide.title, 700);
        pdf.text(titleLines, 480, 200, { align: "center" });

        if (slide.bullets.length > 0) {
          pdf.setFontSize(18);
          pdf.setTextColor(isDark ? 200 : 100);
          pdf.text(slide.bullets[0], 480, 280, { align: "center" });
        }

        // Subtitle
        if (i === 0 && presentation.subtitle) {
          pdf.setFontSize(16);
          pdf.setTextColor(isDark ? 180 : 120);
          pdf.text(presentation.subtitle, 480, 320, { align: "center" });
        }
      } else if (isConclusion) {
        // Conclusion layout
        pdf.setFontSize(32);
        pdf.setTextColor(isDark ? 255 : 30);
        pdf.text(slide.title, 480, 120, { align: "center" });

        pdf.setFillColor(59, 130, 246);
        pdf.rect(380, 140, 200, 3, "F");

        pdf.setFontSize(16);
        pdf.setTextColor(isDark ? 200 : 80);
        slide.bullets.forEach((b, j) => {
          const y = 190 + j * 45;
          if (y < 480) {
            const lines = pdf.splitTextToSize(b, 700);
            pdf.text(lines, 480, y, { align: "center" });
          }
        });
      } else {
        // Standard content layout
        pdf.setFontSize(10);
        pdf.setTextColor(isDark ? 120 : 150);
        pdf.text(`${slide.slideNumber} / ${presentation.slides.length}`, 910, 525);

        pdf.setFontSize(28);
        pdf.setTextColor(isDark ? 255 : 30);
        const titleLines = pdf.splitTextToSize(slide.title, 840);
        pdf.text(titleLines, 60, 70);

        pdf.setDrawColor(59, 130, 246);
        pdf.setLineWidth(2);
        pdf.line(60, 85 + (titleLines.length - 1) * 30, 300, 85 + (titleLines.length - 1) * 30);

        const startY = 120 + (titleLines.length - 1) * 30;
        pdf.setFontSize(15);
        pdf.setTextColor(isDark ? 200 : 60);
        slide.bullets.forEach((b, j) => {
          const y = startY + j * 48;
          if (y < 490) {
            pdf.setFillColor(59, 130, 246);
            pdf.circle(72, y - 4, 4, "F");
            const lines = pdf.splitTextToSize(b, 800);
            pdf.text(lines, 90, y);
          }
        });

        // Key takeaway
        if (slide.keyTakeaway) {
          pdf.setFillColor(isDark ? 50 : 240, isDark ? 50 : 245, isDark ? 60 : 255);
          pdf.roundedRect(50, 470, 860, 30, 5, 5, "F");
          pdf.setFontSize(11);
          pdf.setTextColor(59, 130, 246);
          pdf.text(`💡 ${slide.keyTakeaway}`, 65, 490);
        }
      }
    });

    pdf.save(`${presentation.title.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF downloaded!");
  };

  const currentTheme = THEMES.find(t => t.value === theme) || THEMES[0];
  const slide = presentation?.slides[currentSlide];

  const renderSlideContent = (s: Slide, isPreview = false) => {
    const isTitle = s.layout === "title" || s.slideNumber === 1;
    const isConclusion = s.layout === "conclusion";
    const isDark = theme === "modern";
    const textClass = isDark && !isPreview ? "text-white" : "";

    if (isTitle) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <h3 className={`text-2xl md:text-4xl font-bold ${currentTheme.titleColor} ${textClass}`}>{s.title}</h3>
          {s.bullets[0] && <p className={`text-base md:text-lg ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{s.bullets[0]}</p>}
          {presentation?.subtitle && s.slideNumber === 1 && (
            <p className={`text-sm ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{presentation.subtitle}</p>
          )}
        </div>
      );
    }

    if (isConclusion) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <h3 className={`text-2xl md:text-3xl font-bold ${currentTheme.titleColor} ${textClass}`}>{s.title}</h3>
          <div className="w-20 h-0.5 bg-primary" />
          <ul className="space-y-2 max-w-lg">
            {s.bullets.map((b, i) => (
              <li key={i} className={`text-sm md:text-base ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{b}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <>
        <h3 className={`text-xl md:text-3xl font-bold mb-4 ${currentTheme.titleColor} ${textClass}`}>{s.title}</h3>
        <div className="border-b-2 border-primary w-20 mb-5" />
        <ul className="space-y-3 flex-1">
          {s.bullets.map((b, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`flex items-start gap-3 text-sm md:text-base ${isDark ? "text-foreground" : "text-foreground"}`}>
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              {b}
            </motion.li>
          ))}
        </ul>
        {s.keyTakeaway && (
          <div className={`mt-4 px-4 py-2 rounded-lg text-xs ${isDark ? "bg-muted/20 text-primary" : "bg-primary/5 text-primary"}`}>
            💡 {s.keyTakeaway}
          </div>
        )}
      </>
    );
  };

  return (
    <MainLayout>
      <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background" : "container max-w-5xl py-8"} space-y-8`}>
        {!isFullscreen && (
          <>
            <div className="text-center space-y-3">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Presentation className="h-4 w-4" />
                AI Presentation Generator
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Turn Notes Into Pro Slides</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Paste your notes and get a complete presentation with smart layouts, speaker notes, key takeaways, and PDF download.
              </p>
            </div>

            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your Notes *</label>
                  <Textarea
                    placeholder="Paste your lecture notes, topic outline, research findings, or any content you want to present..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[180px] text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{notes.split(/\s+/).filter(Boolean).length} words</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Slides</label>
                    <Input type="number" min={3} max={20} value={slideCount} onChange={e => setSlideCount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Theme</label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {THEMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Audience</label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger><SelectValue placeholder="General" /></SelectTrigger>
                      <SelectContent>
                        {AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Conclusion Slide</label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch checked={includeConclusion} onCheckedChange={setIncludeConclusion} />
                      <span className="text-xs text-muted-foreground">{includeConclusion ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
                <Button onClick={generate} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating Slides (takes ~15s)...</> : <><Sparkles className="h-4 w-4" /> Generate Presentation</>}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {presentation && slide && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {!isFullscreen && <h2 className="text-xl font-bold text-foreground">{presentation.title}</h2>}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setShowNotes(n => !n)}>
                  <MessageSquare className="h-4 w-4" /> {showNotes ? "Hide" : "Show"} Notes
                </Button>
                <Button variant="ghost" size="sm" onClick={copyAllContent}>
                  {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy All</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => startEditing(currentSlide)}>
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPDF}>
                  <Download className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsFullscreen(f => !f)}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Editing Modal */}
            <AnimatePresence>
              {editingSlide !== null && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className="border-primary/30">
                    <CardContent className="p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Edit Slide {editingSlide + 1}</h4>
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Slide title" />
                      <Textarea value={editBullets} onChange={e => setEditBullets(e.target.value)} placeholder="One bullet per line" className="min-h-[100px]" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}><Save className="h-3 w-3" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSlide(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slide Preview */}
            <Card className="overflow-hidden">
              <div className={`aspect-video p-8 md:p-12 flex flex-col justify-center relative ${currentTheme.bgClass}`}>
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
                {slide.layout !== "title" && slide.slideNumber !== 1 && (
                  <div className={`absolute top-4 right-6 text-xs ${theme === "modern" ? "text-muted-foreground" : "text-muted-foreground"}`}>
                    {slide.slideNumber} / {presentation.slides.length}
                  </div>
                )}
                {renderSlideContent(slide)}
                {showNotes && slide.speakerNotes && (
                  <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border px-6 py-3">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold">🎤 Speaker Notes:</span> {slide.speakerNotes}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" disabled={currentSlide === 0} onClick={() => setCurrentSlide(c => c - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground font-mono">{currentSlide + 1} / {presentation.slides.length}</span>
              <Button variant="outline" size="icon" disabled={currentSlide === presentation.slides.length - 1} onClick={() => setCurrentSlide(c => c + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {!isFullscreen && (
              <>
                <p className="text-xs text-center text-muted-foreground">⌨️ Use arrow keys to navigate • Press F for fullscreen • Esc to exit</p>

                {/* Slide thumbnails */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {presentation.slides.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`p-2 rounded-lg border text-left transition-all hover:shadow-sm ${
                        i === currentSlide ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
                      }`}
                    >
                      <p className="text-[9px] font-bold text-foreground truncate">{s.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[8px] text-muted-foreground">{s.slideNumber}</p>
                        {s.layout && <span className="text-[7px] text-primary bg-primary/10 px-1 rounded">{s.layout}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
