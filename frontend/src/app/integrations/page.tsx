"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import {
  Network,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Shield,
  Database,
  Cloud,
  Layers,
  ArrowDownUp,
} from "lucide-react";
import { motion } from "framer-motion";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    {
      name: "Zoho CRM",
      category: "Enterprise CRM",
      status: "CONNECTED",
      lastSync: "2 minutes ago",
      recordsSynced: 1248,
      logo: "Z",
      color: "border-blue-500/30 text-blue-400 bg-blue-950/20",
      description: "Direct bi-directional push of qualified hot leads and scheduled callbacks into Zoho Leads module.",
    },
    {
      name: "Salesforce Cloud",
      category: "Enterprise CRM",
      status: "CONNECTED",
      lastSync: "14 minutes ago",
      recordsSynced: 874,
      logo: "SF",
      color: "border-cyan-500/30 text-cyan-400 bg-cyan-950/20",
      description: "Creates Opportunities and Contact records with AI transcripts and sentiment tags automatically.",
    },
    {
      name: "HubSpot CRM",
      category: "Inbound & Deals",
      status: "READY",
      lastSync: "Not configured",
      recordsSynced: 0,
      logo: "HS",
      color: "border-orange-500/30 text-orange-400 bg-orange-950/20",
      description: "Triggers marketing workflows and assigns hot leads directly to sales representatives.",
    },
    {
      name: "Custom Webhook Trigger",
      category: "Make / Zapier / n8n",
      status: "CONNECTED",
      lastSync: "Just now",
      recordsSynced: 1284,
      logo: "API",
      color: "border-violet-500/30 text-violet-400 bg-violet-950/20",
      description: "Instant JSON HTTP POST payload dispatched whenever an outbound call produces a HIGH interest score.",
    },
  ]);

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-7 overflow-y-auto relative z-10">
        <TopBar
          title="CRM & Pipeline Integrations"
          subtitle="Automated Bi-Directional Lead Synchronization & Real-Time Webhook Pipeline"
        />

        {/* ── Animated Data Transfer Visualizer ── */}
        <div className="glass-card rounded-3xl p-6 lg:p-8 border border-cyan-500/20 space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ACTIVE DATA SYNCHRONIZATION PIPELINE
              </span>
              <h3 className="text-xl font-black text-white font-sans mt-0.5">
                Autonomous Lead Forwarding
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              ● REAL-TIME WEBHOOK READY
            </span>
          </div>

          {/* Graphical Pipeline Flow */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-6 text-center">
            {/* LeadSense Node */}
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] w-full md:w-60">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">SOURCE PLATFORM</span>
              <h4 className="text-sm font-black text-white font-mono mt-1">VOICE CALLING AGENT</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Voice Qualifier Engine</p>
            </div>

            {/* Moving Stream Particles */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-1 w-full">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                DISPATCHING STRUCTURED JSON PAYLOAD
              </span>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                  className="w-1/3 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f0ff]"
                />
              </div>
              <span className="text-[9px] font-mono text-cyan-400">
                latency: ~320ms • TLS 1.3 encrypted
              </span>
            </div>

            {/* Target CRM Node */}
            <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] w-full md:w-60">
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">DESTINATION</span>
              <h4 className="text-base font-black text-white font-mono mt-1">CONNECTED CRMS</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Zoho / Salesforce / Webhook</p>
            </div>
          </div>
        </div>

        {/* ── Integration Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((item, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-cyan-500/30 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-sm border ${item.color}`}
                    >
                      {item.logo}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-white">{item.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">{item.category}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      item.status === "CONNECTED"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-900 border-slate-850 text-slate-400"
                    }`}
                  >
                    ● {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">RECORDS SYNCED</span>
                  <span className="font-bold text-white text-sm">{item.recordsSynced.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => alert(`Opening configuration for ${item.name}`)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Manage Connection
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
