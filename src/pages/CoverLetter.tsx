import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGenerateCoverLetter } from "@/hooks/useCoverLetter";
import { useProfile } from "@/hooks/useProfile";
import { useCheckAndAwardAchievements } from "@/hooks/useAchievements";
import { Mail, Sparkles, Copy, Download, Lightbulb, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CoverLetter() {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"professional" | "enthusiastic" | "conversational">("professional");
  const [result, setResult] = useState<{
    cover_letter: string;
    key_highlights: string[];
    customization_tips: string[];
    word_count: number;
  } | null>(null);

  const { profile } = useProfile();
  const generateMutation = useGenerateCoverLetter();
  const checkAchievements = useCheckAndAwardAchievements();

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      toast.error("Please provide job title and description");
      return;
    }

    const data = await generateMutation.mutateAsync({
      jobTitle,
      jobDescription,
      companyName,
      tone,
      userProfile: profile ? {
        name: profile.full_name || undefined,
        headline: profile.headline || undefined,
        bio: profile.bio || undefined,
      } : undefined,
    });

    setResult(data);
    checkAchievements.mutate("cover_letter");
  };

  const handleCopy = () => {
    if (result?.cover_letter) {
      navigator.clipboard.writeText(result.cover_letter);
      toast.success("Cover letter copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (result?.cover_letter) {
      const blob = new Blob([result.cover_letter], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${companyName || jobTitle}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Cover Letter Generator</h1>
            <p className="text-muted-foreground">
              Create personalized cover letters tailored to any job
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Enter the job information to generate a tailored cover letter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Paste the job description here..."
                  className="min-h-[200px]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Section */}
          <div className="space-y-4">
            {result ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Your Cover Letter</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <Badge variant="secondary">{result.word_count} words</Badge>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="letter">
                      <TabsList className="mb-4">
                        <TabsTrigger value="letter">Letter</TabsTrigger>
                        <TabsTrigger value="highlights">Highlights</TabsTrigger>
                        <TabsTrigger value="tips">Tips</TabsTrigger>
                      </TabsList>

                      <TabsContent value="letter">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                            {result.cover_letter}
                          </pre>
                        </div>
                      </TabsContent>

                      <TabsContent value="highlights">
                        <div className="space-y-2">
                          {result.key_highlights.map((highlight, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                              <p className="text-sm">{highlight}</p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="tips">
                        <div className="space-y-2">
                          {result.customization_tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Lightbulb className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                              <p className="text-sm">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your generated cover letter will appear here</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
