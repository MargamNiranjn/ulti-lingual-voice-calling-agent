"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Globe2,
  Cpu,
  ShieldCheck,
  MessagesSquare,
  Flame,
  Network,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface WorkflowNode {
  id: string;
  name: string;
  subtitle: string;
  icon: any;
  status: "completed" | "active" | "pending";
  description: string;
}

interface CampaignWorkflowBuilderProps {
  onLaunch?: () => void;
  isRunning?: boolean;
}

export default function CampaignWorkflowBuilder({
  onLaunch,
  isRunning = false,
}: CampaignWorkflowBuilderProps) {
  const [activeStep, setActiveStep] = useState<number>(isRunning ? 2 : 0);

  const workflowSteps: WorkflowNode[] = [
    {
      id: "leads",
      name: "LEAD DATABASE",
      subtitle: "1,284 Profiles",
      icon: Database,
      status: "completed",
      description: "Segmented by status, language preference, and business vertical",
    },
    {
      id: "lang",
      name: "LANGUAGE DETECTION",
      subtitle: "Telugu / Hindi / EN",
      icon: Globe2,
      status: "completed",
      description: "Pre-routes each contact to their native localized neural speech model",
    },
    {
      id: "agent",
      name: "AI VOICE AGENT",
      subtitle: "Maya • Pro Voice",
      icon: Cpu,
      status: isRunning ? "active" : "pending",
      description: "Instantiates dynamic non-scripted multi-turn conversational prompt",
    },
    {
      id: "trai",
      name: "TRAI COMPLIANCE",
      subtitle: "9 AM - 8 PM IST",
      icon: ShieldCheck,
      status: isRunning ? "active" : "pending",
      description: "Auto-validates DND registry, operational hours, and AI disclosure",
    },
    {
      id: "dialogue",
      name: "AI CONVERSATION",
      subtitle: "Dynamic Exchange",
      icon: MessagesSquare,
      status: "pending",
      description: "Executes 2-way audio call with real-time speech-to-text",
    },
    {
      id: "scoring",
      name: "LEAD SCORING",
      subtitle: "0-100 Rating",
      icon: Flame,
      status: "pending",
      description: "Extracts purchase intent, requirements, budget, and callback time",
    },
    {
      id: "crm",
      name: "CRM SYNC",
      subtitle: "Instant Webhook",
      icon: Network,
      status: "pending",
      description: "Automatically dispatches hot leads to Zoho, Salesforce, or Make",
    },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 lg:p-8 border border-cyan-500/20 space-y-7 relative overflow-hidden">
      {/* Visual cyber texture */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
              VISUAL WORKFLOW ENGINE
            </span>
          </div>
          <h3 className="text-xl font-black text-white font-sans">
            Autonomous Outreach Pipeline Architecture
          </h3>
          <p className="text-xs text-slate-400">
            End-to-end mission pipeline executed for each phone contact in active campaigns.
          </p>
        </div>

        <button
          onClick={onLaunch}
          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold font-mono text-xs tracking-wider uppercase transition-all shadow-[0_0_30px_rgba(6,182,212,0.45)] hover:scale-[1.03] cursor-pointer shrink-0"
        >
          <Play className="h-4 w-4 fill-black" />
          <span>START AI CAMPAIGN</span>
        </button>
      </div>

      {/* Interactive Node Flow Diagram */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 pt-2">
        {workflowSteps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= 1;
          const isActive = idx === 2;

          return (
            <motion.div
              key={step.id}
              whileHover={{ y: -3 }}
              className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                isActive
                  ? "bg-slate-900/90 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40"
                  : isCompleted
                  ? "bg-slate-950/70 border-emerald-500/30 text-slate-300"
                  : "bg-slate-950/50 border-slate-850 text-slate-400"
              }`}
            >
              {/* Step indicator tag */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase font-bold text-slate-500">
                  STEP 0{idx + 1}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f0ff]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
              </div>

              {/* Node Core Info */}
              <div className="space-y-1.5">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                    isActive
                      ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                      : isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-black font-mono tracking-tight text-white leading-tight">
                  {step.name}
                </h4>
                <p className="text-[10px] text-cyan-400 font-mono">{step.subtitle}</p>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal pt-1 border-t border-slate-800/80">
                {step.description}
              </p>

              {/* Glow connector badge */}
              {idx < workflowSteps.length - 1 && (
                <div className="hidden xl:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20">
                  <ArrowRight className="h-3 w-3 text-cyan-400/50" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Running Pipeline Status Bar */}
      <div className="relative z-10 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span>PIPELINE ENGINE: <strong className="text-cyan-300">ARMED & IDLE</strong></span>
          <span className="text-slate-700">•</span>
          <span>CONCURRENCY: <strong className="text-white">10 WORKER THREADS</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">TRAI Window: <strong className="text-emerald-400">09:00 - 20:00 IST</strong></span>
          <span className="text-slate-400">Telemetry: <strong className="text-cyan-400">WebSocket / SIP</strong></span>
        </div>
      </div>
    </div>
  );
}
