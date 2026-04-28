import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface UseVoiceCallOptions {
  conversationId: string;
  otherUserId: string;
}

export function useVoiceCall({ conversationId, otherUserId }: UseVoiceCallOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ICE servers configuration
  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Clean up resources
  const cleanup = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setCallDuration(0);
  }, []);

  // Initialize peer connection
  const initializePeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection(iceServers);
    
    // Get local audio stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    } catch (err) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to make voice calls",
        variant: "destructive",
      });
      throw err;
    }
    
    // Handle incoming audio
    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(console.error);
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate, from: user?.id },
        });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState("connected");
        // Start call timer
        callTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall();
      }
    };
    
    peerConnectionRef.current = pc;
    return pc;
  }, [user?.id, toast]);

  // Setup signaling channel
  const setupSignalingChannel = useCallback(() => {
    const channelName = `call-${[user?.id, otherUserId].sort().join("-")}`;
    
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    
    channel.on("broadcast", { event: "offer" }, async ({ payload }) => {
      if (payload.to !== user?.id) return;
      
      setCallState("ringing");
      
      // Store the offer for when user accepts
      (window as any).__pendingOffer = payload;
    });
    
    channel.on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (payload.to !== user?.id || !peerConnectionRef.current) return;
      
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(payload.answer)
      );
    });
    
    channel.on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
      if (payload.from === user?.id || !peerConnectionRef.current) return;
      
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(payload.candidate)
        );
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });
    
    channel.on("broadcast", { event: "end-call" }, () => {
      toast({ title: "Call ended", description: "The other user ended the call" });
      cleanup();
      setCallState("ended");
      setTimeout(() => setCallState("idle"), 2000);
    });
    
    channel.on("broadcast", { event: "reject-call" }, ({ payload }) => {
      if (payload.to === user?.id) {
        toast({ title: "Call rejected", description: "The other user declined the call" });
        cleanup();
        setCallState("ended");
        setTimeout(() => setCallState("idle"), 2000);
      }
    });
    
    channel.subscribe();
    channelRef.current = channel;
    
    return channel;
  }, [user?.id, otherUserId, cleanup, toast]);

  // Start a call
  const startCall = useCallback(async () => {
    try {
      setCallState("calling");
      
      const channel = setupSignalingChannel();
      const pc = await initializePeerConnection();
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channel.send({
        type: "broadcast",
        event: "offer",
        payload: { offer, from: user?.id, to: otherUserId },
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (callState === "calling") {
          toast({ title: "No answer", description: "The call was not answered" });
          cleanup();
          setCallState("idle");
        }
      }, 30000);
    } catch (err) {
      console.error("Error starting call:", err);
      cleanup();
      setCallState("idle");
    }
  }, [user?.id, otherUserId, setupSignalingChannel, initializePeerConnection, cleanup, toast, callState]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    try {
      const pendingOffer = (window as any).__pendingOffer;
      if (!pendingOffer) return;
      
      setCallState("connected");
      
      if (!channelRef.current) {
        setupSignalingChannel();
      }
      
      const pc = await initializePeerConnection();
      
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      channelRef.current?.send({
        type: "broadcast",
        event: "answer",
        payload: { answer, from: user?.id, to: pendingOffer.from },
      });
      
      delete (window as any).__pendingOffer;
    } catch (err) {
      console.error("Error accepting call:", err);
      cleanup();
      setCallState("idle");
    }
  }, [user?.id, setupSignalingChannel, initializePeerConnection, cleanup]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    const pendingOffer = (window as any).__pendingOffer;
    if (pendingOffer && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "reject-call",
        payload: { from: user?.id, to: pendingOffer.from },
      });
    }
    delete (window as any).__pendingOffer;
    cleanup();
    setCallState("idle");
  }, [user?.id, cleanup]);

  // End call
  const endCall = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "end-call",
        payload: { from: user?.id },
      });
    }
    cleanup();
    setCallState("ended");
    setTimeout(() => setCallState("idle"), 2000);
  }, [user?.id, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Format call duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Set remote audio ref
  const setRemoteAudioElement = useCallback((element: HTMLAudioElement | null) => {
    remoteAudioRef.current = element;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Setup channel on mount for receiving calls
  useEffect(() => {
    if (user?.id && otherUserId) {
      setupSignalingChannel();
    }
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, otherUserId, setupSignalingChannel]);

  return {
    callState,
    isMuted,
    callDuration,
    formatDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    setRemoteAudioElement,
  };
}
