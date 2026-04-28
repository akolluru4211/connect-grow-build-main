import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useStudyGroups, useGroupPosts } from "@/hooks/useStudyGroups";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { Users, Plus, BookOpen, MessageSquare, ArrowLeft, Send, Code2, Sparkles, Trash2 } from "lucide-react";

export default function StudyGroups() {
  const { user } = useAuth();
  const { groups, isLoading, createGroup, joinGroup, leaveGroup, deleteGroup } = useStudyGroups();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", subject: "", college_name: "" });
  const [newPost, setNewPost] = useState("");

  const { posts, createPost } = useGroupPosts(selectedGroup);

  const handleCreate = async () => {
    await createGroup.mutateAsync(newGroup);
    setCreateOpen(false);
    setNewGroup({ name: "", description: "", subject: "", college_name: "" });
  };

  const handlePost = async () => {
    if (!newPost.trim() || !selectedGroup) return;
    await createPost.mutateAsync({ groupId: selectedGroup, content: newPost });
    setNewPost("");
  };

  const selected = groups.find((g) => g.id === selectedGroup);

  if (selectedGroup && selected) {
    return (
      <MainLayout>
        <div className="container py-8 max-w-3xl">
          <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Groups
          </Button>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selected.name}</CardTitle>
                  <CardDescription>{selected.description}</CardDescription>
                </div>
                <Badge variant="secondary">{selected.subject}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" /> {selected.member_count} members
              </div>
            </CardHeader>
          </Card>

          {/* Code with EdWorld CTA */}
          <Link to="/code-with-edworld">
            <Card className="mb-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Code2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Code with EdWorld
                    <Badge className="bg-primary/10 text-primary border-0 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" /> Pro
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">Open a collaborative code space with AI explainer for your group</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">Open</Button>
              </CardContent>
            </Card>
          </Link>

          <div className="space-y-4 mb-4">
            <div className="flex gap-2">
              <Input
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share something with the group..."
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
              />
              <Button onClick={handlePost} disabled={!newPost.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {posts.length === 0 ? (
              <Card className="py-8 text-center">
                <CardContent>
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">No posts yet. Start the conversation!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post: any) => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author.avatar_url} />
                        <AvatarFallback>{(post.author.full_name || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{post.author.full_name || "User"}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(post.created_at), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="mt-1 text-sm">{post.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              Study Groups
            </h1>
            <p className="text-muted-foreground mt-1">Join or create study groups to collaborate with peers</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Study Group</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Group Name</Label><Input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="e.g., DSA Practice Group" /></div>
                <div><Label>Subject</Label><Input value={newGroup.subject} onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })} placeholder="e.g., Data Structures" /></div>
                <div><Label>Description</Label><Textarea value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="What is this group about?" /></div>
                <div><Label>College (optional)</Label><Input value={newGroup.college_name} onChange={(e) => setNewGroup({ ...newGroup, college_name: e.target.value })} placeholder="e.g., GITAM University" /></div>
                <Button onClick={handleCreate} disabled={!newGroup.name || !newGroup.subject || createGroup.isPending}>
                  {createGroup.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Code with EdWorld Banner */}
        <Link to="/code-with-edworld">
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
            <CardContent className="py-5 flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-md group-hover:scale-110 transition-transform">
                <Code2 className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Code with EdWorld
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs gap-1">
                    <Sparkles className="h-3 w-3" /> EdWorld Pro
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">Collaborative code editor with AI-powered explanations. Learn coding with friends!</p>
              </div>
              <Button className="shrink-0 gap-2">
                <Code2 className="h-4 w-4" /> Start Coding
              </Button>
            </CardContent>
          </Card>
        </Link>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading groups...</div>
        ) : groups.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No study groups yet. Create the first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedGroup(group.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{group.subject}</Badge>
                    {group.college_name && <Badge variant="outline" className="text-xs">{group.college_name}</Badge>}
                  </div>
                  <CardTitle className="text-lg mt-2">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" /> {group.member_count} members
                    </div>
                    <div className="flex items-center gap-2">
                      {group.created_by === user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Study Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{group.name}" and all its posts. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteGroup.mutate(group.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {group.is_member ? (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); leaveGroup.mutate(group.id); }}>Leave</Button>
                      ) : (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); joinGroup.mutate(group.id); }}>Join</Button>
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
