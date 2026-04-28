import { motion } from "framer-motion";
import { Github, Rocket, Trophy, MessageSquare, Heart, Share2, ExternalLink, TrendingUp, Award, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockPosts = [
  {
    id: "1",
    user: { name: "Adarsh Kolluru", avatar: null, role: "Full Stack Dev" },
    type: "project",
    title: "EcoTrack AI - Carbon Footprint Monitor",
    description: "Just deployed my latest project! Uses TensorFlow to analyze consumption patterns and Next.js for a seamless dashboard experience.",
    tech: ["Next.js", "Python", "TensorFlow"],
    github: "github.com/adarsh/ecotrack",
    stats: { stars: 12, forks: 4 },
    timestamp: "2h ago",
    engagement: { likes: 24, comments: 8 }
  },
  {
    id: "3",
    user: { name: "Isha Patel", avatar: null, role: "Software Engineer" },
    type: "assessment",
    title: "Advanced Data Structures Certificate",
    description: "Scored Top 1% in the Global DSA Assessment on EdWorld! Mastering graph algorithms and dynamic programming.",
    tech: ["DSA", "C++", "Graphs"],
    stats: { score: 99, rank: 12 },
    timestamp: "3h ago",
    engagement: { likes: 89, comments: 4 }
  },
  {
    id: "2",
    user: { name: "Sarah Chen", avatar: null, role: "Backend Architect" },
    type: "github",
    title: "100 Day Streak Reached!",
    description: "Focused on improving the core indexing engine for better query performance. 156 commits this week on open-source repositories.",
    tech: ["Rust", "PostgreSQL"],
    stats: { commits: 156, prs: 12 },
    timestamp: "5h ago",
    engagement: { likes: 142, comments: 21 }
  }
];

export function ProofOfWorkFeed() {
  return (
    <div className="space-y-8">
      {mockPosts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-[2rem] p-8 border-none shadow-xl shadow-slate-200/50 group"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/10">
                <AvatarImage src={post.user.avatar || ""} />
                <AvatarFallback className="bg-primary/5 text-primary font-black">
                  {post.user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  {post.user.name}
                  <Badge variant="secondary" className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 border-none uppercase font-black tracking-widest">
                    {post.user.role}
                  </Badge>
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{post.timestamp}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               {post.type === 'project' && (
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <Rocket className="h-5 w-5" />
                  </div>
               )}
               {post.type === 'github' && (
                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <Github className="h-5 w-5" />
                  </div>
               )}
               {post.type === 'assessment' && (
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                    <Award className="h-5 w-5" />
                  </div>
               )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-black text-2xl text-slate-900 mb-2 group-hover:text-primary transition-colors cursor-pointer leading-tight">
              {post.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              {post.description}
            </p>
          </div>

          {/* Proof of Work Stats Card */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-6 grid grid-cols-2 gap-6">
            {post.type === 'project' && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">GitHub Stars</span>
                  <span className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" /> {post.stats.stars}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Forks</span>
                  <span className="text-3xl font-black text-slate-900">{post.stats.forks}</span>
                </div>
              </>
            )}
            {post.type === 'github' && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Commits</span>
                  <span className="text-3xl font-black text-emerald-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> {post.stats.commits}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">PRs Merged</span>
                  <span className="text-3xl font-black text-slate-900">{post.stats.prs}</span>
                </div>
              </>
            )}
            {post.type === 'assessment' && (
              <>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Score</span>
                  <span className="text-3xl font-black text-primary flex items-center gap-2">
                    <Zap className="h-5 w-5 fill-current" /> {post.stats.score}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Rank</span>
                  <span className="text-3xl font-black text-slate-900">#{post.stats.rank}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {post.tech.map(t => (
              <Badge key={t} variant="outline" className="bg-white border-slate-100 text-[10px] text-slate-600 font-bold px-3 py-1 rounded-lg">
                {t}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="flex items-center gap-8 text-slate-400">
              <button className="flex items-center gap-2 hover:text-rose-500 transition-all font-black group/btn">
                <Heart className="h-5 w-5 group-hover/btn:fill-rose-500" /> <span className="text-xs">{post.engagement.likes}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-primary transition-all font-black group/btn">
                <MessageSquare className="h-5 w-5" /> <span className="text-xs">{post.engagement.comments}</span>
              </button>
              <button className="flex items-center gap-2 hover:text-indigo-500 transition-all font-black group/btn">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            <Button size="sm" variant="ghost" className="rounded-xl font-black text-xs hover:bg-slate-50 text-slate-600">
              <ExternalLink className="h-4 w-4 mr-2" /> View Work
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
