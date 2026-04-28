import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, ExternalLink, Briefcase, Users, Link as LinkIcon } from "lucide-react";

export function LinkedInWidget({ linkedinUrl }: { linkedinUrl?: string | null }) {
  const getAbsoluteUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.includes('linkedin.com')) return `https://${url}`;
    return `https://linkedin.com/in/${url.replace('@', '')}`;
  };
  const absoluteUrl = linkedinUrl ? getAbsoluteUrl(linkedinUrl) : null;
  if (!linkedinUrl) {
    return (
      <Card className="border-border/40 bg-card shadow-sm h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Linkedin className="w-24 h-24" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-500" />
            LinkedIn Profile
          </CardTitle>
          <CardDescription className="text-xs">Connect your professional network</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.href = "/profile"}>
            <LinkIcon className="h-4 w-4" />
            Link Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Without OAuth, LinkedIn API doesn't allow direct fetching of public data for free/unauthenticated users.
  // So we provide a specialized widget that links to their profile and shows mock/placeholder stats or just a nice card.

  return (
    <Card className="border-border/40 bg-card shadow-sm h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Linkedin className="w-24 h-24" />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-500" />
            LinkedIn Profile
          </div>
          <a href={absoluteUrl || "#"} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-500 transition-colors">
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
            <Briefcase className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm font-semibold mb-1 text-foreground">Professional Network</p>
          <p className="text-xs text-muted-foreground mb-4">
            Your LinkedIn profile is connected and visible to recruiters.
          </p>
          <a href={absoluteUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button size="sm" variant="secondary" className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
              View Profile
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
