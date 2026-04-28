import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Briefcase, GraduationCap, BookOpen, User, Building2, Filter, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalSearch, SearchResult, SearchFilters } from "@/hooks/useGlobalSearch";
import { cn } from "@/lib/utils";

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
  course: "bg-yellow-500/10 text-warning",
  user: "bg-green-500/10 text-success",
  company: "bg-muted text-muted-foreground",
  event: "bg-blue-500/10 text-blue-600",
  blog: "bg-purple-500/10 text-purple-600",
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query to prevent lag during typing
  const debouncedQuery = useDebounce(inputValue, 300);

  const { data: results = [], isLoading } = useGlobalSearch(debouncedQuery, filters);

  // Keep focus on input when popover opens
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (value && !open) {
      setOpen(true);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setInputValue("");

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
        navigate(`/blogs?post=${result.id}`);
        break;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full" role="combobox" aria-expanded={open} aria-haspopup="listbox">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search jobs, people, companies... (⌘K)"
            className="h-10 w-full rounded-full border-border bg-muted/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/20"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue && setOpen(true)}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-accent"
              aria-label="Toggle search filters"
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(!showFilters);
              }}
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] overflow-hidden rounded-xl border-border bg-card p-0 shadow-xl md:w-[420px]" align="start">
        {showFilters && (
          <div className="border-b border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
                className="h-7 text-xs text-primary hover:text-primary"
              >
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.types?.join(",") || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    types: value === "all" ? undefined : (value.split(",") as SearchFilters["types"]),
                  }))
                }
              >
                <SelectTrigger className="h-9 w-[130px] rounded-lg border-border bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="internship">Internships</SelectItem>
                  <SelectItem value="course">Courses</SelectItem>
                  <SelectItem value="user">People</SelectItem>
                  <SelectItem value="company">Companies</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="blog">Blog Posts</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Location"
                className="h-9 w-[140px] rounded-lg border-border bg-background"
                value={filters.location || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, location: e.target.value || undefined }))
                }
              />
            </div>
          </div>
        )}
        <Command className="bg-transparent">
          <CommandList className="max-h-[350px] overflow-y-auto md:max-h-[400px]">
            {inputValue.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="mb-3 h-10 w-10 text-primary/30" />
                <p className="text-sm text-muted-foreground">Type at least 2 characters</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty className="py-10 text-center">
                <p className="text-muted-foreground">No results found</p>
              </CommandEmpty>
            ) : (
              Object.entries(groupedResults).map(([type, items]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                return (
                  <CommandGroup
                    key={type}
                    heading={
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        <Icon className="h-3.5 w-3.5" />
                        {typeLabels[type as keyof typeof typeLabels]}s
                      </div>
                    }
                    className="px-2"
                  >
                    {items.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 rounded-lg py-2.5 px-2 cursor-pointer"
                      >
                        {result.imageUrl || result.type === "user" ? (
                          <Avatar className="h-9 w-9 shrink-0 border-2 border-primary/10">
                            <AvatarImage src={result.imageUrl} />
                            <AvatarFallback className="bg-primary/10 text-xs text-primary">
                              {result.title.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                              typeColors[result.type]
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                          {result.subtitle && (
                            <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-primary/20 bg-primary/5 text-xs text-primary"
                        >
                          {typeLabels[result.type]}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
