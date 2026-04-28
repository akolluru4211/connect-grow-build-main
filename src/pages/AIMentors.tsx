import { useState, useRef, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAIMentor, MentorType } from "@/hooks/useAIMentor";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Send, Briefcase, Code, MessageSquare, FileText, GraduationCap,
  User, Loader2, Rocket, Laptop, Users, Clock, Crown, Menu
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const mentorConfig: Record<MentorType, { 
  name: string; 
  icon: typeof Bot; 
  color: string; 
  avatar: string;
  description: string;
  quickPrompts: string[];
}> = {
  career: {
    name: "Career Guide",
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
    avatar: "👔",
    description: "Career paths, job searching, and professional growth",
    quickPrompts: ["How do I negotiate a higher salary?", "How do I transition to tech?"]
  },
  technical: {
    name: "Tech Mentor",
    icon: Code,
    color: "from-purple-500 to-pink-500",
    avatar: "💻",
    description: "Technical guidance, coding help, and best practices",
    quickPrompts: ["What's the best way to learn React?", "Explain microservices"]
  },
  interview: {
    name: "Interview Coach",
    icon: MessageSquare,
    color: "from-green-500 to-emerald-500",
    avatar: "🎯",
    description: "Interview preparation and confidence building",
    quickPrompts: ["How do I answer 'Tell me about yourself'?", "Behavioral interview tips"]
  },
  resume: {
    name: "Resume Expert",
    icon: FileText,
    color: "from-orange-500 to-red-500",
    avatar: "📄",
    description: "Resume optimization and personal branding",
    quickPrompts: ["How do I make my resume ATS-friendly?", "What skills should I highlight?"]
  },
  learning: {
    name: "Learning Advisor",
    icon: GraduationCap,
    color: "from-indigo-500 to-violet-500",
    avatar: "📚",
    description: "Learning paths and skill development",
    quickPrompts: ["Create a 3-month learning plan", "Best resources for web development"]
  },
  startup: {
    name: "Startup Advisor",
    icon: Rocket,
    color: "from-amber-500 to-orange-500",
    avatar: "🚀",
    description: "Business models, fundraising, and startup growth",
    quickPrompts: ["How do I validate my startup idea?", "Tips for pitching to investors"]
  },
  freelance: {
    name: "Freelance Coach",
    icon: Laptop,
    color: "from-teal-500 to-cyan-500",
    avatar: "💼",
    description: "Freelancing, client acquisition, and pricing",
    quickPrompts: ["How do I find my first client?", "How should I price my services?"]
  },
  networking: {
    name: "Networking Pro",
    icon: Users,
    color: "from-rose-500 to-pink-500",
    avatar: "🤝",
    description: "Professional networking and relationship building",
    quickPrompts: ["How do I network on LinkedIn?", "Cold outreach templates"]
  },
  productivity: {
    name: "Productivity Guru",
    icon: Clock,
    color: "from-lime-500 to-green-500",
    avatar: "⚡",
    description: "Time management and focus optimization",
    quickPrompts: ["How do I stop procrastinating?", "Best productivity systems"]
  },
  leadership: {
    name: "Leadership Coach",
    icon: Crown,
    color: "from-yellow-500 to-amber-500",
    avatar: "👑",
    description: "Leadership skills and team management",
    quickPrompts: ["How do I become a better leader?", "Tips for managing a team"]
  },
};

const allMentorTypes = Object.keys(mentorConfig) as MentorType[];

