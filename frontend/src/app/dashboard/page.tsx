"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import {
  Users,
  PhoneCall,
  Award,
  TrendingUp,
  RefreshCw,
  Phone,
  Zap,
  X
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CallSimulator from "@/components/CallSimulator";

const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada",
  "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi",
  "Urdu", "Odia", "Assamese", "Spanish", "French",
  "German", "Arabic", "Japanese"
];

interface DashboardStats {
  total_customers: number;
  total_calls: number;
  calls_in_progress: number;
  interested_leads: number;
  follow_up_required: number;
  conversion_rate: number;
  calls_queued?: number;
  calls_completed?: number;
  calls_no_answer?: number;
  calls_failed?: number;
  high_interest_leads?: number;
  medium_interest_leads?: number;
  low_interest_leads?: number;
  not_interested_leads?: number;
  daily_analytics: any[];
  weekly_analytics: any[];
  campaign_performance: any[];
  language_distribution: any[];
}

const COLORS = ["#8b5cf6", "#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#f43f5e", "#a855f7"];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCallSim, setActiveCallSim] = useState<any | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);

  // ── Quick Simulate modal state ──
  const [isQuickSimOpen, setIsQuickSimOpen] = useState(false);
  const [qsName, setQsName] = useState("");
  const [qsMobile, setQsMobile] = useState("");
  const [qsLang, setQsLang] = useState("English");
  const [qsError, setQsError] = useState("");
  const [qsLoading, setQsLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get("/api/analytics/dashboard");
      setStats(statsRes.data);
      
      const custRes = await api.get("/api/customers/?limit=5");
      setRecentCustomers(custRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll updates every 10 seconds for live calling status updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerCallSimulation = async (customer: any) => {
    try {
      const res = await api.post(`/api/calls/manual?customer_id=${customer.id}`);
      setActiveCallSim({
        callId: res.data.id,
        customerName: customer.name,
        mobile: customer.mobile,
        preferredLanguage: customer.preferred_language
      });
    } catch (err) {
      console.error(err);
      alert("Failed to initiate simulated call. Check connection.");
    }
  };

  // ── Quick Simulate: create/reuse customer by mobile, then launch sim ──
  const handleQuickSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setQsError("");
    if (!qsName.trim() || !qsMobile.trim()) {
      setQsError("Name and mobile number are required.");
      return;
    }
    setQsLoading(true);
    try {
      let customerId: number;
      try {
        const existing = await api.get(`/api/customers/?search=${encodeURIComponent(qsMobile.trim())}`);
        const found = existing.data.find((c: any) => c.mobile === qsMobile.trim());
        if (found) {
          customerId = found.id;
        } else {
          const created = await api.post("/api/customers/", {
            name: qsName.trim(), mobile: qsMobile.trim(), preferred_language: qsLang,
          });
          customerId = created.data.id;
        }
      } catch {
        const created = await api.post("/api/customers/", {
          name: qsName.trim(), mobile: qsMobile.trim(), preferred_language: qsLang,
        });
        customerId = created.data.id;
      }
      const callRes = await api.post(`/api/calls/manual?customer_id=${customerId}`);
      setIsQuickSimOpen(false);
      setQsName(""); setQsMobile(""); setQsLang("English");
      setActiveCallSim({
        callId: callRes.data.id,
        customerName: qsName.trim(),
        mobile: qsMobile.trim(),
        preferredLanguage: qsLang
      });
      fetchDashboardData();
    } catch (err: any) {
      setQsError(err.response?.data?.detail || "Failed to start simulation.");
    } finally {
      setQsLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
        <span className="ml-2 font-medium">Loading Dashboard Analytics...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[160px] pointer-events-none" />

      <Sidebar />

      {/* Main Content wrapper */}
      <main className="flex-1 md:ml-64 p-6 md:p-8 space-y-8 overflow-y-auto relative z-10">
        {/* Upper Header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Live System Dashboard
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Executive Overview
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Welcome back, <span className="text-blue-400 font-bold">{user?.username}</span> • Outbound calling operations are fully armed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Stats
            </button>
            <button
              onClick={() => { setIsQuickSimOpen(true); setQsError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-600/35 hover:scale-[1.02]"
            >
              <Zap className="h-4 w-4" /> Quick Simulate
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Customers</p>
              <h3 className="text-3xl font-black text-white">{stats?.total_customers}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Uploaded lead profiles</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Calls Attempted</p>
              <h3 className="text-3xl font-black text-white">{stats?.total_calls}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Completed & in-progress</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PhoneCall className="h-6 w-6 text-indigo-400" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Interested Leads</p>
              <h3 className="text-3xl font-black text-emerald-400">{stats?.interested_leads}</h3>
              <p className="text-[10px] text-emerald-500/80 font-medium">Hot qualified prospects</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="h-6 w-6 text-emerald-400" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversion Rate</p>
              <h3 className="text-3xl font-black text-cyan-400">{stats?.conversion_rate}%</h3>
              <p className="text-[10px] text-slate-500 font-medium">Positive qualification ratio</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* AI Outbound Qualification Breakdown Strip */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                AI Dialing Pipeline & Structured Qualification Status
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
              Live Dial Queue & Scoring
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-1">
            <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Calls Queued</p>
              <p className="text-lg font-extrabold text-blue-400 mt-0.5">{stats?.calls_queued ?? 0}</p>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Completed</p>
              <p className="text-lg font-extrabold text-slate-200 mt-0.5">{stats?.calls_completed ?? stats?.total_calls ?? 0}</p>
            </div>
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
              <p className="text-[10px] text-emerald-400 uppercase font-bold">High Interest</p>
              <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{stats?.high_interest_leads ?? 0}</p>
            </div>
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl">
              <p className="text-[10px] text-amber-400 uppercase font-bold">Medium Interest</p>
              <p className="text-lg font-extrabold text-amber-400 mt-0.5">{stats?.medium_interest_leads ?? 0}</p>
            </div>
            <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
              <p className="text-[10px] text-indigo-300 uppercase font-bold">Follow-Up / Callback</p>
              <p className="text-lg font-extrabold text-indigo-300 mt-0.5">{stats?.follow_up_required ?? 0}</p>
            </div>
            <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
              <p className="text-[10px] text-red-400 uppercase font-bold">Not Interested</p>
              <p className="text-lg font-extrabold text-red-400 mt-0.5">{stats?.not_interested_leads ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Charts & Interactive Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area Chart */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200">Daily Lead Acquisition</h4>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-extrabold uppercase">
                Last 7 Days
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.daily_analytics}>
                  <defs>
                    <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#cbd5e1" }} />
                  <Area type="monotone" dataKey="Calls" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#callsGrad)" />
                  <Area type="monotone" dataKey="Leads" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#leadsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Languages Pie Chart */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <h4 className="font-bold text-slate-200 mb-4">Preferred Languages</h4>
            <div className="h-56 relative flex items-center justify-center">
              {stats?.language_distribution && stats.language_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.language_distribution}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.language_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#cbd5e1" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-500 text-xs font-semibold">No Lead Data Available</div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-4 border-t border-slate-800">
              {stats?.language_distribution?.slice(0, 6).map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulator quick access */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent client lists with outbound test dialing */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200">Recent Customer Leads</h4>
              <span className="text-xs text-purple-400 font-bold">Manual Test Dialer</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Mobile</th>
                    <th className="pb-3">Language</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentCustomers.map((cust) => (
                    <tr key={cust.id} className="text-slate-300">
                      <td className="py-3 font-semibold text-slate-200">{cust.name}</td>
                      <td className="py-3">{cust.mobile}</td>
                      <td className="py-3">{cust.preferred_language}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          cust.status === "Interested"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : cust.status === "Maybe Interested"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => triggerCallSimulation(cust)}
                          className="px-3 py-1.5 bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg font-bold flex items-center gap-1.5 ml-auto cursor-pointer transition-all"
                        >
                          <Phone className="h-3.5 w-3.5" /> Call AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign Analytics List */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-200">Campaign Efficiencies</h4>
            <div className="space-y-4">
              {stats?.campaign_performance && stats.campaign_performance.length > 0 ? (
                stats.campaign_performance.map((camp) => (
                  <div key={camp.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate w-40">{camp.name}</span>
                      <span className="text-purple-400">{camp.rate}% CR</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" style={{ width: `${Math.min(camp.rate, 100)}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs text-center py-6">No Campaign runs configured</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Interactive voice call simulator popup */}
      {activeCallSim && (
        <CallSimulator
          callId={activeCallSim.callId}
          customerName={activeCallSim.customerName}
          mobile={activeCallSim.mobile}
          preferredLanguage={activeCallSim.preferredLanguage}
          onClose={() => {
            setActiveCallSim(null);
            fetchDashboardData();
          }}
          onCallCompleted={fetchDashboardData}
        />
      )}

      {/* Quick Simulate modal */}
      {isQuickSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div>
                <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-400" /> Quick Simulate
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Run an AI call simulation with any number</p>
              </div>
              <button onClick={() => setIsQuickSimOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuickSimulate} className="space-y-4">
              {qsError && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg">{qsError}</div>
              )}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Customer Name</label>
                <input type="text" required value={qsName} onChange={(e) => setQsName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Ravi Kumar" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mobile Number</label>
                <input type="text" required value={qsMobile} onChange={(e) => setQsMobile(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. +919876543210" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Preferred Language</label>
                <select value={qsLang} onChange={(e) => setQsLang(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsQuickSimOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 bg-slate-900 hover:bg-slate-850 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={qsLoading}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  {qsLoading ? "Starting..." : "Start Simulation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
