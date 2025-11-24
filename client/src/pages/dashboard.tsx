import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Upload, Terminal, Activity, Settings, Plus, Trash2, Zap, FileText, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SCENARIOS, Scenario } from "@/lib/mock-scenarios";
import l2Placeholder from "@assets/generated_images/level_2_market_data_simulation.png"; 

interface Message {
  id: string;
  sessionId: string;
  role: "user" | "coach";
  content: string;
  type: "text" | "image" | "analysis";
  imageUrl?: string;
  imageData?: string;
  timestamp: string;
  mode?: "tldr" | "full";
  scenarioId?: string;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isFullReview, setIsFullReview] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  // Fetch current session messages
  const { data: sessionMessages = [] } = useQuery({
    queryKey: ["messages", currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return [];
      const res = await fetch(`/api/sessions/${currentSessionId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!currentSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setCurrentSessionId(newSession.id);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      if (sessions.length > 0) {
        setCurrentSessionId(sessions[0].id);
      }
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: async (msg: Omit<Message, "id">) => {
      const res = await fetch(`/api/sessions/${currentSessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: msg.role,
          content: msg.content,
          type: msg.type,
          imageUrl: msg.imageUrl,
          imageData: msg.imageData,
          mode: msg.mode,
          scenarioId: msg.scenarioId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", currentSessionId] });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    },
  });

  // Sync local messages with server state
  useEffect(() => {
    setMessages(sessionMessages);
  }, [sessionMessages]);

  // Initialize first session on load
  useEffect(() => {
    if (sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const createNewSession = () => {
    const title = `Session ${new Date().toLocaleTimeString()}`;
    createSessionMutation.mutate(title);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSessionId) return;

    const userMsg = {
      sessionId: currentSessionId,
      role: "user" as const,
      content: input,
      type: "text" as const,
      timestamp: new Date().toISOString(),
    };

    await createMessageMutation.mutateAsync(userMsg);
    setInput("");
    processCoachResponse(userMsg);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file || !currentSessionId) return;

    try {
      const uploadResult = await uploadFileMutation.mutateAsync(file);
      
      const userMsg = {
        sessionId: currentSessionId,
        role: "user" as const,
        content: `Analyzing screenshot: ${file.name}...`,
        type: "image" as const,
        imageUrl: uploadResult.url,
        imageData: uploadResult.url,
        timestamp: new Date().toISOString(),
      };

      await createMessageMutation.mutateAsync(userMsg);
      processCoachResponse(userMsg);
      toast({ title: "Screenshot uploaded", description: `Processing ${file.name}...` });
    } catch (error) {
      toast({ title: "Upload failed", description: "Could not upload file", variant: "destructive" });
    }
  };

  const handleSimulateScenario = async (scenario: Scenario) => {
    if (!currentSessionId) return;

    const userMsg = {
      sessionId: currentSessionId,
      role: "user" as const,
      content: `Analyzing setup: ${scenario.title}...`,
      type: "image" as const,
      imageUrl: l2Placeholder,
      scenarioId: scenario.id,
      timestamp: new Date().toISOString(),
    };

    await createMessageMutation.mutateAsync(userMsg);
    processCoachResponse(userMsg, scenario);
  };

  const processCoachResponse = async (userMsg: any, scenario?: Scenario) => {
    setIsTyping(true);

    setTimeout(async () => {
      const responseContent = scenario 
        ? (isFullReview ? scenario.fullResponse : scenario.tldrResponse)
        : generateGenericResponse(userMsg.content, isFullReview);

      const coachMsg = {
        sessionId: currentSessionId,
        role: "coach" as const,
        content: responseContent,
        type: "analysis" as const,
        mode: (isFullReview ? "full" : "tldr") as const,
        timestamp: new Date().toISOString(),
      };

      await createMessageMutation.mutateAsync(coachMsg);
      setIsTyping(false);
    }, 1200);
  };

  const generateGenericResponse = (content: string, fullMode: boolean): string => {
    const lower = content.toLowerCase();
    if (lower.includes("buyer") || lower.includes("long")) {
      return `> COACH READ\nBuyers are weak here. Don't chase.\nI see heavy offers stacking at the half-dollar.\nWait for the reclaim of the level before lifting.`;
    }
    if (lower.includes("seller") || lower.includes("short")) {
      return `> COACH READ\nSellers are aggressive on the tape.\nBids are stepping down.\nLook for the flush below the round number.`;
    }
    return `> COACH READ\nUnderstood. Keep your eyes on the T&S.\nSpeed is increasing.\nWatch for the stuff move at the high of day.`;
  };

  const downloadTranscript = () => {
    const transcript = messages.map(m => 
      `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join("\n\n");
    
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `l2_coach_${new Date().toISOString()}.txt`;
    a.click();
    toast({ title: "Downloaded", description: "Transcript saved" });
  };

  const copyLastMessage = () => {
    const lastCoachMsg = [...messages].reverse().find(m => m.role === "coach");
    if (lastCoachMsg) {
      navigator.clipboard.writeText(lastCoachMsg.content);
      toast({ title: "Copied", description: "Coach response copied" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col shrink-0 hidden sm:flex shadow-lg">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">Sessions</h2>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary rounded-sm"
            onClick={createNewSession}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {sessions.map((session: Session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`w-full text-left text-xs p-3 rounded-sm border transition-all group ${
                  currentSessionId === session.id
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border hover:border-border/80"
                }`}
              >
                <div className="font-bold truncate">{session.title}</div>
                <div className="text-[10px] opacity-70 mt-1">{new Date(session.createdAt).toLocaleDateString()}</div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-full h-5 mt-2 text-[10px] text-destructive opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSessionMutation.mutate(session.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm shadow-[0_0_10px_rgba(var(--primary),0.2)]">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">L2 COACH <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">LIVE</span></h1>
              <p className="text-xs text-muted-foreground">Real-time Order Flow Mentor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 h-8 text-xs border-dashed">
                  <FileText className="w-3 h-3" /> SCENARIOS
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuLabel className="text-xs text-muted-foreground">MARKET CONDITIONS</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {SCENARIOS.map((scenario) => (
                  <DropdownMenuItem 
                    key={scenario.id} 
                    onClick={() => handleSimulateScenario(scenario)}
                    className="text-xs cursor-pointer"
                  >
                    {scenario.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-sm border border-border">
              <Label htmlFor="mode-toggle" className={`text-[10px] uppercase font-bold cursor-pointer ${!isFullReview ? 'text-primary' : 'text-muted-foreground'}`}>TL;DR</Label>
              <Switch 
                id="mode-toggle" 
                checked={isFullReview}
                onCheckedChange={setIsFullReview}
                className="h-4 w-8"
              />
              <Label htmlFor="mode-toggle" className={`text-[10px] uppercase font-bold cursor-pointer ${isFullReview ? 'text-primary' : 'text-muted-foreground'}`}>Full</Label>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-secondary/50 rounded-sm w-8 h-8">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuLabel className="text-xs">Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={downloadTranscript} className="text-xs cursor-pointer">
                  <Download className="w-3 h-3 mr-2" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLastMessage} className="text-xs cursor-pointer">
                  <Copy className="w-3 h-3 mr-2" /> Copy Read
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Chat */}
        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[90%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 shrink-0 rounded-sm flex items-center justify-center border ${msg.role === "user" ? "bg-secondary border-secondary-foreground/20" : "bg-black border-primary/40"}`}>
                    {msg.role === "user" ? <span className="text-[10px] font-bold">YOU</span> : <Terminal className="w-4 h-4 text-primary" />}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-[10px] text-muted-foreground uppercase">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       {msg.mode && <span className="text-[10px] px-1.5 py-px rounded-sm border border-primary/30 text-primary bg-primary/10">{msg.mode === "full" ? "DEEP" : "FLASH"}</span>}
                    </div>
                    
                    <div className={`p-4 rounded-sm border backdrop-blur-md ${msg.role === "user" ? "bg-secondary/80 border-border" : "bg-card/90 border-primary/20"}`}>
                      {msg.type === "image" && msg.imageUrl && (
                        <div className="mb-3 rounded-sm overflow-hidden border border-border/50">
                          <img src={msg.imageUrl} alt="Data" className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed text-sm font-mono text-foreground">
                        {msg.content.split('\n').map((line, i) => (
                          <div key={i} className={line.startsWith('>') ? 'text-primary font-bold mb-2' : line.includes('ACTION:') ? 'font-bold p-2 border-l-4 border-bullish bg-bullish/10 my-2 text-bullish' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex gap-3">
                   <div className="w-8 h-8 shrink-0 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-primary" />
                   </div>
                   <div className="flex items-center gap-1 h-8 px-2 bg-card/50 border border-border/50 rounded-sm">
                      <span className="text-[10px] text-primary font-bold animate-pulse">ANALYZING</span>
                   </div>
                </div>
              </motion.div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 bg-card border-t border-border shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0 rounded-sm h-12 w-12 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask L2 Coach..."
                className="h-12 bg-background/50 border-border rounded-sm"
              />
            </div>
            
            <Button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-12 w-12 shrink-0 rounded-sm bg-primary text-primary-foreground"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="max-w-3xl mx-auto mt-3 flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/40 pt-2">
            <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> LIVE</span>
                <span className="flex items-center gap-1.5 text-primary"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div> CONNECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
