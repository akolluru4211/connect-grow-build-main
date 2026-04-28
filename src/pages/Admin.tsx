import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAdmin } from "@/hooks/useAdmin";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Users, Briefcase, GraduationCap, TrendingUp,
  Shield, Mail, Send, Loader2, Pencil, Search,
  Target, Zap, CheckCircle2, AlertCircle, BarChart3,
  Rocket, Bot, Terminal, Sparkles
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { syncDiscoveredOpportunities } from "@/lib/opportunityUpdater";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const {
    isAdmin, isAdminLoading, stats,
    allUsers, allJobs, allInternships,
    updateUserRole, deleteJob
  } = useAdmin();

  const { data: analytics } = useAnalytics(30);

  const [geminiPrompt, setGeminiPrompt] = useState("");
  const [isGeminiProcessing, setIsGeminiProcessing] = useState(false);
  const [geminiResult, setGeminiResult] = useState<{message?: string, error?: string} | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryType, setDiscoveryType] = useState<"internship" | "job">("internship");
  const [discoveryIndustry, setDiscoveryIndustry] = useState("Technology");

  const handleGeminiCommand = async () => {
    if (!geminiPrompt.trim()) return;
    setIsGeminiProcessing(true);
    setGeminiResult(null);

    try {
      // 1. Use Gemini to interpret the command and generate the necessary data/actions
      const prompt = `You are an AI Admin Assistant for the EdWorld platform. 
      The user wants to perform an admin action: "${geminiPrompt}"
      
      Interpret this request. If it involves adding jobs or internships, generate the data in JSON format.
      If it's a general query about the system, respond with a message.
      
      Current tables available:
      - jobs (id, company_id, title, description, requirements, responsibilities, location, job_type, experience_level, salary_min, salary_max, salary_currency, is_active, application_url)
      - internships (id, company_id, title, description, requirements, location, internship_type, duration_months, stipend_amount, stipend_currency, is_active, application_url)
      - companies (id, name, description, industry, location)

      Respond with a JSON object:
      {
        "action": "insert_jobs" | "insert_internships" | "message" | "error",
        "data": [...] | null,
        "message": "User-friendly response message"
      }
      
      If inserting, provide the full objects (without IDs if they should be auto-generated).
      For companies, check if a company name is mentioned and try to link it or suggest creating it.`;

      const { generateJSON } = await import("@/lib/gemini");
      const result = await generateJSON<any>(prompt);

      if (result.action === "error") {
        throw new Error(result.message || "Failed to process command");
      }

      if (result.action === "insert_jobs" && result.data) {
        const { error } = await supabase.from("jobs").insert(result.data);
        if (error) throw error;
      } else if (result.action === "insert_internships" && result.data) {
        const { error } = await supabase.from("internships").insert(result.data);
        if (error) throw error;
      }

      setGeminiResult({ message: result.message });
      setGeminiPrompt("");
      toast({ title: "Command Executed", description: result.message });
    } catch (err: any) {
      setGeminiResult({ error: err.message || "Failed to execute command" });
      toast({ title: "Gemini AI Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGeminiProcessing(false);
    }
  };

  const handleDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const result = await syncDiscoveredOpportunities(discoveryType, discoveryIndustry);
      if (result.success) {
        toast({ title: "Discovery Complete", description: result.message });
      } else {
        toast({ title: "Discovery Failed", description: result.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Discovery Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDiscovering(false);
    }
  };


  if (isAdminLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] bg-white">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filteredUsers = allUsers?.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50/50 pb-20">
        {/* CRM Hero Section */}
        <section className="bg-white border-b border-slate-100 pt-12 pb-8">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">OS Command Center</h1>
                  <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mt-1">Institutional CRM & Placement Control</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                       <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                       <div className="text-xl font-black text-slate-900">84%</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase">Placement Rate</div>
                    </div>
                 </div>
                 <Button className="h-14 px-8 rounded-2xl btn-premium shadow-xl shadow-primary/20">
                    <Rocket className="h-5 w-5 mr-2" /> Scale App
                 </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mt-12">
               {[
                 { label: 'Managed Leads', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600' },
                 { label: 'Active Pipeline', value: (stats?.totalJobs || 0) + (stats?.totalInternships || 0), icon: Target, color: 'text-primary' },
                 { label: 'Verified Partners', value: '42', icon: Shield, color: 'text-indigo-600' },
                 { label: 'Success Radius', value: '12km', icon: Zap, color: 'text-amber-600' }
               ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-6 rounded-3xl border-none shadow-sm"
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
                    <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{stat.label}</div>
                  </motion.div>
               ))}
            </div>
          </div>
        </section>

        <div className="container mt-12">
          <Tabs defaultValue="pipeline" className="space-y-8">
            <TabsList className="bg-white/50 p-1.5 rounded-2xl border border-slate-100 inline-flex w-auto gap-1">
              <TabsTrigger value="pipeline" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Target className="h-4 w-4 mr-2" /> Placement Pipeline
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4 mr-2" /> Student Relationship
              </TabsTrigger>
              <TabsTrigger value="companies" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Briefcase className="h-4 w-4 mr-2" /> Partner Companies
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Mail className="h-4 w-4 mr-2" /> Mass Outreach
              </TabsTrigger>
              <TabsTrigger value="gemini" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-primary">
                <Bot className="h-4 w-4 mr-2" /> Gemini AI Agent
              </TabsTrigger>
            </TabsList>

            {/* Pipeline Content */}
            <TabsContent value="pipeline" className="space-y-6">
               <div className="grid lg:grid-cols-3 gap-8">
                  {['Shortlisted', 'Interviewing', 'Placed'].map((stage, idx) => (
                    <div key={stage} className="space-y-4">
                       <div className="flex items-center justify-between px-4">
                          <h3 className="font-black text-slate-900 flex items-center gap-2">
                             {stage} <Badge variant="secondary" className="bg-slate-200 text-slate-600 text-[10px]">{idx === 0 ? '12' : idx === 1 ? '5' : '8'}</Badge>
                          </h3>
                       </div>
                       
                       <div className="space-y-4">
                          {[1, 2].map((_, cardIdx) => (
                            <div key={cardIdx} className="glass-card p-5 rounded-3xl border-none shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                   <Avatar className="h-10 w-10">
                                      <AvatarFallback className="bg-primary/5 text-primary font-black text-xs">SK</AvatarFallback>
                                   </Avatar>
                                   <div>
                                      <div className="font-bold text-sm text-slate-900 line-clamp-1">Sandeep Kumar</div>
                                      <div className="text-[10px] font-bold text-primary uppercase">MERN Expert</div>
                                   </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                                   <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Targeting</div>
                                   <div className="text-xs font-bold text-slate-700">Senior Frontend at Google</div>
                                </div>
                                <div className="flex items-center justify-between">
                                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase">High Priority</Badge>
                                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full"><Pencil className="h-3 w-3" /></Button>
                                </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </TabsContent>

            {/* Student Relationship Content */}
            <TabsContent value="students">
              <Card className="glass-card border-none rounded-[2rem] shadow-xl overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900">Student Leads</CardTitle>
                      <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Managing {allUsers?.length} Active Students</CardDescription>
                    </div>
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <Input 
                         placeholder="Search name, tech stack or email..." 
                         className="pl-10 h-12 w-full md:w-80 rounded-2xl border-slate-100 bg-slate-50 outline-none"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-none">
                          <TableHead className="px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Student Profile</TableHead>
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Success Index</TableHead>
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Placements</TableHead>
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                          <TableHead className="px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((u) => (
                          <TableRow key={u.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                            <TableCell className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-primary/5">
                                  <AvatarImage src={u.avatar_url || ""} />
                                  <AvatarFallback className="bg-primary/5 text-primary font-black">{u.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-black text-slate-900">{u.full_name || "Unnamed"}</div>
                                  <div className="text-xs font-medium text-slate-400">{u.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                                <div className="w-32">
                                   <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                      <span>Ready</span>
                                      <span>75%</span>
                                   </div>
                                   <Progress value={75} className="h-1.5 rounded-full" />
                                </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-wrap gap-1">
                                  {u.roles?.includes('admin') ? (
                                    <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase">Super Admin</Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-slate-100 text-slate-500 font-bold text-[9px] uppercase">No Offer Yet</Badge>
                                  )}
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Now
                               </div>
                            </TableCell>
                            <TableCell className="px-8">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm"><Pencil className="h-4 w-4 text-slate-400" /></Button>
                                <Select onValueChange={(value) => {
                                  const [action, role] = value.split("-") as ["add" | "remove", any];
                                  updateUserRole.mutate({ userId: u.id, role, action });
                                }}>
                                  <SelectTrigger className="w-32 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider">
                                    <SelectValue placeholder="Promote" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="add-admin">Admin</SelectItem>
                                    <SelectItem value="add-mentor">Mentor</SelectItem>
                                    <SelectItem value="add-company">Company</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Broadcast Outreach */}
            <TabsContent value="broadcast">
               <div className="grid lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3 space-y-6">
                     <Card className="glass-card border-none rounded-[2rem] shadow-xl p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                           <Send className="h-5 w-5 text-primary" /> Smart Broadcast
                        </h3>
                        <div className="space-y-6">
                           <div>
                              <Label className="font-black text-slate-400 uppercase text-[10px] mb-2 block">Target Audience</Label>
                              <Select defaultValue="all">
                                 <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-bold"><SelectValue /></SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="all">All Registered Students</SelectItem>
                                    <SelectItem value="mentors">Verified Mentors</SelectItem>
                                    <SelectItem value="placed">Placed Students Only</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div>
                              <Label className="font-black text-slate-400 uppercase text-[10px] mb-2 block">Subject Line</Label>
                              <Input placeholder="Enter high-conversion subject..." className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold" />
                           </div>
                           <div>
                              <Label className="font-black text-slate-400 uppercase text-[10px] mb-2 block">Broadcast Content</Label>
                              <Textarea placeholder="Write your professional outreach here..." rows={8} className="rounded-2xl border-slate-100 bg-slate-50 font-medium p-4" />
                           </div>
                           <Button className="w-full h-14 rounded-2xl btn-premium shadow-xl shadow-primary/20 text-lg">
                              Dispatch Global Outreach <Send className="ml-2 h-5 w-5" />
                           </Button>
                        </div>
                     </Card>
                  </div>
                  
                  <div className="lg:col-span-2 space-y-6">
                     <div className="p-8 rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                           <Zap className="h-32 w-32" />
                        </div>
                        <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                           <Zap className="h-5 w-5 text-amber-400" /> CRM IQ
                        </h4>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                           Personalized emails see a <span className="text-white font-bold">42% higher</span> engagement rate. Use variables like [first_name] to automate intimacy.
                        </p>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs font-bold">Verified SMTP Delivery</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs font-bold">Open-Rate Tracking</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-4 uppercase text-[10px] tracking-widest">Recent Campaigns</h4>
                        <div className="space-y-4">
                           {[
                             { name: 'Placement Alert', sent: '1.2k', rate: '68%' },
                             { name: 'New Interview Guide', sent: '400', rate: '82%' }
                           ].map((camp, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                                <div>
                                   <div className="font-bold text-xs text-slate-900">{camp.name}</div>
                                   <div className="text-[9px] font-bold text-slate-400">{camp.sent} Recipients</div>
                                </div>
                                <div className="text-primary font-black text-xs">{camp.rate}</div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </TabsContent>
            <TabsContent value="gemini">
               <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <Card className="glass-card border-none rounded-[2rem] shadow-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                           <Bot className="h-32 w-32" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                           <Bot className="h-5 w-5 text-primary" /> Gemini Command Controller
                        </h3>
                        <div className="space-y-6 relative z-10">
                           <div>
                              <Label className="font-black text-slate-400 uppercase text-[10px] mb-2 block flex items-center gap-2"><Terminal className="h-3 w-3" /> Natural Language Input</Label>
                              <Textarea 
                                placeholder="e.g. Add 3 new senior software engineering jobs in New York with a salary range of $120k to $150k" 
                                rows={6} 
                                className="rounded-2xl border-slate-200 bg-white font-medium p-4 text-slate-700 shadow-inner"
                                value={geminiPrompt}
                                onChange={(e) => setGeminiPrompt(e.target.value)}
                              />
                           </div>
                           <Button 
                             onClick={handleGeminiCommand}
                             disabled={isGeminiProcessing}
                             className="w-full h-14 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-slate-800 text-lg flex items-center gap-2"
                           >
                              {isGeminiProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} 
                              {isGeminiProcessing ? "Executing Sequence..." : "Execute Admin Action"}
                           </Button>

                           {geminiResult?.message && (
                             <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 mt-4">
                               <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" /> {geminiResult.message}
                               </p>
                             </div>
                           )}
                           {geminiResult?.error && (
                             <div className="p-4 rounded-xl bg-red-50 border border-red-100 mt-4">
                               <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" /> {geminiResult.error}
                               </p>
                             </div>
                           )}
                        </div>
                     </Card>
                  </div>
                   <div className="space-y-6">
                      <Card className="glass-card border-none rounded-[2rem] shadow-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                           <Rocket className="h-32 w-32" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                           <Search className="h-5 w-5 text-primary" /> Real-time Opportunity Discovery
                        </h3>
                        <div className="space-y-6 relative z-10">
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <Label className="font-black text-slate-400 uppercase text-[10px] mb-2 block">Discovery Type</Label>
                                 <Select value={discoveryType} onValueChange={(v: any) => setDiscoveryType(v)}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-white font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="internship">Internships</SelectItem>
                                       <SelectItem value="job">Full-time Jobs</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                              <div>
                                 <Label className="font-black text-slate-400 uppercase text-[10px] mb-2 block">Target Industry</Label>
                                 <Select value={discoveryIndustry} onValueChange={setDiscoveryIndustry}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-white font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="Technology">Technology</SelectItem>
                                       <SelectItem value="Finance">Finance</SelectItem>
                                       <SelectItem value="Marketing">Marketing</SelectItem>
                                       <SelectItem value="Healthcare">Healthcare</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                           
                           <Button 
                             onClick={handleDiscovery}
                             disabled={isDiscovering}
                             className="w-full h-14 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 text-lg flex items-center gap-2"
                           >
                              {isDiscovering ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />} 
                              {isDiscovering ? "Scouting career sites..." : "Trigger AI Discovery Sync"}
                           </Button>

                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                              Powered by Gemini 1.5 Pro • Real-time Web Context
                           </p>
                        </div>
                      </Card>

                      <div className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden">
                         <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-300" /> How It Works
                         </h4>
                         <p className="text-sm text-indigo-100 font-medium leading-relaxed mb-6">
                            The EdWorld Gemini API Agent bypasses manual forms. Simply describe the internal action you want to take, and the edge-function converts your natural language into direct PostgreSQL insertions using your Supabase Service Role Key.
                         </p>
                         <div className="space-y-4">
                            <div className="p-3 bg-indigo-500/30 rounded-xl border border-indigo-400/20">
                               <span className="font-bold text-xs uppercase text-indigo-200">Example 1</span>
                               <p className="text-sm text-white mt-1">"Create a Data Analyst internship at Microsoft equivalent paying $30/hr."</p>
                            </div>
                            <div className="p-3 bg-indigo-500/30 rounded-xl border border-indigo-400/20">
                               <span className="font-bold text-xs uppercase text-indigo-200">Example 2</span>
                               <p className="text-sm text-white mt-1">"Add a remote product manager job with a clear requirement for Agile."</p>
                            </div>
                         </div>
                      </div>
                   </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
