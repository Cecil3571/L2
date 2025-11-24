import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Upload, Terminal, Activity, ShieldAlert, ChevronRight, Maximize2, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
}

const COACH_SYSTEM_PROMPT = `
You are L2 Coach, my dedicated real-time tape-reading mentor for scalping based on Level 2, NBBO, and Time & Sales.
DEFAULT MODE (TL;DR):
- Who is in control
- Momentum status
- Key inflection level
- Next 10-30s prediction
- Actionable takeaway
`;

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

  const handleFileUpload = () => {
    // Simulation of file upload
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Analyzing this setup...",
      type: "image",
      imageUrl: l2Placeholder, 
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    processCoachResponse(userMsg);
  };

  const processCoachResponse = async (userMsg: Message) => {
    setIsTyping(true);
    
    // Simulate processing delay for realism
    setTimeout(() => {
      const responseContent = generateMockResponse(userMsg, isFullReview);
      
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
    }, 1500);
  };

  const generateMockResponse = (msg: Message, fullMode: boolean): string => {
    if (msg.type === "image") {
      if (!fullMode) {
        return `> TL;DR ANALYSIS
STATUS: SELLERS IN CONTROL
MOMENTUM: Stalling at VWAP
INFLECTION: 42.50 (Big Offer Stack)
NEXT 30s: Flush to 42.35 likely
ACTION: SHORT BIAS - Wait for 42.48 break`;
      } else {
        return `> FULL TAPE REVIEW
----------------------------------------
1. STRUCTURE
- Heavy aggressive selling on ARCA/EDGX
- Bid stepping down 5c increments
- 42.50 Wall: 50k shares displayed (Iceberg likely)

2. ORDER FLOW
- T&S shows red prints hitting bid repeatedly
- Absorption seen at 42.40 but weakening
- No refreshing on the bid side

3. SCENARIO
- Bearish continuation pattern
- Buyers are trapped above 42.60
- If 42.40 breaks, vacuum down to 42.20

> ACTIONABLE SETUP
Short the pop to 42.45, Stop 42.55. Target 42.20 flush.`;
      }
    }
    
    // Text response
    if (msg.content.toLowerCase().includes("buyer") || msg.content.toLowerCase().includes("long")) {
       return `> COACH READ
Buyers are weak here. Don't chase.
I see heavy offers stacking at the half-dollar. 
Wait for the reclaim of the level before lifting.`;
    }
    
    return `> COACH READ
Understood. Keep your eyes on the T&S. 
Speed is increasing on the offer side.
Watch for the stuff move at the high of day.`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card p-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              L2 COACH <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">LIVE</span>
            </h1>
            <p className="text-xs text-muted-foreground">Real-time Order Flow Mentor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-sm border border-border">
            <Label htmlFor="mode-toggle" className={`text-xs cursor-pointer ${!isFullReview ? 'text-primary font-bold' : 'text-muted-foreground'}`}>TL;DR</Label>
            <Switch 
              id="mode-toggle" 
              checked={isFullReview}
              onCheckedChange={setIsFullReview}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="mode-toggle" className={`text-xs cursor-pointer ${isFullReview ? 'text-primary font-bold' : 'text-muted-foreground'}`}>FULL REVIEW</Label>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-secondary/50 rounded-sm">
            <ShieldAlert className="w-5 h-5 text-muted-foreground" />
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
              <div className={`max-w-[85%] sm:max-w-[75%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 shrink-0 rounded-sm flex items-center justify-center border ${
                  msg.role === "user" 
                    ? "bg-secondary border-secondary-foreground/20" 
                    : "bg-primary/10 border-primary/30"
                }`}>
                  {msg.role === "user" ? (
                    <span className="text-xs font-bold">YOU</span>
                  ) : (
                    <Terminal className="w-4 h-4 text-primary" />
                  )}
                </div>

                {/* Content Bubble */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                       {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                     </span>
                     {msg.role === "coach" && (
                       <span className={`text-[10px] px-1.5 rounded-sm border ${
                         msg.mode === "full" 
                           ? "border-purple-500/30 text-purple-400 bg-purple-500/10" 
                           : "border-primary/30 text-primary bg-primary/10"
                       }`}>
                         {msg.mode === "full" ? "DEEP DIVE" : "FLASH READ"}
                       </span>
                     )}
                  </div>
                  
                  <div className={`p-4 rounded-sm border backdrop-blur-sm shadow-sm ${
                    msg.role === "user" 
                      ? "bg-secondary/50 border-border text-foreground" 
                      : "bg-card/80 border-primary/20 text-foreground"
                  }`}>
                    {msg.type === "image" && (
                      <div className="mb-3 rounded-sm overflow-hidden border border-border">
                         <div className="aspect-video bg-black flex items-center justify-center relative group">
                            {msg.imageUrl ? (
                               <img src={msg.imageUrl} alt="Market Data" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            ) : (
                               <div className="text-xs text-muted-foreground flex flex-col items-center gap-2">
                                  <FileText className="w-8 h-8" />
                                  <span>[L2 DATA SNAPSHOT]</span>
                               </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
                               <Button size="sm" variant="secondary" className="h-6 text-[10px]">
                                 <Maximize2 className="w-3 h-3 mr-1" /> ZOOM
                               </Button>
                            </div>
                         </div>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {msg.content.split('\n').map((line, i) => {
                        // Styling specific lines based on keywords
                        if (line.startsWith('>')) return <span key={i} className="block text-primary font-bold mb-2">{line}</span>;
                        if (line.includes("ACTION:")) return <span key={i} className="block font-bold text-bullish bg-bullish/10 p-2 border-l-2 border-bullish my-2">{line}</span>;
                        if (line.includes("SHORT BIAS")) return <span key={i} className="block font-bold text-bearish bg-bearish/10 p-2 border-l-2 border-bearish my-2">{line}</span>;
                        if (line.startsWith('-')) return <span key={i} className="block pl-4 border-l border-border/50 ml-1 my-1 text-muted-foreground">{line}</span>;
                        return <div key={i}>{line}</div>;
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
                 <div className="flex items-center gap-1 h-8 px-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                 </div>
              </div>
            </motion.div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <Button 
            variant="outline" 
            size="icon" 
            className="shrink-0 rounded-sm h-12 w-12 border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={handleFileUpload}
            title="Simulate L2 Screenshot Upload"
          >
            <Upload className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask L2 Coach about the tape..."
              className="h-12 bg-background border-border focus-visible:ring-primary rounded-sm pl-4 pr-12 font-mono text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">CMD+K</span>
            </div>
          </div>
          
          <Button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-12 w-12 shrink-0 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <div className="max-w-3xl mx-auto mt-2 flex justify-center gap-6 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> LATENCY: 12ms</span>
          <span className="flex items-center gap-1 text-primary"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div> MARKET: OPEN</span>
          <span className="flex items-center gap-1">NBBO: CONNECTED</span>
        </div>
      </div>
    </div>
  );
}
