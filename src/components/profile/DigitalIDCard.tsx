import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RotateCcw, Scan } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { Profile } from "@/hooks/useProfile";
import { UserProfile } from "@/hooks/useUserProfile";

interface DigitalIDCardProps {
  profile: Profile | UserProfile | null;
  idNumber: string;
  edworldEmail: string;
  initials: string;
  className?: string;
}

export function DigitalIDCard({ profile, idNumber, edworldEmail, initials, className }: DigitalIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);

  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/profile/${profile?.id || ''}`
    : '';

  return (
    <div className={className}>
      {/* Flip hint */}
      <div className="flex justify-center mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          <RotateCcw size={10} className="text-primary" /> Click to flip card
        </p>
      </div>

      <motion.div
        style={{ perspective: 1400 }}
        className="cursor-pointer w-full flex justify-center"
        onClick={() => setIsFlipped((f) => !f)}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-[280px] aspect-[1/1.55] sm:max-w-[340px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* ── FRONT ── */}
          <div
            style={{ 
              backfaceVisibility: "hidden", 
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(1px)" 
            }}
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-700 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -right-20 top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-widest">EDWORLD</h2>
                  <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5 sm:mt-1">Official ID</p>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[7px] sm:text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm">
                  VERIFIED
                </Badge>
              </div>

              {/* Photo & Info */}
              <div className="flex flex-col items-center text-center mt-1 sm:mt-2">
                <div className="p-0.5 sm:p-1 bg-gradient-to-br from-primary to-amber-500 rounded-full mb-3 sm:mb-4 shadow-xl shadow-primary/20">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-slate-900 bg-slate-800">
                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-slate-800 text-xl sm:text-2xl font-bold text-slate-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white text-center mb-0.5 sm:mb-1 leading-tight truncate w-full px-2">
                  {profile?.full_name || "Student Name"}
                </h3>
                <p className="text-primary font-bold tracking-wide text-[10px] sm:text-[11px] text-center uppercase truncate w-full px-2">
                  {profile?.headline || "EdWorld Member"}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-auto pt-4 sm:pt-5 border-t border-slate-700/50">
              <div className="flex flex-col gap-2 sm:gap-3">
                <div>
                  <p className="text-[7px] sm:text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5 sm:mb-1">ID Number</p>
                  <p className="text-[10px] sm:text-xs font-mono text-white tracking-[0.15em] bg-slate-800/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-700/50 inline-block">
                    {idNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] sm:text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5 sm:mb-1">EdWorld Email</p>
                  <p className="text-[9px] sm:text-[10px] font-mono text-primary font-bold tracking-wide break-all bg-primary/5 px-2 py-0.5 sm:py-1 rounded-md border border-primary/10">
                    {edworldEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(1px)",
            }}
            className="absolute inset-0 w-full h-full bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-primary/40 flex flex-col items-center justify-between overflow-hidden py-8 sm:py-10"
          >

            <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-6 h-full w-full">
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-black text-white tracking-widest">EDWORLD</h2>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5 sm:mt-1">Scan to Find My Profile</p>
              </div>

              {/* Large QR Code */}
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl flex flex-col items-center shrink-0 shadow-2xl border border-slate-200">
                <QRCodeSVG
                  ref={qrRef}
                  value={profileUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur-sm">
                  <Scan size={12} className="text-primary" /> Point camera to scan
                </p>
              </div>

              {/* ID chips at bottom */}
              <div className="mt-auto flex items-center gap-2 w-full justify-center">
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-1.5 flex-1 max-w-[110px]">
                  <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">ID</p>
                  <p className="text-[10px] font-mono text-white tracking-widest truncate">{idNumber}</p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-1.5 flex-1 max-w-[130px]">
                  <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Name</p>
                  <p className="text-[10px] font-bold text-white truncate">{profile?.full_name || "Student"}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
