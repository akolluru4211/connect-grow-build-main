import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, GitBranch, Star, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface GithubData {
  login: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  bio: string;
  name: string;
}

export function GitHubWidget({ githubUrl }: { githubUrl?: string | null }) {
  const [data, setData] = useState<GithubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchGithubData() {
      if (!githubUrl) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Extract username from url
        const username = githubUrl.split('/').filter(Boolean).pop();
        if (!username) throw new Error("Invalid GitHub URL");
        
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) throw new Error("Failed to fetch GitHub data");
        
        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchGithubData();
  }, [githubUrl]);

  if (!githubUrl) {
    return (
      <Card className="border-border/40 bg-card shadow-sm h-full flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Github className="w-24 h-24" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Profile
          </CardTitle>
          <CardDescription className="text-xs">Connect to display stats</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.location.href = "/profile"}>
            <Github className="h-4 w-4" />
            Connect GitHub
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border/40 bg-card shadow-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/40 bg-card shadow-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load GitHub stats.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card shadow-sm h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Github className="w-24 h-24" />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub
          </div>
          <a href={data.html_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="h-4 w-4" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <img src={data.avatar_url} alt={data.login} className="h-10 w-10 rounded-full border border-border" />
          <div>
            <p className="text-sm font-semibold">{data.name || data.login}</p>
            <p className="text-xs text-muted-foreground">@{data.login}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 rounded-lg p-2 flex flex-col items-center justify-center">
            <GitBranch className="h-4 w-4 text-primary mb-1" />
            <span className="text-xs font-medium">{data.public_repos}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Repos</span>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 flex flex-col items-center justify-center">
            <Users className="h-4 w-4 text-emerald-500 mb-1" />
            <span className="text-xs font-medium">{data.followers}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Followers</span>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 flex flex-col items-center justify-center">
            <Star className="h-4 w-4 text-amber-500 mb-1" />
            <span className="text-xs font-medium">{data.following}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Following</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
