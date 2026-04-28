import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link, X, Loader2, ImageIcon, Video } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  acceptVideo?: boolean;
}

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
};

export function ImageUpload({ value, onChange, acceptVideo = false }: ImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = acceptVideo 
    ? "image/*,video/mp4,video/webm,video/ogg" 
    : "image/*";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    // Validate file type
    if (!isImage && !isVideo) {
      toast({ title: "Please select an image or video file", variant: "destructive" });
      return;
    }

    if (isVideo && !acceptVideo) {
      toast({ title: "Video uploads are not allowed here", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeText = isVideo ? "50MB" : "5MB";
      toast({ title: `File must be less than ${maxSizeText}`, variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast({ title: `${isVideo ? 'Video' : 'Image'} uploaded successfully!` });
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  if (value) {
    const isVideo = isVideoUrl(value);
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cover {isVideo ? 'Video' : 'Image'}</Label>
        <div className="relative rounded-lg overflow-hidden border border-input">
          {isVideo ? (
            <video 
              src={value}
              className="w-full h-48 object-cover"
              controls
              muted
              playsInline
              onError={(e) => {
                console.error("Video load error:", e);
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img 
              src={value} 
              alt="Cover" 
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        {acceptVideo ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
        Cover {acceptVideo ? 'Media' : 'Image'}
      </Label>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link className="h-3.5 w-3.5" />
            URL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-24 border-dashed gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !user}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    {acceptVideo 
                      ? "PNG, JPG up to 5MB or MP4, WebM up to 50MB"
                      : "PNG, JPG up to 5MB"
                    }
                  </p>
                </div>
              </>
            )}
          </Button>
        </TabsContent>
        <TabsContent value="url" className="mt-3">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={acceptVideo 
                ? "https://example.com/media.jpg or .mp4"
                : "https://example.com/image.jpg"
              }
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
              Add
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
