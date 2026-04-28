import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Code2,
  Plus,
  Play,
  Share2,
  Copy,
  Sparkles,
  Bug,
  Zap,
  Loader2,
  Link as LinkIcon,
  Users,
  Globe,
  Lock,
  ArrowLeft,
  Terminal,
  Trash2,
} from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "html", label: "HTML/CSS" },
  { value: "sql", label: "SQL" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
];

function useCodeRooms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["code-rooms", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("code_rooms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createRoom = useMutation({
    mutationFn: async (room: { name: string; description: string; language: string; is_public: boolean; study_group_id?: string }) => {
      const { data, error } = await supabase
        .from("code_rooms")
        .insert({ ...room, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-rooms"] });
      toast.success("Code room created!");
    },
  });

  const updateCode = useMutation({
    mutationFn: async ({ id, code_content }: { id: string; code_content: string }) => {
      const { error } = await supabase
        .from("code_rooms")
        .update({ code_content, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("code_rooms")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-rooms"] });
      toast.success("Room deleted!");
    },
    onError: () => {
      toast.error("Failed to delete room. You can only delete rooms you created.");
    },
  });

  return { rooms, isLoading, createRoom, updateCode, deleteRoom };
}

function CodeEditor({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("code");
  const { updateCode } = useCodeRooms();

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase
        .from("code_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (data) {
        setRoom(data);
        setCode(data.code_content || "");
      }
    };
    fetchRoom();
  }, [roomId]);

  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel(`code-room-${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "code_rooms", filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.new.code_content !== code) {
          setCode(payload.new.code_content);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const saveCode = useCallback(() => {
    updateCode.mutate({ id: roomId, code_content: code });
    toast.success("Code saved!");
  }, [roomId, code]);

  const handleAI = async (action: "explain" | "fix" | "optimize") => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    setIsAiLoading(true);
    setAiResponse("");
    setActiveTab("ai");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-explainer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ code, language: room?.language || "javascript", action }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || "AI service error");
        setIsAiLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setAiResponse(result);
            }
          } catch { /* partial */ }
        }
      }
    } catch (err) {
      toast.error("Failed to get AI response");
    }
    setIsAiLoading(false);
  };

  const shareLink = room ? `${window.location.origin}/code-with-edworld?room=${room.share_code}` : "";

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Share link copied!");
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            {room.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{room.language}</Badge>
            <Badge variant={room.is_public ? "default" : "outline"} className="gap-1">
              {room.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {room.is_public ? "Public" : "Private"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-1">
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
          <Button size="sm" onClick={saveCode} className="gap-1">
            <Terminal className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Share link */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-3 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <code className="text-xs text-muted-foreground truncate flex-1">{shareLink}</code>
          <Button variant="ghost" size="sm" onClick={copyShareLink}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Code Editor */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 bg-muted/30 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Code Editor</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => handleAI("explain")} disabled={isAiLoading} className="gap-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Explain
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleAI("fix")} disabled={isAiLoading} className="gap-1 text-xs">
                <Bug className="h-3.5 w-3.5" /> Fix
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleAI("optimize")} disabled={isAiLoading} className="gap-1 text-xs">
                <Zap className="h-3.5 w-3.5" /> Optimize
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[400px] p-4 font-mono text-sm bg-card text-foreground resize-none focus:outline-none border-0"
              placeholder={`// Write your ${room.language} code here...\n// Use AI Explain, Fix, or Optimize buttons above`}
              spellCheck={false}
            />
          </CardContent>
        </Card>

        {/* AI Output */}
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="py-3 bg-muted/30">
              <TabsList className="h-8">
                <TabsTrigger value="code" className="text-xs">Output</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI Assistant
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="code" className="m-0">
                <div className="h-[400px] p-4 text-sm text-muted-foreground flex items-center justify-center">
                  <p>Run your code to see output here</p>
                </div>
              </TabsContent>
              <TabsContent value="ai" className="m-0">
                <ScrollArea className="h-[400px]">
                  <div className="p-4">
                    {isAiLoading && !aiResponse && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI is thinking...
                      </div>
                    )}
                    {aiResponse ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                        {aiResponse}
                      </div>
                    ) : !isAiLoading ? (
                      <p className="text-muted-foreground text-center py-8">
                        Click Explain, Fix, or Optimize to get AI help with your code
                      </p>
                    ) : null}
                  </div>
                </ScrollArea>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default function CodeWithEdworld() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roomParam = searchParams.get("room");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", language: "javascript", is_public: true });
  const { rooms, isLoading, createRoom, deleteRoom } = useCodeRooms();

  // Join via share code
  useEffect(() => {
    if (roomParam && user) {
      const findRoom = async () => {
        const { data } = await supabase
          .from("code_rooms")
          .select("id")
          .eq("share_code", roomParam)
          .single();
        if (data) setSelectedRoomId(data.id);
        else toast.error("Room not found");
      };
      findRoom();
    }
  }, [roomParam, user]);

  const handleCreate = async () => {
    const result = await createRoom.mutateAsync(newRoom);
    setCreateOpen(false);
    setNewRoom({ name: "", description: "", language: "javascript", is_public: true });
    setSelectedRoomId(result.id);
  };

  if (selectedRoomId) {
    return (
      <MainLayout>
        <div className="container py-6 max-w-6xl">
          <Button variant="ghost" onClick={() => { setSelectedRoomId(null); navigate("/code-with-edworld"); }} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Rooms
          </Button>
          <CodeEditor roomId={selectedRoomId} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Code2 className="h-4 w-4" /> EdWorld Pro
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Code with EdWorld
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Write code, share rooms with friends, and get AI-powered explanations to learn faster
          </p>
        </motion.div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Your Code Rooms</h2>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Room</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Code Room</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Room Name</Label><Input value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g., React Practice" /></div>
                <div><Label>Description</Label><Textarea value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} placeholder="What will you code?" /></div>
                <div>
                  <Label>Language</Label>
                  <Select value={newRoom.language} onValueChange={(v) => setNewRoom({ ...newRoom, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Label>Visibility</Label>
                  <Button
                    variant={newRoom.is_public ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewRoom({ ...newRoom, is_public: true })}
                    className="gap-1"
                  >
                    <Globe className="h-3.5 w-3.5" /> Public
                  </Button>
                  <Button
                    variant={!newRoom.is_public ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewRoom({ ...newRoom, is_public: false })}
                    className="gap-1"
                  >
                    <Lock className="h-3.5 w-3.5" /> Private
                  </Button>
                </div>
                <Button onClick={handleCreate} disabled={!newRoom.name || createRoom.isPending} className="w-full">
                  {createRoom.isPending ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="font-semibold mb-1">No code rooms yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first room and start coding with friends!</p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: any) => (
              <motion.div key={room.id} whileHover={{ y: -2 }}>
                <Card
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/20"
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{room.language}</Badge>
                      <Badge variant={room.is_public ? "default" : "outline"} className="gap-1 text-xs">
                        {room.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {room.is_public ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{room.name}</CardTitle>
                    {room.description && <CardDescription className="line-clamp-2">{room.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> {room.share_code}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`${window.location.origin}/code-with-edworld?room=${room.share_code}`);
                            toast.success("Link copied!");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy Link
                        </Button>
                        {room.created_by === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this room permanently?")) {
                                deleteRoom.mutate(room.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
