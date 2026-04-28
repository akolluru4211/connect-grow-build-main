import { useCallback, useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Image as ImageIcon,
  Upload,
  Loader2,
  Video,
  Maximize2,
  Minimize2,
  Film,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Resizable Image Component
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const { src, alt, width } = node.attrs;

  const handleWidthChange = (value: number[]) => {
    updateAttributes({ width: `${value[0]}%` });
  };

  const currentWidth = parseInt(width?.replace('%', '') || '100', 10);

  return (
    <NodeViewWrapper className="relative inline-block my-4">
      <div 
        className={cn(
          "relative group",
          selected && "ring-2 ring-primary ring-offset-2 rounded-lg"
        )}
        style={{ width: width || '100%', maxWidth: '100%' }}
      >
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-auto rounded-lg"
          draggable={false}
        />
        
        {/* Resize controls - show on selection */}
        {selected && (
          <div className="absolute -bottom-12 left-0 right-0 flex items-center gap-2 p-2 bg-popover border rounded-lg shadow-lg z-10">
            <Minimize2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[currentWidth]}
              onValueChange={handleWidthChange}
              min={25}
              max={100}
              step={5}
              className="flex-1"
            />
            <Maximize2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-10 text-right">{currentWidth}%</span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Custom Resizable Image Extension
const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: '100%' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { 
      class: 'max-w-full h-auto rounded-lg my-4',
      style: `width: ${HTMLAttributes.width || '100%'}; max-width: 100%;`
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export function RichTextEditor({ value, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
  const [isVideoPopoverOpen, setIsVideoPopoverOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ResizableImage,
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg my-4',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUploadWithPosition(file, view, event);
            return true;
          }
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                handleImageUploadAtCursor(file);
              }
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleImageUploadWithPosition = async (file: File, view: any, event: DragEvent) => {
    if (!user) {
      toast({ title: "Please sign in to upload images", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      // Insert at drop position
      const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
      if (coordinates) {
        editor?.chain().focus().insertContentAt(coordinates.pos, {
          type: 'resizableImage',
          attrs: { src: publicUrl, width: '100%' },
        }).run();
      }

      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUploadAtCursor = async (file: File) => {
    if (!user) {
      toast({ title: "Please sign in to upload images", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      editor?.chain().focus().insertContent({
        type: 'resizableImage',
        attrs: { src: publicUrl, width: '100%' },
      }).run();
      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUploadAtCursor(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      setIsLinkPopoverOpen(false);
      return;
    }

    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
    setIsLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const insertImageFromUrl = useCallback(() => {
    if (!imageUrl) return;
    
    const url = imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`;
    editor?.chain().focus().insertContent({
      type: 'resizableImage',
      attrs: { src: url, width: '100%' },
    }).run();
    setImageUrl('');
    setIsImagePopoverOpen(false);
  }, [editor, imageUrl]);

  const insertVideo = useCallback(() => {
    if (!videoUrl) return;
    
    // Support YouTube and Vimeo
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    const vimeoMatch = videoUrl.match(/(?:vimeo\.com\/)(\d+)/);
    
    if (youtubeMatch) {
      editor?.commands.setYoutubeVideo({
        src: `https://www.youtube.com/watch?v=${youtubeMatch[1]}`,
        width: 640,
        height: 360,
      });
    } else if (vimeoMatch) {
      // Insert Vimeo as iframe HTML
      const vimeoHtml = `<div class="aspect-video my-4"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" class="w-full h-full rounded-lg" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
      editor?.chain().focus().insertContent(vimeoHtml).run();
    } else {
      toast({ title: "Invalid video URL", description: "Please enter a valid YouTube or Vimeo URL", variant: "destructive" });
      return;
    }
    
    setVideoUrl('');
    setIsVideoPopoverOpen(false);
    toast({ title: "Video embedded successfully!" });
  }, [editor, videoUrl, toast]);

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('video/')) {
      toast({ title: "Please select a video file", variant: "destructive" });
      return;
    }

    // Max 50MB for videos
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Video must be less than 50MB", variant: "destructive" });
      return;
    }

    setIsVideoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      // Insert video as HTML5 video element
      const videoHtml = `<div class="video-container my-4"><video src="${publicUrl}" controls class="w-full rounded-lg" style="max-width: 100%;"></video></div>`;
      editor?.chain().focus().insertContent(videoHtml).run();
      
      toast({ title: "Video uploaded successfully!" });
      setIsVideoPopoverOpen(false);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsVideoUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    title,
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode 
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-muted text-foreground"
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="rich-text-editor border border-input rounded-md overflow-hidden bg-background">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {/* Hidden file input for video upload */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        onChange={handleVideoFileUpload}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-input bg-muted/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link Button */}
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('link') && "bg-muted text-foreground"
              )}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setLink()}
              />
              <Button size="sm" onClick={setLink}>Add</Button>
            </div>
          </PopoverContent>
        </Popover>

        {editor.isActive('link') && (
          <ToolbarButton 
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <Unlink className="h-4 w-4" />
          </ToolbarButton>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        {/* Image Upload Button */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !user}
          title="Upload Image"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </ToolbarButton>

        {/* Image URL Button */}
        <Popover open={isImagePopoverOpen} onOpenChange={setIsImagePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Image from URL"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertImageFromUrl()}
              />
              <Button size="sm" onClick={insertImageFromUrl}>Add</Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Video Embed/Upload Button */}
        <Popover open={isVideoPopoverOpen} onOpenChange={setIsVideoPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('youtube') && "bg-muted text-foreground"
              )}
              title="Add Video"
            >
              <Video className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-3">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="upload" className="gap-1.5 text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="embed" className="gap-1.5 text-xs">
                  <Film className="h-3.5 w-3.5" />
                  Embed URL
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 border-dashed gap-2"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isVideoUploading || !user}
                >
                  {isVideoUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Uploading video...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Click to upload video</p>
                        <p className="text-xs text-muted-foreground">MP4, WebM up to 50MB</p>
                      </div>
                    </>
                  )}
                </Button>
              </TabsContent>
              <TabsContent value="embed">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Paste a YouTube or Vimeo URL</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && insertVideo()}
                      className="text-sm"
                    />
                    <Button size="sm" onClick={insertVideo}>Embed</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton 
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>


      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Upload indicator */}
      {isUploading && (
        <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading image...
        </div>
      )}

      <style>{`
        .rich-text-editor .ProseMirror {
          min-height: 200px;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: hsl(var(--muted-foreground));
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-editor .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 1rem;
          margin-left: 0;
          color: hsl(var(--muted-foreground));
        }
        .rich-text-editor .ProseMirror pre {
          background: hsl(var(--muted));
          border-radius: 0.375rem;
          padding: 0.75rem 1rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }
        .rich-text-editor .ProseMirror code {
          background: hsl(var(--muted));
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .rich-text-editor .ProseMirror ul {
          list-style-type: disc;
        }
        .rich-text-editor .ProseMirror ol {
          list-style-type: decimal;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .rich-text-editor .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        .rich-text-editor .ProseMirror iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .rich-text-editor .ProseMirror .aspect-video {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
        }
        .rich-text-editor .ProseMirror .aspect-video iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .rich-text-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 1.5rem 0;
        }
        .rich-text-editor .ProseMirror hr.ProseMirror-selectednode {
          border-top-color: hsl(var(--primary));
        }
        .rich-text-editor .ProseMirror .video-container {
          width: 100%;
          margin: 1rem 0;
        }
        .rich-text-editor .ProseMirror .video-container video {
          width: 100%;
          max-width: 100%;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
