import { motion } from "framer-motion";
import { User, Shield, Zap, Award, Globe, Building2, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";
import { Profile } from "@/hooks/useProfile";
import { UserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

interface StudentIDCardProps {
  profile: Profile | UserProfile | null;
  initials: string;
}

export function StudentIDCard({ profile, initials }: StudentIDCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -15 }}
      animate={{ opacity: 1, rotateY: 0 }}
      whileHover={{ scale: 1.02, rotateY: 5 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-sm aspect-[1.586/1] rounded-[2rem] overflow-hidden shadow-2xl group preserve-3d"
    >
      {/* Background with Premium Glows */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Decorative Golden Border */}
      <div className="absolute inset-2 border border-slate-100 rounded-[1.6rem] pointer-events-none" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col p-6 z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="EdWorld" className="h-6 w-auto" />
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Career OS</span>
          </div>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full">
            OFFICIAL MEMBER
          </Badge>
        </div>

        {/* Center Section: Avatar & Details */}
        <div className="flex items-center gap-6 mt-2">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-2xl group-hover:blur-[30px] transition-all" />
            <div className="relative h-24 w-24 rounded-2xl border-2 border-white shadow-xl overflow-hidden bg-white">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            {/* Identity Badge */}
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black text-slate-900 leading-tight truncate">
              {profile?.full_name || "VALUED STUDENT"}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">
              {profile?.headline || "Career Aspirant"}
            </p>
            
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                <MapPin className="h-3 w-3 text-primary" />
                {profile?.location || "Global Ecosystem"}
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                <Globe className="h-3 w-3 text-primary" />
                Member ID: ED-{Math.random().toString(36).substr(2, 6).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Skills/Stats */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
          <div className="flex gap-4">
             <div className="text-center">
                <div className="text-xs font-black text-slate-900">12</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Courses</div>
             </div>
             <div className="text-center">
                <div className="text-xs font-black text-slate-900">94</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Velocity</div>
             </div>
             <div className="text-center">
                <div className="text-xs font-black text-slate-900">A+</div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Status</div>
             </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 italic font-black text-slate-300 text-[8px] leading-tight text-center uppercase tracking-tighter">
            Digital<br/>Seal
          </div>
        </div>
      </div>

      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none group-hover:translate-x-full transition-transform duration-1000" />
    </motion.div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", className)}>
      {children}
    </span>
  );
}
