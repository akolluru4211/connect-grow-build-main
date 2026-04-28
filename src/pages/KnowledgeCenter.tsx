import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import {
  Library,
  BookOpen,
  FileText,
  Code,
  Briefcase,
  GraduationCap,
  Search,
  Download,
  ExternalLink,
  Star,
  Clock,
  Users,
  TrendingUp,
  Layers,
  Database,
  Globe,
  Cpu,
  Terminal,
  Palette,
} from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  pdfUrl: string;
  coverColor: string;
  rating: number;
  pages: number;
  readTime: string;
  downloads: number;
  difficulty?: string;
}

const books: Book[] = [
  // TECHNOLOGY & AI
  {
    id: "tech-1",
    title: "Mastering Modern AI: A Comprehensive Guide",
    author: "Dr. Elena Vance",
    description: "Deep dive into Large Language Models, Transformer architectures, and the future of Generative AI.",
    category: "programming",
    pdfUrl: "https://www.google.com/search?q=AI+Modern+Mastery+PDF",
    coverColor: "bg-blue-600",
    rating: 4.9,
    pages: 342,
    readTime: "12 hours",
    downloads: 12500,
    difficulty: "Advanced",
  },
  {
    id: "tech-2",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    description: "The gold standard for writing maintainable, readable, and professional grade code.",
    category: "programming",
    pdfUrl: "https://www.google.com/search?q=Clean+Code+PDF+Robert+Martin",
    coverColor: "bg-slate-800",
    rating: 5.0,
    pages: 464,
    readTime: "15 hours",
    downloads: 89000,
    difficulty: "Intermediate",
  },
  {
    id: "tech-3",
    title: "Data Science from Scratch",
    author: "Joel Grus",
    description: "Learn Python for data analysis, probability, statistics, and machine learning models from the ground up.",
    category: "dsa",
    pdfUrl: "https://www.google.com/search?q=Data+Science+from+Scratch+PDF",
    coverColor: "bg-orange-600",
    rating: 4.7,
    pages: 330,
    readTime: "10 hours",
    downloads: 41200,
    difficulty: "Beginner",
  },
  {
    id: "tech-4",
    title: "System Design Interview Guide",
    author: "Alex Xu",
    description: "Master the art of designing scalable systems. Essential for FAANG and high-scale startup interviews.",
    category: "webdev",
    pdfUrl: "https://www.google.com/search?q=System+Design+Alex+Xu+PDF",
    coverColor: "bg-indigo-700",
    rating: 4.9,
    pages: 200,
    readTime: "8 hours",
    downloads: 65000,
    difficulty: "Advanced",
  },

  // LIFESTYLE & PRODUCTIVITY
  {
    id: "life-1",
    title: "Atomic Habits: An Easy & Proven Way to Build Good Habits",
    author: "James Clear",
    description: "Transform your life through tiny changes. Learn the systems behind peak performance and habit maintenance.",
    category: "softskills",
    pdfUrl: "https://www.google.com/search?q=Atomic+Habits+PDF",
    coverColor: "bg-yellow-500",
    rating: 5.0,
    pages: 320,
    readTime: "6 hours",
    downloads: 120000,
    difficulty: "Beginner",
  },
  {
    id: "life-2",
    title: "Deep Work: Rules for Focused Success in a Distracted World",
    author: "Cal Newport",
    description: "Learn how to master cognitively demanding tasks and produce elite-level results by avoiding shallow work.",
    category: "career",
    pdfUrl: "https://www.google.com/search?q=Deep+Work+Cal+Newport+PDF",
    coverColor: "bg-emerald-600",
    rating: 4.8,
    pages: 304,
    readTime: "7 hours",
    downloads: 34500,
    difficulty: "Intermediate",
  },
  {
    id: "life-3",
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    description: "A counterintuitive approach to living a good life by prioritizing what truly matters.",
    category: "softskills",
    pdfUrl: "https://www.google.com/search?q=Subtle+Art+Mark+Manson+PDF",
    coverColor: "bg-orange-500",
    rating: 4.6,
    pages: 224,
    readTime: "5 hours",
    downloads: 98000,
    difficulty: "Beginner",
  },

  // PHILOSOPHY & KNOWLEDGE
  {
    id: "phil-1",
    title: "Meditations",
    author: "Marcus Aurelius",
    description: "The journals of the Roman Emperor. A foundational text on Stoicism and resilient living.",
    category: "softskills",
    pdfUrl: "https://www.gutenberg.org/files/264/264-pdf.pdf",
    coverColor: "bg-red-800",
    rating: 4.9,
    pages: 180,
    readTime: "4 hours",
    downloads: 250000,
    difficulty: "Beginner",
  },
  {
    id: "phil-2",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    description: "Explore the history of our species, from the first humans to the radical breakthroughs of the Cognitive Revolution.",
    category: "business",
    pdfUrl: "https://www.google.com/search?q=Sapiens+PDF+Yuval+Harari",
    coverColor: "bg-amber-700",
    rating: 4.9,
    pages: 443,
    readTime: "14 hours",
    downloads: 150000,
    difficulty: "Intermediate",
  },

  // ADDING MORE FOR SCALE
  {
    id: "scale-1",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    description: "Timeless lessons on wealth, greed, and happiness. Understand your relationship with finance.",
    category: "business",
    pdfUrl: "https://www.google.com/search?q=Psychology+of+Money+PDF",
    coverColor: "bg-green-700",
    rating: 4.9,
    pages: 256,
    readTime: "5 hours",
    downloads: 55000,
    difficulty: "Beginner",
  },
  {
    id: "scale-2",
    title: "Zero to One: Notes on Startups",
    author: "Peter Thiel",
    description: "How to build the future by creating things that are truly unique. A guide for aspiring founders.",
    category: "business",
    pdfUrl: "https://www.google.com/search?q=Zero+to+One+PDF",
    coverColor: "bg-purple-900",
    rating: 4.7,
    pages: 210,
    readTime: "4 hours",
    downloads: 72000,
    difficulty: "Intermediate",
  }
];

