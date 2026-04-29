import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";

export function CertificateWidget({ completed, courseName, userName }: { completed: boolean, courseName?: string, userName?: string }) {
  const downloadCertificate = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const name = courseName || "EdWorld Masterclass";
    const studentName = userName || "Valued Student";
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Premium Border
    doc.setDrawColor(234, 179, 8); // Primary Gold (amber-500)
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
    doc.text(studentName.toUpperCase(), pageWidth / 2, 100, { align: "center" });

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(18);
    doc.text("has successfully completed", pageWidth / 2, 120, { align: "center" });

    doc.setTextColor(234, 179, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text(name, pageWidth / 2, 140, { align: "center" });

    // Date
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
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
    doc.text(`Issued on: ${date}`, (pageWidth * 3) / 4, 182, { align: "center" });

    // Logo Placeholder or Design
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.5);
    doc.circle(pageWidth / 2, 175, 12);
    doc.setFontSize(8);
    doc.text("SEAL", pageWidth / 2, 176.5, { align: "center" });

    doc.save(`EdWorld-Certificate-${name.replace(/\s+/g, '-')}.pdf`);
  };

  if (!completed) {
    return (
      <Card className="border-border/40 bg-card shadow-sm h-full flex flex-col relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Award className="w-32 h-32" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
            <Award className="h-4 w-4" />
            Certificates
          </CardTitle>
          <CardDescription className="text-xs">Complete courses to earn certificates</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Award className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No certificates yet</p>
          <Button variant="link" size="sm" className="mt-2" onClick={() => window.location.href = "/explore"}>
            Browse Courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-yellow-500/10 shadow-sm h-full relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 p-4 opacity-[0.05] group-hover:opacity-20 transition-opacity text-amber-500">
        <Award className="w-32 h-32" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <Award className="h-5 w-5" />
            Certificate of Completion
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 flex flex-col items-center text-center shadow-inner">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
          <h3 className="font-serif text-lg font-bold text-foreground mb-1">
            {courseName || "EdWorld Masterclass"}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Awarded for successful completion of the requirements.
          </p>
          <Button 
            onClick={downloadCertificate}
            size="sm" 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2 font-bold shadow-lg shadow-amber-500/20"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
