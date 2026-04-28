import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Briefcase, 
  GraduationCap, 
  BookOpen, 
  User, 
  Building2, 
  X, 
  ArrowLeft, 
  Calendar, 
  FileText,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { cn } from "@/lib/utils";

const typeIcons = {
  job: Briefcase,
  internship: GraduationCap,
  course: BookOpen,
  user: User,
  company: Building2,
  event: Calendar,
  blog: FileText,
};

const typeLabels = {
  job: "Job",
  internship: "Internship",
  course: "Course",
  user: "Person",
  company: "Company",
  event: "Event",
  blog: "Blog",
};

const typeColors = {
  job: "bg-primary/10 text-primary",
  internship: "bg-accent/10 text-accent-foreground",
  course: "bg-secondary/20 text-secondary-foreground",
  user: "bg-muted text-muted-foreground",
  company: "bg-muted text-muted-foreground",
  event: "bg-primary/10 text-primary",
  blog: "bg-secondary/10 text-secondary-foreground",
};

const quickFilters = [
  { label: "All", types: undefined, icon: Search },
  { label: "Jobs", types: ["job"] as const, icon: Briefcase },
  { label: "Internships", types: ["internship"] as const, icon: GraduationCap },
  { label: "People", types: ["user"] as const, icon: User },
  { label: "Companies", types: ["company"] as const, icon: Building2 },
  { label: "Courses", types: ["course"] as const, icon: BookOpen },
  { label: "Events", types: ["event"] as const, icon: Calendar },
  { label: "Blogs", types: ["blog"] as const, icon: FileText },
];

const trendingSearches = [
  "Software Engineer",
  "React Developer",
  "Data Science",
  "Marketing Intern",
  "UI/UX Design",
];

interface MobileSearchProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSearch({ open, onClose }: MobileSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<typeof quickFilters[0]>(quickFilters[0]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isLoading } = useGlobalSearch(query, {
    types: activeFilter.types as any,
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Load recent searches
      const saved = localStorage.getItem("recent-searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } else {
      setQuery("");
      setActiveFilter(quickFilters[0]);
    }
  }, [open]);

  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recent-searches", JSON.stringify(updated));
  };

  const handleSelect = (result: SearchResult) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    onClose();
    setQuery("");

    switch (result.type) {
      case "job":
        navigate(`/jobs?selected=${result.id}`);
        break;
      case "internship":
        navigate(`/internships?selected=${result.id}`);
        break;
      case "course":
        navigate(`/courses?selected=${result.id}`);
        break;
      case "user":
        navigate(`/network?profile=${result.id}`);
        break;
      case "company":
        navigate(`/companies/${result.id}`);
        break;
      case "event":
        navigate(`/events?selected=${result.id}`);
        break;
      case "blog":
        navigate(`/blogs`);
        break;
    }
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card p-3">
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 rounded-full hover:bg-primary/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            ref={inputRef}
            placeholder="Search jobs, people, companies..."
            className="h-11 w-full rounded-full border-primary/20 bg-primary/5 pl-10 pr-10 text-base focus:border-primary focus:ring-primary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full hover:bg-primary/10"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto border-b border-border bg-card/50 p-3 scrollbar-hide">
        {quickFilters.map((filter) => {
          const IconComponent = filter.icon;
          return (
            <Button
              key={filter.label}
              variant={activeFilter.label === filter.label ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "shrink-0 rounded-full px-4 gap-1.5",
                activeFilter.label === filter.label && "bg-primary text-primary-foreground shadow-md"
              )}
            >
              <IconComponent className="h-3.5 w-3.5" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {query.length < 2 ? (
          <div className="space-y-6">
            {/* Trending Searches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Trending Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSearch(term)}
                    className="rounded-full hover:bg-primary/10 hover:border-primary"
                  >
                    <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
                    {term}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Recent Searches</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground h-auto p-1"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickSearch(term)}
                      className="flex items-center gap-3 w-full p-3 rounded-xl bg-muted/30 hover:bg-muted transition-colors text-left"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {recentSearches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">Search EdWorld</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Find jobs, people, companies, and more
                </p>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Searching...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No results found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try different keywords or filters
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {results.map((result) => {
              const Icon = typeIcons[result.type];
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left shadow-sm border border-border/50 transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.98]"
                >
                  {result.imageUrl || result.type === "user" ? (
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarImage src={result.imageUrl} />
                      <AvatarFallback className="bg-primary/10 text-sm text-primary">
                        {result.title.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        typeColors[result.type]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{result.title}</p>
                    {result.subtitle && (
                      <p className="truncate text-sm text-muted-foreground flex items-center gap-1">
                        {result.type === "job" && <MapPin className="h-3 w-3" />}
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-primary/20 bg-primary/5 text-xs text-primary"
                  >
                    {typeLabels[result.type]}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
