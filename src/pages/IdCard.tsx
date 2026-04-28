import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Image as ImageIcon, FileText, RotateCcw, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";
import { useRef, useState } from "react";
import { generateIdNumber, generateEdworldEmail } from "@/lib/idUtils";
import { QRScanner } from "@/components/profile/QRScanner";
import { useNetwork } from "@/hooks/useNetwork";
import { useNavigate } from "react-router-dom";

export default function IdCard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { sendRequest } = useNetwork();
  const navigate = useNavigate();
  const qrRef = useRef<SVGSVGElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const idNumber = generateIdNumber(user?.id);

  // Profile URL that the QR code will point to
  const profileUrl = user?.id
    ? `${window.location.origin}/profile/${user.id}`
    : window.location.origin;

  const svgToBase64Async = (svgEl: SVGSVGElement): Promise<string> => {
    return new Promise((resolve) => {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      const logo = new Image();
      logo.src = "/edworld-logo.png";
      
      const blob = new Blob([svgStr], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 256, 256);
        ctx.drawImage(img, 0, 0, 256, 256);
        
        // Draw logo in middle
        logo.onload = () => {
          const logoSize = 64;
          const x = (256 - logoSize) / 2;
          const y = (256 - logoSize) / 2;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4);
          ctx.drawImage(logo, x, y, logoSize, logoSize);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/png"));
        };
        logo.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/png"));
        };
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
      img.src = url;
    });
  };

  const edworldEmail = generateEdworldEmail(profile, user?.id, user?.email);

  // Converts an image URL to a circular base64 data URL via a canvas
  const fetchCircularImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.naturalWidth, img.naturalHeight);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Create circular clip
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          
          // Draw center-cropped image
          ctx.drawImage(
            img,
            (img.naturalWidth - size) / 2,
            (img.naturalHeight - size) / 2,
            size,
            size,
            0,
            0,
            size,
            size
          );
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = url + (url.includes("?") ? "&" : "?") + "_cb=" + Date.now();
    });
  };

  const fetchImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = url + (url.includes("?") ? "&" : "?") + "_cb=" + Date.now();
    });
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [55, 85],
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Dark background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Header bar accent
    doc.setFillColor(234, 179, 8);
    doc.rect(0, 0, pageWidth, 2, "F");

    // EDWORLD title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("EDWORLD", pageWidth / 2, 10, { align: "center" });
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6);
    doc.text("OFFICIAL STUDENT ID", pageWidth / 2, 14, { align: "center" });

    // Profile photo (circle clipped)
    const avatarUrl = profile?.avatar_url;
    const photoSize = 20; // mm
    const photoX = (pageWidth - photoSize) / 2;
    const photoY = 18;

    if (avatarUrl) {
      const base64 = await fetchCircularImageAsBase64(avatarUrl);
      if (base64) {
        // Draw primary color border/ring
        doc.setFillColor(234, 179, 8);
        doc.circle(pageWidth / 2, photoY + photoSize / 2, photoSize / 2 + 0.8, "F");
        // Draw white background
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth / 2, photoY + photoSize / 2, photoSize / 2 + 0.3, "F");
        // Add the circular image
        doc.addImage(base64, "PNG", photoX, photoY, photoSize, photoSize, undefined, "FAST");
      } else {
        // Fallback: initials circle
        doc.setFillColor(51, 65, 85);
        doc.circle(pageWidth / 2, photoY + photoSize / 2, photoSize / 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(getInitials(), pageWidth / 2, photoY + photoSize / 2 + 4, { align: "center" });
      }
    } else {
      doc.setFillColor(51, 65, 85);
      doc.circle(pageWidth / 2, photoY + photoSize / 2, photoSize / 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(getInitials(), pageWidth / 2, photoY + photoSize / 2 + 4, { align: "center" });
    }

    // Name & Headline — centered, with word-wrap for long names
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const nameText = (profile?.full_name || "STUDENT NAME").toUpperCase();
    const nameLines = doc.splitTextToSize(nameText, pageWidth - 10);
    doc.text(nameLines, pageWidth / 2, photoY + photoSize + 6, { align: "center" });

    const nameBlockHeight = nameLines.length * 5;
    doc.setTextColor(234, 179, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const headlineText = (profile?.headline || "EdWorld Member").toUpperCase();
    const headlineLines = doc.splitTextToSize(headlineText, pageWidth - 10);
    doc.text(headlineLines, pageWidth / 2, photoY + photoSize + 6 + nameBlockHeight, { align: "center" });

    // Divider
    doc.setDrawColor(51, 65, 85);
    doc.line(5, 62, pageWidth - 5, 62);

    // Left column — ID Number
    const footerY = 64;
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.text("ID NUMBER", 5, footerY + 3);
    doc.setTextColor(255, 255, 255);
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text(idNumber, 5, footerY + 8);

    // Left column — EdWorld Email
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.text("EDWORLD EMAIL", 5, footerY + 14);
    doc.setTextColor(234, 179, 8);
    doc.setFont("courier", "bold");
    doc.setFontSize(4.8);
    const emailLines = doc.splitTextToSize(edworldEmail, 30);
    doc.text(emailLines, 5, footerY + 18);

    // Right column — QR Code
    if (qrRef.current) {
      const qrBase64 = await svgToBase64Async(qrRef.current);
      if (qrBase64) {
        const qrSize = 16;
        const qrX = pageWidth - qrSize - 4;
        doc.addImage(qrBase64, "PNG", qrX, footerY + 1, qrSize, qrSize);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(3.5);
        doc.text("SCAN TO VIEW", qrX + qrSize / 2, footerY + qrSize + 3, { align: "center" });
      }
    }

    // Bottom accent
    doc.setFillColor(234, 179, 8);
    doc.rect(0, pageHeight - 2, pageWidth, 2, "F");

    doc.save(`EdWorld_ID_${profile?.full_name?.replace(/\s+/g, '_') || 'Card'}.pdf`);
  };

  const handleDownloadImage = async () => {
    const cardElement = document.getElementById("id-card-element");
    if (!cardElement) return;

    // Pre-fetch avatar as base64 and swap src so html2canvas can read it
    const avatarImgs = cardElement.querySelectorAll<HTMLImageElement>("img");
    const origSrcs: string[] = [];
    await Promise.all(
      Array.from(avatarImgs).map(async (img, i) => {
        origSrcs[i] = img.src;
        if (img.src && !img.src.startsWith("data:")) {
          const b64 = await fetchImageAsBase64(img.src);
          if (b64) img.src = b64;
        }
      })
    );

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `EdWorld_ID_${profile?.full_name?.replace(/\s+/g, '_') || 'Card'}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating image", error);
    } finally {
      // Restore original src values
      Array.from(avatarImgs).forEach((img, i) => {
        if (origSrcs[i]) img.src = origSrcs[i];
      });
    }
  };

  const { toast } = useToast();

  const handleScan = (decodedText: string) => {
    setIsScannerOpen(false);
    
    // Check if the scanned text is an EdWorld profile URL
    try {
      const url = new URL(decodedText);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      // Expected format: /profile/:id
      if (pathSegments[0] === 'profile' && pathSegments[1]) {
        const profileId = pathSegments[1];
        
        if (profileId === user?.id) {
          toast({ title: "That's your own ID card! 😄" });
          return;
        }

        // Connect directly
        sendRequest.mutate(profileId);
        
        // Also navigate to their profile
        navigate(`/profile?id=${profileId}`);
      } else {
        toast({ 
          title: "Invalid QR Code", 
          description: "This doesn't seem to be an EdWorld profile.", 
          variant: "destructive" 
        });
      }
    } catch (e) {
      toast({ 
        title: "Invalid QR Code", 
        description: "Could not parse the scanned data.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl py-12 md:py-20 space-y-8 flex flex-col items-center">
        <div className="text-center space-y-2 mb-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Your Digital Identity</h1>
          <p className="text-lg text-slate-500">The official EdWorld student identification card.</p>
        </div>

        {/* Flip hint */}
        <p className="text-sm text-slate-400 flex items-center gap-1.5">
          <RotateCcw size={14} /> Click card or use button to flip
        </p>

        {/* 3D Flip Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ perspective: 1400 }}
          className="cursor-pointer w-full flex justify-center"
          onClick={() => setIsFlipped((f) => !f)}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-[320px] xs:max-w-[360px] aspect-[1/1.55] sm:max-w-[400px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* ── FRONT ── */}
            <div
              id="id-card-element"
              style={{ 
                backfaceVisibility: "hidden", 
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(1px)" 
              }}
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-700 flex flex-col justify-between overflow-hidden"
            >
              {/* Background Decorations */}
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldCheck size={180} className="text-white" />
              </div>
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -right-20 top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-widest">EDWORLD</h2>
                    <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Official ID</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-bold backdrop-blur-sm">
                    VERIFIED
                  </Badge>
                </div>

                {/* Photo & Info */}
                <div className="flex flex-col items-center text-center mt-2">
                  <div className="p-1.5 bg-gradient-to-br from-primary to-amber-500 rounded-full mb-4 shadow-xl shadow-primary/20">
                    <Avatar className="h-28 w-28 border-4 border-slate-900 bg-slate-800">
                      <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-slate-800 text-3xl font-bold text-slate-300">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h3 className="text-2xl font-black text-white text-center mb-1 leading-tight">
                    {profile?.full_name || "Student Name"}
                  </h3>
                  <p className="text-primary font-bold tracking-wide text-sm text-center">
                    {profile?.headline || "EdWorld Member"}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-10 mt-auto pt-5 border-t border-slate-700/50">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">ID Number</p>
                    <p className="text-base font-mono text-white tracking-widest bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-700/50 inline-block">
                      {idNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">EdWorld Email</p>
                    <p className="text-xs font-mono text-primary font-bold tracking-wide break-all">
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
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] shadow-2xl border border-primary/40 flex flex-col items-center justify-between overflow-hidden py-10"
            >
              {/* Background Decorations */}
              <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full" style={{
                  backgroundImage: "repeating-linear-gradient(45deg, #eab308 0, #eab308 1px, transparent 0, transparent 50%)",
                  backgroundSize: "20px 20px",
                }} />
              </div>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-amber-400 to-primary rounded-t-[2.5rem]" />
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-amber-400 to-primary rounded-b-[2.5rem]" />

              <div className="relative z-10 flex flex-col items-center gap-4 px-6 h-full w-full">
                <div className="text-center">
                  <h2 className="text-xl font-black text-white tracking-widest">EDWORLD</h2>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Scan to Find My Profile</p>
                </div>

                {/* Large QR Code */}
                <div className="bg-white p-2 rounded-2xl flex flex-col items-center shrink-0 shadow-2xl border border-slate-200">
                  <QRCodeSVG
                    ref={qrRef}
                    value={profileUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "/edworld-logo.png",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="text-center mt-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur-sm">
                    <Scan size={14} className="text-primary" /> Point camera to scan
                  </p>
                </div>

                {/* ID chips at bottom - moved into flex flow to prevent overlap */}
                <div className="mt-auto flex items-center gap-2 w-full justify-center">
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 flex-1 max-w-[120px]">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">ID</p>
                    <p className="text-xs font-mono text-white tracking-widest truncate">{idNumber}</p>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 flex-1 max-w-[140px]">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Name</p>
                    <p className="text-xs font-bold text-white truncate">{profile?.full_name || "Student"}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 items-center flex-wrap justify-center"
        >
          {/* Flip button */}
          <Button
            onClick={() => setIsFlipped((f) => !f)}
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10 font-bold rounded-full px-6 h-11 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {isFlipped ? "Show Front" : "Show QR Back"}
          </Button>

          <Button
            onClick={handleDownloadImage}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 h-11 shadow-lg shadow-primary/20 gap-2"
          >
            <ImageIcon className="h-4 w-4" /> Download Image
          </Button>

          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="border-slate-300 font-bold rounded-full px-8 h-11 gap-2"
          >
            <FileText className="h-4 w-4" /> Download PDF
          </Button>
          <Button
            onClick={() => setIsScannerOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-full px-8 h-11 shadow-xl gap-2 order-first sm:order-none"
          >
            <Scan className="h-4 w-4 text-primary" /> Scan to Connect
          </Button>
        </motion.div>

        <QRScanner 
          isOpen={isScannerOpen} 
          onClose={() => setIsScannerOpen(false)} 
          onScan={handleScan} 
        />
      </div>
    </MainLayout>
  );
}

