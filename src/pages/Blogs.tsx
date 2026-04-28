import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBlogs, useBlogComments, useInfiniteBlogPosts, BlogPost } from "@/hooks/useBlogs";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { useForYouFeed } from "@/hooks/useForYouFeed";
import { useFollows, useUserFollowStats } from "@/hooks/useFollows";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format, parseISO } from "date-fns";
import { Loader2, RefreshCw, Search, Calendar, Sparkles, Hash, X as XIcon, Wand2, UserPlus, UserCheck, Users, Zap, ArrowRight, BadgeCheck } from "lucide-react";
import { 
  Heart, MessageCircle, Eye, Plus, Trash, Edit, Send, ArrowLeft, 
  Globe, Bookmark, BookmarkCheck, MoreHorizontal, Image as ImageIcon,
  Video, FileText, TrendingUp, BarChart3, Lightbulb, Building2, GraduationCap, Briefcase
} from "lucide-react";
import { PostAnalyticsDashboard } from "@/components/blog/PostAnalyticsDashboard";
import { FloatingPostButton } from "@/components/blog/FloatingPostButton";
import { SocialShareButtons } from "@/components/blog/SocialShareButtons";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { ImageUpload } from "@/components/blog/ImageUpload";

import { GoogleAd } from "@/components/ads/GoogleAd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { getDisplayName, getDisplayAvatar, isEdworldUser } from "@/lib/edworldProfile";

