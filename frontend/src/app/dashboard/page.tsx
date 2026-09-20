"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AIBotMascot from "@/components/AIBotMascot";
import SparklineWave from "@/components/SparklineWave";
import api from "@/lib/api";

export default function MinimalistDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<"Weekly" | "Monthly" | "Daily">("Weekly");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<"Models" | "Voices" | "Prompt">("Models");
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Pro");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(2); // Default Wednesday (380)

  // Chart data matching screenshot curve across Mon - Sun
  const weeklyData = [
    { day: "Mon", calls: 340, x: 40, y: 140 },
    { day: "Tue", calls: 280, x: 140, y: 175 },
    { day: "Wed", calls: 380, x: 240, y: 110 },
    { day: "Thu", calls: 160, x: 340, y: 240 },
    { day: "Fri", calls: 270, x: 440, y: 180 },
    { day: "Sat", calls: 350, x: 540, y: 130 },
    { day: "Sun", calls: 430, x: 640, y: 80 },
  ];

  // Models list matching the screenshot
  const models = [
    { id: "gpt-5", name: "GPT-5", provider: "OpenAI", status: "Available" },
    { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", status: "Available" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google DeepMind", active: true },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google DeepMind", status: "Fast" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", status: "Available" },
  ];

  // Domain agents matching the screenshot
  const domainAgents = [
    { name: "Real Estate", sparkColor: "blue" as const, points: [20, 24, 28, 22, 34, 30, 36, 32, 40] },
    { name: "eCommerce", sparkColor: "amber" as const, points: [18, 26, 22, 32, 28, 38, 34, 39, 36] },
    { name: "Healthcare", sparkColor: "amber" as const, points: [22, 20, 28, 24, 30, 26, 34, 31, 38] },
    { name: "NBFC", sparkColor: "blue" as const, points: [19, 23, 27, 21, 32, 29, 35, 33, 39] },
  ];

  // Recent call records matching the screenshot table
  const recentCalls = [
    {
      id: "call-1",
      user: "John",
      date: "Sep 23, 2025",
      phone: "+1 (123) 456-XXXX",
      sentiment: "Positive",
      sentimentColor: "text-emerald-400",
      status: "Complete",
    },
    {
      id: "call-2",
      user: "Aryan",
      date: "Sep 22, 2025",
      phone: "+91 999999XXXX",
      sentiment: "Neutral",
      sentimentColor: "text-slate-300",
      status: "Complete",
    },
    {
      id: "call-3",
      user: "Priya Sharma",
      date: "Sep 22, 2025",
      phone: "+91 987654XXXX",
      sentiment: "Positive",
      sentimentColor: "text-emerald-400",
      status: "Complete",
    },
    {
      id: "call-4",
      user: "Rahul Verma",
      date: "Sep 21, 2025",
      phone: "+91 976543XXXX",
      sentiment: "Positive",
      sentimentColor: "text-emerald-400",
      status: "Complete",
    },
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get("/api/analytics/dashboard");
        if (res.data) setStats(res.data);
      } catch (err) {
        // Fallback to high-fidelity defaults
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D17] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-[#635BFF] selection:text-white">
      <Sidebar />

      {/* Main Canvas */}
      <main className="flex-1 md:ml-60 p-5 md:p-8 space-y-6 overflow-y-auto">
        <TopBar title="Dashboard" />

        {/* 2-Column Grid Layout matching screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ════════ LEFT / MAIN COLUMN (8 cols) ════════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Purple Hero Metrics Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-[#5B50E5] via-[#6558F5] to-[#7B61FF] p-6 sm:p-8 text-white shadow-xl shadow-[#635BFF]/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              {/* Metrics Left Area */}
              <div className="space-y-6 w-full sm:w-auto z-10">
                {/* Top Row: Total Calls & Total Messages */}
                <div className="flex items-center gap-10 sm:gap-14">
                  <div>
                    <p className="text-xs font-medium text-white/80">Total Calls</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                      {stats?.total_calls ? stats.total_calls.toLocaleString() : "1,254"}
                    </h2>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-white/80">Total Messages</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                      {stats?.total_customers ? (stats.total_customers * 9.5).toFixed(0).toLocaleString() : "12,056"}
                    </h2>
                  </div>
                </div>

                {/* Bottom Row: Agents, Success Rate, Total Duration */}
                <div className="flex items-center gap-8 sm:gap-10 pt-2 border-t border-white/15">
                  <div>
                    <p className="text-[11px] font-medium text-white/75">Agents</p>
                    <p className="text-base sm:text-lg font-bold mt-0.5">10</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-white/75">Success Rate</p>
                    <p className="text-base sm:text-lg font-bold mt-0.5">89%</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-white/75">Total Duration</p>
                    <p className="text-base sm:text-lg font-bold mt-0.5">5,430 Mins</p>
                  </div>
                </div>
              </div>

              {/* Right Mascot Illustration */}
              <div className="shrink-0 z-10">
                <AIBotMascot />
              </div>
            </div>

            {/* 2. Overview Spline Chart Card */}
            <div className="bg-[#121524] rounded-3xl p-6 border border-slate-800/60 space-y-4 shadow-sm">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight">Overview</h3>

                {/* Time range selector dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-[#171a2e] border border-slate-800/80 transition-colors"
                  >
                    <span>{timeRange}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {isTimeDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-28 rounded-xl bg-[#171a2e] border border-slate-800 shadow-xl py-1 z-30">
                      {(["Weekly", "Monthly", "Daily"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setTimeRange(r);
                            setIsTimeDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-[#635BFF] hover:text-white transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Spline Chart SVG Area */}
              <div className="relative w-full h-64 pt-2">
                {/* SVG Graph */}
                <svg viewBox="0 0 680 260" className="w-full h-full overflow-visible">
                  <defs>
                    {/* Linear Gradient for fill under curve */}
                    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#635BFF" stopOpacity="0.32" />
                      <stop offset="60%" stopColor="#635BFF" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#635BFF" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Filter for glowing line */}
                    <filter id="glowLine" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Y-Axis Grid Lines & Labels */}
                  {[
                    { label: "500", y: 40 },
                    { label: "400", y: 90 },
                    { label: "300", y: 140 },
                    { label: "200", y: 190 },
                    { label: "100", y: 240 },
                  ].map((grid, i) => (
                    <g key={i}>
                      <text x="5" y={grid.y + 4} fill="#4B556D" fontSize="10" fontFamily="sans-serif">
                        {grid.label}
                      </text>
                      <line
                        x1="35"
                        y1={grid.y}
                        x2="670"
                        y2={grid.y}
                        stroke="#1C2136"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    </g>
                  ))}

                  {/* Shaded Area Below Curve */}
                  <path
                    d="M 40,140 C 90,140 90,175 140,175 C 190,175 190,110 240,110 C 290,110 290,240 340,240 C 390,240 390,180 440,180 C 490,180 490,130 540,130 C 590,130 590,80 640,80 L 640,250 L 40,250 Z"
                    fill="url(#curveGradient)"
                  />

                  {/* Main Smooth Purple Spline Curve */}
                  <path
                    d="M 40,140 C 90,140 90,175 140,175 C 190,175 190,110 240,110 C 290,110 290,240 340,240 C 390,240 390,180 440,180 C 490,180 490,130 540,130 C 590,130 590,80 640,80"
                    fill="none"
                    stroke="#6D5DFB"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#glowLine)"
                  />

                  {/* Interactive Nodes for each day */}
                  {weeklyData.map((pt, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g
                        key={pt.day}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                      >
                        {/* Invisible hover hotspot */}
                        <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                        {/* Outer pulsing ring when active */}
                        {isHovered && (
                          <>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="12"
                              fill="#635BFF"
                              opacity="0.35"
                              className="animate-ping"
                            />
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="8"
                              fill="#635BFF"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            <circle cx={pt.x} cy={pt.y} r="3" fill="#FFFFFF" />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Pill (Matching screenshot: 380 Wednesday) */}
                {hoveredPointIndex !== null && (
                  <div
                    className="absolute pointer-events-none transition-all duration-200"
                    style={{
                      left: `calc(${(weeklyData[hoveredPointIndex].x / 680) * 100}% - 44px)`,
                      top: `calc(${(weeklyData[hoveredPointIndex].y / 260) * 100}% - 58px)`,
                    }}
                  >
                    <div className="bg-[#191D30] border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-xl text-center">
                      <p className="text-xs font-extrabold text-white leading-none">
                        {weeklyData[hoveredPointIndex].calls}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {weeklyData[hoveredPointIndex].day === "Wed"
                          ? "Wednesday"
                          : weeklyData[hoveredPointIndex].day === "Mon"
                          ? "Monday"
                          : weeklyData[hoveredPointIndex].day === "Tue"
                          ? "Tuesday"
                          : weeklyData[hoveredPointIndex].day === "Thu"
                          ? "Thursday"
                          : weeklyData[hoveredPointIndex].day === "Fri"
                          ? "Friday"
                          : weeklyData[hoveredPointIndex].day === "Sat"
                          ? "Saturday"
                          : "Sunday"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* X-Axis Days Labels */}
              <div className="flex justify-between px-6 pt-1 text-xs text-slate-400 font-medium">
                {weeklyData.map((pt, idx) => (
                  <button
                    key={pt.day}
                    onClick={() => setHoveredPointIndex(idx)}
                    className={`transition-colors ${
                      hoveredPointIndex === idx ? "text-white font-bold" : "hover:text-slate-300"
                    }`}
                  >
                    {pt.day}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Recent Call Intelligence Table */}
            <div className="bg-[#121524] rounded-3xl p-6 border border-slate-800/60 space-y-4 shadow-sm">
              {/* Header with Filter Button */}
              <div className="flex items-center justify-end">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#635BFF] hover:bg-[#5349EE] text-white text-xs font-semibold shadow-md shadow-[#635BFF]/30 transition-all hover:scale-[1.02]">
                  <span>Filter</span>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Clean Minimalist Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-medium border-b border-slate-800/70 pb-3">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Phone No.</th>
                      <th className="pb-3 font-medium">Sentiment</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {recentCalls.map((call) => (
                      <tr key={call.id} className="hover:bg-[#161a2e]/60 transition-colors">
                        <td className="py-4 font-semibold text-white">{call.user}</td>
                        <td className="py-4 text-slate-400">{call.date}</td>
                        <td className="py-4 text-slate-300 font-mono text-[11px]">{call.phone}</td>
                        <td className={`py-4 font-medium ${call.sentimentColor}`}>{call.sentiment}</td>
                        <td className="py-4 text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#221c17] text-[#FFA842] border border-[#FFA842]/20">
                            {call.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ════════ RIGHT COLUMN (4 cols) ════════ */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. Agent Configuration Card */}
            <div className="bg-[#121524] rounded-3xl p-6 border border-slate-800/60 space-y-5 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Agent Configuration
                </h3>
                <button
                  title="Options"
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Subtabs: Models (active pill), Voices, Prompt */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveConfigTab("Models")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeConfigTab === "Models"
                      ? "bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Models
                </button>

                <button
                  onClick={() => setActiveConfigTab("Voices")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeConfigTab === "Voices"
                      ? "bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Voices
                </button>

                <button
                  onClick={() => setActiveConfigTab("Prompt")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeConfigTab === "Prompt"
                      ? "bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Prompt
                </button>
              </div>

              {/* Tab Content */}
              {activeConfigTab === "Models" && (
                <div className="space-y-2.5">
                  {models.map((m) => {
                    const isSelected = selectedModel === m.name;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModel(m.name)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-[#171a30] border-[#635BFF]/60 shadow-sm"
                            : "bg-[#0E111E] border-slate-800/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? "bg-[#635BFF] shadow-[0_0_8px_#635BFF]" : "bg-slate-600"
                            }`}
                          />
                          <div>
                            <p className="text-xs font-semibold text-white">{m.name}</p>
                            <p className="text-[10px] text-slate-500">{m.provider}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-[#635BFF]/20 flex items-center justify-center text-[#8C7BFF]">
                            <RefreshCw className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeConfigTab === "Voices" && (
                <div className="space-y-2.5">
                  {[
                    { name: "Maya (Hindi/Indian English)", type: "Neural Warm" },
                    { name: "Aarav (Telugu/Hindi)", type: "Professional Male" },
                    { name: "Priya (Indian English)", type: "Executive Female" },
                  ].map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-[#0E111E] border border-slate-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">{v.name}</p>
                        <p className="text-[10px] text-slate-500">{v.type}</p>
                      </div>
                      <span className="text-[10px] text-[#8C7BFF] font-medium">Ready</span>
                    </div>
                  ))}
                  <Link
                    href="/ai-studio"
                    className="block text-center text-xs text-[#8C7BFF] hover:underline pt-1 font-medium"
                  >
                    Open AI Voice Studio →
                  </Link>
                </div>
              )}

              {activeConfigTab === "Prompt" && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-[#0E111E] border border-slate-800/60 text-xs text-slate-300 leading-relaxed font-sans">
                    "You are Maya, senior qualifying representative for Multi-Lingual Generative Voice Calling Agent. Greet warmly in customer's preferred language, qualify interest, and schedule sales call."
                  </div>
                  <Link
                    href="/settings"
                    className="block text-center text-xs text-[#8C7BFF] hover:underline pt-1 font-medium"
                  >
                    Configure Directives in Settings →
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Agents Domain Telemetry Card */}
            <div className="bg-[#121524] rounded-3xl p-6 border border-slate-800/60 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-white tracking-tight">Agents</h3>

              <div className="space-y-2">
                {domainAgents.map((agent) => (
                  <div
                    key={agent.name}
                    className="p-3.5 rounded-2xl bg-[#0E111E] border border-slate-800/60 hover:border-slate-700/80 flex items-center justify-between transition-all"
                  >
                    <span className="text-xs font-semibold text-slate-200">{agent.name}</span>
                    <SparklineWave color={agent.sparkColor} points={agent.points} />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/campaigns"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#171a2e] hover:bg-[#1c2138] text-xs font-semibold text-[#8C7BFF] transition-all border border-slate-800/80"
                >
                  <span>Launch Agent Campaign</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

