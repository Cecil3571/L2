import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Upload, Terminal, Activity, ShieldAlert, ChevronRight, Maximize2, Zap, FileText, Play, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      content: "L2 COACH ONLINE. SYSTEM READY.\nUpload your L2/NBBO screenshot for immediate read.\nDefault Mode: TL;DR (Speed). Toggle 'Full Review' for deep analysis.",
      type: "text",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isFullReview, setIsFullReview] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
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

  // Simulate uploading a specific market scenario
  const handleSimulateScenario = (scenario: Scenario) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Analyzing setup: ${scenario.title}...`,
      type: "image",
      imageUrl: l2Placeholder, // Ideally this would be different per scenario
      timestamp: new Date(),
      scenarioId: scenario.id
    };
    
    setMessages((prev) => [...prev, userMsg]);
    processCoachResponse(userMsg, scenario);
  };

  const handleFileUpload = () => {
    // Default to the first scenario if just clicking upload
    handleSimulateScenario(SCENARIOS[0]);
  };

  const processCoachResponse = async (userMsg: Message, scenario?: Scenario) => {
    setIsTyping(true);
    
    // Simulate processing delay for realism
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
    // Text response logic
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono overflow-hidden selection:bg-primary/30">
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
        
        <div className="flex items-center gap-4">
          {/* Scenario Selector for Demo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex gap-2 h-8 text-xs border-dashed border-muted-foreground/40">
                <Play className="w-3 h-3" /> SIMULATE SETUP
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
          
          <Button variant="ghost" size="icon" className="hover:bg-secondary/50 rounded-sm w-8 h-8">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Chat Area */}
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

                {/* Content Bubble */}
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
                            
                            {/* Scanline effect overlay */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] pointer-events-none opacity-50"></div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                               <Button size="sm" variant="secondary" className="h-7 text-[10px] font-bold tracking-wider border border-white/10">
                                 <Maximize2 className="w-3 h-3 mr-1.5" /> ZOOM
                               </Button>
                            </div>
                         </div>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap leading-relaxed text-sm font-mono">
                      {msg.content.split('\n').map((line, i) => {
                        // Styling specific lines based on keywords for that "Terminal" feel
                        const key = `${msg.id}-line-${i}`;
                        
                        if (line.startsWith('>')) {
                            return <span key={key} className="block text-primary font-bold mb-3 tracking-wide border-b border-primary/20 pb-1">{line}</span>;
                        }
                        
                        if (line.includes("ACTION:")) {
                            const isLong = line.includes("LONG");
                            const isShort = line.includes("SHORT");
                            const colorClass = isLong ? "text-bullish bg-bullish/10 border-bullish" : isShort ? "text-bearish bg-bearish/10 border-bearish" : "text-muted-foreground bg-secondary border-secondary";
                            
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
                             const isSellers = line.includes("SELLERS");
                             return <span key={key} className={`block font-bold ${isBuyers ? 'text-bullish' : isSellers ? 'text-bearish' : 'text-foreground'}`}>{line}</span>;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0 rounded-sm h-12 w-12 border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
                    title="Simulate L2 Screenshot Upload"
                >
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-card border-border">
              <DropdownMenuLabel className="text-xs text-muted-foreground">SIMULATE UPLOAD</DropdownMenuLabel>
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
              <span className="flex items-center gap-1.5 hover:text-foreground transition-colors">NY SE: CONNECTED</span>
          </div>
          <div className="flex gap-2 opacity-50">
              <span>V 1.0.2</span>
              <span>|</span>
              <span>PROD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
