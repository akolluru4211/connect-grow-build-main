import { useState, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkExperience, useEducation } from "@/hooks/useExperience";
import {
  useGenerateResumeFromJob,
  GeneratedResumeData,
} from "@/hooks/useJobResumeGenerator";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  Target,
  Lightbulb,
  TrendingUp,
  Download,
  FileText,
  Key,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface JobResumeGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobResumeGeneratorModal({
  open,
  onOpenChange,
}: JobResumeGeneratorModalProps) {
  const { profile } = useProfile();
  const { experiences } = useWorkExperience();
  const { education } = useEducation();
  const generateResume = useGenerateResumeFromJob();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<GeneratedResumeData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    const userData = {
      name: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      location: profile?.location || "",
      experience: experiences.map((e) => ({
        title: e.title,
        company: e.company_name,
        description: e.description || "",
      })),
      education: education.map((e) => ({
        degree: e.degree,
        institution: e.institution,
      })),
      skills: [], // Will be populated from user's profile skills if available
    };

    const data = await generateResume.mutateAsync({
      jobTitle: jobTitle || "Target Position",
      jobDescription,
      userData,
    });

    if (data) {
      setResult(data);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || !profile) return;

    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = 20;

      // Helper function to add text with word wrap
      const addWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number = 6
      ) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * lineHeight;
      };

      // Header - Name
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(profile.full_name || "Your Name", margin, yPosition);
      yPosition += 10;

      // Contact Info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const contactParts = [
        profile.email,
        profile.phone,
        profile.location,
      ].filter(Boolean);
      doc.text(contactParts.join(" | "), margin, yPosition);
      yPosition += 12;

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Professional Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PROFESSIONAL SUMMARY", margin, yPosition);
      yPosition += 2;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPosition = addWrappedText(
        result.professional_summary,
        margin,
        yPosition,
        contentWidth
      );
      yPosition += 8;

      // Keywords Section
      if (result.keywords && result.keywords.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("KEY QUALIFICATIONS", margin, yPosition);
        yPosition += 2;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const keywordsText = result.keywords.join(" • ");
        yPosition = addWrappedText(keywordsText, margin, yPosition, contentWidth);
        yPosition += 8;
      }

      // Skills Section
      const allSkills = [
        ...(result.matching_skills || []),
        ...(result.skills_to_add || []),
        ...(result.required_skills || []),
      ];
      const uniqueSkills = [...new Set(allSkills)].slice(0, 15);

      if (uniqueSkills.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("TECHNICAL SKILLS", margin, yPosition);
        yPosition += 2;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const skillsText = uniqueSkills.join(" • ");
        yPosition = addWrappedText(skillsText, margin, yPosition, contentWidth);
        yPosition += 8;
      }

      // Experience Section
      if (experiences.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("PROFESSIONAL EXPERIENCE", margin, yPosition);
        yPosition += 2;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        experiences.forEach((exp, index) => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(exp.title, margin, yPosition);
          yPosition += 5;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          const dateRange = exp.is_current
            ? `${exp.start_date} - Present`
            : `${exp.start_date} - ${exp.end_date || ""}`;
          doc.text(`${exp.company_name} | ${dateRange}`, margin, yPosition);
          yPosition += 5;

          doc.setTextColor(0, 0, 0);

          // Use generated bullets if available, otherwise use description
          if (
            result.experience_bullets &&
            result.experience_bullets.length > index
          ) {
            yPosition = addWrappedText(
              `• ${result.experience_bullets[index]}`,
              margin,
              yPosition,
              contentWidth
            );
          } else if (exp.description) {
            yPosition = addWrappedText(
              `• ${exp.description}`,
              margin,
              yPosition,
              contentWidth
            );
          }
          yPosition += 6;
        });
      }

      // Education Section
      if (education.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("EDUCATION", margin, yPosition);
        yPosition += 2;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        education.forEach((edu) => {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(edu.degree, margin, yPosition);
          yPosition += 5;

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(edu.institution, margin, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 8;
        });
      }

      // Save the PDF
      const fileName = `Resume_${profile.full_name?.replace(/\s+/g, "_") || "Generated"}_${jobTitle.replace(/\s+/g, "_") || "Position"}.pdf`;
      doc.save(fileName);
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
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
            <FileText className="h-5 w-5 text-primary" />
            Generate Resume from Job Description
          </DialogTitle>
          <DialogDescription>
            Paste a job description and our AI will create a tailored resume with
            relevant keywords for maximum ATS compatibility.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          {!result ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title *</Label>
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
                  rows={12}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Include requirements, responsibilities, and qualifications for
                  best keyword extraction.
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={
                  generateResume.isPending ||
                  !jobDescription.trim() ||
                  !jobTitle.trim()
                }
                className="w-full"
              >
                {generateResume.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Tailored Resume
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Match Score */}
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-4">
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
                </CardContent>
              </Card>

              {/* Professional Summary */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Generated Professional Summary
                </h4>
                <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                  {result.professional_summary}
                </div>
              </div>

              <Separator />

              {/* Keywords */}
              {result.keywords && result.keywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Key className="h-4 w-4 text-yellow-500" />
                    ATS Keywords Extracted
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((keyword, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {result.required_skills && result.required_skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Required Skills for This Role
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.required_skills.map((skill, i) => (
                      <Badge key={i} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.matching_skills && result.matching_skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Your Matching Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.matching_skills.map((skill, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-green-500/10 text-green-700 dark:text-green-400"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.recommendations.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try Another Job
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="flex-1"
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download as PDF
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
