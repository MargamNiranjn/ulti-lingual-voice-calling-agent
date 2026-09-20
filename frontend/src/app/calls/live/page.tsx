"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AIOrb from "@/components/AIOrb";
import VoiceWaveform from "@/components/VoiceWaveform";
import LeadScoreGauge from "@/components/LeadScoreGauge";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneOff,
  PhoneForwarded,
  Volume2,
  Shield,
  Activity,
  Globe,
  Radio,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LiveCallScreen() {
  const [callState, setCallState] = useState<"speaking" | "listening" | "thinking">("speaking");
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeLang, setActiveLang] = useState("Telugu");

  const [transcript, setTranscript] = useState([
    {
      speaker: "AI AGENT (MAYA)",
      text: "నమస్కారం Arjun గారు! నేను LeadSense నుండి మాట్లాడుతున్నాను. మీరు వెబ్‌సైట్ మరియు ఆన్‌లైన్ పేమెంట్ సొల్యూషన్స్ గురించి ఆసక్తి చూపించారు కదా?",
      time: "00:04",
      role: "ai",
    },
    {
      speaker: "ARJUN KUMAR",
      text: "అవును అండి. నా హైదరాబాద్ లోని రిటైల్ స్టోర్ కోసం ఆన్‌లైన్ ఆర్డరింగ్ సిస్టమ్ కావాలి. డెలివరీ ట్రాకింగ్ ఇంకా యూపీఐ పేమెంట్స్ ఉండాలి.",
      time: "00:15",
      role: "customer",
    },
    {
      speaker: "AI AGENT (MAYA)",
      text: "చాలా సంతోషం Arjun గారు! మా ప్లాట్‌ఫారమ్ ఆటోమేటిక్ డెలివరీ ట్రాకింగ్, జీరో-కమీషన్ యూపీఐ మరియు ఇన్వెంటరీ సింక్‌ను సపోర్ట్ చేస్తుంది. మీ ప్రాజెక్ట్ ప్రారంభ సమయం ఎప్పుడు ఉండవచ్చు?",
      time: "00:26",
      role: "ai",
    },
    {
      speaker: "ARJUN KUMAR",
      text: "వచ్చే నెల మొదటి వారంలో లైవ్ అవ్వాలి. ప్రైసింగ్ వివరాలు నాకు తెలుసుకోవాలి.",
      time: "00:38",
      role: "customer",
    },
    {
      speaker: "AI AGENT (MAYA)",
      text: "ఖచ్చితంగా! మా సీనియర్ ఈ-కామర్స్ ఆర్కిటెక్ట్‌తో రేపు ఉదయం 11:30 గంటలకు మీకు వివరణాత్మక ప్రతిపాదనతో కాల్ ఏర్పాటు చేయనా?",
      time: "00:49",
      role: "ai",
    },
  ]);

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      {/* Dynamic Ambient Backdrops */}
      <div className="absolute top-[-10%] left-[20%] w-[650px] h-[650px] bg-cyan-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[180px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-6 overflow-y-auto relative z-10">
        <TopBar
          title="Active Call Mission Control"
          subtitle="Real-Time Carrier Voice Line • Direct Neural Interaction"
          activeCallsCount={1}
        />

        {/* ── Top Header Banner with Live Call Metadata ── */}
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/25 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
              <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white tracking-wide">
                  LINE #01: ACTIVE CONVERSATION
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  ● CALL CONNECTED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Duration: <strong className="text-slate-200">01:14</strong> • Bitrate: 64kbps Opus • Latency: 740ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300">
              Language: <strong>{activeLang}</strong>
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> TRAI DND Checked
            </span>
          </div>
        </div>

        {/* ── Main 3-Column Cockpit ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Customer Profile Card (3 cols) */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-5 border border-slate-800/90 space-y-5">
            <div className="border-b border-slate-800/80 pb-3">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                PROSPECT PROFILE
              </span>
              <h4 className="text-lg font-bold text-white font-sans mt-0.5">Arjun Kumar</h4>
              <p className="text-xs font-mono text-cyan-400">+91 98765 43210</p>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase">Company & Role</span>
                <p className="font-bold text-slate-200 mt-0.5 font-sans">Apex Retail Hub • Founder</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase">Service Inquired</span>
                <p className="font-bold text-cyan-300 mt-0.5 font-sans">E-Commerce & Online Store</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                <span className="text-[10px] text-slate-500 uppercase">Target Timeline</span>
                <p className="font-bold text-emerald-400 mt-0.5 font-sans">Next Month (Early)</p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-cyan-400 uppercase font-bold">LEAD CLASSIFICATION</span>
                  <p className="text-sm font-black text-cyan-300 font-mono flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-400 fill-orange-400" /> HOT LEAD
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-cyan-400">87/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Large Animated Voice Orb + Visualizer (6 cols) */}
          <div className="lg:col-span-6 glass-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                STATE: {callState.toUpperCase()}
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">
                Maya • Senior AI Sales Consultant
              </h3>
            </div>

            {/* Central Animated Orb */}
            <div className="my-2">
              <AIOrb status={callState} size="xl" />
            </div>

            {/* Multiline Continuous Waveform */}
            <div className="w-full max-w-md px-4">
              <VoiceWaveform state={callState} barCount={36} height={34} color="cyan" />
            </div>

            {/* Circular Mission Control Action Buttons */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full border transition-all cursor-pointer ${
                  isMuted
                    ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-slate-900/80 border-slate-850 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={() => {
                  setIsPaused(!isPaused);
                  setCallState(isPaused ? "speaking" : "thinking");
                }}
                className={`p-4 rounded-full border transition-all cursor-pointer ${
                  isPaused
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    : "bg-slate-900/80 border-slate-850 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                }`}
                title={isPaused ? "Resume AI" : "Pause AI"}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>

              <button
                onClick={() => alert("Transferring call to Human Senior Sales Specialist...")}
                className="p-4 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                title="Transfer to Human Agent"
              >
                <PhoneForwarded className="h-5 w-5" />
              </button>

              <button
                onClick={() => alert("Call ended. Generating final AI qualification summary...")}
                className="p-4 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                title="End Call & Qualify"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right: Real-time AI Lead Intelligence Breakdown (3 cols) */}
          <div className="lg:col-span-3 glass-card rounded-2xl p-5 border border-slate-800/90 space-y-4">
            <div className="border-b border-slate-800/80 pb-3">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                AI INTELLIGENCE BREAKDOWN
              </span>
              <h4 className="text-base font-bold text-white font-sans mt-0.5">Qualification Metrics</h4>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Intent</span>
                  <span className="text-cyan-400 font-bold">91%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: "91%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Buying Probability</span>
                  <span className="text-blue-400 font-bold">84%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: "84%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Budget Fit</span>
                  <span className="text-indigo-400 font-bold">78%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: "78%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Urgency</span>
                  <span className="text-emerald-400 font-bold">93%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400" style={{ width: "93%" }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                Action Recommendation
              </span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-850">
                ⚡ Hot lead. High readiness for e-commerce website with UPI integration. Immediate callback requested for tomorrow 11:30 AM.
              </p>
            </div>
          </div>
        </div>

        {/* ── Bottom Section: Full Real-time Neural Conversation Stream ── */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                Live Turn-by-Turn Audio Dialogue Log
              </h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-500/25">
              Speech-to-Text: Deepgram Nova-2 Multilingual
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {transcript.map((t, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl text-xs border leading-relaxed ${
                  t.role === "ai"
                    ? "bg-slate-900/80 border-cyan-500/20 text-slate-200"
                    : "bg-slate-950/90 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-mono uppercase text-slate-500 mb-1">
                  <span className={t.role === "ai" ? "text-cyan-400 font-bold" : "text-slate-400 font-bold"}>
                    {t.speaker}
                  </span>
                  <span>{t.time}</span>
                </div>
                <p className="font-sans">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
