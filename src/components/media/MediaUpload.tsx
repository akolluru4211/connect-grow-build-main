import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Link, X, Loader2, ImageIcon, Video, Play, Pause } from "lucide-react";

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  acceptVideo?: boolean;
  maxImageSize?: number; // in MB
  maxVideoSize?: number; // in MB
  className?: string;
}

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext));
};

export function MediaUpload({ 
  value, 
  onChange, 
  bucket = "media-uploads",
  acceptVideo = true,
  maxImageSize = 10,
  maxVideoSize = 100,
  className 
}: MediaUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const acceptedTypes = acceptVideo 
    ? "image/*,video/mp4,video/webm,video/ogg,video/quicktime" 
    : "image/*";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) {
      toast.error("Please log in to upload files");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    if (isVideo && !acceptVideo) {
      toast.error("Video uploads are not allowed here");
      return;
    }

    const maxSize = isVideo ? maxVideoSize * 1024 * 1024 : maxImageSize * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeText = isVideo ? `${maxVideoSize}MB` : `${maxImageSize}MB`;
      toast.error(`File must be less than ${maxSizeText}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        // Try blog-images as fallback
        const { error: fallbackError } = await supabase.storage
          .from("blog-images")
          .upload(fileName, file);
        
        if (fallbackError) throw fallbackError;

        const { data: { publicUrl } } = supabase.storage
          .from("blog-images")
          .getPublicUrl(fileName);

        setUploadProgress(100);
        onChange(`${publicUrl}?t=${Date.now()}`);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        setUploadProgress(100);
        onChange(`${publicUrl}?t=${Date.now()}`);
      }

      toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      toast.success("Media URL added!");
    }
  };

  const handleRemove = () => {
    onChange("");
    setIsPlaying(false);
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (value) {
    const isVideo = isVideoUrl(value);
    
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium flex items-center gap-2">
          {isVideo ? <Video className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
          {isVideo ? 'Video' : 'Image'}
        </Label>
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/30">
          {isVideo ? (
            <div className="relative group">
              <video 
                ref={videoRef}
                src={value}
                className="w-full h-48 object-cover"
                controls={false}
                muted
                playsInline
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error("Video load error:", e);
                }}
              >
                Your browser does not support the video tag.
              </video>
              <button
                onClick={toggleVideoPlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="h-6 w-6 text-primary-foreground" />
                  ) : (
                    <Play className="h-6 w-6 text-primary-foreground ml-1" />
                  )}
                </div>
              </button>
            </div>
          ) : (
            <img 
              src={value} 
              alt="Uploaded media" 
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2">
            <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-full">
              {isVideo ? "Video" : "Image"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium flex items-center gap-2">
        {acceptVideo ? <Video className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
        {acceptVideo ? 'Upload Media' : 'Upload Image'}
      </Label>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
            className="w-full h-28 border-dashed border-2 gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !user}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Uploading...</span>
                <Progress value={uploadProgress} className="h-2 w-32" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    {acceptVideo 
                      ? `Images up to ${maxImageSize}MB • Videos up to ${maxVideoSize}MB`
                      : `PNG, JPG, GIF up to ${maxImageSize}MB`
                    }
                  </p>
                </div>
              </div>
            )}
          </Button>
          {!user && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please sign in to upload files
            </p>
          )}
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
              className="flex-1"
            />
            <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()} className="shrink-0">
              Add
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
