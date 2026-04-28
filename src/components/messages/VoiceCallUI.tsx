import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from "lucide-react";
import { CallState } from "@/hooks/useVoiceCall";
import { cn } from "@/lib/utils";

interface VoiceCallUIProps {
  callState: CallState;
  isMuted: boolean;
  callDuration: number;
  formatDuration: (seconds: number) => string;
  otherUser?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  onStartCall: () => void;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  setRemoteAudioElement: (element: HTMLAudioElement | null) => void;
}

export function VoiceCallButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="text-primary hover:bg-primary/10"
      title="Start voice call"
    >
      <Phone className="h-5 w-5" />
    </Button>
  );
}

export function VoiceCallUI({
  callState,
  isMuted,
  callDuration,
  formatDuration,
  otherUser,
  onStartCall,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onToggleMute,
  setRemoteAudioElement,
}: VoiceCallUIProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      setRemoteAudioElement(audioRef.current);
    }
    return () => setRemoteAudioElement(null);
  }, [setRemoteAudioElement]);

  const isCallActive = callState !== "idle" && callState !== "ended";

  return (
    <>
      {/* Hidden audio element for remote audio */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Call Dialog */}
      <Dialog open={isCallActive} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center py-8">
            {/* Avatar with pulse animation during calling/ringing */}
            <div className="relative mb-6">
              <Avatar
                className={cn(
                  "h-24 w-24 border-4 border-background shadow-lg",
                  (callState === "calling" || callState === "ringing") &&
                    "animate-pulse"
                )}
              >
                <AvatarImage src={otherUser?.avatar_url || ""} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {otherUser?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              {/* Call status indicator */}
              {callState === "connected" && (
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                  <Phone className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
            </div>

            {/* User name */}
            <h3 className="text-xl font-semibold mb-2">
              {otherUser?.full_name || "Unknown User"}
            </h3>

            {/* Call status */}
            <p className="text-muted-foreground mb-6">
              {callState === "calling" && "Calling..."}
              {callState === "ringing" && "Incoming call..."}
              {callState === "connected" && formatDuration(callDuration)}
              {callState === "ended" && "Call ended"}
            </p>

            {/* Call controls */}
            <div className="flex items-center gap-4">
              {callState === "ringing" ? (
                <>
                  {/* Accept call */}
                  <Button
                    size="lg"
                    className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90"
                    onClick={onAcceptCall}
                  >
                    <PhoneIncoming className="h-6 w-6" />
                  </Button>
                  
                  {/* Reject call */}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-16 w-16 rounded-full"
                    onClick={onRejectCall}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </>
              ) : callState === "connected" ? (
                <>
                  {/* Mute toggle */}
                  <Button
                    size="lg"
                    variant={isMuted ? "destructive" : "secondary"}
                    className="h-14 w-14 rounded-full"
                    onClick={onToggleMute}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                  
                  {/* End call */}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-16 w-16 rounded-full"
                    onClick={onEndCall}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                </>
              ) : callState === "calling" ? (
                /* Cancel outgoing call */
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-16 w-16 rounded-full"
                  onClick={onEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              ) : null}
            </div>

            {/* Encryption indicator */}
            {callState === "connected" && (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                End-to-end encrypted
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
