"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AIOrb from "@/components/AIOrb";
import VoiceWaveform from "@/components/VoiceWaveform";
import {
  Sliders,
  Volume2,
  Globe2,
  Sparkles,
  Bot,
  Play,
  Save,
  CheckCircle2,
  MessageSquare,
  Wand2,
} from "lucide-react";

export default function AIStudioPage() {
  const [agentName, setAgentName] = useState("Maya");
  const [voiceModel, setVoiceModel] = useState("Female — Professional & Conversational");
  const [primaryObjective, setPrimaryObjective] = useState("Lead Qualification & Callback Booking");
  const [personality, setPersonality] = useState("Professional, Empathetic, Dynamic");
  const [responseLength, setResponseLength] = useState("Concise (1-2 sentences for natural audio rhythm)");
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const supportedLanguages = [
    { name: "English", tag: "en-IN", active: true },
    { name: "Telugu", tag: "te-IN", active: true },
    { name: "Hindi", tag: "hi-IN", active: true },
    { name: "Tamil", tag: "ta-IN", active: true },
    { name: "Kannada", tag: "kn-IN", active: true },
    { name: "Malayalam", tag: "ml-IN", active: true },
    { name: "Marathi", tag: "mr-IN", active: false },
    { name: "Bengali", tag: "bn-IN", active: false },
  ];

  const handleTestVoice = () => {
    setIsPlayingSample(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "నమస్కారం! నేను LeadSense నుండి మాయాను మాట్లాడుతున్నాను. మీ వ్యాపారం కోసం ఈ-కామర్స్ మరియు వెబ్‌సైట్ సొల్యూషన్స్ గురించి చర్చిద్దాం."
      );
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingSample(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingSample(false), 3000);
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-7 overflow-y-auto relative z-10">
        <TopBar
          title="AI Voice & Personality Studio"
          subtitle="Configure Neural Persona, Conversational Tone, Multi-Lingual Speech & Qualification Directives"
        />

        {/* ── Studio Top Panel: Live Testing Cockpit ── */}
        <div className="glass-card rounded-3xl p-6 lg:p-8 border border-cyan-500/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4">
            <AIOrb status={isPlayingSample ? "speaking" : "thinking"} size="md" />
            <p className="text-xs font-mono font-bold text-cyan-300 mt-4">
              AGENT PERSONA: <span className="text-white font-sans">{agentName.toUpperCase()}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Model: Llama 3.3-70B • Deepgram Nova-2 • Cartesia Sonic
            </p>

            {/* Test Voice Control */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={handleTestVoice}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold font-mono text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                <span>{isPlayingSample ? "Playing Voice Stream..." : "Test AI Voice Sample"}</span>
              </button>
              {isPlayingSample && (
                <div className="w-48 mt-1">
                  <VoiceWaveform state="speaking" barCount={24} height={20} color="cyan" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                NEURAL CONVERSATIONAL DIRECTIVE
              </span>
              <h3 className="text-2xl font-black text-white font-sans mt-0.5">
                Dynamic Voice Configuration
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Fine-tune Maya's vocal cadences, emotional pitch, objection handling threshold, and regional phonetic accents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Latency Target</span>
                <p className="font-bold font-mono text-cyan-300 text-sm mt-0.5">~720ms (Human-Parity)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Context Memory</span>
                <p className="font-bold font-mono text-emerald-400 text-sm mt-0.5">Full Turn-by-Turn History</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Configuration Matrix ── */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h4 className="font-bold text-sm uppercase tracking-wider font-mono text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" /> Conversational Agent Parameters
            </h4>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" /> Persona Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Agent Name */}
            <div className="space-y-1.5">
              <label className="block font-mono uppercase text-slate-400 font-bold text-[10px]">
                Agent Identity Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            {/* Voice Model */}
            <div className="space-y-1.5">
              <label className="block font-mono uppercase text-slate-400 font-bold text-[10px]">
                Acoustic Voice Model
              </label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-sans"
              >
                <option value="Female — Professional & Conversational">Maya • Indian English & Regional Nuance</option>
                <option value="Male — Authoritative Enterprise">Aarav • Confident & Articulate</option>
                <option value="Female — Warm Support Specialist">Pooja • Friendly & Reassuring</option>
              </select>
            </div>

            {/* Personality Style */}
            <div className="space-y-1.5">
              <label className="block font-mono uppercase text-slate-400 font-bold text-[10px]">
                Conversational Tone & Temperament
              </label>
              <input
                type="text"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-sans"
              />
            </div>

            {/* Response Cadence */}
            <div className="space-y-1.5">
              <label className="block font-mono uppercase text-slate-400 font-bold text-[10px]">
                Spoken Rhythm & Cadence
              </label>
              <input
                type="text"
                value={responseLength}
                onChange={(e) => setResponseLength(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-sans"
              />
            </div>
          </div>

          {/* Supported Languages Matrix */}
          <div className="space-y-3 pt-2 border-t border-slate-850">
            <div className="flex items-center justify-between">
              <label className="font-mono uppercase text-slate-400 font-bold text-[10px] flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5 text-cyan-400" /> Supported Regional Languages
              </label>
              <span className="text-[10px] font-mono text-cyan-400">AUTO-LANGUAGE SWITCHING: ENABLED</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {supportedLanguages.map((lang, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    lang.active
                      ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-300"
                      : "bg-slate-950/50 border-slate-850 text-slate-500"
                  }`}
                >
                  <span className="font-bold text-xs">{lang.name}</span>
                  <span className="text-[9px] font-mono opacity-70">{lang.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end pt-4 border-t border-slate-850">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold font-mono text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              <Save className="h-4 w-4" /> Save AI Persona
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
