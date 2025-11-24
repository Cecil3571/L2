import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Upload, Terminal, Activity, Settings, Plus, Trash2, Save, RotateCcw, Zap, FileText, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SCENARIOS, Scenario } from "@/lib/mock-scenarios";

// Mock L2 image for demo
import l2Placeholder from "@assets/generated_images/level_2_market_data_simulation.png"; 

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  type: "text" | "image" | "analysis";
  imageUrl?: string;
  timestamp: Date;
  mode?: "tldr" | "full";
  scenarioId?: string;
}

interface Session {
  id: string;
  title: string;
  createdAt: Date;
  messages: Message[];
}

const STORAGE_KEY = "l2_coach_sessions";
const CURRENT_SESSION_KEY = "l2_coach_current_session";

export default function Dashboard() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      content: "L2 COACH ONLINE. SYSTEM READY.\nUpload your L2/NBBO screenshot or select a scenario.\nDefault Mode: TL;DR (Speed). Toggle 'Full Review' for deep analysis.",
      type: "text",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isFullReview, setIsFullReview] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedSessions = JSON.parse(saved).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(parsedSessions);
        
        const currentId = localStorage.getItem(CURRENT_SESSION_KEY);
        if (currentId && parsedSessions.find((s: Session) => s.id === currentId)) {
          setCurrentSessionId(currentId);
          const session = parsedSessions.find((s: Session) => s.id === currentId);
          setMessages(session.messages);
        } else if (parsedSessions.length > 0) {
          setCurrentSessionId(parsedSessions[0].id);
          setMessages(parsedSessions[0].messages);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // Save current session
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const updatedSessions = sessions.map(s => 
        s.id === currentSessionId ? { ...s, messages } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const createNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: `Session ${new Date().toLocaleTimeString()}`,
      createdAt: new Date(),
      messages: [
        {
          id: "welcome",
          role: "coach",
          content: "L2 COACH ONLINE. SYSTEM READY.\nUpload your L2/NBBO screenshot or select a scenario.",
          type: "text",
          timestamp: new Date(),
        },
      ],
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setUploadedImage(null);
  };

  const switchSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setUploadedImage(null);
    }
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        switchSession(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      type: "text",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    processCoachResponse(userMsg);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setUploadedImage(imageData);
        
        const userMsg: Message = {
          id: Date.now().toString(),
          role: "user",
          content: `Analyzing screenshot: ${file.name}...`,
          type: "image",
          imageUrl: imageData,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, userMsg]);
        processCoachResponse(userMsg);
        toast({
          title: "Screenshot uploaded",
          description: `Processing ${file.name}...`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateScenario = (scenario: Scenario) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Analyzing setup: ${scenario.title}...`,
      type: "image",
      imageUrl: l2Placeholder,
      timestamp: new Date(),
      scenarioId: scenario.id
    };
    
    setMessages((prev) => [...prev, userMsg]);
    processCoachResponse(userMsg, scenario);
  };

  const processCoachResponse = (userMsg: Message, scenario?: Scenario) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let responseContent = "";
      
      if (scenario) {
        responseContent = isFullReview ? scenario.fullResponse : scenario.tldrResponse;
      } else {
        responseContent = generateGenericResponse(userMsg, isFullReview);
      }
      
      const coachMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: responseContent,
        type: "analysis",
        timestamp: new Date(),
        mode: isFullReview ? "full" : "tldr",
      };
      
      setMessages((prev) => [...prev, coachMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const generateGenericResponse = (msg: Message, fullMode: boolean): string => {
    const lowerContent = msg.content.toLowerCase();
    
    if (lowerContent.includes("buyer") || lowerContent.includes("long")) {
       return `> COACH READ
Buyers are weak here. Don't chase.
I see heavy offers stacking at the half-dollar. 
Wait for the reclaim of the level before lifting.`;
    }
    
    if (lowerContent.includes("seller") || lowerContent.includes("short")) {
       return `> COACH READ
Sellers are aggressive on the tape.
Bids are stepping down.
Look for the flush below the round number.`;
    }

    if (lowerContent.includes("wait") || lowerContent.includes("patience")) {
       return `> COACH READ
Good discipline.
The tape is choppy right now. 
Preserve your capital for the A+ setup.`;
    }
    
    return `> COACH READ
Understood. Keep your eyes on the T&S. 
Speed is increasing.
Watch for the stuff move at the high of day.`;
  };

  const downloadTranscript = () => {
    const transcript = messages.map(m => 
      `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join("\n\n");
    
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `l2_coach_${new Date().toISOString()}.txt`;
    a.click();
    toast({
      title: "Downloaded",
      description: "Transcript saved to file",
    });
  };

  const copyLastMessage = () => {
    const lastCoachMsg = [...messages].reverse().find(m => m.role === "coach");
    if (lastCoachMsg) {
      navigator.clipboard.writeText(lastCoachMsg.content);
      toast({
        title: "Copied",
        description: "Coach response copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-mono overflow-hidden selection:bg-primary/30">
      {/* Sidebar - Sessions */}
      <div className="w-64 bg-card border-r border-border flex flex-col shrink-0 hidden sm:flex shadow-lg">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider">Sessions</h2>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary rounded-sm"
            onClick={createNewSession}
            title="New session"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`w-full text-left text-xs p-3 rounded-sm border transition-all group ${
                  currentSessionId === session.id
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="font-bold truncate">{session.title}</div>
                <div className="text-[10px] mt-1 opacity-70">{session.messages.length} messages</div>
                <div className="text-[10px] mt-1 opacity-50">{session.createdAt.toLocaleDateString()}</div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-full h-5 mt-2 text-[10px] text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card p-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm shadow-[0_0_10px_rgba(var(--primary),0.2)]">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                L2 COACH <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20">LIVE</span>
              </h1>
              <p className="text-xs text-muted-foreground">Real-time Order Flow Mentor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 h-8 text-xs border-dashed border-muted-foreground/40">
                  <FileText className="w-3 h-3" /> SCENARIOS
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuLabel className="text-xs text-muted-foreground">SELECT MARKET CONDITION</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {SCENARIOS.map((scenario) => (
                  <DropdownMenuItem 
                    key={scenario.id} 
                    onClick={() => handleSimulateScenario(scenario)}
                    className="text-xs cursor-pointer focus:bg-primary/10 focus:text-primary"
                  >
                    {scenario.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-sm border border-border">
              <Label htmlFor="mode-toggle" className={`text-[10px] uppercase font-bold cursor-pointer transition-colors ${!isFullReview ? 'text-primary' : 'text-muted-foreground'}`}>TL;DR</Label>
              <Switch 
                id="mode-toggle" 
                checked={isFullReview}
                onCheckedChange={setIsFullReview}
                className="h-4 w-8 data-[state=checked]:bg-primary"
              />
              <Label htmlFor="mode-toggle" className={`text-[10px] uppercase font-bold cursor-pointer transition-colors ${isFullReview ? 'text-primary' : 'text-muted-foreground'}`}>Full Review</Label>
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
                  <Download className="w-3 h-3 mr-2" /> Download Transcript
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLastMessage} className="text-xs cursor-pointer">
                  <Copy className="w-3 h-3 mr-2" /> Copy Last Read
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={createNewSession} className="text-xs cursor-pointer">
                  <Plus className="w-3 h-3 mr-2" /> New Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 sm:p-6 bg-[url('/grid-pattern.svg')] bg-repeat opacity-100">
          <div className="max-w-3xl mx-auto space-y-6 pb-10">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[90%] sm:max-w-[80%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 shrink-0 rounded-sm flex items-center justify-center border shadow-sm ${
                    msg.role === "user" 
                      ? "bg-secondary border-secondary-foreground/20" 
                      : "bg-black border-primary/40 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]"
                  }`}>
                    {msg.role === "user" ? (
                      <span className="text-[10px] font-bold">YOU</span>
                    ) : (
                      <Terminal className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                         {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </span>
                       {msg.role === "coach" && (
                         <span className={`text-[10px] px-1.5 py-px rounded-sm border font-bold tracking-wider ${
                           msg.mode === "full" 
                             ? "border-purple-500/30 text-purple-400 bg-purple-500/10" 
                             : "border-primary/30 text-primary bg-primary/10"
                         }`}>
                           {msg.mode === "full" ? "DEEP DIVE" : "FLASH READ"}
                         </span>
                       )}
                    </div>
                    
                    <div className={`p-4 rounded-sm border backdrop-blur-md shadow-sm overflow-hidden ${
                      msg.role === "user" 
                        ? "bg-secondary/80 border-border text-foreground" 
                        : "bg-card/90 border-primary/20 text-foreground"
                    }`}>
                      {msg.type === "image" && (
                        <div className="mb-3 rounded-sm overflow-hidden border border-border/50">
                           <div className="aspect-video bg-black flex items-center justify-center relative group">
                              {msg.imageUrl ? (
                                 <img src={msg.imageUrl} alt="Market Data" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                              ) : (
                                 <div className="text-xs text-muted-foreground flex flex-col items-center gap-2">
                                    <FileText className="w-8 h-8" />
                                    <span>[L2 DATA SNAPSHOT]</span>
                                 </div>
                              )}
                              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] pointer-events-none opacity-50"></div>
                           </div>
                        </div>
                      )}
                      
                      <div className="whitespace-pre-wrap leading-relaxed text-sm font-mono">
                        {msg.content.split('\n').map((line, i) => {
                          const key = `${msg.id}-line-${i}`;
                          
                          if (line.startsWith('>')) {
                              return <span key={key} className="block text-primary font-bold mb-3 tracking-wide border-b border-primary/20 pb-1">{line}</span>;
                          }
                          
                          if (line.includes("ACTION:")) {
                              const isLong = line.includes("LONG");
                              const colorClass = isLong ? "text-bullish bg-bullish/10 border-bullish" : "text-bearish bg-bearish/10 border-bearish";
                              
                              return (
                                  <motion.div 
                                      key={key}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.2 }}
                                      className={`block font-bold p-3 border-l-4 my-3 ${colorClass}`}
                                  >
                                      {line}
                                  </motion.div>
                              );
                          }
                          
                          if (line.includes("STATUS:")) {
                               const isBuyers = line.includes("BUYERS");
                               return <span key={key} className={`block font-bold ${isBuyers ? 'text-bullish' : 'text-bearish'}`}>{line}</span>;
                          }

                          if (line.startsWith('-')) {
                              return <span key={key} className="block pl-4 border-l border-border/30 ml-1 my-1.5 text-muted-foreground/90 hover:text-foreground transition-colors">{line}</span>;
                          }
                          
                          if (line.includes("----------------")) {
                              return <Separator key={key} className="my-2 bg-border/50" />;
                          }
                          
                          return <div key={key} className="min-h-[1.2em]">{line}</div>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[75%]">
                   <div className="w-8 h-8 shrink-0 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-primary" />
                   </div>
                   <div className="flex items-center gap-1 h-8 px-2 bg-card/50 border border-border/50 rounded-sm">
                      <span className="text-[10px] text-primary mr-2 font-bold animate-pulse">ANALYZING TAPE</span>
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                   </div>
                </div>
              </motion.div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-card border-t border-border shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] relative z-20">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              size="icon" 
              className="shrink-0 rounded-sm h-12 w-12 border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
              onClick={() => fileInputRef.current?.click()}
              title="Upload L2 Screenshot"
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
            
            <div className="flex-1 relative group">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask L2 Coach about the tape..."
                className="h-12 bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary rounded-sm pl-4 pr-16 font-mono text-sm transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                 <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-1.5 rounded-sm">
                    CMD+K
                 </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-12 w-12 shrink-0 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Status Bar */}
          <div className="max-w-3xl mx-auto mt-3 flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/40 pt-2">
            <div className="flex gap-4">
                <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-help" title="Simulated Latency"><Zap className="w-3 h-3" /> 12ms</span>
                <span className="flex items-center gap-1.5 text-primary font-bold"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div> MARKET OPEN</span>
                <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">NYSE: CONNECTED</span>
            </div>
            <div className="flex gap-2 opacity-50">
                <span>V 1.1.0</span>
                <span>|</span>
                <span>PROD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
