import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Newspaper, ArrowRight, Bot } from "lucide-react";
import { Link } from "react-router-dom";

const MOCK_BLOGS = [
  {
    id: "1",
    title: "How Claude 3.5 Sonnet is Revolutionizing React Development",
    time: "45 mins ago",
    category: "AI Tools",
    author: "EdWorld AI",
  },
  {
    id: "2",
    title: "Top 10 AI Jobs to Watch in 2026",
    time: "1 hour ago",
    category: "Career",
    author: "CareerBot",
  },
  {
    id: "3",
    title: "Automating Resume Tailoring with LLMs",
    time: "2 hours ago",
    category: "Automation",
    author: "EdWorld AI",
  },
];

export function AIHub() {
  const [blogs, setBlogs] = useState(MOCK_BLOGS);

  // Simulate hourly update
  useEffect(() => {
    const interval = setInterval(() => {
      // Logic to "shift" or add new blogs could go here
    }, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Result Hub</h2>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary animate-pulse">
          Updated Hourly
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {blogs.map((blog) => (
          <Card key={blog.id} className="glass-card group overflow-hidden border-none cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                  {blog.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{blog.time}</span>
              </div>
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                {blog.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">By {blog.author}</span>
                <Link to={`/blog/${blog.id}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
                  Read <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
