"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Lock,
  Clock,
  Database,
  History,
  Info,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ComplianceCenterPage() {
  const [callingWindowActive, setCallingWindowActive] = useState(true);
  const [dndEnforced, setDndEnforced] = useState(true);
  const [aiDisclosureMandatory, setAiDisclosureMandatory] = useState(true);

  const complianceRules = [
    {
      name: "Operational Calling Window",
      description: "Restricts all outgoing carrier calls strictly between 09:00 AM and 08:00 PM IST per TRAI mandate.",
      status: "PASS",
      code: "REG-TRAI-01",
    },
    {
      name: "DND National Registry Filtering",
      description: "Auto-queries Do-Not-Disturb blocklist before establishing SIP/PSTN voice connections.",
      status: "PASS",
      code: "REG-TRAI-02",
    },
    {
      name: "Mandatory AI Caller Disclosure",
      description: "Forces the voice agent to state that it is an artificial intelligence within the first 10 seconds of pickup.",
      status: "PASS",
      code: "REG-AI-DISC",
    },
    {
      name: "Immediate Opt-Out Processing",
      description: "Upon customer refusal or rejection, the number is permanently locked from subsequent automated dials.",
      status: "PASS",
      code: "REG-OPTOUT",
    },
    {
      name: "Call Recording & Consent Notice",
      description: "Audible notification played prior to audio capture with encrypted storage retention.",
      status: "PASS",
      code: "REG-CONSENT",
    },
    {
      name: "Cryptographic Audit Trail",
      description: "Every dial attempt, timestamp, and carrier SID is immutable and indexed for audit verification.",
      status: "PASS",
      code: "REG-AUDIT",
    },
  ];

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      {/* Glow backgrounds */}
      <div className="absolute top-[-10%] left-[20%] w-[650px] h-[650px] bg-emerald-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[180px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-7 overflow-y-auto relative z-10">
        <TopBar
          title="TRAI Compliance Shield"
          subtitle="Autonomous Telecommunication Regulation & Consumer Protection Center"
        />

        {/* ── Central Shield Hero Section ── */}
        <div className="glass-card rounded-3xl p-8 border border-emerald-500/25 relative overflow-hidden">
          <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Shield Icon Animation */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center"
              >
                <div className="w-40 h-40 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="h-20 w-20 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                </div>
              </motion.div>

              <div className="mt-4">
                <span className="inline-block text-[11px] font-mono font-black uppercase px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  ● SYSTEM SAFE • TRAI PROTECTED
                </span>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  100% Policy Verification • Zero Active Violations
                </p>
              </div>
            </div>

            {/* Right: Regulatory Status & Security Controls */}
            <div className="lg:col-span-8 space-y-5">
              <div>
                <h3 className="text-2xl font-black text-white font-sans">
                  Telecom Regulatory Authority of India (TRAI) Guard
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Multi-Lingual Generative Voice Calling Agent actively enforces all commercial communication regulations. Outbound calls violating calling windows or registered on national DND registries are automatically intercepted and terminated before dial dispatch.
                </p>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/20">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                    <span>Calling Window</span>
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <p className="text-lg font-black font-mono text-emerald-300 mt-1">09:00 - 20:00</p>
                  <span className="text-[9px] text-emerald-400 font-mono">IST Enforced</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/20">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                    <span>DND Interceptions</span>
                    <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <p className="text-lg font-black font-mono text-cyan-300 mt-1">42 Blocked</p>
                  <span className="text-[9px] text-cyan-400 font-mono">Protected Today</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/20">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
                    <span>Consent Logs</span>
                    <FileCheck className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <p className="text-lg font-black font-mono text-blue-300 mt-1">1,284 Indexed</p>
                  <span className="text-[9px] text-blue-400 font-mono">100% Retained</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Detailed Rules Checklist Table ── */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h4 className="font-bold text-sm uppercase tracking-wider font-mono text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Automated Compliance Verification Matrix
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              AUDIT FREQUENCY: CONTINUOUS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-emerald-500/30 transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {rule.code}
                    </span>
                    <h5 className="text-xs font-bold text-slate-200 font-sans">{rule.name}</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rule.description}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 shrink-0">
                  <CheckCircle2 className="h-3 w-3" /> {rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