// LinkedIn-style Feed Post Component
function FeedPostCard({ post }: { post: BlogPost }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleLike } = useBlogs();
  const { isPostSaved, toggleSavePost } = useSavedPosts();
  const { isFollowing, toggleFollow } = useFollows();
  const saved = isPostSaved(post.id);
  const following = isFollowing(post.author_id);
  const isOwnPost = user?.id === post.author_id;
  const isEdworldAuthor = isEdworldUser(post.author?.full_name);
  const displayName = getDisplayName(post.author?.full_name);
  const displayAvatar = getDisplayAvatar(post.author?.full_name, post.author?.avatar_url);

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }
    action();
  };

  const handleNavigateToPost = () => {
    navigate(`/blog/${post.slug}`);
  };

  return (
    <Card className="border-border/60 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-primary/10">
              <AvatarImage src={displayAvatar || ""} className={isEdworldAuthor ? "bg-background p-1" : ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold hover:text-primary cursor-pointer">
                  {displayName}
                </p>
                {isEdworldAuthor && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheck className="h-5 w-5 text-green-500 fill-green-500/20 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified Official Account</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {user && !isOwnPost && (
                  <Button
                    variant={following ? "secondary" : "outline"}
                    size="sm"
                    className="h-6 px-2 text-xs gap-1"
                    onClick={handleAction(() => toggleFollow.mutate(post.author_id))}
                  >
                    {following ? (
                      <>
                        <UserCheck className="h-3 w-3" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {post.published_at ? format(parseISO(post.published_at), "MMM d, yyyy") : "Draft"}
                <span>•</span>
                <Globe className="h-3 w-3" />
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAction(() => toggleSavePost.mutate(post.id))}>
                {saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                    Unsave
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Post Content */}
      <CardContent className="pb-3 cursor-pointer" onClick={handleNavigateToPost}>
        <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{post.excerpt}</p>
        )}
        
        {post.cover_image_url && (
          <div className="h-64 sm:h-80 overflow-hidden rounded-lg -mx-4 sm:-mx-6 mt-3">
            <img 
              src={post.cover_image_url} 
              alt={post.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-primary text-sm hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      {/* Engagement Stats */}
      <div className="px-4 sm:px-6 py-2 text-xs text-muted-foreground flex items-center justify-between border-b">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <span className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
              <Heart className="h-2.5 w-2.5 text-white fill-white" />
            </span>
          </div>
          <span>{post.likes_count}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{post.comments_count} comments</span>
          <span>{post.views_count} views</span>
        </div>
      </div>

      {/* Action Buttons */}
      <CardFooter className="py-1 px-2 sm:px-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 gap-2 ${post.user_liked ? "text-red-500" : ""}`}
          onClick={handleAction(() => toggleLike.mutate(post.id))}
        >
          <Heart className={`h-4 w-4 ${post.user_liked ? "fill-current" : ""}`} />
          <span className="hidden sm:inline">Like</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleNavigateToPost}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Comment</span>
        </Button>
        <div className="flex-1 flex justify-center">
          <SocialShareButtons title={post.title} compact />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`flex-1 gap-2 ${saved ? "text-primary" : ""}`}
          onClick={handleAction(() => toggleSavePost.mutate(post.id))}
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

function BlogPostDetail({ post, onClose }: { post: BlogPost; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleLike } = useBlogs();
  const { comments, addComment, deleteComment } = useBlogComments(post.id);
  const { isPostSaved, toggleSavePost } = useSavedPosts();
  const [newComment, setNewComment] = useState("");
  const saved = isPostSaved(post.id);
  const isEdworldDetailAuthor = isEdworldUser(post.author?.full_name);
  const detailDisplayName = getDisplayName(post.author?.full_name);
  const detailDisplayAvatar = getDisplayAvatar(post.author?.full_name, post.author?.avatar_url);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    await addComment.mutateAsync({ content: newComment });
    setNewComment("");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={onClose} className="gap-2 hover:bg-muted">
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Button>

      <Card>
        {post.cover_image_url && (
          <div className="h-72 sm:h-96 overflow-hidden">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={detailDisplayAvatar || ""} className={isEdworldDetailAuthor ? "bg-background p-1" : ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {detailDisplayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{detailDisplayName}</p>
                {isEdworldDetailAuthor && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <BadgeCheck className="h-6 w-6 text-green-500 fill-green-500/20 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Verified Official Account</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {post.published_at ? format(parseISO(post.published_at), "MMMM d, yyyy 'at' h:mm a") : "Draft"}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{post.title}</h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />

          {/* Social Share */}
          <div className="pt-4 border-t">
            <SocialShareButtons title={post.title} />
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <div className="flex items-center gap-6 w-full border-t border-b py-4">
            <button
              className={`flex items-center gap-2 font-medium transition-colors ${post.user_liked ? "text-red-500" : "text-muted-foreground hover:text-primary"}`}
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                toggleLike.mutate(post.id);
              }}
            >
              <Heart className={`h-5 w-5 ${post.user_liked ? "fill-current" : ""}`} />
              {post.likes_count} likes
            </button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
              {post.comments_count} comments
            </div>
            <button
              className={`flex items-center gap-2 font-medium ml-auto transition-colors ${saved ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                toggleSavePost.mutate(post.id);
              }}
            >
              {saved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Comments ({comments?.length || 0})</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-muted">
                {user ? user.email?.charAt(0).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                className="flex-1"
                disabled={!user}
              />
              <Button 
                onClick={handleAddComment} 
                disabled={addComment.isPending || !user}
                size="icon"
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 bg-muted/40 rounded-xl">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={getDisplayAvatar(comment.author?.full_name, comment.author?.avatar_url)} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getDisplayName(comment.author?.full_name).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium">{getDisplayName(comment.author?.full_name)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {format(parseISO(comment.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    {comment.author_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComment.mutate(comment.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-foreground/90">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// LinkedIn-style Post Composer with AI Suggestions
function PostComposer({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isPending 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  isPending: boolean;
}) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { 
    isLoading: aiLoading, 
    titleSuggestions, 
    tagSuggestions, 
    improvements,
    getSuggestions, 
    clearSuggestions 
  } = useAISuggestions();
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    cover_image_url: "",
    tags: "",
    is_published: true,
    scheduled_at: "",
  });
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const handleSubmit = async () => {
    await onSubmit({
      title: postForm.title,
      content: postForm.content,
      excerpt: postForm.excerpt,
      cover_image_url: postForm.cover_image_url || null,
      tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_published: postForm.is_published,
      scheduled_at: postForm.scheduled_at || null,
    });
    onOpenChange(false);
    setPostForm({ title: "", content: "", excerpt: "", cover_image_url: "", tags: "", is_published: true, scheduled_at: "" });
    clearSuggestions();
    setShowAISuggestions(false);
  };

  const handleGetSuggestions = async (type: "title" | "tags" | "improve") => {
    setShowAISuggestions(true);
    await getSuggestions(type, postForm.content, postForm.excerpt || postForm.title);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        clearSuggestions();
        setShowAISuggestions(false);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold">{profile?.full_name || "Your Post"}</p>
              <p className="text-xs text-muted-foreground font-normal">Post to Anyone</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* AI Suggestions Panel */}
          <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 w-full mb-1">
              <Wand2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Writing Assistant</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGetSuggestions("title")}
              disabled={aiLoading || !postForm.content}
              className="gap-1.5"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Suggest Titles
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGetSuggestions("tags")}
              disabled={aiLoading || !postForm.content}
              className="gap-1.5"
            >
              <Hash className="h-3.5 w-3.5" />
              Suggest Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGetSuggestions("improve")}
              disabled={aiLoading || !postForm.content}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get Tips
            </Button>
            {aiLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          {/* AI Suggestions Results */}
          {showAISuggestions && (titleSuggestions.length > 0 || tagSuggestions.length > 0 || improvements.length > 0) && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              {titleSuggestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Titles (click to use):</p>
                  <div className="space-y-1.5">
                    {titleSuggestions.map((title, i) => (
                      <button
                        key={i}
                        onClick={() => setPostForm({ ...postForm, title })}
                        className="w-full text-left text-sm p-2 rounded-md bg-background hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {tagSuggestions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Tags (click to add):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tagSuggestions.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => {
                          const currentTags = postForm.tags ? postForm.tags.split(",").map(t => t.trim()) : [];
                          if (!currentTags.includes(tag)) {
                            setPostForm({ 
                              ...postForm, 
                              tags: [...currentTags, tag].filter(Boolean).join(", ") 
                            });
                          }
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {improvements.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Improvement Tips:</p>
                  <div className="space-y-2">
                    {improvements.map((tip, i) => (
                      <div key={i} className="text-sm p-2 rounded-md bg-background">
                        <span className="font-medium text-primary">{tip.area}:</span>{" "}
                        <span className="text-muted-foreground">{tip.suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Title</Label>
            <Input
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              placeholder="What do you want to talk about?"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Summary (optional)</Label>
            <Input
              value={postForm.excerpt}
              onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
              placeholder="Brief description of your post"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Content</Label>
            <div className="mt-1.5">
              <RichTextEditor
                value={postForm.content}
                onChange={(value) => setPostForm({ ...postForm, content: value })}
                placeholder="Share your thoughts, experiences, or insights..."
              />
            </div>
          </div>
          <ImageUpload
            value={postForm.cover_image_url}
            onChange={(url) => setPostForm({ ...postForm, cover_image_url: url })}
          />
          <div>
            <Label className="text-sm font-medium">Tags</Label>
            <Input
              value={postForm.tags}
              onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
              placeholder="tech, career, advice (comma-separated)"
              className="mt-1.5"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="font-medium">Publish immediately</Label>
              <p className="text-xs text-muted-foreground">Your post will be visible to everyone</p>
            </div>
            <Switch
              checked={postForm.is_published}
              onCheckedChange={(checked) => setPostForm({ ...postForm, is_published: checked, scheduled_at: checked ? "" : postForm.scheduled_at })}
            />
          </div>
          {!postForm.is_published && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule for later
              </Label>
              <Input
                type="datetime-local"
                value={postForm.scheduled_at}
                onChange={(e) => setPostForm({ ...postForm, scheduled_at: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-1.5"
              />
              {postForm.scheduled_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Will be published on {format(new Date(postForm.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={!postForm.title || !postForm.content || isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? "Publishing..." : postForm.scheduled_at ? "Schedule Post" : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



export default function Blogs() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { myPosts, createPost, updatePost, deletePost, toggleLike } = useBlogs();
  
  // Combine search query with selected tag for filtering
  const combinedSearch = selectedTag 
    ? (debouncedSearch ? `${debouncedSearch} ${selectedTag}` : selectedTag)
    : debouncedSearch;
  
  const { 
    data: infinitePosts, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    refetch
  } = useInfiniteBlogPosts(combinedSearch);
  const { savedPostIds, isPostSaved } = useSavedPosts();
  const { data: trendingTopics, isLoading: trendingLoading } = useTrendingTopics();
  const { data: forYouPosts, isLoading: forYouLoading } = useForYouFeed();
  const { stats: followStats } = useUserFollowStats(user?.id);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    cover_image_url: "",
    tags: "",
    is_published: true,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pull to refresh for mobile
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(0);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Pull-to-refresh touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - pullStartY.current);
    const dampedDistance = Math.min(distance * 0.5, 100); // Damped pull with max 100px
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(dampedDistance);
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60) {
      await handleRefresh();
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  }, [pullDistance, handleRefresh]);

  // Flatten infinite pages into posts array
  const posts = infinitePosts?.pages.flatMap((page) => page.posts) || [];

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const option = { threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Handle compose query parameter
  useEffect(() => {
    if (searchParams.get("compose") === "true" && user) {
      setCreateDialogOpen(true);
      setSearchParams({});
    }
  }, [searchParams, user, setSearchParams]);

  const handleCreatePost = async (postData: any) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    await createPost.mutateAsync(postData);
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    await updatePost.mutateAsync({
      id: editingPost.id,
      title: postForm.title,
      content: postForm.content,
      excerpt: postForm.excerpt,
      cover_image_url: postForm.cover_image_url || null,
      tags: postForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_published: postForm.is_published,
    });
    setEditingPost(null);
    setPostForm({ title: "", content: "", excerpt: "", cover_image_url: "", tags: "", is_published: true });
  };

  const openEditDialog = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      cover_image_url: post.cover_image_url || "",
      tags: post.tags?.join(", ") || "",
      is_published: post.is_published || false,
    });
  };

  // Filter saved posts
  const savedPosts = posts?.filter((post) => isPostSaved(post.id)) || [];


  return (
    <MainLayout>
        <div 
          ref={containerRef}
          className="h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="container py-4 px-3 md:px-6">
            <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="hidden lg:block space-y-4">
            <Card className="sticky top-20 overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-primary via-primary/80 to-accent-foreground" />
              <CardContent className="pt-0 -mt-10 text-center">
                <Avatar className="h-20 w-20 mx-auto border-4 border-background ring-2 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-semibold">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold mt-3 text-lg">{profile?.full_name || "Welcome!"}</h3>
                <p className="text-sm text-muted-foreground">{profile?.headline || "Add a headline"}</p>
                
                {/* Follower Stats */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
                  <button 
                    onClick={() => navigate("/followers?tab=followers")}
                    className="text-center hover:text-primary transition-colors"
                  >
                    <p className="font-bold text-lg">{followStats?.followersCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </button>
                  <div className="w-px h-8 bg-border" />
                  <button 
                    onClick={() => navigate("/followers?tab=following")}
                    className="text-center hover:text-primary transition-colors"
                  >
                    <p className="font-bold text-lg">{followStats?.followingCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t space-y-2 text-left">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 h-9"
                    onClick={() => navigate("/profile")}
                  >
                    <Eye className="h-4 w-4" />
                    View Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 h-9"
                    onClick={() => navigate("/followers")}
                  >
                    <Users className="h-4 w-4" />
                    My Network
                    <Badge variant="secondary" className="ml-auto">
                      {(followStats?.followersCount || 0) + (followStats?.followingCount || 0)}
                    </Badge>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 h-9"
                    onClick={() => navigate("/profile")}
                  >
                    <Bookmark className="h-4 w-4" />
                    Saved items
                    <Badge variant="secondary" className="ml-auto">{savedPostIds.length}</Badge>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-3">
            {/* Welcome Hero Section for visitors */}
            {!user && (
              <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent-foreground/10" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent-foreground/20 to-transparent rounded-full blur-2xl" />
                    
                    <div className="relative p-6 sm:p-10">
                      <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="flex-1 text-center lg:text-left space-y-6">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                            <Zap className="h-4 w-4" />
                            Your Career Journey Starts Here
                          </div>
                          
                          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                            Connect, Learn &<br />
                            <span className="gradient-text">Grow Your Career</span>
                          </h1>
                          
                          <p className="text-muted-foreground text-lg max-w-xl">
                            Join thousands of professionals sharing insights, discovering opportunities, 
                            and building meaningful connections. Your next big opportunity is just a click away.
                          </p>
                          
                          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button 
                              onClick={() => navigate("/auth?mode=signup")} 
                              size="lg"
                              className="gap-2 text-base px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                            >
                              Get Started Free
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => navigate("/auth")} 
                              size="lg"
                              className="text-base px-8"
                            >
                              Sign In
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4 text-primary" />
                              <span>10K+ Members</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="h-4 w-4 text-primary" />
                              <span>500+ Jobs</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span>100+ Companies</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden lg:flex flex-col items-center justify-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent-foreground rounded-3xl blur-2xl opacity-30 animate-pulse" />
                            <div className="relative grid grid-cols-2 gap-3 p-6 bg-card/80 backdrop-blur rounded-3xl border shadow-xl">
                              <div className="flex flex-col items-center gap-2 p-4 bg-primary/10 rounded-2xl">
                                <Briefcase className="h-8 w-8 text-primary" />
                                <span className="text-sm font-medium">Find Jobs</span>
                              </div>
                              <div className="flex flex-col items-center gap-2 p-4 bg-accent rounded-2xl">
                                <Users className="h-8 w-8 text-accent-foreground" />
                                <span className="text-sm font-medium">Network</span>
                              </div>
                              <div className="flex flex-col items-center gap-2 p-4 bg-accent rounded-2xl">
                                <GraduationCap className="h-8 w-8 text-accent-foreground" />
                                <span className="text-sm font-medium">Learn Skills</span>
                              </div>
                              <div className="flex flex-col items-center gap-2 p-4 bg-primary/10 rounded-2xl">
                                <FileText className="h-8 w-8 text-primary" />
                                <span className="text-sm font-medium">Share Ideas</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pull to Refresh Indicator */}
            {(pullDistance > 0 || isRefreshing) && (
              <div 
                className="flex items-center justify-center py-4 transition-all duration-200"
                style={{ height: isRefreshing ? 60 : pullDistance }}
              >
                <div className={`flex items-center gap-2 text-primary ${pullDistance > 60 ? 'scale-110' : ''} transition-transform`}>
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3.6}deg)` }} />
                  <span className="text-sm font-medium">
                    {isRefreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
                  </span>
                </div>
              </div>
            )}

            {/* Post Composer Card - Compact for mobile */}
            <Card className="shadow-sm">
              <CardContent className="p-3 md:pt-4 md:px-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    className="flex-1 justify-start text-muted-foreground font-normal rounded-full h-10 md:h-12 text-sm"
                    onClick={() => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      setCreateDialogOpen(true);
                    }}
                  >
                    Start a post...
                  </Button>
                </div>
                <div className="flex items-center justify-around mt-2 pt-2 border-t gap-1">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground flex-1 h-8">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span className="hidden sm:inline">Photo</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground flex-1 h-8">
                    <Video className="h-4 w-4 text-green-500" />
                    <span className="hidden sm:inline">Video</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1.5 text-xs text-muted-foreground flex-1 h-8"
                    onClick={() => {
                      if (!user) {
                        navigate("/auth");
                        return;
                      }
                      setCreateDialogOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span className="hidden sm:inline">Article</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Tag Filter */}
            {selectedTag && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <span className="font-medium">Filtering by: </span>
                    <Badge variant="secondary" className="text-primary">
                      #{selectedTag}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTag(null)}
                    className="gap-1"
                  >
                    <XIcon className="h-4 w-4" />
                    Clear
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tabs for different views */}
            <Tabs defaultValue="all" className="space-y-3">
              <TabsList className="w-full justify-start bg-muted/50 rounded-lg p-1 h-auto gap-1 overflow-x-auto">
                <TabsTrigger 
                  value="all" 
                  className="rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  All
                </TabsTrigger>
                {user && (
                  <>
                    <TabsTrigger 
                      value="my" 
                      className="rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      My Posts
                    </TabsTrigger>
                    <TabsTrigger 
                      value="saved" 
                      className="rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Saved
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Stats
                    </TabsTrigger>
                    <TabsTrigger 
                      value="foryou" 
                      className="rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      For You
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* For You Tab */}
              {user && (
                <TabsContent value="foryou" className="space-y-4 mt-0">
                  {forYouLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-muted rounded w-1/3" />
                              <div className="h-3 bg-muted rounded w-1/4" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-4 bg-muted rounded w-full" />
                          <div className="h-48 bg-muted rounded-lg mt-4" />
                        </CardContent>
                      </Card>
                    ))
                  ) : !forYouPosts || forYouPosts.length === 0 ? (
                    <Card className="py-12 text-center border-dashed">
                      <CardContent>
                        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground mb-2">
                          We're learning your interests!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Like and save posts to get personalized recommendations.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    forYouPosts.map((post, index) => (
                      <div key={post.id}>
                        <FeedPostCard post={post} />
                        {index === 5 && <div className="my-4"><GoogleAd className="rounded-lg" /></div>}
                      </div>
                    ))
                  )}
                </TabsContent>
              )}

              <TabsContent value="all" className="space-y-4 mt-0">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-muted" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-1/4" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-48 bg-muted rounded-lg mt-4" />
                      </CardContent>
                    </Card>
                  ))
                ) : posts.length === 0 ? (
                  <Card className="py-12 text-center border-dashed">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                      <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                      <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                        Create Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {posts.map((post, index) => (
                      <div key={post.id}>
                        <FeedPostCard post={post} />
                        
                        {index === 5 && <div className="my-4"><GoogleAd className="rounded-lg" /></div>}
                      </div>
                    ))}
                    
                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Loading more posts...</span>
                        </div>
                      ) : hasNextPage ? (
                        <p className="text-sm text-muted-foreground">Scroll for more</p>
                      ) : posts.length > 0 ? (
                        <p className="text-sm text-muted-foreground">You've reached the end</p>
                      ) : null}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="my" className="space-y-4 mt-0">
                {myPosts?.length === 0 ? (
                  <Card className="py-12 text-center border-dashed">
                    <CardContent>
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                      <p className="text-muted-foreground">You haven't created any posts yet.</p>
                      <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                        Write Your First Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  myPosts?.map((post) => (
                    <Card key={post.id} className="border-border/60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{post.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {post.is_published ? "Published" : "Draft"} • {format(parseISO(post.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(post)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePost.mutate(post.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="saved" className="space-y-4 mt-0">
                {savedPosts.length === 0 ? (
                  <Card className="py-12 text-center border-dashed">
                    <CardContent>
                      <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                      <p className="text-muted-foreground">No saved posts yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click the bookmark icon on any post to save it for later.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  savedPosts.map((post) => (
                    <FeedPostCard 
                      key={post.id} 
                      post={post} 
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <PostAnalyticsDashboard />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Trending */}
          <div className="hidden lg:block">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base">Trending Topics</h2>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="h-4 w-4 bg-muted rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-3 bg-muted rounded w-12" />
                      </div>
                    </div>
                  ))
                ) : trendingTopics && trendingTopics.length > 0 ? (
                  trendingTopics.map((topic, i) => (
                    <button
                      key={topic.tag}
                      onClick={() => setSelectedTag(selectedTag === topic.tag ? null : topic.tag)}
                      className={`w-full flex items-start gap-3 p-2 rounded-lg transition-colors text-left ${
                        selectedTag === topic.tag 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm text-muted-foreground w-4 shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          selectedTag === topic.tag ? "text-primary" : ""
                        }`}>
                          #{topic.tag}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {topic.count} {topic.count === 1 ? "post" : "posts"}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No trending topics yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Suggested for you card */}
            {user && (
              <Card className="mt-4 sticky top-[340px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Quick Actions</h3>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Write a post
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate("/jobs")}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Browse jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Post Composer Dialog */}
      <PostComposer
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreatePost}
        isPending={createPost.isPending}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Title</Label>
              <Input
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="What's on your mind?"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Summary</Label>
              <Input
                value={postForm.excerpt}
                onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                placeholder="Brief description"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Content</Label>
              <div className="mt-1.5">
                <RichTextEditor
                  value={postForm.content}
                  onChange={(value) => setPostForm({ ...postForm, content: value })}
                  placeholder="Share your thoughts..."
                />
              </div>
            </div>
            <ImageUpload
              value={postForm.cover_image_url}
              onChange={(url) => setPostForm({ ...postForm, cover_image_url: url })}
            />
            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <Input
                value={postForm.tags}
                onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                placeholder="tech, career, advice"
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label className="font-medium">Published</Label>
                <p className="text-xs text-muted-foreground">Visible to everyone</p>
              </div>
              <Switch
                checked={postForm.is_published}
                onCheckedChange={(checked) => setPostForm({ ...postForm, is_published: checked })}
              />
            </div>
            <Button 
              onClick={handleUpdatePost} 
              disabled={!postForm.title || !postForm.content || updatePost.isPending}
              className="w-full"
              size="lg"
            >
              {updatePost.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Post Button - visible on all devices */}
      <FloatingPostButton onClick={() => setCreateDialogOpen(true)} />
    </MainLayout>
  );
}
