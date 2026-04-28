import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Star, Activity, Code2, Trophy, Users, FolderDot, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface GithubStatsProps {
  githubUrl: string;
}

const getLanguageColor = (lang: string) => {
  const colors: Record<string, string> = {
    TypeScript: "bg-[#3178c6]",
    JavaScript: "bg-[#f1e05a]",
    Python: "bg-[#3572A5]",
    Java: "bg-[#b07219]",
    "C++": "bg-[#f34b7d]",
    "C#": "bg-[#178600]",
    Ruby: "bg-[#701516]",
    PHP: "bg-[#4F5D95]",
    HTML: "bg-[#e34c26]",
    CSS: "bg-[#563d7c]",
    Rust: "bg-[#dea584]",
    Go: "bg-[#00ADD8]",
    Dart: "bg-[#00B4AB]",
    Kotlin: "bg-[#A97BFF]",
    Swift: "bg-[#F05138]",
    C: "bg-[#555555]",
    Vue: "bg-[#41b883]",
  };
  return colors[lang] || "bg-slate-400";
};

export function GithubStats({ githubUrl }: GithubStatsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const username = githubUrl.split("/").pop() || "";
        if (!username) {
          setLoading(false);
          return;
        }

        const userRes = await fetch(`https://api.github.com/users/${username}`);
        const userData = await userRes.json();

        if (userData.message && userData.message.includes("Not Found")) {
          setLoading(false);
          return;
        }

        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        const reposData = await reposRes.json();

        let totalStars = 0;
        const languages: Record<string, number> = {};

        if (Array.isArray(reposData)) {
          reposData.forEach((repo: any) => {
            totalStars += repo.stargazers_count || 0;
            if (repo.language) {
              languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
          });
        }

        const totalLangs = Object.values(languages).reduce((a, b) => a + b, 0);
        const topLanguages = Object.entries(languages)
          .map(([name, count]) => ({
            name,
            percent: totalLangs > 0 ? Math.round((count / totalLangs) * 100) : 0,
            color: getLanguageColor(name),
          }))
          .sort((a, b) => b.percent - a.percent)
          .slice(0, 4);

        setStats({
          username,
          public_repos: userData.public_repos || 0,
          stars: totalStars,
          followers: userData.followers || 0,
          following: userData.following || 0,
          languages: topLanguages,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
        setLoading(false);
      }
    };

    fetchGithubData();
  }, [githubUrl]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <Card className="glass-card border-none overflow-hidden rounded-[2.5rem] shadow-2xl shadow-primary/5">
        <CardHeader className="bg-gradient-to-r from-slate-900/5 to-transparent border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-100 group-hover:rotate-6 transition-transform">
                <Github className="h-8 w-8 text-slate-900" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">GitHub Pulse</CardTitle>
                <CardDescription className="font-medium text-slate-500 flex items-center gap-2">
                   Linked to <span className="text-primary font-bold">@{stats.username}</span>
                   <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-tighter px-2">Live Sync</Badge>
                </CardDescription>
              </div>
            </div>
            
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 transition-colors rounded-2xl px-5 py-3 text-white shadow-lg cursor-pointer">
               <Trophy className="h-5 w-5 text-amber-400" />
               <div className="flex flex-col leading-none">
                 <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">View Profile</span>
                 <span className="text-sm font-black">On GitHub</span>
               </div>
            </a>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div className="hover:bg-slate-50 p-4 rounded-3xl transition-colors cursor-default border border-transparent hover:border-slate-100">
               <FolderDot className="h-5 w-5 text-primary mb-3" />
               <div className="text-3xl font-black text-slate-900 leading-none">{stats.public_repos}</div>
               <div className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">Repositories</div>
            </div>
            <div className="hover:bg-slate-50 p-4 rounded-3xl transition-colors cursor-default border border-transparent hover:border-slate-100">
               <Star className="h-5 w-5 text-amber-500 mb-3" />
               <div className="text-3xl font-black text-slate-900 leading-none">{stats.stars}</div>
               <div className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">Earned Stars</div>
            </div>
            <div className="hover:bg-slate-50 p-4 rounded-3xl transition-colors cursor-default border border-transparent hover:border-slate-100">
               <Users className="h-5 w-5 text-indigo-500 mb-3" />
               <div className="text-3xl font-black text-slate-900 leading-none">{stats.followers}</div>
               <div className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">Followers</div>
            </div>
            <div className="hover:bg-slate-50 p-4 rounded-3xl transition-colors cursor-default border border-transparent hover:border-slate-100">
               <UserPlus className="h-5 w-5 text-emerald-500 mb-3" />
               <div className="text-3xl font-black text-slate-900 leading-none">{stats.following}</div>
               <div className="text-xs text-slate-400 font-bold uppercase mt-2 tracking-widest">Following</div>
            </div>
          </div>

          {/* Activity Heatmap Mockup */}
          <div className="mb-10">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Contribution Heat Map
            </h4>
            <div className="w-full overflow-hidden rounded-xl border border-slate-100 p-2">
              <img 
                src={`https://ghchart.rshah.org/${stats.username}`} 
                alt={`${stats.username}'s GitHub Activity`} 
                className="w-full object-contain"
              />
            </div>
          </div>

          {/* Tech Bar */}
          {stats.languages.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5" /> Language Ecosystem
              </h4>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                {stats.languages.map((lang: any) => (
                  <div 
                    key={lang.name} 
                    className={`${lang.color} h-full transition-all`} 
                    style={{ width: `${lang.percent}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                 {stats.languages.map((lang: any) => (
                   <div key={lang.name} className="flex items-center gap-2">
                     <div className={`h-2 w-2 rounded-full ${lang.color}`} />
                     <span className="text-xs font-bold text-slate-600">{lang.name}</span>
                     <span className="text-xs text-slate-400">{lang.percent}%</span>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

