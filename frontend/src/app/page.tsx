"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  PhoneCall,
  Play,
  ArrowRight,
  Globe2,
  Users,
  Award,
  Zap,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Activity,
  Mic,
  TrendingUp,
  Volume2
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeLang, setActiveLang] = useState("Hindi");
  const [waveActive, setWaveActive] = useState(true);

  const sampleCalls: Record<string, { prompt: string; reply: string; score: number }> = {
    Hindi: {
      prompt: "नमस्ते, मुझे अमेज़न सेलर सेवाओं के बारे में जानकारी चाहिए। क्या प्रक्रिया है?",
      reply: "नमस्ते! अमेज़न पर आपका स्वागत है। आप लाखों ग्राहकों तक अपने प्रोडक्ट्स पहुँचा सकते हैं। क्या मैं हमारे सेलर विशेषज्ञ के साथ कल सुबह 11 बजे आपकी कॉल शेड्यूल करूँ?",
      score: 96,
    },
    Telugu: {
      prompt: "నమస్కారం, నేను అమెజాన్‌లో నా వ్యాపారాన్ని నమోదు చేయాలనుకుంటున్నాను.",
      reply: "నమస్కారం! అమెజాన్ ద్వారా మీ వ్యాపారాన్ని లక్షలాది కస్టమర్లకు చేర్చవచ్చు. మీ ఆన్‌బోర్డింగ్ కోసం మా నిపుణుడితో కాల్ షెడ్యూల్ చేయనా?",
      score: 95,
    },
    English: {
      prompt: "Hello, I saw your platform and want to understand the seller registration process.",
      reply: "Hello! Welcome to Amazon Services. We help scale your business to millions of active buyers. Would tomorrow at 11 AM work for an onboarding specialist callback?",
      score: 98,
    },
    Tamil: {
      prompt: "வணக்கம், அமேசானில் விற்பனையாளராக பதிவு செய்வது எப்படி?",
      reply: "வணக்கம்! அமேசான் மூலம் உங்கள் தயாரிப்புகளை எளிதாக விற்கலாம். எங்கள் விற்பனை நிபுணருடன் ஒரு ஆலோசனைக் கூட்டத்தை திட்டமிடலாமா?",
      score: 94,
    },
    Spanish: {
      prompt: "¿Hola, cómo puedo empezar a vender productos en Amazon?",
      reply: "¡Hola! Con Amazon puede llegar a millones de compradores. ¿Le gustaría que agendemos una llamada con nuestro especialista de incorporación mañana?",
      score: 97,
    },
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-x-hidden font-sans">
      {/* Dynamic Background Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[15%] w-[600px] h-[550px] bg-blue-600/12 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[550px] h-[500px] bg-indigo-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[20%] w-[500px] h-[400px] bg-cyan-500/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid line texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ─── Top Navigation Bar ─── */}
      <header className="relative z-20 w-full border-b border-slate-800/60 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                LeadSense <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 font-semibold tracking-wide uppercase">AI Pro</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Autonomous Multilingual Calling
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-blue-400 transition-colors">
              How it works
            </Link>
            <Link href="#languages" className="hover:text-blue-400 transition-colors">
              18+ Languages
            </Link>
            <Link href="#demo" className="hover:text-blue-400 transition-colors">
              Live Simulator
            </Link>
            <Link href="/about" className="hover:text-blue-400 transition-colors">
              Architecture
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section (Inspired by User Sample) ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading, Pitch, CTA, Stats */}
          <div className="lg:col-span-6 space-y-8">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Next-Gen Cold Calling Automation</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] text-white">
              Screen your leads and qualify them,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                everywhere!
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl">
              Eliminate manual cold calling. Our multilingual AI voice agent dials prospects, converses naturally in their preferred language, detects genuine interest, and instantly alerts your sales team.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/35 transition-all hover:scale-[1.03] flex items-center gap-2.5 cursor-pointer"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-blue-400 text-blue-400" />
                <span>Explore Architecture</span>
              </Link>
            </div>

            {/* Bottom 3 Stat Badges (Exact layout as user sample) */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800/80 max-w-md">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scale</span>
                </div>
                <div className="text-2xl font-black text-white">100k+</div>
                <div className="text-xs text-slate-400">leads dialed</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Globe2 className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reach</span>
                </div>
                <div className="text-2xl font-black text-white">18+</div>
                <div className="text-xs text-slate-400">native languages</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Award className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Impact</span>
                </div>
                <div className="text-2xl font-black text-white">85%</div>
                <div className="text-xs text-slate-400">time saved</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic AI Voice Calling Card (User's Blue Folder style transformed into AI Caller) */}
          <div className="lg:col-span-6 flex justify-center perspective-1000">
            <div className="w-full max-w-lg relative animate-float-3d">
              {/* Outer Glowing Backplate */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 via-indigo-600/30 to-cyan-500/20 rounded-3xl blur-2xl -z-10 animate-pulse-glow" />

              {/* 3D Main Calling Vault Container */}
              <div className="bg-gradient-to-b from-[#10172b] to-[#0a0f1d] border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/40 backdrop-blur-2xl space-y-6 relative overflow-hidden">
                
                {/* Visual Tab Header (Styled like the prominent blue folder tab in the sample image) */}
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-600 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-lg shadow-blue-600/50 flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity className="h-3.5 w-3.5 animate-pulse" /> Live Call Active
                </div>

                {/* Agent Call Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/40">
                        <Mic className="h-7 w-7 animate-bounce" />
                      </div>
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-[#10172b] rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white">Amazon Voice AI</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                          Groq Llama 3.3
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Outbound Qualifying • Real-Time STT/TTS</p>
                    </div>
                  </div>

                  {/* Soundwave Animation Bars */}
                  <div className="flex items-center gap-1 h-8 px-3 rounded-xl bg-blue-950/60 border border-blue-500/20">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="w-1 bg-blue-400 rounded-full"
                        style={{
                          animation: `soundWaveBar 1.2s ease-in-out infinite`,
                          animationDelay: `${i * 0.18}s`,
                          height: "16px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Language Switcher Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Simulate Language</span>
                    <span className="text-blue-400 font-medium">18 Available</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Hindi", "Telugu", "English", "Tamil", "Spanish"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activeLang === lang
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/40 scale-105"
                            : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversation Preview Card */}
                <div className="bg-[#070b14] border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-inner">
                  {/* Prospect prompt */}
                  <div className="flex gap-2.5 items-start">
                    <div className="h-6 w-6 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      USER
                    </div>
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 w-full">
                      "{sampleCalls[activeLang]?.prompt}"
                    </p>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-2.5 items-start">
                    <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-md shadow-blue-600/40">
                      AI
                    </div>
                    <p className="text-xs text-blue-100 bg-blue-950/40 p-2.5 rounded-xl border border-blue-800/40 w-full font-medium">
                      "{sampleCalls[activeLang]?.reply}"
                    </p>
                  </div>
                </div>

                {/* Live Post-Call Analysis Badges */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Lead Score</span>
                    <span className="text-lg font-black text-emerald-400">
                      {sampleCalls[activeLang]?.score}/100
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Intent</span>
                    <span className="text-xs font-bold text-blue-400 block mt-1">Interested</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Alert</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full inline-block mt-1">
                      SMS Dispatched
                    </span>
                  </div>
                </div>

                {/* Direct Action Link */}
                <Link
                  href="/dashboard"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/40 transition-all cursor-pointer"
                >
                  <Headphones className="h-4 w-4" /> Open Full Interactive Dialer
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 3 Feature Highlights Section ─── */}
      <section id="features" className="relative z-10 border-t border-slate-800/80 bg-[#0a0d16] py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Smarter Calls. Better Leads. Zero Cold Call Burnout.
            </h2>
            <p className="text-slate-400 text-sm">
              Engineered specifically for businesses, agencies, and enterprise sales teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-2xl p-7 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">18 Regional & Global Languages</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects across Hindi, Telugu, Tamil, Kannada, Urdu, English, Spanish, French, German, Arabic, and more using native Neural voices with ultra-natural accents.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-2xl p-7 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero-Shot Lead Qualification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our Groq Llama 3.3-70B model analyzes transcripts instantly, categorizing prospects into Interested, Maybe, or Not Interested with calibrated 0-100 scores.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-2xl p-7 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">TRAI Compliance Guard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Native enforcement of telecom regulations: automated DND scrubbing, mandatory AI disclosure statements, and strict 9 AM - 8 PM IST calling window locks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#060810] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-blue-500" />
            <span className="font-bold text-slate-300">LeadSense</span>
            <span>• 4-1 B.Tech Major Project Engineering Release</span>
          </div>
          <div>
            Built with Next.js 16, FastAPI, Groq Llama 3.3, Twilio & WebSockets
          </div>
        </div>
      </footer>
    </div>
  );
}

