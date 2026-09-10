"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  TrendingUp,
  Smile,
  AlertCircle
} from "lucide-react";
import api, { API_URL } from "@/lib/api";

interface CallSimulatorProps {
  callId: number;
  customerName: string;
  mobile: string;
  preferredLanguage: string;
  onClose: () => void;
  onCallCompleted?: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function CallSimulator({
  callId,
  customerName,
  mobile,
  preferredLanguage,
  onClose,
  onCallCompleted
}: CallSimulatorProps) {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sentiment, setSentiment] = useState("Neutral");
  const [scoreEstimate, setScoreEstimate] = useState(10);
  const [isMuted, setIsMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isRealCall, setIsRealCall] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition (Browser Web Speech API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        
        // Map preferred language to speech recognition locale
        const langMap: Record<string, string> = {
          English: "en-US",
          Hindi: "hi-IN",
          Telugu: "te-IN",
          Tamil: "ta-IN",
          Kannada: "kn-IN",
          Malayalam: "ml-IN",
          Bengali: "bn-IN",
          Marathi: "mr-IN",
          Gujarati: "gu-IN",
          Punjabi: "pa-IN",
          Urdu: "ur-IN",
          Odia: "or-IN",
          Assamese: "as-IN",
          Spanish: "es-ES",
          French: "fr-FR",
          German: "de-DE",
          Arabic: "ar-SA",
          Japanese: "ja-JP"
        };
        rec.lang = langMap[preferredLanguage] || "en-US";

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setInputText(resultText);
          setIsListening(false);
          // Auto send spoken message
          sendCustomerMessage(resultText);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [preferredLanguage]);

