import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Heart,
  MessageSquare,
  Users,
  ExternalLink,
  Github,
  MapPin,
  Calendar,
  Eye,
  Loader2,
} from "lucide-react";
import { useProjects, useMyProjects, useCreateProject, useLikeProject, useApplyToProject, Project } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

const statusColors = {
  open: "bg-success/10 text-success border-success/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-muted text-muted-foreground border-muted",
  closed: "bg-destructive/10 text-destructive border-destructive/20",
};

function ProjectCard({ project, onApply }: { project: Project; onApply: (projectId: string) => void }) {
  const { user } = useAuth();
  const likeProject = useLikeProject();

  const handleLike = () => {
    if (!user) {
      toast.error("Please sign in to like projects");
      return;
    }
    likeProject.mutate({ projectId: project.id, isLiked: project.is_liked || false });
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {project.cover_image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={project.cover_image_url}
            alt={project.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs", statusColors[project.status])}>
                {project.status.replace("_", " ")}
              </Badge>
              {project.is_featured && (
                <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
              )}
            </div>
            <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
          </div>
        </div>
        
        {/* Creator Info */}
        <div className="flex items-center gap-2 mt-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getDisplayAvatar(project.profiles?.full_name, project.profiles?.avatar_url)} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getDisplayName(project.profiles?.full_name).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getDisplayName(project.profiles?.full_name)}</p>
            {project.college_name && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.college_name}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

        {/* Tech Stack */}
        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.tech_stack.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tech_stack.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Looking For */}
        {project.looking_for?.length > 0 && project.status === "open" && (
          <div className="rounded-lg bg-accent/50 p-3">
            <p className="text-xs font-medium text-foreground mb-2">Looking for:</p>
            <div className="flex flex-wrap gap-1.5">
              {project.looking_for.map((role) => (
                <Badge key={role} variant="outline" className="text-xs border-primary/30 text-primary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Team Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {project.team_size}/{project.max_team_size} members
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(project.created_at), "MMM d, yyyy")}
          </span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                project.is_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
              )}
            >
              <Heart className={cn("h-4 w-4", project.is_liked && "fill-current")} />
              {project.likes_count}
            </button>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              {project.comments_count}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {project.views_count}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {project.github_url && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            )}
            {project.project_url && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {project.status === "open" && user && user.id !== project.user_id && (
              <Button size="sm" onClick={() => onApply(project.id)}>
                Join Team
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createProject = useCreateProject();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_url: "",
    github_url: "",
    tech_stack: "",
    looking_for: "",
    college_name: "",
    max_team_size: 5,
    status: "open" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      {
        title: formData.title,
        description: formData.description,
        project_url: formData.project_url || undefined,
        github_url: formData.github_url || undefined,
        tech_stack: formData.tech_stack.split(",").map((s) => s.trim()).filter(Boolean),
        looking_for: formData.looking_for.split(",").map((s) => s.trim()).filter(Boolean),
        college_name: formData.college_name || undefined,
        max_team_size: formData.max_team_size,
        team_size: 1,
        status: formData.status,
        tags: [],
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormData({
            title: "",
            description: "",
            project_url: "",
            github_url: "",
            tech_stack: "",
            looking_for: "",
            college_name: "",
            max_team_size: 5,
            status: "open",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your project, its goals, and what makes it unique..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project_url">Live Project URL</Label>
              <Input
                id="project_url"
                value={formData.project_url}
                onChange={(e) => setFormData({ ...formData, project_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech_stack">Tech Stack (comma-separated)</Label>
            <Input
              id="tech_stack"
              value={formData.tech_stack}
              onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
              placeholder="React, Node.js, PostgreSQL..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="looking_for">Looking For (comma-separated roles)</Label>
            <Input
              id="looking_for"
              value={formData.looking_for}
              onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
              placeholder="Frontend Developer, UI Designer, Backend Developer..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college_name">College/University</Label>
              <Input
                id="college_name"
                value={formData.college_name}
                onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                placeholder="Your college name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_team_size">Max Team Size</Label>
              <Input
                id="max_team_size"
                type="number"
                min={1}
                max={20}
                value={formData.max_team_size}
                onChange={(e) => setFormData({ ...formData, max_team_size: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [applyRole, setApplyRole] = useState("");

  const { data: projects, isLoading } = useProjects({ status: statusFilter, search });
  const { data: myProjects } = useMyProjects();
  const applyToProject = useApplyToProject();

  const handleApply = (projectId: string) => {
    if (!user) {
      toast.error("Please sign in to join projects");
      return;
    }
    setSelectedProjectId(projectId);
    setApplyDialogOpen(true);
  };

  const submitApplication = () => {
    if (selectedProjectId && applyRole) {
      applyToProject.mutate(
        { projectId: selectedProjectId, role: applyRole },
        {
          onSuccess: () => {
            setApplyDialogOpen(false);
            setApplyRole("");
            setSelectedProjectId(null);
          },
        }
      );
    }
  };

  return (
    <MainLayout>
      <div className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Projects</h1>
          <p className="text-muted-foreground">
            Discover amazing projects, find collaborators, and build together
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user && (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Share Project
            </Button>
          )}
        </div>

        {/* Content */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            {user && <TabsTrigger value="my">My Projects</TabsTrigger>}
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : projects?.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-muted-foreground mt-1">
                  Be the first to share your project!
                </p>
                {user && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                    Share Your Project
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects?.map((project) => (
                  <ProjectCard key={project.id} project={project} onApply={handleApply} />
                ))}
              </div>
            )}
          </TabsContent>

          {user && (
            <TabsContent value="my">
              {myProjects?.length === 0 ? (
                <Card className="p-12 text-center">
                  <h3 className="text-lg font-semibold">You haven't shared any projects yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Share your project to find collaborators
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
                    Share Your First Project
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {myProjects?.map((project) => (
                    <ProjectCard key={project.id} project={project as Project} onApply={handleApply} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Create Project Dialog */}
        <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Apply Dialog */}
        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join This Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Input
                  id="role"
                  value={applyRole}
                  onChange={(e) => setApplyRole(e.target.value)}
                  placeholder="e.g., Frontend Developer, UI Designer..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitApplication} disabled={!applyRole || applyToProject.isPending}>
                  {applyToProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
