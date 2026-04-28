import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlogComments } from "@/hooks/useBlogs";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useAuth } from "@/contexts/AuthContext";
import { useBlogPostBySlug } from "@/hooks/useBlogPostBySlug";
import { format, parseISO } from "date-fns";
import { SocialShareButtons } from "@/components/blog/SocialShareButtons";
import { getDisplayName, getDisplayAvatar, isEdworldUser } from "@/lib/edworldProfile";
import { 
  Heart, MessageCircle, Send, ArrowLeft, 
  Bookmark, BookmarkCheck, Trash, Eye, Calendar 
} from "lucide-react";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { post, isLoading, toggleLike, incrementViews } = useBlogPostBySlug(slug || "");
  const { comments, addComment, deleteComment } = useBlogComments(post?.id || "");
  const { isPostSaved, toggleSavePost } = useSavedPosts();
  const [newComment, setNewComment] = useState("");

  const saved = post ? isPostSaved(post.id) : false;

  // Increment views on mount
  useEffect(() => {
    if (post?.id) {
      incrementViews();
    }
  }, [post?.id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    await addComment.mutateAsync({ content: newComment });
    setNewComment("");
  };

  // Generate excerpt for meta description
  const metaDescription = post?.excerpt || 
    (post?.content ? DOMPurify.sanitize(post.content, { ALLOWED_TAGS: [] }).slice(0, 160) : "");

  // Generate canonical URL
  const canonicalUrl = `${window.location.origin}/blog/${slug}`;

  // Generate JSON-LD structured data
  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": metaDescription,
    "image": post.cover_image_url || undefined,
    "datePublished": post.published_at,
    "dateModified": post.created_at,
    "author": {
      "@type": "Person",
      "name": getDisplayName(post.author?.full_name)
    },
    "publisher": {
      "@type": "Organization",
      "name": "EdWorld"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  } : null;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-6 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Card>
            <div className="h-72 sm:h-96">
              <Skeleton className="w-full h-full" />
            </div>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="container py-6 max-w-3xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>{post.title} | EdWorld Blog</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta property="article:published_time" content={post.published_at || ""} />
        <meta property="article:author" content={getDisplayName(post.author?.full_name)} />
        {post.tags?.map((tag, i) => (
          <meta key={i} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={metaDescription} />
        {post.cover_image_url && <meta name="twitter:image" content={post.cover_image_url} />}

        {/* JSON-LD */}
        {jsonLd && (
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        )}
      </Helmet>

      <div className="container py-6 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 hover:bg-muted mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Button>

        <article>
          <Card>
            {post.cover_image_url && (
              <div className="h-72 sm:h-96 overflow-hidden">
                <img 
                  src={post.cover_image_url} 
                  alt={post.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={getDisplayAvatar(post.author?.full_name, post.author?.avatar_url)} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getDisplayName(post.author?.full_name).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{getDisplayName(post.author?.full_name)}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.published_at ? format(parseISO(post.published_at), "MMMM d, yyyy") : "Draft"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {post.views_count || 0} views
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <h1 className="text-2xl sm:text-3xl font-bold">{post.title}</h1>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`}>
                      <Badge variant="secondary" className="hover:bg-primary/20 cursor-pointer">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
              />

              {/* Social Share */}
              <div className="pt-4 border-t">
                <SocialShareButtons title={post.title} url={canonicalUrl} />
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
                    toggleLike();
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
        </article>

        {/* Comments Section */}
        <Card className="mt-6">
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
    </MainLayout>
  );
}
