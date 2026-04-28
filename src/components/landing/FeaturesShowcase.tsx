import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Target, Github, Trophy, BrainCircuit, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "AI Resume Precision",
    description: "Our proprietary ATS algorithm analyzes your resume against 10,000+ real job descriptions to ensure a 90%+ match rate.",
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-50",
    tag: "ATS Powered"
  },
  {
    title: "GitHub Pulse",
    description: "We deep-link into your coding activity to generate a live Pulse Heatmap, verifying your 'Proof of Work' to recruiters.",
    icon: Github,
    color: "text-slate-900",
    bg: "bg-slate-50",
    tag: "Real-time"
  },
  {
    title: "Career Velocity",
    description: "A single, gamified metric that measures your global industry readiness based on DSA, Projects, and Soft Skills.",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    tag: "Proprietary"
  },
  {
    title: "AI Study Plans",
    description: "Custom-tailored learning roadmaps that adapt hourly based on emerging market trends and your personal weak spots.",
    icon: Target,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    tag: "Adaptive"
  },
  {
    title: "Project Forge",
    description: "AI generates unique project ideas for you to build, then tracks your deployment milestones for your portfolio.",
    icon: Rocket,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    tag: "Portfolio"
  },
  {
    title: "24/7 AI Mentors",
    description: "Expert AI advisors available round-the-clock for mock interviews, career counseling, and code reviews.",
    icon: BrainCircuit,
    color: "text-rose-600",
    bg: "bg-rose-50",
    tag: "Unlimited"
  }
];

export function FeaturesShowcase() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none font-bold uppercase tracking-widest px-4 py-1">
              The Career OS Ecosystem
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Precision Engines for <span className="text-primary italic">Exponential</span> Growth
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              We replaced legacy learning with a data-driven Career Operating System designed to automate your job hunt and gamify your technical mastery.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass-card p-8 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 group transition-all"
            >
              <div className={`h-16 w-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all`}>
                <feature.icon className="h-8 w-8" />
              </div>
              
              <Badge variant="outline" className="mb-3 text-[10px] uppercase font-black tracking-widest border-slate-100 text-slate-400">
                {feature.tag}
              </Badge>
              
              <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
