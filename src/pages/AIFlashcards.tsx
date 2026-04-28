import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, RefreshCw, ChevronLeft, ChevronRight, BrainCircuit, Library } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { generateJSON } from "@/lib/gemini";

interface Flashcard {
  front: string;
  back: string;
}

export default function AIFlashcards() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const generateCards = async () => {
    if (topic.trim().length < 10) {
      toast.error("Please enter a detailed topic or paste your notes.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const prompt = `
        Generate 5 high-quality flashcards based on the following topic or notes:
        "${topic}"
        
        The flashcards should have a "front" (question/concept) and a "back" (answer/explanation).
        Format the response as a JSON array of objects with "front" and "back" keys.
      `;
      
      const generatedCards = await generateJSON<Flashcard[]>(prompt);
      
      if (Array.isArray(generatedCards) && generatedCards.length > 0) {
        setFlashcards(generatedCards);
        setCurrentIndex(0);
        setIsFlipped(false);
        toast.success(`AI generated ${generatedCards.length} smart flashcards!`);
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (error: any) {
      console.error("Flashcard generation error:", error);
      toast.error("Failed to generate flashcards. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (!flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const prevCard = () => {
    if (!flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8 space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
          >
            <BrainCircuit className="h-4 w-4" />
            AI Flashcard Generator
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Master Any Topic Instantly</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Paste your lecture notes, textbook paragraphs, or syllabus topics. Our AI will instantly extract key concepts into verifiable memory flashcards.
          </p>
        </div>

        {!flashcards && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    Source Material
                  </label>
                  <Textarea
                    placeholder="Paste your notes or enter a specific topic here (e.g., 'Newton's laws of motion' or 'React useEffect hook')..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[200px] text-base resize-none bg-background/50 border-input/50 focus-visible:ring-primary/50"
                  />
                  <p className="text-xs text-muted-foreground pt-1">{topic.length} characters</p>
                </div>
                
                <Button 
                  onClick={generateCards} 
                  disabled={isGenerating} 
                  className="w-full btn-premium py-6 text-lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Extracting Knowledge...</>
                  ) : (
                    <><Sparkles className="h-5 w-5 mr-2" /> Generate Smart Cards</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {flashcards && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="space-y-6"
          >
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" /> 
                Study Deck
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFlashcards(null)}
                className="bg-background/50 hover:bg-muted border-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Create New
              </Button>
            </div>

            <div className="relative perspective-1000 w-full max-w-2xl mx-auto h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex + (isFlipped ? "-flipped" : "")}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 w-full h-full cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <Card className={`w-full h-full flex flex-col justify-center items-center p-8 text-center glass-card border-t border-white/20 shadow-2xl transition-colors ${isFlipped ? 'bg-primary/5 border-primary/30' : ''}`}>
                    <span className="absolute top-4 left-6 text-xs font-semibold uppercase tracking-widest opacity-50">
                      {isFlipped ? "Back / Answer" : "Front / Question"}
                    </span>
                    <span className="absolute top-4 right-6 text-xs font-mono opacity-50 bg-background/50 px-2 py-1 rounded-md">
                      {currentIndex + 1} / {flashcards.length}
                    </span>
                    
                    <h2 className={`text-2xl md:text-3xl font-medium leading-relaxed ${isFlipped ? 'text-primary' : 'text-foreground'}`}>
                      {isFlipped ? flashcards[currentIndex].back : flashcards[currentIndex].front}
                    </h2>
                    
                    <p className="absolute bottom-6 text-xs text-muted-foreground animate-pulse">
                      Click anywhere to flip
                    </p>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={prevCard}
                className="w-12 h-12 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div className="flex gap-2">
                {flashcards.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-primary shadow-[0_0_8px_rgba(14,165,233,0.8)]' : 'w-2 bg-muted/50 cursor-pointer hover:bg-muted'}`}
                    onClick={() => { setIsFlipped(false); setCurrentIndex(idx); }}
                  />
                ))}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextCard}
                className="w-12 h-12 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all pb-0.5 pl-0.5"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