const categories = [
  { id: "all", label: "All Topics", icon: BookOpen },
  { id: "dsa", label: "DSA & Algorithms", icon: Database },
  { id: "programming", label: "Programming", icon: Code },
  { id: "webdev", label: "Web Development", icon: Globe },
  { id: "career", label: "Career & Interview", icon: Briefcase },
  { id: "softskills", label: "Soft Skills", icon: Users },
  { id: "exam", label: "Study & Exams", icon: GraduationCap },
  { id: "business", label: "Business", icon: TrendingUp },
];

const topicCards = [
  { icon: Database, label: "DSA", desc: "Arrays, Trees, Graphs", color: "bg-green-500/10 text-success", category: "dsa" },
  { icon: Code, label: "Python", desc: "Learn Python basics", color: "bg-emerald-500/10 text-emerald-600", category: "programming" },
  { icon: Terminal, label: "JavaScript", desc: "Frontend & Node.js", color: "bg-yellow-500/10 text-warning", category: "programming" },
  { icon: Globe, label: "System Design", desc: "Architecture patterns", color: "bg-purple-500/10 text-purple-600", category: "webdev" },
  { icon: Briefcase, label: "Interview Prep", desc: "FAANG preparation", color: "bg-rose-500/10 text-rose-600", category: "dsa" },
  { icon: Cpu, label: "Linux & DevOps", desc: "Command line mastery", color: "bg-muted text-muted-foreground", category: "programming" },
  { icon: Palette, label: "Web Dev", desc: "Full-stack skills", color: "bg-blue-500/10 text-blue-600", category: "webdev" },
  { icon: Layers, label: "CS Fundamentals", desc: "Core concepts", color: "bg-violet-500/10 text-violet-600", category: "programming" },
];

export default function KnowledgeCenter() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter((book) => {
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout>
      <Helmet>
        <title>Knowledge Center - Free DSA, Programming, Interview Prep Books | EdWorld</title>
        <meta name="description" content="Access free programming books, DSA tutorials, interview prep guides, and career resources. Learn Python, JavaScript, algorithms, system design & more. Like GeeksForGeeks but with curated PDF resources." />
        <meta name="keywords" content="free programming books, DSA tutorial, data structures algorithms, coding interview prep, Python tutorial, JavaScript guide, system design, career development books, GeeksForGeeks alternative, student resources free" />
      </Helmet>
      <div className="container py-8">
        {/* Hero Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Library className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Knowledge Center</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your free library of programming, DSA, interview prep & career resources — curated like GeeksForGeeks.
          </p>
        </div>

        {/* Topic Cards Grid (GFG-style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {topicCards.map((topic) => (
            <button
              key={topic.label}
              onClick={() => setSelectedCategory(topic.category)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                selectedCategory === topic.category ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${topic.color}`}>
                <topic.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">{topic.label}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{topic.desc}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search books by title, author, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3 mb-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">{books.length}+</div>
                  <div className="text-sm text-muted-foreground">Free Resources</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Download className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">
                    {Math.round(books.reduce((acc, b) => acc + b.downloads, 0) / 1000)}K+
                  </div>
                  <div className="text-sm text-muted-foreground">Total Downloads</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Star className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <div className="text-2xl font-bold">
                    {(books.reduce((acc, b) => acc + b.rating, 0) / books.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </CardContent>
              </Card>
            </div>

            {/* Books Grid */}
            {filteredBooks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No resources found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBooks.map((book) => (
                  <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className={`h-3 ${book.coverColor}`} />
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {book.title}
                          </CardTitle>
                          <CardDescription className="mt-1">{book.author}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {categories.find(c => c.id === book.category)?.label || book.category}
                          </Badge>
                          {book.difficulty && (
                            <Badge variant="outline" className={`text-[10px] ${
                              book.difficulty === "Beginner" ? "border-green-500/30 text-success" :
                              book.difficulty === "Intermediate" ? "border-yellow-500/30 text-warning" :
                              "border-red-500/30 text-destructive"
                            }`}>
                              {book.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">{book.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span>{book.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{book.pages}p</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{book.readTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">
                          {book.downloads.toLocaleString()} downloads
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(book.pdfUrl, "_blank")}
                            className="gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => window.open(book.pdfUrl, "_blank")}
                            className="gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">100% Free Learning Resources</h3>
              <p className="text-sm text-muted-foreground">
                All books, PDFs, and tutorials are freely available. No premium required. Learn DSA, programming, system design & more!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
