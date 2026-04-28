import { useState } from "react";
import { useTailorResume } from "@/hooks/useResumeTailoring";
import { ResumeData } from "@/hooks/useResumes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  Target,
  Lightbulb,
  TrendingUp,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface ResumeTailoringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resume: ResumeData;
  onApplyChanges?: (changes: {
    summary?: string;
    skills?: string[];
  }) => void;
}

export function ResumeTailoringModal({
  open,
  onOpenChange,
  resume,
  onApplyChanges,
}: ResumeTailoringModalProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const tailorResume = useTailorResume();
  const [result, setResult] = useState<{
    tailored_summary: string;
    suggested_skills: string[];
    keyword_matches: string[];
    improvement_tips: string[];
    match_score: number;
  } | null>(null);

  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    const data = await tailorResume.mutateAsync({
      resume,
      jobDescription,
      jobTitle: jobTitle || undefined,
    });

    if (data) {
      setResult(data);
    }
  };

  const handleApplySummary = () => {
    if (result?.tailored_summary && onApplyChanges) {
      onApplyChanges({ summary: result.tailored_summary });
      toast.success("Summary applied to resume!");
    }
  };

  const handleApplySkills = () => {
    if (result?.suggested_skills && onApplyChanges) {
      const newSkills = [
        ...(resume.skills || []),
        ...result.suggested_skills.filter(
          (s) => !resume.skills?.includes(s)
        ),
      ];
      onApplyChanges({ skills: newSkills });
      toast.success("Skills added to resume!");
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleReset = () => {
    setResult(null);
    setJobTitle("");
    setJobDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Tailor Resume to Job
          </DialogTitle>
          <DialogDescription>
            Paste a job description and our AI will suggest changes to optimize
            your resume for that specific role.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {!result ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title (Optional)</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description *</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Include requirements, responsibilities, and preferred
                  qualifications for best results.
                </p>
              </div>

              <Button
                onClick={handleTailor}
                disabled={tailorResume.isPending || !jobDescription.trim()}
                className="w-full"
              >
                {tailorResume.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Tailor My Resume
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Match Score */}
              <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-accent/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Match Score</h3>
                    <Progress value={result.match_score} className="mt-2 h-2" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">
                      {result.match_score}
                    </span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              {/* Keyword Matches */}
              {result.keyword_matches?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Keywords Found in Your Resume
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keyword_matches.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Tailored Summary */}
              {result.tailored_summary && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Tailored Summary
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyText(result.tailored_summary)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {onApplyChanges && (
                        <Button size="sm" onClick={handleApplySummary}>
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                    {result.tailored_summary}
                  </div>
                </div>
              )}

              {/* Suggested Skills */}
              {result.suggested_skills?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Suggested Skills to Add
                    </h4>
                    {onApplyChanges && (
                      <Button size="sm" onClick={handleApplySkills}>
                        Add All
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.suggested_skills.map((skill, i) => (
                      <Badge key={i} variant="outline">
                        + {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Tips */}
              {result.improvement_tips?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Improvement Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.improvement_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Try Another Job
                </Button>
                <Button onClick={() => onOpenChange(false)} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
