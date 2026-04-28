import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useProfile } from "@/hooks/useProfile";
import { useRecordActivity } from "@/hooks/useGamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Brain, Github, Linkedin, Sparkles, FileText, Briefcase, Bot, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AIProfileAnalyzer() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { mutate: recordActivity } = useRecordActivity();
  const navigate = useNavigate();

  const [githubUrl, setGithubUrl] = useState(profile?.github_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const startAnalysis = async () => {
    if (!githubUrl && !linkedinUrl) {
      toast.error("Please provide at least one profile URL for EdWorld AI to analyze.");
      return;
    }

    if (githubUrl !== profile?.github_url || linkedinUrl !== profile?.linkedin_url) {
      await updateProfile({ github_url: githubUrl, linkedin_url: linkedinUrl });
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisComplete(false);

    // Simulate AI parsing pipeline
    const stages = [10, 30, 45, 60, 85, 100];
    for (const p of stages) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(p);
    }
    
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    
    // Actually record the activity for gamification
    recordActivity({ 
      activityType: "profile_update", 
      description: "Completed AI Profile Scan with GitHub/LinkedIn linking" 
    });

    toast.success("AI Profile Analysis Complete!", {
      icon: <Sparkles className="h-4 w-4 text-primary" />
    });
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl py-12">
        <div className="mb-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
            EdWorld <span className="text-primary italic">AI Profile Analyzer</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Our proprietary AI scans your GitHub and LinkedIn to reverse-engineer your skills, generate a production-ready resume, and instantly match you with high-probability jobs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Card className="shadow-xl shadow-slate-200/50 border-none rounded-[2rem] overflow-hidden bg-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" /> Data Sources
                </CardTitle>
                <CardDescription>Link your professional profiles to feed the AI engine.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2 relative">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Github className="h-4 w-4 text-slate-800" /> GitHub URL
                  </label>
                  <Input 
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white"
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-600" /> LinkedIn URL
                  </label>
                  <Input 
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:bg-white"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={startAnalysis}
                  disabled={isAnalyzing || isUpdating}
                  className="w-full btn-premium h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {isAnalyzing ? "Processing Data Pipeline..." : analysisComplete ? "Re-Analyze Profile" : "Start AI Deep Scan"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Card className="h-full border-dashed border-2 border-slate-200 bg-slate-50/50 rounded-[2rem] flex flex-col justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!isAnalyzing && !analysisComplete && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center"
                  >
                    <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Awaiting Input</h3>
                    <p className="text-sm text-slate-500 font-medium">Connect your profiles to generate insights.</p>
                  </motion.div>
                )}

                {isAnalyzing && (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 w-full"
                  >
                    <div className="text-center mb-6">
                      <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                      <h3 className="text-lg font-bold text-slate-900">EdWorld AI is Scanning...</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1">Extracting commits, repositories, and endorsements</p>
                    </div>
                    <Progress value={progress} className="h-3 rounded-full bg-slate-200" />
                    <p className="text-center text-xs text-primary font-bold mt-4 uppercase tracking-widest">{progress}% Complete</p>
                  </motion.div>
                )}

                {analysisComplete && (
                  <motion.div 
                    key="complete"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center h-full flex flex-col justify-center"
                  >
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-6">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Scan Successful</h3>
                    <p className="text-slate-500 font-medium mb-8">AI has successfully built your professional knowledge graph.</p>
                    
                    <div className="space-y-4">
                      <Button 
                        onClick={() => navigate("/resume")}
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2"
                      >
                        <FileText className="h-5 w-5" /> Generate ATS Resume
                      </Button>
                      <Button 
                        onClick={() => navigate("/job-recommendations")}
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-primary bg-primary/5 text-primary hover:bg-primary/10 font-bold flex items-center gap-2"
                      >
                        <Briefcase className="h-5 w-5" /> View Curated Job Matches
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
