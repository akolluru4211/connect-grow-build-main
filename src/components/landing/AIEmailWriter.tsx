import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Sparkles, 
  Copy, 
  Check, 
  Loader2, 
  Plus, 
  X,
  Wand2,
  Send
} from "lucide-react";
import { toast } from "sonner";

type Tone = "professional" | "friendly" | "formal" | "casual";

const toneOptions: { value: Tone; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Business-appropriate" },
  { value: "friendly", label: "Friendly", description: "Warm & personable" },
  { value: "formal", label: "Formal", description: "Traditional & respectful" },
  { value: "casual", label: "Casual", description: "Relaxed & informal" },
];

export function AIEmailWriter() {
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [recipient, setRecipient] = useState("");
  const [context, setContext] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [newKeyPoint, setNewKeyPoint] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setKeyPoints([...keyPoints, newKeyPoint.trim()]);
      setNewKeyPoint("");
    }
  };

  const removeKeyPoint = (index: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== index));
  };

  const generateEmail = async () => {
    if (!purpose.trim()) {
      toast.error("Please enter the purpose of your email");
      return;
    }

    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-writer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            purpose,
            tone,
            recipient: recipient || undefined,
            context: context || undefined,
            keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate email");
      }

      const data = await response.json();
      setGeneratedEmail({ subject: data.subject, body: data.body });
      toast.success("Email generated successfully!");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error("Failed to generate email. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedEmail) return;
    
    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Wand2 className="h-4 w-4" />
            AI-Powered Tool
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            AI Professional Email Writer
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Write perfect, humanized emails in seconds. Our AI crafts natural-sounding 
            emails that don't feel robotic or template-like.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Compose Your Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">What's the purpose of this email? *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="e.g., Follow up on a job application, request a meeting, thank someone for an interview..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Tone</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {toneOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTone(option.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          tone === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient (optional)</Label>
                  <Input
                    id="recipient"
                    placeholder="e.g., Hiring Manager, John Smith, Team..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Additional Context (optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Any background information that might help..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Key Points to Include (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a key point..."
                      value={newKeyPoint}
                      onChange={(e) => setNewKeyPoint(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addKeyPoint()}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addKeyPoint}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <AnimatePresence>
                    {keyPoints.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mt-2"
                      >
                        {keyPoints.map((point, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge variant="secondary" className="gap-1 pr-1">
                              {point}
                              <button
                                onClick={() => removeKeyPoint(index)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button 
                  onClick={generateEmail} 
                  className="w-full gap-2"
                  disabled={isGenerating || !purpose.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Generated Email */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Generated Email
                  </span>
                  {generatedEmail && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                    >
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <Sparkles className="h-5 w-5 absolute -top-1 -right-1 text-primary animate-pulse" />
                      </div>
                      <p className="mt-4">Crafting your perfect email...</p>
                    </motion.div>
                  ) : generatedEmail ? (
                    <motion.div
                      key="email"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                        <p className="font-medium">{generatedEmail.subject}</p>
                      </div>
                      <div className="p-4 bg-card border rounded-lg min-h-[200px]">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {generatedEmail.body}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                    >
                      <Mail className="h-12 w-12 mb-4 opacity-30" />
                      <p>Your generated email will appear here</p>
                      <p className="text-sm mt-1">Fill out the form and click generate</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
