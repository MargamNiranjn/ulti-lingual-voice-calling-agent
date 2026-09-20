"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import {
  BarChart3,
  TrendingUp,
  Award,
  PhoneCall,
  Clock,
  Zap,
  Globe2,
  Calendar,
  Filter,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Last 7 Days");

  const callsOverTimeData = [
    { date: "Mon", calls: 1420, hot: 184, conversion: 18.2 },
    { date: "Tue", calls: 1890, hot: 242, conversion: 19.5 },
    { date: "Wed", calls: 2150, hot: 290, conversion: 21.0 },
    { date: "Thu", calls: 2480, hot: 340, conversion: 22.4 },
    { date: "Fri", calls: 2310, hot: 310, conversion: 20.8 },
    { date: "Sat", calls: 1290, hot: 145, conversion: 16.5 },
    { date: "Sun", calls: 1300, hot: 160, conversion: 17.2 },
  ];

  const languagePerformanceData = [
    { name: "Telugu", value: 42, qualifiedRate: 78.4, color: "#00f0ff" },
    { name: "Hindi", value: 34, qualifiedRate: 71.2, color: "#3b82f6" },
    { name: "English", value: 24, qualifiedRate: 64.9, color: "#8b5cf6" },
  ];

  const funnelData = [
    { stage: "Numbers Queued", count: 12840, pct: 100 },
    { stage: "Calls Connected", count: 8780, pct: 68.4 },
    { stage: "Multi-Turn Dialogue", count: 6420, pct: 50.0 },
    { stage: "Requirements Gathered", count: 3210, pct: 25.0 },
    { stage: "Hot Qualified Leads", count: 1284, pct: 18.7 },
  ];

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-7 overflow-y-auto relative z-10">
        <TopBar
          title="Voice Operations Analytics"
          subtitle="Real-Time Conversion Rates, Multilingual Intelligence & AI Performance Telemetry"
        />

        {/* ── Top Metric Cards Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Calls</span>
            <h3 className="text-2xl font-black font-mono text-white">12,840</h3>
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> +18.4%
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Answer Rate</span>
            <h3 className="text-2xl font-black font-mono text-cyan-400">68.4%</h3>
            <span className="text-[10px] text-slate-400 font-mono">PSTN Connect</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Avg Duration</span>
            <h3 className="text-2xl font-black font-mono text-blue-400">03:42</h3>
            <span className="text-[10px] text-slate-400 font-mono">Full Turns</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Hot Leads</span>
            <h3 className="text-2xl font-black font-mono text-emerald-400">1,284</h3>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">Action Ready</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Conversion</span>
            <h3 className="text-2xl font-black font-mono text-violet-400">18.7%</h3>
            <span className="text-[10px] text-violet-400 font-mono font-bold">Qualified</span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-cyan-500/20 space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Latency</span>
            <h3 className="text-2xl font-black font-mono text-cyan-300">~780ms</h3>
            <span className="text-[10px] text-cyan-400 font-mono">Human-Parity</span>
          </div>
        </div>

        {/* ── Visual Analytics Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Area Chart (8 cols) */}
          <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider font-mono text-white">
                  Call Volume & Hot Lead Acquisition Over Time
                </h4>
                <p className="text-xs text-slate-400">Interactive telemetry across active campaigns</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-500/30">
                Hourly Resolution
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callsOverTimeData}>
                  <defs>
                    <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hotGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontStyle="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontStyle="monospace" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#070b14",
                      borderColor: "rgba(0, 240, 255, 0.3)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="#00f0ff" strokeWidth={2.5} fillOpacity={1} fill="url(#callsGrad)" name="Total Outbound" />
                  <Area type="monotone" dataKey="hot" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#hotGrad)" name="Qualified Hot Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Multilingual Performance Pie Breakdown (4 cols) */}
          <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider font-mono text-white">
                Language Distribution & Yield
              </h4>
              <p className="text-xs text-slate-400">Prospect language engagement percentage</p>
            </div>

            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languagePerformanceData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {languagePerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#070b14",
                      borderColor: "rgba(0, 240, 255, 0.3)",
                      borderRadius: "12px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs font-mono">
              {languagePerformanceData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">{item.qualifiedRate}% Qualified</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Conversion Funnel Stream ── */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wider font-mono text-white">
            Lead Qualification Funnel Efficiency
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {funnelData.map((f, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 space-y-2 relative"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>STAGE 0{i + 1}</span>
                  <span className="text-cyan-400 font-bold">{f.pct}%</span>
                </div>
                <p className="text-xs font-bold text-white font-sans">{f.stage}</p>
                <p className="text-xl font-black font-mono text-slate-200">{f.count.toLocaleString()}</p>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
