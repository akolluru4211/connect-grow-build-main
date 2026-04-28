import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, CheckCircle2 } from "lucide-react";

export function CertificateWidget({ completed, courseName }: { completed: boolean, courseName?: string }) {
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
          <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2 font-bold shadow-lg shadow-amber-500/20">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
