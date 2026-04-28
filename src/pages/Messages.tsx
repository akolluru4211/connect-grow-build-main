import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useConversations, useMessages, Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Send, Plus, MessageSquare, Search, Check, CheckCheck, Phone, Shield, Crown, Lock } from "lucide-react";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { VoiceCallButton, VoiceCallUI } from "@/components/messages/VoiceCallUI";
import { useEncryptedMessages } from "@/hooks/useEncryptedMessages";

import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
            selectedId === conv.id ? "bg-primary/10" : "hover:bg-muted"
          }`}
          onClick={() => onSelect(conv.id)}
        >
          <Avatar>
            <AvatarImage src={conv.other_user?.avatar_url || ""} />
            <AvatarFallback>{conv.other_user?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{conv.other_user?.full_name || "Unknown User"}</p>
              {conv.unread_count ? (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                  {conv.unread_count}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {conv.last_message?.content || "No messages yet"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function MessageThread({ 
  conversationId, 
  otherUser,
  otherUserId 
}: { 
  conversationId: string; 
  otherUser?: { full_name: string | null; avatar_url: string | null };
  otherUserId?: string;
}) {
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, markAsRead, typingUsers, sendTypingIndicator } = useMessages(conversationId);
  const [newMessage, setNewMessage] = useState("");
  const [decryptedMessages, setDecryptedMessages] = useState<Array<{ id: string; decryptedContent: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Encryption hook
  const { encrypt, decryptMessages, isEncryptionReady, hasSharedKey } = useEncryptedMessages(
    conversationId,
    otherUserId
  );

  // Voice call hook
  const voiceCall = useVoiceCall({
    conversationId,
    otherUserId: otherUserId || "",
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, decryptedMessages]);

  useEffect(() => {
    markAsRead.mutate();
  }, [conversationId, messages?.length]);

  // Decrypt messages when they arrive
  useEffect(() => {
    if (messages && isEncryptionReady) {
      decryptMessages(messages).then(decrypted => {
        setDecryptedMessages(decrypted.map(m => ({ id: m.id, decryptedContent: m.decryptedContent })));
      });
    }
  }, [messages, isEncryptionReady, decryptMessages]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    sendTypingIndicator(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    sendTypingIndicator(false);
    
    // Encrypt message before sending
    const encryptedContent = await encrypt(newMessage);
    await sendMessage.mutateAsync(encryptedContent);
    setNewMessage("");
  };

  const getDecryptedContent = (messageId: string, originalContent: string) => {
    const decrypted = decryptedMessages.find(m => m.id === messageId);
    return decrypted?.decryptedContent || originalContent;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with call button and encryption indicator */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={otherUser?.avatar_url || ""} />
            <AvatarFallback>{otherUser?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{otherUser?.full_name || "Unknown User"}</h3>
            {typingUsers.length > 0 && (
              <p className="text-sm text-primary animate-pulse">Typing...</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Encryption indicator */}
          <Badge variant="outline" className="gap-1 text-xs">
            <Shield className="h-3 w-3 text-primary" />
            E2E Encrypted
          </Badge>
          
          {/* Voice call button */}
          {otherUserId && (
            <VoiceCallButton onClick={voiceCall.startCall} />
          )}
        </div>
      </div>

      {/* Voice call UI */}
      {otherUserId && (
        <VoiceCallUI
          callState={voiceCall.callState}
          isMuted={voiceCall.isMuted}
          callDuration={voiceCall.callDuration}
          formatDuration={voiceCall.formatDuration}
          otherUser={otherUser}
          onStartCall={voiceCall.startCall}
          onAcceptCall={voiceCall.acceptCall}
          onRejectCall={voiceCall.rejectCall}
          onEndCall={voiceCall.endCall}
          onToggleMute={voiceCall.toggleMute}
          setRemoteAudioElement={voiceCall.setRemoteAudioElement}
        />
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => {
            const isOwn = message.sender_id === user?.id;
            const displayContent = getDecryptedContent(message.id, message.content);
            
            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender?.avatar_url || ""} />
                      <AvatarFallback>{message.sender?.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p>{displayContent}</p>
                    <div className={`flex items-center gap-1 text-xs mt-1 ${isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
                      <span>{format(parseISO(message.created_at), "p")}</span>
                      {isOwn && (
                        message.is_read ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewConversationDialog({ onStart }: { onStart: (userId: string) => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    // Use profiles_public view for privacy
    const { data } = await supabase
      .from("profiles_public")
      .select("id, full_name, avatar_url")
      .neq("id", user?.id)
      .ilike("full_name", `%${search}%`)
      .limit(10);
    setUsers((data || []).map(u => ({ id: u.id!, full_name: u.full_name, avatar_url: u.avatar_url })));
    setIsSearching(false);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Start a Conversation</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name..."
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
          />
          <Button onClick={searchUsers} disabled={isSearching}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              onClick={() => onStart(u.id)}
            >
              <Avatar>
                <AvatarImage src={u.avatar_url || ""} />
                <AvatarFallback>{u.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{u.full_name || "Unknown User"}</span>
            </button>
          ))}
        </div>
      </div>
    </DialogContent>
  );
}

export default function Messages() {
  const { conversations, isLoading, startConversation } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newConvoDialogOpen, setNewConvoDialogOpen] = useState(false);

  const handleStartConversation = async (userId: string) => {
    const conversationId = await startConversation.mutateAsync(userId);
    setSelectedConversation(conversationId);
    setNewConvoDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">Direct communication with users and companies</p>
          </div>
          <Dialog open={newConvoDialogOpen} onOpenChange={setNewConvoDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </DialogTrigger>
            <NewConversationDialog onStart={handleStartConversation} />
          </Dialog>
        </div>

        <div className="grid md:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-16rem)]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[calc(100vh-22rem)]">
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-4">Loading...</p>
                ) : conversations?.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">Start a new conversation!</p>
                  </div>
                ) : (
                  <ConversationList
                    conversations={conversations || []}
                    selectedId={selectedConversation}
                    onSelect={setSelectedConversation}
                  />
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            {selectedConversation ? (
              <MessageThread 
                conversationId={selectedConversation} 
                otherUser={conversations?.find(c => c.id === selectedConversation)?.other_user}
                otherUserId={conversations?.find(c => c.id === selectedConversation)?.other_user?.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-muted-foreground">Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