  // Autoscroll conversation chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if it is a real call or simulated call on mount
  useEffect(() => {
    const checkCallType = async () => {
      try {
        const response = await api.get(`/api/calls/${callId}`);
        const callData = response.data;
        const isReal = !!(callData.sid && !callData.sid.startsWith("sim-"));
        setIsRealCall(isReal);
        
        if (isReal) {
          if (callData.status === "Answered" || callData.status === "Completed") {
            setCallState("ended");
            if (callData.ai_summary) {
              setAnalysisResult(callData.ai_summary);
            }
          } else {
            // Set call status
            if (callData.status === "Ringing") {
              setCallState("ringing");
            } else if (callData.status === "In-Progress") {
              setCallState("connected");
            } else {
              setCallState("ringing");
            }
            
            // Connect to transcript websocket
            const wsBase = API_URL.replace(/^http/, "ws");
            const wsUrl = `${wsBase}/api/ws/transcript/${callId}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              if (data.type === "live_transcript") {
                setMessages(data.history);
                setCallState("connected");
              } else if (data.type === "call_ended") {
                setCallState("ended");
                setAnalysisResult(data.analysis);
                ws.close();
                if (onCallCompleted) {
                  onCallCompleted();
                }
              }
            };
            
            ws.onclose = () => {
              // Fetch final status
              api.get(`/api/calls/${callId}`).then(res => {
                if (res.data.status === "Answered" || res.data.status === "Completed") {
                  setCallState("ended");
                  if (res.data.ai_summary) {
                    setAnalysisResult(res.data.ai_summary);
                  }
                }
              }).catch(err => console.error(err));
            };
          }
        }
      } catch (err) {
        console.error("Failed to fetch call type details", err);
      }
    };
    checkCallType();
  }, [callId]);

  // Clean up WebSockets on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined") return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    // Clean text from emojis/special chars for smoother TTS
    const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const langMap: Record<string, string> = {
      English: "en",
      Hindi: "hi",
      Telugu: "te",
      Tamil: "ta",
      Kannada: "kn",
      Malayalam: "ml",
      Bengali: "bn",
      Marathi: "mr",
      Gujarati: "gu",
      Punjabi: "pa"
    };
    const targetLang = langMap[preferredLanguage] || "en";
    
    // Robust voice matching: checks prefix, locale suffix, or name includes (e.g. te-IN, hi-IN)
    const matchedVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(targetLang.toLowerCase()) || 
      v.lang.toLowerCase().includes("-" + targetLang.toLowerCase()) ||
      v.lang.toLowerCase().includes(targetLang.toLowerCase())
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      console.log(`[TTS] Selected voice: ${matchedVoice.name} (${matchedVoice.lang})`);
    } else {
      console.warn(`[TTS] Voice for ${preferredLanguage} (${targetLang}) not found. Falling back to default.`);
    }
    
    utterance.rate = 0.95; // Slightly slower for better clarity in qualifying
    window.speechSynthesis.speak(utterance);
  };

  const startCall = () => {
    setCallState("ringing");
    setMessages([]);
    setAnalysisResult(null);

    // Unlock Speech Synthesis for browser (safari/chrome policy)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const unlockUtterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlockUtterance);
    }

    // Setup WebSockets URL (convert http to ws)
    const wsBase = API_URL.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/api/ws/call/${callId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Small timeout to simulate connecting ringing phase
      setTimeout(() => {
        setCallState("connected");
      }, 2000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "agent_speech") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
        setSentiment(data.sentiment || "Neutral");
        setScoreEstimate(data.score_estimate || 50);
        speakText(data.text);
      } else if (data.type === "call_ended") {
        setCallState("ended");
        setAnalysisResult(data.analysis);
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (onCallCompleted) {
          onCallCompleted();
        }
      } else if (data.type === "error") {
        alert(data.message);
        endCall();
      }
    };

    ws.onerror = (err) => {
      console.error(err);
      endCall();
    };

    ws.onclose = () => {
      setCallState("ended");
    };
  };

  const endCall = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "hang_up" }));
    } else {
      setCallState("ended");
    }
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  };

  const sendCustomerMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || text.trim() === "") return;

    // Append customer message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "customer_speech",
        text: text
      }));
    }

    if (!textToSend) {
      setInputText("");
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-full">
        
        {/* Header bar */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              callState === "connected" ? "bg-emerald-500 animate-pulse" : (callState === "ringing" ? "bg-amber-500 animate-bounce" : "bg-slate-500")
            }`}></div>
            <div>
              <h3 className="font-bold text-slate-100">{customerName}</h3>
              <p className="text-xs text-slate-400">
                {mobile} • Preferred: {preferredLanguage} • <span className={isRealCall ? "text-emerald-400 font-bold" : "text-purple-400 font-semibold"}>{isRealCall ? "Real Call" : "Simulation"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${soundEnabled ? "text-purple-400 bg-purple-500/10" : "text-slate-500 hover:text-slate-300"}`}
              title={soundEnabled ? "Mute Call Voice" : "Unmute Call Voice"}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/40"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-950/40">
          {isRealCall && callState === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm text-slate-400">Connecting to live call tracker...</p>
            </div>
          )}
          
          {!isRealCall && callState === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
              {/* Pulsing Dialer Icon */}
              <div className="relative h-24 w-24 flex items-center justify-center">
                <div className="wave-ring"></div>
                <div className="wave-ring wave-ring-delay-1"></div>
                <div className="wave-ring wave-ring-delay-2"></div>
                <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white z-10 shadow-lg shadow-purple-900/40">
                  <Phone className="h-8 w-8 animate-bounce" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-200">Start Lead Qualification Call</h4>
                <p className="text-sm text-slate-400 max-w-sm">
                  This simulates an automated outbound AI call. The agent will speak in {preferredLanguage} to pitch services and qualify this lead.
                </p>
              </div>
              <button
                onClick={startCall}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm glow-btn cursor-pointer"
              >
                Dial Outward Call
              </button>
            </div>
          )}

          {callState === "ringing" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-950/60">
              <div className="relative h-28 w-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping"></div>
                <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 z-10">
                  <Volume2 className="h-10 w-10 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-amber-500 animate-pulse">Ringing...</h4>
                <p className="text-xs text-slate-500">Connecting line to {mobile}</p>
              </div>
              <button
                onClick={isRealCall ? onClose : endCall}
                className="px-6 py-2.5 bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isRealCall ? "Close Monitor" : "Cancel Call"}
              </button>
            </div>
          )}

          {callState === "connected" && (
            <>
              {/* Active metrics strip */}
              <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Smile className="h-4 w-4 text-purple-400" />
                  <span>Detected Sentiment: <strong className="text-purple-400">{sentiment}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span>Estimated Lead Score: <strong className="text-emerald-400">{scoreEstimate}/100</strong></span>
                </div>
              </div>

              {/* Message History list */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "assistant"
                          ? "bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-sm"
                          : "bg-purple-600 text-white rounded-tr-sm shadow-md"
                      }`}
                    >
                      <p className="text-[10px] opacity-60 font-semibold mb-1 uppercase tracking-wider">
                        {msg.role === "assistant" ? "AI Voice Agent" : "Lead (Customer)"}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input panel */}
              {!isRealCall ? (
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
                  {recognitionRef.current && (
                    <button
                      onClick={toggleListen}
                      className={`p-3 rounded-xl border transition-all ${
                        isListening
                          ? "bg-red-500 border-red-400 text-white animate-pulse"
                          : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                      }`}
                      title={isListening ? "Listening... click to stop" : "Speak (Use Microphone)"}
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                  )}
                  
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendCustomerMessage()}
                    className="flex-1 rounded-xl bg-slate-950/60 border border-slate-800 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={isListening ? "Speaking..." : `Type customer response in ${preferredLanguage}...`}
                    disabled={isListening}
                  />
                  
                  <button
                    onClick={() => sendCustomerMessage()}
                    disabled={isListening}
                    className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-900/20 disabled:opacity-40"
                  >
                    <Send className="h-5 w-5" />
                  </button>

                  <button
                    onClick={endCall}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/30"
                    title="Hang Up Call"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-slate-900 border-t border-slate-800 text-center space-y-2 flex flex-col items-center justify-center">
                  <Volume2 className="h-5 w-5 text-emerald-400 animate-bounce" />
                  <h5 className="text-xs font-bold text-slate-200">Call is Live on Prospect's Phone</h5>
                  <p className="text-[10px] text-slate-400 max-w-sm leading-normal">
                    The conversation is streaming directly to the customer's phone. Speak naturally into the phone. The live transcript above updates in real time.
                  </p>
                </div>
              )}
            </>
          )}

          {callState === "ended" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-center">
              <div className="text-center space-y-2">
                <div className="mx-auto h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2">
                  <PhoneOff className="h-8 w-8 text-red-500" />
                </div>
                <h4 className="text-2xl font-bold text-slate-200">Call Connected Completed</h4>
                <p className="text-sm text-slate-400">Post-Call AI analysis report generated</p>
              </div>

              {analysisResult ? (
                <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Interest Status</p>
                      <p className={`font-bold mt-1 text-sm ${
                        analysisResult.interest_status === "Interested"
                          ? "text-emerald-400"
                          : analysisResult.interest_status === "Maybe Interested"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}>
                        {analysisResult.interest_status}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-900">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">AI Lead Score</p>
                      <p className="text-sm font-bold text-slate-200 mt-1">{analysisResult.lead_score} / 100</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Call Summary</p>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/30 p-3 rounded-xl border border-slate-900">
                      {analysisResult.summary}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  <AlertCircle className="h-5 w-5 text-slate-500" />
                  <p className="text-xs">No analysis generated (call was probably disconnected before answering).</p>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-sm cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
