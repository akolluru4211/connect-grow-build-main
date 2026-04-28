import { MainLayout } from "@/components/layout/MainLayout";
import { jsPDF } from "jspdf";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Play, Star, Clock, BookOpen, ChevronRight, Bookmark, CheckCircle2, Award, ShieldCheck, Download, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const categories = ["All", "Tech", "Business", "Lifestyle", "Design", "AI & ML", "Finance"];

const GENERATED_COURSES = [
  // TECH & DEVELOPMENT (15)
  { id: 101, title: "React Architecture Mastery", subtitle: "Text-based bootcamp for building scalable apps.", rating: 4.9, hours: 25, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800" },
  { id: 102, title: "Python for Automation", subtitle: "Write scripts that save you hours of work.", rating: 4.8, hours: 18, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800" },
  { id: 103, title: "Advanced SQL for Data", subtitle: "Complex queries, window functions & optimization.", rating: 4.7, hours: 12, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800" },
  { id: 104, title: "FullStack Next.js 14", subtitle: "App router, Server Actions & Supabase integration.", rating: 5.0, hours: 35, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800" },
  { id: 105, title: "Docker & Kubernetes Basics", subtitle: "Containerize your apps for production.", rating: 4.6, hours: 20, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1605745341112-85968b193ef1?w=800" },
  { id: 106, title: "Rust Programming Fundamentals", subtitle: "Learn memory safety and high performance.", rating: 4.9, hours: 30, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800" },
  { id: 107, title: "Cybersecurity Essentials", subtitle: "Protect digital assets from common threats.", rating: 4.7, hours: 15, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800" },
  { id: 108, title: "AWS Cloud Practitioner", subtitle: "Foundations of cloud computing on Amazon.", rating: 4.5, hours: 22, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800" },
  { id: 109, title: "Tailwind CSS Design Systems", subtitle: "Build custom UI fast without writing CSS.", rating: 4.8, hours: 10, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800" },
  { id: 110, title: "TypeScript In-Depth", subtitle: "Type safety for large scale applications.", rating: 4.9, hours: 16, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800" },
  { id: 111, title: "Golang Backend Services", subtitle: "The modern way to build microservices.", rating: 4.7, hours: 24, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800" },
  { id: 112, title: "Mobile Apps with Flutter", subtitle: "Build for iOS & Android with one codebase.", rating: 4.8, hours: 40, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800" },
  { id: 113, title: "GraphQL API Design", subtitle: "Type-safe APIs that clients will love.", rating: 4.6, hours: 14, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=800" },
  { id: 114, title: "Linux SysAdmin Guide", subtitle: "Mastering the terminal and automation.", rating: 4.7, hours: 20, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800" },
  { id: 115, title: "Web Performance Tuning", subtitle: "Make your sites load in milliseconds.", rating: 4.8, hours: 12, price: 0, category: "Tech", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800" },

  // AI & ML (10)
  { id: 201, title: "LLM Engineering Guide", subtitle: "Build apps on top of Claude, GPT & Gemini.", rating: 5.0, hours: 20, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800" },
  { id: 202, title: "Prompt Engineering Bootcamp", subtitle: "Art of getting exactly what you want from AI.", rating: 4.9, hours: 8, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1675557009875-436f599393e1?w=800" },
  { id: 203, title: "Neural Networks from Scratch", subtitle: "Mathematics behind the machine mind.", rating: 4.7, hours: 30, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800" },
  { id: 204, title: "AI Product Management", subtitle: "Strategy for building AI-first products.", rating: 4.6, hours: 15, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800" },
  { id: 205, title: "TensorFlow to Production", subtitle: "Deploying deep learning models securely.", rating: 4.5, hours: 25, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800" },
  { id: 206, title: "Computer Vision Basics", subtitle: "Teaching machines how to see the world.", rating: 4.7, hours: 20, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1527430295725-236b2f19c115?w=800" },
  { id: 207, title: "Natural Language Processing", subtitle: "Analyzing and generating human text.", rating: 4.8, hours: 22, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800" },
  { id: 208, title: "AI Ethics & Safety", subtitle: "Navigating the moral landscape of AI.", rating: 4.9, hours: 10, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800" },
  { id: 209, title: "Generative Art with AI", subtitle: "Midjourney, Stable Diffusion & DALL-E.", rating: 4.6, hours: 12, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" },
  { id: 210, title: "MLOps Fundamentals", subtitle: "CI/CD for Machine Learning pipelines.", rating: 4.7, hours: 18, price: 0, category: "AI & ML", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800" },

  // BUSINESS & FINANCE (10)
  { id: 301, title: "Startup Strategy 101", subtitle: "From idea to first $10k in revenue.", rating: 4.8, hours: 15, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800" },
  { id: 302, title: "Venture Capital Basics", subtitle: "How to raise funds and manage runway.", rating: 4.7, hours: 10, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1579532512165-45d944d446a1?w=800" },
  { id: 303, title: "Personal Finance for Gen-Z", subtitle: "Investing, taxes and financial freedom.", rating: 4.9, hours: 12, price: 0, category: "Finance", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800" },
  { id: 304, title: "Digital Marketing Mastery", subtitle: "SEO, SEM and social media growth hacking.", rating: 4.6, hours: 20, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c207?w=800" },
  { id: 305, title: "Sales Psychology", subtitle: "The art of non-coercive persuasion.", rating: 4.8, hours: 8, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800" },
  { id: 306, title: "Negotiation Tactics", subtitle: "Getting what you deserve in any situation.", rating: 4.7, hours: 6, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800" },
  { id: 307, title: "Micro-SaaS Blueprint", subtitle: "Building profitable niche software alone.", rating: 5.0, hours: 25, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800" },
  { id: 308, title: "Public Speaking for CEOs", subtitle: "command the room and inspire action.", rating: 4.8, hours: 14, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1475721027187-4024733924f7?w=800" },
  { id: 309, title: "Product-Led Growth", subtitle: "Scaling without traditional sales teams.", rating: 4.6, hours: 18, price: 0, category: "Business", image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800" },
  { id: 310, title: "Cryptocurrency Essentials", subtitle: "DeFi, Wallets and Smart Contracts.", rating: 4.5, hours: 15, price: 0, category: "Finance", image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800" },

  // DESIGN & LIFESTYLE (15)
  { id: 401, title: "Visual Design Foundations", subtitle: "Color theory, typography & grid systems.", rating: 4.9, hours: 12, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800" },
  { id: 402, title: "Product Photography with Phone", subtitle: "Take professional shots anywhere.", rating: 4.7, hours: 6, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1490604001847-b712b0c2f967?w=800" },
  { id: 403, title: "High Performance Cooking", subtitle: "Healthy, fast meals for busy professionals.", rating: 4.8, hours: 10, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800" },
  { id: 404, title: "Meditation for Clarity", subtitle: "Ancient techniques for modern minds.", rating: 5.0, hours: 5, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800" },
  { id: 405, title: "Figma for UI Designers", subtitle: "Master the industry-standard design tool.", rating: 4.9, hours: 18, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800" },
  { id: 406, title: "Motion Design in After Effects", subtitle: "Bring your designs to life with animation.", rating: 4.7, hours: 25, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800" },
  { id: 407, title: "Interior Design Basics", subtitle: "Make your workspace inspiring and functional.", rating: 4.6, hours: 14, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800" },
  { id: 408, title: "Travel Hacking Guide", subtitle: "Travel the world for less on business class.", rating: 4.5, hours: 6, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800" },
  { id: 409, title: "Productive Writing Habits", subtitle: "Write books and articles without burnouts.", rating: 4.8, hours: 8, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800" },
  { id: 410, title: "Biohacking Foundations", subtitle: "Optimize your health with data and science.", rating: 4.9, hours: 12, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1532187863486-abf9d3a446ac?w=800" },
  { id: 411, title: "Minimalist Living", subtitle: "Declutter your mind and your home.", rating: 4.7, hours: 5, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800" },
  { id: 412, title: "Brand Identity Design", subtitle: "Creating logos and visual languages.", rating: 4.8, hours: 20, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1513346030247-7cda3be3239e?w=800" },
  { id: 413, title: "Coffee Brewing Masterclass", subtitle: "From bean to cup like a professional.", rating: 4.9, hours: 4, price: 0, category: "Lifestyle", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800" },
  { id: 414, title: "Product Management for Designers", subtitle: "Bridging the gap between art and business.", rating: 4.6, hours: 10, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800" },
  { id: 415, title: "Digital Illustrations with Procreate", subtitle: "Draw anyting on your iPad.", rating: 5.0, hours: 15, price: 0, category: "Design", image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800" },
];

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [completedCourses, setCompletedCourses] = useState<number[]>([]);
  const [showCertificate, setShowCertificate] = useState<any | null>(null);
  const [readingCourse, setReadingCourse] = useState<any | null>(null);
  const navigate = useNavigate();
  const { profile } = useProfile();

  // Load completed courses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("edworld_completed_courses");
    if (saved) setCompletedCourses(JSON.parse(saved));
  }, []);

  const handleComplete = (course: any) => {
    if (completedCourses.includes(course.id)) {
        toast.info("Course already completed!");
        setReadingCourse(null);
        return;
    }
    const newCompleted = [...completedCourses, course.id];
    setCompletedCourses(newCompleted);
    localStorage.setItem("edworld_completed_courses", JSON.stringify(newCompleted));
    toast.success(`${course.title} completed! Click to download certificate.`);
    setReadingCourse(null);
    setShowCertificate(course);
  };

  const generatePDF = (course: any) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Premium Border
    doc.setDrawColor(234, 179, 8); // Primary Gold
    doc.setLineWidth(10);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    doc.setLineWidth(1);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Background decoration
    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(252, 252, 253);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24, "F");

    // Header
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 50, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.line(pageWidth / 4, 55, (pageWidth * 3) / 4, 55);

    // Body
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "italic");
    doc.setFontSize(18);
    doc.text("This is to certify that", pageWidth / 2, 80, { align: "center" });

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text(profile?.full_name?.toUpperCase() || "VALUED STUDENT", pageWidth / 2, 100, { align: "center" });

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(18);
    doc.text("has successfully completed the course", pageWidth / 2, 120, { align: "center" });

    doc.setTextColor(234, 179, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text(course.title, pageWidth / 2, 140, { align: "center" });

    // Footer
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("EDWORLD CO.", pageWidth / 4, 175, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("OFFICIAL LEARNING PORTAL", pageWidth / 4, 182, { align: "center" });

    doc.setFontSize(14);
    doc.text("VERIFIED CREDENTIAL", (pageWidth * 3) / 4, 175, { align: "center" });
    doc.setFontSize(10);
    doc.text(`ID: EDW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, (pageWidth * 3) / 4, 182, { align: "center" });

    // Logo Placeholder or Design
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.5);
    doc.circle(pageWidth / 2, 175, 12);
    doc.setFontSize(8);
    doc.text("SEAL", pageWidth / 2, 176.5, { align: "center" });

    doc.save(`EdWorld_Certificate_${course.title.replace(/\s+/g, '_')}.pdf`);
    toast.success("Certificate downloaded!");
  };

  const downloadCertificate = (course: any) => {
    setShowCertificate(course);
  };

  const filteredCourses = GENERATED_COURSES.filter(course => {
    const matchesCategory = activeCategory === "All" || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout>
      <div className="container max-w-6xl py-6 md:py-10 space-y-8 relative z-10 font-sans">
        
        {/* Certificate Modal */}
        <AnimatePresence>
          {showCertificate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCertificate(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-2xl w-full bg-white border-[12px] border-[#EAB308] p-12 text-center shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Award size={200} className="text-[#EAB308]" />
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="flex justify-center mb-4">
                     <ShieldCheck size={80} className="text-[#EAB308]" />
                  </div>
                  <h1 className="text-4xl font-serif text-slate-900 border-b-2 border-slate-200 pb-4">CERTIFICATE OF COMPLETION</h1>
                  
                  <div className="py-8">
                    <p className="text-xl text-slate-500 italic">This is to certify that</p>
                    <h2 className="text-3xl font-black text-slate-900 my-2 uppercase tracking-tight">
                      {profile?.full_name || "VALUED STUDENT"}
                    </h2>
                    <p className="text-xl text-slate-500 italic">has successfully completed the course</p>
                    <h2 className="text-2xl font-bold text-[#EAB308] mt-2 underline decoration-slate-200 underline-offset-8">
                      {showCertificate.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 italic text-slate-400">
                    <div>
                      <p className="font-bold text-slate-600">EDWORLD CO.</p>
                      <p className="text-xs">Education for the AI Era</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-600 tracking-widest uppercase">OFFICIAL</p>
                      <p className="text-xs">Verify at edworld.co/verify</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4 justify-center print:hidden">
                  <Button onClick={() => generatePDF(showCertificate)} className="bg-slate-900 text-white hover:bg-slate-800 rounded-full">
                    <Download className="mr-2 h-4 w-4" /> Download Official PDF
                  </Button>
                  <Button variant="outline" onClick={() => setShowCertificate(null)} className="rounded-full">
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {readingCourse && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setReadingCourse(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="max-w-4xl w-full max-h-[85vh] flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-primary/5 p-6 border-b border-primary/10 flex justify-between items-center shrink-0">
                   <div>
                     <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30 border-none">{readingCourse.category}</Badge>
                     <h2 className="text-2xl font-black text-slate-900">{readingCourse.title}</h2>
                     <p className="text-muted-foreground mt-1">{readingCourse.subtitle}</p>
                   </div>
                   <Button variant="ghost" className="rounded-full h-10 w-10 p-0" onClick={() => setReadingCourse(null)}>✕</Button>
                </div>
                
                <div className="p-8 overflow-y-auto flex-1 text-slate-700 leading-relaxed space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Module 1: Introduction</h3>
                  <p>Welcome to this comprehensive guide on {readingCourse.title}. In this module, we will explore the foundational concepts and ensure you have a solid understanding of the basics.</p>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                  
                  <h3 className="text-xl font-bold text-slate-900">Module 2: Core Concepts</h3>
                  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                  <div className="bg-muted p-4 rounded-xl border border-border/50">
                     <p className="font-mono text-sm">console.log("Learning is a lifelong journey");</p>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900">Module 3: Advanced Applications</h3>
                  <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                  <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Estimated read time: {readingCourse.hours} hours
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setReadingCourse(null)} className="rounded-full font-bold">
                      Read Later
                    </Button>
                    <Button onClick={() => handleComplete(readingCourse)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Read & Get Certificate
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                Learning Portal <Badge className="bg-primary/20 text-primary border-primary/20">50+ New Courses</Badge>
              </h1>
              <p className="text-muted-foreground text-lg">Acquire elite skills for the modern workforce.</p>
            </div>
          </div>
          
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by topic, skill or sector..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-16 rounded-3xl bg-white/50 border-primary/20 text-lg focus-visible:ring-primary shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-3 -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-8 py-3 rounded-full text-sm font-bold transition-all transform active:scale-95 ${
                activeCategory === category 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-white/80 text-muted-foreground hover:text-foreground hover:bg-white border border-primary/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {filteredCourses.map((course, idx) => (
            <motion.div 
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card overflow-hidden h-full flex flex-col group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-primary/10 hover:border-primary/40 rounded-[2.5rem] bg-white/40">
                <div className="aspect-[16/10] w-full relative overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {completedCourses.includes(course.id) && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                       <div className="bg-white p-3 rounded-full shadow-xl">
                          <CheckCircle2 size={40} className="text-primary fill-current text-white" />
                       </div>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-7 flex-1 flex flex-col relative">
                  <Badge className="absolute -top-5 left-7 bg-white text-primary border-primary/10 shadow-md px-3 py-1 font-bold">
                    {course.category}
                  </Badge>
                  
                  <div className="mt-3 flex-1">
                    <h3 className="text-2xl font-black text-foreground leading-[1.1] group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-3 font-medium">{course.subtitle}</p>
                    
                    <div className="flex items-center gap-4 mt-6 text-sm">
                      <div className="flex items-center gap-1.5 font-bold text-amber-500">
                        <Star className="h-4 w-4 fill-current" /> {course.rating}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                         <Clock className="h-4 w-4" /> {course.hours}h
                      </div>
                      <Badge variant="outline" className="border-primary/20 text-primary font-bold">Text Only</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    {completedCourses.includes(course.id) ? (
                       <Button 
                         onClick={() => downloadCertificate(course)} 
                         className="w-full h-12 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold gap-2"
                        >
                         <Award className="h-5 w-5" /> Get Certificate
                       </Button>
                    ) : (
                       <Button 
                         onClick={() => setReadingCourse(course)} 
                         className="w-full h-12 rounded-2xl btn-premium font-bold gap-2"
                        >
                         <BookOpen className="h-4 w-4" /> Read Course
                       </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="py-24 text-center glass-card rounded-[3rem] border-dashed border-primary/20">
            <Search size={60} className="mx-auto text-primary/20 mb-6" />
            <h2 className="text-3xl font-bold">No results found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
