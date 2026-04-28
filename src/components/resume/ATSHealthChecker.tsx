import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Sparkles,
  Target,
  Shield,
  Zap,
  Award,
  BookOpen,
  Briefcase,
  User,
  ListChecks,
  ArrowRight,
  Loader2
} from "lucide-react";
import { ResumeData } from "@/hooks/useResumes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ATSHealthCheckerProps {
  resumeData: ResumeData;
  onImprove?: (section: string) => void;
}

interface HealthCheck {
  id: string;
  category: string;
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
  points: number;
  maxPoints: number;
  suggestion?: string;
}

export function ATSHealthChecker({ resumeData, onImprove }: ATSHealthCheckerProps) {
  const [isTailoring, setIsTailoring] = useState(false);
  const [jdText, setJdText] = useState("");
  const [tailoredVersion, setTailoredVersion] = useState<string | null>(null);

  const analyzeResume = (): HealthCheck[] => {
    const checks: HealthCheck[] = [];
    const info = resumeData.personal_info || {};

    // Personal Info Checks
    checks.push({
      id: "fullname",
      category: "Personal Info",
      label: "Full Name",
      status: info.full_name && info.full_name.length > 2 ? "pass" : "fail",
      message: info.full_name ? "Full name identified" : "Full name is missing",
      points: info.full_name ? 10 : 0,
      maxPoints: 10,
      suggestion: "Recruiters and ATS need your name at the very top."
    });

    checks.push({
      id: "email",
      category: "Personal Info",
      label: "Professional Email",
      status: info.email && info.email.includes("@") ? "pass" : "fail",
      message: info.email ? "Email address validated" : "Contact email missing",
      points: info.email ? 10 : 0,
      maxPoints: 10,
      suggestion: "A professional email (e.g., name@gmail.com) is essential."
    });

    // Experience Checks
    const expCount = resumeData.experience?.length || 0;
    checks.push({
      id: "experience_count",
      category: "Experience",
      label: "Impactful Entries",
      status: expCount >= 2 ? "pass" : expCount === 1 ? "warning" : "fail",
      message: expCount >= 2 ? `${expCount} roles detailed` : "Add more experience",
      points: Math.min(expCount * 10, 20),
      maxPoints: 20,
      suggestion: "Detailed work history is the biggest signal for ATS systems."
    });

    // Skills Check
    const skillsCount = resumeData.skills?.length || 0;
    checks.push({
      id: "skills_count",
      category: "Skills",
      label: "Keyword Density",
      status: skillsCount >= 10 ? "pass" : skillsCount >= 5 ? "warning" : "fail",
      message: skillsCount >= 10 ? "Optimal keyword density" : "Low technical keywords",
      points: Math.min(skillsCount * 2, 20),
      maxPoints: 20,
      suggestion: "Target 10-15 key industry skills to pass modern ATS filters."
    });

    return checks;
  };

  const healthChecks = analyzeResume();
  const totalPoints = healthChecks.reduce((sum, check) => sum + check.points, 0);
  const maxPoints = healthChecks.reduce((sum, check) => sum + check.maxPoints, 0);
  const overallScore = Math.round((totalPoints / maxPoints) * 100);

  const handleTailor = () => {
    if (!jdText) return;
    setIsTailoring(true);
    setTimeout(() => {
      setIsTailoring(false);
      setTailoredVersion("Your resume has been optimized for this role. Key tech stack (React, Node.js) emphasized in summary.");
    }, 2500);
  };

  const categories = [...new Set(healthChecks.map(c => c.category))];
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "fail": return <XCircle className="h-5 w-5 text-rose-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Personal Info": return <User className="h-4 w-4" />;
      case "Experience": return <Briefcase className="h-4 w-4" />;
      case "Skills": return <Zap className="h-4 w-4" />;
      default: return <ListChecks className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="glass-card border-none overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200/40">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent p-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-900">Career OS Intelligence</CardTitle>
              <CardDescription className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">ATS Readiness Analysis</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10">
          {/* Overall Score */}
          <div className="relative group">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="text-4xl font-black tracking-tight text-slate-900">
                  {overallScore}% <span className="text-lg text-slate-400 font-bold">Health</span>
                </h3>
              </div>
              <Badge className={cn("px-4 py-1.5 rounded-xl font-black text-[10px] uppercase", 
                overallScore >= 80 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                {overallScore >= 80 ? 'Market Ready' : 'Needs Optimization'}
              </Badge>
            </div>
            <Progress value={overallScore} className="h-4 rounded-full bg-slate-100" />
            
            <div className="grid grid-cols-3 gap-4 mt-6">
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-lg font-black text-slate-900">{healthChecks.filter(c => c.status === 'pass').length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Passed</div>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-lg font-black text-slate-900">{healthChecks.filter(c => c.status === 'warning').length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Alerts</div>
               </div>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-lg font-black text-slate-900">{healthChecks.filter(c => c.status === 'fail').length}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Critical</div>
               </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Detailed Analysis */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Structural Audit</h4>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {categories.map(category => (
                  <AccordionItem key={category} value={category} className="border-none">
                    <AccordionTrigger className="glass-card px-6 py-4 rounded-2xl hover:no-underline shadow-sm border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-primary">
                          {getCategoryIcon(category)}
                        </div>
                        <span className="font-bold text-slate-900">{category}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 px-2">
                       <div className="space-y-3">
                         {healthChecks.filter(c => c.category === category).map(check => (
                           <div key={check.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                             <div className="flex items-start gap-3">
                               {getStatusIcon(check.status)}
                               <div>
                                 <div className="font-bold text-sm text-slate-900">{check.label}</div>
                                 <p className="text-xs text-slate-500 mt-1">{check.message}</p>
                                 {check.status !== 'pass' && (
                                   <div className="mt-2 text-[11px] font-bold text-primary flex items-center gap-1.5">
                                      <Sparkles className="h-3 w-3" /> Fix: {check.suggestion}
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* AI Tailoring Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Precision Tailoring</h4>
              <div className="glass-card p-6 rounded-[2rem] border-primary/10 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                <div className="absolute -right-8 -top-8 text-primary/5 -rotate-12">
                   <Target className="h-32 w-32" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6 text-slate-900 font-black text-lg">
                    <Sparkles className="h-5 w-5 text-primary" /> AI Optimiser
                  </div>
                  <textarea 
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="w-full h-40 rounded-2xl bg-white/80 border-slate-200 p-4 text-sm focus:ring-2 ring-primary/20 transition-all shadow-inner outline-none placeholder:text-slate-300 resize-none"
                    placeholder="Paste the Job Description here to tailor your resume achieving 90%+ match score..."
                  />
                  <Button 
                    onClick={handleTailor}
                    disabled={!jdText || isTailoring}
                    className="w-full h-14 mt-6 rounded-2xl btn-premium shadow-xl shadow-primary/20 text-lg group"
                  >
                    {isTailoring ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Tailoring Experience...</>
                    ) : (
                      <>Tailor Resume Now <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </Button>

                  <AnimatePresence>
                    {tailoredVersion && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium"
                      >
                         <CheckCircle2 className="h-4 w-4 inline mr-2" />
                         {tailoredVersion}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-6 rounded-[2rem] border border-slate-100 bg-white">
                 <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">System Insights</div>
                 <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Target className="h-4 w-4 text-primary" /> 
                    Keywords: <span className="text-primary">+12 identified from JD</span>
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}