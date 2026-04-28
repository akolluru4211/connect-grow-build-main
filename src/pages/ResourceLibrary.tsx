import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useResources } from "@/hooks/useResources";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Heart, Download, ExternalLink, Search, FileText, Video, Link2 } from "lucide-react";

const RESOURCE_TYPES = ["notes", "past_papers", "slides", "video", "link", "other"];
const SUBJECTS = ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", "Engineering", "Business", "Arts", "Other"];

export default function ResourceLibrary() {
  const { resources, isLoading, uploadResource, toggleLike } = useResources();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", resource_type: "notes", subject: "Computer Science", external_link: "", tags: "" });
  const [file, setFile] = useState<File | null>(null);

  const filtered = resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || r.resource_type === filterType;
    return matchSearch && matchType;
  });

  const handleSubmit = async () => {
    if (!form.title || !form.subject) return;
    await uploadResource.mutateAsync({
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
      file: file || undefined,
    });
    setOpen(false);
    setForm({ title: "", description: "", resource_type: "notes", subject: "Computer Science", external_link: "", tags: "" });
    setFile(null);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "link": return <Link2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Resource Library</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Share Resource</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Share a Resource</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <Select value={form.resource_type} onValueChange={v => setForm(f => ({ ...f, resource_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="External link (optional)" value={form.external_link} onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))} />
                <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                <Button onClick={handleSubmit} disabled={uploadResource.isPending} className="w-full">
                  {uploadResource.isPending ? "Uploading..." : "Share"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No resources found. Be the first to share!</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcon(r.resource_type)}
                      <CardTitle className="text-base">{r.title}</CardTitle>
                    </div>
                    <Badge variant="secondary">{r.subject}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {r.description && <p className="text-sm text-muted-foreground mb-3">{r.description}</p>}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {r.tags?.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>by {r.uploader_name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleLike.mutate({ resourceId: r.id, isLiked: r.is_liked || false })}
                        className={`flex items-center gap-1 hover:text-red-500 ${r.is_liked ? "text-red-500" : ""}`}
                      >
                        <Heart className={`h-4 w-4 ${r.is_liked ? "fill-current" : ""}`} /> {r.likes_count}
                      </button>
                      {r.file_url && (
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      {r.external_link && (
                        <a href={r.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
