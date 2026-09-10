"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Sparkles, 
  PhoneCall, 
  Cpu, 
  ShieldCheck, 
  Workflow, 
  Server, 
  Globe2, 
  Layers 
} from "lucide-react";

export default function AboutPage() {
  const stack = [
    { name: "Next.js 14 (App Router)", desc: "Responsive, component-driven client dashboard styled with premium dark glassmorphism.", icon: Layers, color: "text-purple-400" },
    { name: "FastAPI Backend", desc: "High-performance Python API server orchestrating TwiML calls, WebSockets, and background workers.", icon: Server, color: "text-indigo-400" },
    { name: "Twilio Telephony", desc: "Outbound carrier connectivity handling real phone dials, speech recognition (STT), and voice synthesis (TTS).", icon: PhoneCall, color: "text-rose-400" },
    { name: "OpenAI GPT-4 Agent", desc: "Conversational qualification reasoning, sentiment evaluation, post-call transcripts, and interest scoring.", icon: Cpu, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-8 space-y-8 overflow-y-auto relative">
        {/* Decorative ambient background glows */}
        <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-purple-400 text-glow-primary animate-pulse" />
            About This Platform
          </h2>
          <p className="text-sm text-slate-400 font-medium max-w-2xl">
            Learn how this platform integrates Twilio Cloud Telephony and OpenAI to automate outbound sales qualification calls and screen prospects at scale.
          </p>
        </div>

        {/* 1. Core Architecture Diagram Section */}
        <section className="relative z-10 glass-card rounded-2xl p-6 md:p-8 border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-purple-400" />
            Call Flow & Integration Architecture
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            Outbound campaigns leverage an automated call-and-listen callback loop. When a call connects, Twilio interacts with the local FastAPI server using dynamic TwiML documents, converting vocal speech into text and requesting GPT-4 response actions.
          </p>

          <div className="my-6 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 p-2 flex justify-center">
            <img 
              src="/architecture_diagram.jpg" 
              alt="System Architecture Diagram" 
              className="max-h-[350px] object-contain rounded-lg border border-slate-800/80 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 text-center">
            {/* Step 1 */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
              <div className="h-8 w-8 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-400 text-xs">1</div>
              <h4 className="text-xs font-bold text-slate-200">Outbound Dial</h4>
              <p className="text-[10px] text-slate-500">FastAPI initiates call via Twilio REST API</p>
            </div>
            
            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-700 font-bold">→</div>

            {/* Step 2 */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
              <div className="h-8 w-8 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center font-bold text-rose-400 text-xs">2</div>
              <h4 className="text-xs font-bold text-slate-200">Twilio Telephony</h4>
              <p className="text-[10px] text-slate-500">Dials customer & connects active speech channel</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-700 font-bold">→</div>

            {/* Step 3 */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
              <div className="h-8 w-8 mx-auto rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 text-xs">3</div>
              <h4 className="text-xs font-bold text-slate-200">FastAPI & TwiML</h4>
              <p className="text-[10px] text-slate-500">Routes call-and-response loop via secure webhooks</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-700 font-bold">→</div>

            {/* Step 4 */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
              <div className="h-8 w-8 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-xs">4</div>
              <h4 className="text-xs font-bold text-slate-200">OpenAI GPT-4</h4>
              <p className="text-[10px] text-slate-500">Formulates qualification dialogue responses</p>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-700 font-bold">→</div>

            {/* Step 5 */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 space-y-2">
              <div className="h-8 w-8 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-400 text-xs">5</div>
              <h4 className="text-xs font-bold text-slate-200">CRM Webhook Sync</h4>
              <p className="text-[10px] text-slate-500">Automatically syncs interested leads to external CRMs</p>
            </div>
          </div>
        </section>

        {/* 2. Technology Stack Grid */}
        <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tech stack Details */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-purple-400" />
              Unified Technology Stack
            </h3>
            <div className="space-y-4 pt-2">
              {stack.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex gap-4 p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                    <div className={`h-8 w-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0 ${item.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance & Dialing Policies */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-purple-400" />
              Compliance & Dialing Regulations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This platform implements native telecom guardrails to comply with global regulations and India's Telecom Regulatory Authority (TRAI) directives:
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe2 className="h-4 w-4 text-purple-400" /> Dialing Geo-Permissions & Hours
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  Enforces restrictions allowing calls only between 9:00 AM and 8:00 PM IST to protect consumer privacy.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-400" /> DND Scrubbing & AI Disclosures
                </h4>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  Filters DND (Do Not Call) mobile registries and plays a mandatory artificial assistant notice at the start of call connections.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
