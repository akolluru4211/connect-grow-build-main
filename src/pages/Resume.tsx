import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile } from "@/hooks/useProfile";
import { useWorkExperience, useEducation } from "@/hooks/useExperience";
import { useResumes, useCreateResume, useUpdateResume, useDeleteResume, calculateATSScore, ResumeData } from "@/hooks/useResumes";
import { useGenerateSummary, useSuggestSkills } from "@/hooks/useResumeAI";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ResumeTailoringModal } from "@/components/resume/ResumeTailoringModal";
import { JobResumeGeneratorModal } from "@/components/resume/JobResumeGeneratorModal";
import { ATSHealthChecker } from "@/components/resume/ATSHealthChecker";
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Eye,
  Sparkles,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Loader2,
  Upload,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const templates = [
  { id: "professional", name: "Professional", description: "Clean and modern design" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
  { id: "creative", name: "Creative", description: "Stand out with style" },
];

const builderSteps = ["Personal Info", "Summary", "Experience", "Education", "Skills", "Review"];

export default function Resume() {
  const { profile } = useProfile();
  const { experiences } = useWorkExperience();
  const { education } = useEducation();
  const { data: resumes, isLoading } = useResumes();
  const createResume = useCreateResume();
  const updateResume = useUpdateResume();
  const deleteResume = useDeleteResume();
  const generateSummary = useGenerateSummary();
  const suggestSkills = useSuggestSkills();
  const { uploadResume, deleteFile, getSignedUrl, listResumeFiles, userId } = useResumeUpload();

  const [showBuilder, setShowBuilder] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [showTailoringModal, setShowTailoringModal] = useState(false);
  const [showJobGeneratorModal, setShowJobGeneratorModal] = useState(false);
  const [selectedResumeForTailoring, setSelectedResumeForTailoring] = useState<ResumeData | null>(null);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData>({
    title: "My Resume",
    template: "professional",
    personal_info: {},
    summary: "",
    experience: [],
    education: [],
    skills: [],
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Fetch uploaded files
  const { data: uploadedFiles = [], refetch: refetchFiles } = useQuery({
    queryKey: ["resumeFiles"],
    queryFn: listResumeFiles,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadResume.mutateAsync(file);
      refetchFiles();
    }
    e.target.value = "";
  };

  const handleDownloadFile = async (fileName: string) => {
    try {
      const url = await getSignedUrl(fileName, userId);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      await deleteFile(fileName, userId);
      refetchFiles();
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const handleGenerateSummary = async () => {
    const result = await generateSummary.mutateAsync({
      name: resumeData.personal_info?.full_name,
      currentRole: resumeData.experience?.[0]?.title,
      yearsExperience: resumeData.experience?.length ? `${resumeData.experience.length}+ years` : undefined,
      skills: resumeData.skills,
    });
    if (result?.summary) {
      setResumeData({ ...resumeData, summary: result.summary });
      toast.success("Summary generated!");
    }
  };

  const handleSuggestSkills = async () => {
    const result = await suggestSkills.mutateAsync({
      currentSkills: resumeData.skills,
      targetRole: resumeData.experience?.[0]?.title,
    });
    if (result) {
      const allSuggestions = [
        ...(result.technical_skills || []),
        ...(result.soft_skills || []),
      ].filter(s => !resumeData.skills?.includes(s));
      setSuggestedSkills(allSuggestions.slice(0, 10));
      toast.success("Skills suggested!");
    }
  };

  // Auto-populate from profile
  useEffect(() => {
    if (profile) {
      setResumeData((prev) => ({
        ...prev,
        personal_info: {
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          linkedin: profile.linkedin_url || "",
          website: profile.website || "",
        },
      }));
    }
  }, [profile]);

  // Auto-populate experience
  useEffect(() => {
    if (experiences.length > 0) {
      setResumeData((prev) => ({
        ...prev,
        experience: experiences.map((e) => ({
          company: e.company_name,
          title: e.title,
          location: e.location || "",
          start_date: e.start_date,
          end_date: e.end_date || "",
          is_current: e.is_current || false,
          description: e.description || "",
        })),
      }));
    }
  }, [experiences]);

  // Auto-populate education
  useEffect(() => {
    if (education.length > 0) {
      setResumeData((prev) => ({
        ...prev,
        education: education.map((e) => ({
          institution: e.institution,
          degree: e.degree,
          field: e.field_of_study || "",
          start_date: e.start_date || "",
          end_date: e.end_date || "",
        })),
      }));
    }
  }, [education]);

  const atsScore = calculateATSScore(resumeData);

  const handleSaveResume = () => {
    createResume.mutate(
      { ...resumeData, ats_score: atsScore },
      {
        onSuccess: () => {
          setShowBuilder(false);
          setCurrentStep(0);
        },
      }
    );
  };

  const handleDownloadPDF = async (data?: ResumeData) => {
    const rd = data || resumeData;
    const jspdf = await import("jspdf");
    const doc = new jspdf.jsPDF();
    let y = 18;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const maxWidth = pageWidth - margin * 2;

    const addWrappedText = (text: string, x: number, startY: number, fontSize: number, style: "normal" | "bold" = "normal") => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", style);
      const lines = doc.splitTextToSize(text, maxWidth - (x - margin));
      doc.text(lines, x, startY);
      return startY + lines.length * (fontSize * 0.45) + 2;
    };

    const checkPage = (currentY: number, needed: number) => {
      if (currentY + needed > 278) { doc.addPage(); return 18; }
      return currentY;
    };

    const addSection = (title: string) => {
      y = checkPage(y, 18);
      y += 4;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235); // primary blue
      doc.text(title.toUpperCase(), margin, y);
      y += 1.5;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      doc.setTextColor(30, 30, 30);
    };

    // ─── HEADER: Name ───
    if (rd.personal_info?.full_name) {
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(rd.personal_info.full_name, pageWidth / 2, y, { align: "center" });
      y += 8;
    }

    // ─── HEADER: Headline / Title ───
    if (rd.experience?.[0]?.title) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(rd.experience[0].title, pageWidth / 2, y, { align: "center" });
      y += 6;
    }

    // ─── HEADER: Contact Line ───
    const contactParts = [
      rd.personal_info?.email,
      rd.personal_info?.phone,
      rd.personal_info?.location,
    ].filter(Boolean);
    if (contactParts.length) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(contactParts.join("  ·  "), pageWidth / 2, y, { align: "center" });
      y += 5;
    }

    // ─── HEADER: Links ───
    const linkParts = [
      rd.personal_info?.linkedin,
      rd.personal_info?.website,
    ].filter(Boolean);
    if (linkParts.length) {
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text(linkParts.join("  ·  "), pageWidth / 2, y, { align: "center" });
      y += 4;
    }

    // Divider after header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setTextColor(30, 30, 30);

    // ─── SUMMARY ───
    if (rd.summary) {
      addSection("Professional Summary");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      y = addWrappedText(rd.summary, margin, y, 10);
      y += 3;
    }

    // ─── EXPERIENCE ───
    if (rd.experience?.length) {
      addSection("Professional Experience");
      rd.experience.forEach((exp) => {
        y = checkPage(y, 22);
        // Title + Date on same line
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(exp.title, margin, y);
        const dateStr = `${exp.start_date} – ${exp.is_current ? "Present" : exp.end_date || ""}`;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(dateStr, pageWidth - margin, y, { align: "right" });
        y += 5;
        // Company + Location
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 70, 70);
        doc.text(`${exp.company}${exp.location ? `, ${exp.location}` : ""}`, margin, y);
        y += 5;
        doc.setTextColor(30, 30, 30);
        if (exp.description) {
          const bullets = exp.description.split(/\n|•|;/).map(b => b.trim()).filter(Boolean);
          bullets.forEach((bullet) => {
            y = checkPage(y, 8);
            y = addWrappedText(`•  ${bullet}`, margin + 3, y, 9.5);
            y += 1;
          });
        }
        if (exp.achievements?.length) {
          exp.achievements.forEach((ach) => {
            y = checkPage(y, 8);
            y = addWrappedText(`▸  ${ach}`, margin + 3, y, 9.5);
            y += 1;
          });
        }
        y += 3;
      });
    }

    // ─── EDUCATION ───
    if (rd.education?.length) {
      addSection("Education");
      rd.education.forEach((edu) => {
        y = checkPage(y, 14);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`, margin, y);
        // Date right-aligned
        if (edu.start_date || edu.end_date) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(120, 120, 120);
          doc.text(`${edu.start_date || ""} – ${edu.end_date || "Present"}`, pageWidth - margin, y, { align: "right" });
        }
        y += 5;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 70, 70);
        doc.text(edu.institution, margin, y);
        doc.setTextColor(30, 30, 30);
        y += 4;
        if (edu.gpa) {
          doc.setFontSize(9);
          doc.text(`GPA: ${edu.gpa}`, margin, y);
          y += 4;
        }
        y += 2;
      });
    }

    // ─── SKILLS ───
    if (rd.skills?.length) {
      addSection("Technical Skills");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      // Wrap skills in a readable format
      const skillsText = rd.skills.join("  ·  ");
      y = addWrappedText(skillsText, margin, y, 10);
      y += 3;
    }

    // ─── CERTIFICATIONS ───
    if (rd.certifications?.length) {
      addSection("Certifications");
      rd.certifications.forEach((cert) => {
        y = checkPage(y, 10);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(cert.name, margin, y);
        if (cert.date) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(120, 120, 120);
          doc.text(cert.date, pageWidth - margin, y, { align: "right" });
        }
        y += 4;
        if (cert.issuer) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(70, 70, 70);
          doc.text(cert.issuer, margin, y);
          doc.setTextColor(30, 30, 30);
          y += 4;
        }
        y += 1;
      });
    }

    // ─── PROJECTS ───
    if (rd.projects?.length) {
      addSection("Projects");
      rd.projects.forEach((proj) => {
        y = checkPage(y, 14);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(proj.name, margin, y);
        y += 4;
        if (proj.description) {
          doc.setFont("helvetica", "normal");
          y = addWrappedText(proj.description, margin, y, 9.5);
          y += 1;
        }
        if (proj.technologies?.length) {
          doc.setFontSize(8.5);
          doc.setTextColor(37, 99, 235);
          doc.text(`Tech: ${proj.technologies.join(", ")}`, margin, y);
          doc.setTextColor(30, 30, 30);
          y += 4;
        }
        y += 2;
      });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text("Generated with EdWorld Resume Builder", pageWidth / 2, footerY, { align: "center" });

    doc.save(`${rd.title || "Resume"}_ATS.pdf`);
    toast.success("ATS Resume PDF downloaded!");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={resumeData.personal_info?.full_name || ""}
                  onChange={(e) => setResumeData({ ...resumeData, personal_info: { ...resumeData.personal_info, full_name: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={resumeData.personal_info?.email || ""}
                  onChange={(e) => setResumeData({ ...resumeData, personal_info: { ...resumeData.personal_info, email: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={resumeData.personal_info?.phone || ""}
                  onChange={(e) => setResumeData({ ...resumeData, personal_info: { ...resumeData.personal_info, phone: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={resumeData.personal_info?.location || ""}
                  onChange={(e) => setResumeData({ ...resumeData, personal_info: { ...resumeData.personal_info, location: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  value={resumeData.personal_info?.linkedin || ""}
                  onChange={(e) => setResumeData({ ...resumeData, personal_info: { ...resumeData.personal_info, linkedin: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={resumeData.personal_info?.website || ""}
                  onChange={(e) => setResumeData({ ...resumeData, personal_info: { ...resumeData.personal_info, website: e.target.value } })}
                />
              </div>
            </div>
          </div>
        );
      case 1: // Summary
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Professional Summary</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generateSummary.isPending}
              >
                {generateSummary.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI Generate
              </Button>
            </div>
            <Textarea
              value={resumeData.summary || ""}
              onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
              placeholder="Write a compelling 2-3 sentence summary highlighting your experience and career goals..."
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              Tip: Include keywords from job descriptions you're targeting.
            </p>
          </div>
        );
      case 2: // Experience
        return (
          <div className="space-y-4">
            {resumeData.experience?.length === 0 ? (
              <p className="text-muted-foreground">No experience added. Add from your profile or manually.</p>
            ) : (
              resumeData.experience?.map((exp, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{exp.title}</h4>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            <p className="text-sm text-muted-foreground">
              Experience is imported from your profile. Edit your profile to update.
            </p>
          </div>
        );
      case 3: // Education
        return (
          <div className="space-y-4">
            {resumeData.education?.length === 0 ? (
              <p className="text-muted-foreground">No education added. Add from your profile.</p>
            ) : (
              resumeData.education?.map((edu, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{edu.degree}</h4>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {edu.field && <p className="text-xs text-muted-foreground">{edu.field}</p>}
                      </div>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
      case 4: // Skills
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Skills (comma separated)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestSkills}
                disabled={suggestSkills.isPending}
              >
                {suggestSkills.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                AI Suggest
              </Button>
            </div>
            <Textarea
              value={resumeData.skills?.join(", ") || ""}
              onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="React, TypeScript, Node.js, Python, AWS..."
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {resumeData.skills?.map((skill, i) => (
                <Badge key={i} variant="secondary">{skill}</Badge>
              ))}
            </div>
            {suggestedSkills.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">AI Suggested Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        if (!resumeData.skills?.includes(skill)) {
                          setResumeData({ ...resumeData, skills: [...(resumeData.skills || []), skill] });
                        }
                      }}
                    >
                      + {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 5: // Review
        return (
          <div className="space-y-6">
            <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-accent/5 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">ATS Score</h3>
                  <Progress value={atsScore} className="mt-2 h-3" />
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold">{atsScore}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                {atsScore >= 80 ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-4 w-4" /> Excellent! Your resume is ATS-ready.
                  </div>
                ) : atsScore >= 60 ? (
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="h-4 w-4" /> Good, but consider adding more details.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" /> Needs improvement. Add more content.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resume Title</Label>
              <Input
                value={resumeData.title}
                onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={resumeData.template}
                onValueChange={(v) => setResumeData({ ...resumeData, template: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => handleDownloadPDF()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF Preview
            </Button>
          </div>
        );
    }
  };

  const [activeTab, setActiveTab] = useState("resumes");

  // Handler for ATS checker improvements
  const handleATSImprove = (section: string) => {
    const stepMap: Record<string, number> = {
      fullname: 0,
      email: 0,
      phone: 0,
      location: 0,
      linkedin: 0,
      summary: 1,
      experience_count: 2,
      experience_descriptions: 2,
      education: 3,
      skills_count: 4,
    };
    
    if (stepMap[section] !== undefined) {
      setCurrentStep(stepMap[section]);
      setShowBuilder(true);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Hero Profile Section */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 text-primary shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {profile?.full_name ? `${profile.full_name}'s Resume Builder` : "Resume Builder"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                Create ATS-optimized resumes that get you 3x more interviews
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" /> AI-Powered
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" /> ATS-Optimized
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Download className="h-3 w-3" /> PDF Export
                </Badge>
                {resumes && resumes.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" /> {resumes.length} Resume{resumes.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowJobGeneratorModal(true)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate from Job
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadResume.isPending}
                />
                <Button variant="outline" asChild>
                  <span>
                    {uploadResume.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload PDF
                  </span>
                </Button>
              </label>
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Resume
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {resumes && resumes.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{resumes.length}</p>
                <p className="text-xs text-muted-foreground">Resumes Created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {resumes.length > 0 ? Math.round(resumes.reduce((s, r) => s + (r.ats_score || 0), 0) / resumes.length) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Avg ATS Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{uploadedFiles.length}</p>
                <p className="text-xs text-muted-foreground">Uploaded PDFs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">Free</p>
                <p className="text-xs text-muted-foreground">AI Tools Included</p>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="resumes" className="gap-2">
              <FileText className="h-4 w-4" />
              My Resumes
            </TabsTrigger>
            <TabsTrigger value="ats-checker" className="gap-2">
              <Target className="h-4 w-4" />
              ATS Health Checker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="space-y-6">
            {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Resumes</CardTitle>
              <CardDescription>Your PDF files stored in the cloud</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.metadata?.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file.name)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFile(file.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Resumes */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resumes?.length === 0 ? (
          <Card className="text-center border-dashed border-2">
            <CardContent className="py-16">
              <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Create Your First Resume</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Build a professional, ATS-friendly resume in minutes with our AI-powered builder. Your profile info will be auto-filled!
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <Button onClick={() => setShowBuilder(true)} size="lg">
                  <Plus className="mr-2 h-5 w-5" /> Create Resume
                </Button>
                <Button variant="outline" size="lg" onClick={() => setShowJobGeneratorModal(true)}>
                  <Sparkles className="mr-2 h-5 w-5" /> Generate from Job Description
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resumes?.map((resume) => (
              <Card key={resume.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{resume.title}</CardTitle>
                      <CardDescription>
                        Updated {format(new Date(resume.updated_at), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    {resume.ats_score && (
                      <Badge
                        variant={resume.ats_score >= 80 ? "default" : resume.ats_score >= 60 ? "secondary" : "destructive"}
                        className="text-sm font-bold"
                      >
                        {resume.ats_score}% ATS
                      </Badge>
                    )}
                  </div>
                  {resume.ats_score && (
                    <Progress value={resume.ats_score} className="h-1.5 mt-2" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl flex-1 md:flex-none">
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 px-4 rounded-xl flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-all shadow-lg shadow-yellow-500/20"
                      onClick={() => {
                        handleDownloadPDF({
                          title: resume.title,
                          template: resume.template || "professional",
                          personal_info: resume.personal_info as ResumeData["personal_info"],
                          summary: resume.summary || "",
                          experience: resume.experience as ResumeData["experience"],
                          education: resume.education as ResumeData["education"],
                          skills: resume.skills as ResumeData["skills"],
                        });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 rounded-xl"
                      onClick={() => {
                        setSelectedResumeForTailoring({
                          title: resume.title,
                          template: resume.template || "professional",
                          personal_info: resume.personal_info as ResumeData["personal_info"],
                          summary: resume.summary || "",
                          experience: resume.experience as ResumeData["experience"],
                          education: resume.education as ResumeData["education"],
                          skills: resume.skills as ResumeData["skills"],
                        });
                        setShowTailoringModal(true);
                      }}
                    >
                      <Target className="mr-2 h-4 w-4" /> Tailor
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0 ml-auto"
                      onClick={() => deleteResume.mutate(resume.id)}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="ats-checker">
            <div className="max-w-4xl mx-auto">
              <ATSHealthChecker 
                resumeData={resumeData} 
                onImprove={handleATSImprove}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Builder Dialog */}
        <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Build Your Resume</DialogTitle>
            </DialogHeader>

            {/* Steps Indicator */}
            <div className="flex items-center justify-between py-6 px-2 overflow-x-auto scrollbar-hide">
              {builderSteps.map((step, i) => (
                <div key={step} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all shadow-sm ${
                        i <= currentStep ? "bg-primary text-primary-foreground scale-110 shadow-primary/20" : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${i <= currentStep ? "text-primary" : "text-muted-foreground"}`}>{step}</span>
                  </div>
                  {i < builderSteps.length - 1 && (
                    <div className={cn(
                      "mx-2 md:mx-4 h-[2px] w-4 md:w-8 transition-colors",
                      i < currentStep ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </div>
              ))}
            </div>

            <div className="py-4">{renderStep()}</div>

            <DialogFooter className="gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </Button>
              )}
              {currentStep < builderSteps.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
              ) : (
                <Button onClick={handleSaveResume} disabled={createResume.isPending}>
                  {createResume.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Resume
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hidden Print Template */}
        <div className="hidden">
          <div ref={printRef}>
            <h1>{resumeData.personal_info?.full_name}</h1>
            <div className="contact">
              {resumeData.personal_info?.email} | {resumeData.personal_info?.phone} | {resumeData.personal_info?.location}
            </div>
            {resumeData.summary && (
              <>
                <h2>Summary</h2>
                <p>{resumeData.summary}</p>
              </>
            )}
            {resumeData.experience && resumeData.experience.length > 0 && (
              <>
                <h2>Experience</h2>
                {resumeData.experience.map((exp, i) => (
                  <div key={i} className="experience">
                    <h3>{exp.title} at {exp.company}</h3>
                    <p>{exp.start_date} - {exp.is_current ? "Present" : exp.end_date}</p>
                    <p>{exp.description}</p>
                  </div>
                ))}
              </>
            )}
            {resumeData.education && resumeData.education.length > 0 && (
              <>
                <h2>Education</h2>
                {resumeData.education.map((edu, i) => (
                  <div key={i} className="education">
                    <h3>{edu.degree}</h3>
                    <p>{edu.institution}</p>
                  </div>
                ))}
              </>
            )}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <>
                <h2>Skills</h2>
                <div className="skills">
                  {resumeData.skills.map((skill, i) => (
                    <span key={i} className="skill">{skill}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resume Tailoring Modal */}
      {selectedResumeForTailoring && (
        <ResumeTailoringModal
          open={showTailoringModal}
          onOpenChange={(open) => {
            setShowTailoringModal(open);
            if (!open) setSelectedResumeForTailoring(null);
          }}
          resume={selectedResumeForTailoring}
        />
      )}

      {/* Job Resume Generator Modal */}
      <JobResumeGeneratorModal
        open={showJobGeneratorModal}
        onOpenChange={setShowJobGeneratorModal}
      />
    </MainLayout>
  );
}
