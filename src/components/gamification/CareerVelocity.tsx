import { motion } from "framer-motion";
import { TrendingUp, Zap, Target, Award, Rocket } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCareerVelocity } from "@/hooks/useCareerVelocity";

export function CareerVelocity() {
  const { score, status, technicalPower, resumeScore, networkPower, consistencyScore, trend } = useCareerVelocity();

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Career Velocity</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Industry readiness index <Target className="h-3 w-3" />
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black gradient-text tracking-tighter">
              {score}%
            </div>
            <Badge variant="outline" className={`mt-1 text-[10px] uppercase font-bold tracking-widest bg-background/50 border-white/5 ${trend === 'up' ? 'text-primary' : 'text-blue-400'}`}>
              {trend === 'up' && <TrendingUp className="h-2 w-2 mr-1" />} {status}
            </Badge>
          </div>
        </div>

        <div className="space-y-5">
          {/* Technical Power */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium px-0.5">
              <span className="flex items-center gap-1.5 text-slate-300"><Rocket className="h-3.5 w-3.5 text-blue-400" /> Technical Power</span>
              <span className="text-blue-400">{Math.round(technicalPower)}%</span>
            </div>
            <Progress value={technicalPower} className="h-1.5 bg-white/5" indicatorClassName="bg-gradient-to-r from-blue-500 to-cyan-400" />
          </div>

          {/* Network Power */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium px-0.5">
              <span className="flex items-center gap-1.5 text-slate-300"><Zap className="h-3.5 w-3.5 text-orange-400" /> Network Power</span>
              <span className="text-orange-400">{Math.round(networkPower || 0)}%</span>
            </div>
            <Progress value={networkPower} className="h-1.5 bg-white/5" indicatorClassName="bg-gradient-to-r from-orange-500 to-amber-400" />
          </div>

          {/* Resume Precision */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium px-0.5">
              <span className="flex items-center gap-1.5 text-slate-300"><Target className="h-3.5 w-3.5 text-emerald-400" /> Resume Precision</span>
              <span className="text-emerald-400">{Math.round(resumeScore)}%</span>
            </div>
            <Progress value={resumeScore} className="h-1.5 bg-white/5" indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-400" />
          </div>

          {/* Consistency */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium px-0.5">
              <span className="flex items-center gap-1.5 text-slate-300"><Award className="h-3.5 w-3.5 text-purple-400" /> Consistency</span>
              <span className="text-purple-400">{Math.round(consistencyScore)}%</span>
            </div>
            <Progress value={consistencyScore} className="h-1.5 bg-white/5" indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-400" />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your velocity is calculated based on <span className="text-foreground font-medium">real-world proof-of-work</span> including GitHub commits, project frequency, and resume ATS compatibility.
          </p>
        </div>
      </div>
    </div>
  );
}