export default function AIMentors() {
  const [selectedMentor, setSelectedMentor] = useState<MentorType>("career");
  const [conversations, setConversations] = useState<Record<MentorType, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    allMentorTypes.forEach(type => { initial[type] = []; });
    return initial as Record<MentorType, ChatMessage[]>;
  });
  const [inputMessage, setInputMessage] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mentorMutation = useAIMentor();
  const isMobile = useIsMobile();

  const currentConversation = conversations[selectedMentor];
  const mentor = mentorConfig[selectedMentor];

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation, scrollToBottom]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage.trim();
    if (!text || mentorMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setConversations(prev => ({
      ...prev,
      [selectedMentor]: [...prev[selectedMentor], userMessage],
    }));
    setInputMessage("");

    try {
      const history = conversations[selectedMentor].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await mentorMutation.mutateAsync({
        mentorType: selectedMentor,
        message: text,
        conversationHistory: history,
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.reply,
        timestamp: new Date(),
      };

      setConversations(prev => ({
        ...prev,
        [selectedMentor]: [...prev[selectedMentor], assistantMessage],
      }));
    } catch (error) {
      console.error("Failed to get mentor response:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMentorSelect = (type: MentorType) => {
    setSelectedMentor(type);
    setSheetOpen(false);
  };

  const MentorCard = ({ type, compact = false }: { type: MentorType; compact?: boolean }) => {
    const config = mentorConfig[type];
    const Icon = config.icon;
    const isSelected = selectedMentor === type;
    const hasMessages = conversations[type].length > 0;

    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card
          className={`cursor-pointer transition-all ${
            isSelected ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
          }`}
          onClick={() => handleMentorSelect(type)}
        >
          <CardContent className={compact ? "p-3" : "p-4"}>
            <div className="flex items-center gap-3">
              <div className={`${compact ? "p-1.5" : "p-2"} rounded-lg bg-gradient-to-br ${config.color} text-white`}>
                <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${compact ? "text-sm" : ""}`}>{config.name}</p>
                {!compact && (
                  <p className="text-xs text-muted-foreground truncate">
                    {config.description}
                  </p>
                )}
              </div>
              {hasMessages && (
                <div className="h-2 w-2 rounded-full bg-success shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const MentorList = ({ compact = false }: { compact?: boolean }) => (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      {allMentorTypes.map((type) => (
        <MentorCard key={type} type={type} compact={compact} />
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className="container py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6 lg:mb-8">
          <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">AI Mentors</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              Get personalized guidance from AI mentors
            </p>
          </div>
          {/* Mobile mentor selector */}
          {isMobile && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Choose Mentor</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
                  <MentorList compact />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="grid gap-4 lg:gap-6 lg:grid-cols-4">
          {/* Desktop Mentor Selection - hidden on mobile */}
          <div className="hidden lg:block space-y-4">
            <h2 className="font-semibold text-lg">Choose Your Mentor</h2>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="pr-4">
                <MentorList />
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)] lg:h-[calc(100vh-200px)] min-h-[400px]">
            <CardHeader className="border-b py-3 sm:py-4 px-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${mentor.color} text-white text-xl sm:text-2xl`}>
                  {mentor.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">{mentor.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm truncate">{mentor.description}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
              <div className="space-y-4">
                {currentConversation.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[250px] sm:min-h-[300px] text-center px-2">
                    <div className={`p-3 sm:p-4 rounded-full bg-gradient-to-br ${mentor.color} text-white text-3xl sm:text-4xl mb-4`}>
                      {mentor.avatar}
                    </div>
                    <h3 className="text-base sm:text-lg font-medium mb-2">
                      Hi! I'm your {mentor.name}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-4 sm:mb-6">
                      {mentor.description}. Ask me anything!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {mentor.quickPrompts.map((prompt, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm h-auto py-2 px-3 whitespace-normal text-left"
                          onClick={() => sendMessage(prompt)}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {currentConversation.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex gap-2 sm:gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                            <AvatarFallback className={`bg-gradient-to-br ${mentor.color} text-white text-sm`}>
                              {mentor.avatar}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                            <AvatarFallback className="bg-secondary">
                              <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {mentorMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2 sm:gap-3 justify-start"
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarFallback className={`bg-gradient-to-br ${mentor.color} text-white text-sm`}>
                        {mentor.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 sm:p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={`Ask ${mentor.name} anything...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={mentorMutation.isPending}
                  className="flex-1 text-sm sm:text-base"
                />
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={!inputMessage.trim() || mentorMutation.isPending}
                  className={`bg-gradient-to-r ${mentor.color} hover:opacity-90 shrink-0`}
                  size={isMobile ? "icon" : "default"}
                >
                  <Send className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Send</span>}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
