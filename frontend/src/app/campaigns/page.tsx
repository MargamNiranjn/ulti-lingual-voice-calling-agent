"use client";

import React, { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import CampaignWorkflowBuilder from "@/components/CampaignWorkflowBuilder";
import api from "@/lib/api";
import {
  Play,
  Pause,
  Square,
  Plus,
  PhoneCall,
  X,
  AlertCircle,
  Radio,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import CallSimulator from "@/components/CallSimulator";

interface Campaign {
  id: number;
  name: string;
  status: string;
  retry_count: number;
  retry_delay_minutes: number;
  created_at: string;
  total_customers: number;
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  qualified_leads: number;
  conversion_rate: number;
  average_duration: number;
}

interface LiveCall {
  call_id: number;
  customer_id: number;
  customer_name: string;
  mobile: string;
  language: string;
  status: string;
  campaign_id: number | null;
  created_at: string;
}

// Badge colours per call status
function statusBadge(s: string) {
  switch (s) {
    case "Answered":    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Ringing":     return "bg-amber-500/10  text-amber-400  border-amber-500/20  animate-pulse";
    case "In-Progress": return "bg-blue-500/10   text-blue-400   border-blue-500/20   animate-pulse";
    case "Pending":     return "bg-slate-800      text-slate-400  border-slate-700";
    case "No-Answer":
    case "Failed":      return "bg-red-500/10    text-red-400    border-red-500/20";
    case "Completed":   return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default:            return "bg-slate-800      text-slate-400  border-slate-700";
  }
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCallSim, setActiveCallSim] = useState<any | null>(null);

  // Live calls polling state
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Expanded campaign call queue
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [campaignCalls, setCampaignCalls] = useState<any[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [retryCount, setRetryCount] = useState(2);
  const [retryDelay, setRetryDelay] = useState(60);
  const [assignCriteria, setAssignCriteria] = useState("all_new");
  const [assignLanguage, setAssignLanguage] = useState("English");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Data fetchers ───────────────────────────────────────────────────────────

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/campaigns/");
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignCalls = async (campId: number) => {
    try {
      setLoadingCalls(true);
      const res = await api.get(`/api/calls/?campaign_id=${campId}`);
      setCampaignCalls(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCalls(false);
    }
  };

  const fetchLiveCalls = async () => {
    try {
      const res = await api.get("/api/calls/status/live");
      setLiveCalls(res.data);
    } catch {
      // silently ignore — non-critical polling
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCampaigns();
    fetchLiveCalls();
  }, []);

  // Whenever campaigns change, start/stop live-call polling based on Running status
  useEffect(() => {
    const hasRunning = campaigns.some((c) => c.status === "Running");

    if (hasRunning && !liveIntervalRef.current) {
      // Poll every 5 seconds while at least one campaign is running
      liveIntervalRef.current = setInterval(() => {
        fetchLiveCalls();
        fetchCampaigns();
        if (expandedCampaignId !== null) fetchCampaignCalls(expandedCampaignId);
      }, 5000);
    } else if (!hasRunning && liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
      fetchLiveCalls(); // final refresh to clear stale badges
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [campaigns, expandedCampaignId]);

  useEffect(() => {
    if (expandedCampaignId !== null) fetchCampaignCalls(expandedCampaignId);
  }, [expandedCampaignId]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleStart = async (id: number) => {
    try {
      await api.post(`/api/campaigns/${id}/start`);
      fetchCampaigns();
      fetchLiveCalls();
      if (expandedCampaignId === id) fetchCampaignCalls(id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start campaign.");
    }
  };

  const handleStartAI = async (id: number) => {
    try {
      const res = await api.post(`/api/campaigns/${id}/start-ai`);
      alert(`🚀 ${res.data?.message || "AI Campaign started in background queue!"}`);
      fetchCampaigns();
      fetchLiveCalls();
      if (expandedCampaignId === id) fetchCampaignCalls(id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start AI campaign.");
    }
  };

  const handlePause = async (id: number) => {
    try {
      await api.post(`/api/campaigns/${id}/pause`);
      fetchCampaigns();
    } catch { alert("Failed to pause campaign."); }
  };

  const handleStop = async (id: number) => {
    try {
      await api.post(`/api/campaigns/${id}/stop`);
      fetchCampaigns();
    } catch { alert("Failed to stop campaign."); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this campaign? All call logs will be removed.")) return;
    try {
      await api.delete(`/api/campaigns/${id}`);
      if (expandedCampaignId === id) setExpandedCampaignId(null);
      fetchCampaigns();
    } catch { alert("Failed to delete campaign."); }
  };

  const triggerCallSimulation = (call: any) => {
    setActiveCallSim({
      callId: call.id,
      customerName: call.customer.name,
      mobile: call.customer.mobile,
      preferredLanguage: call.customer.preferred_language
    });
  };

  const triggerAutoSimulate = async (callId: number) => {
    try {
      await api.post(`/api/calls/auto-simulate/${callId}`);
      if (expandedCampaignId) {
        fetchCampaignCalls(expandedCampaignId);
        fetchCampaigns();
      }
    } catch { alert("Failed to auto-simulate call."); }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    if (!name.trim()) { setFormError("Campaign Name is required"); setIsSubmitting(false); return; }

    try {
      if (assignCriteria === "csv_upload") {
        if (!csvFile) { setFormError("Please select a CSV file."); setIsSubmitting(false); return; }
        const fd = new FormData();
        fd.append("name", name);
        fd.append("retry_count", retryCount.toString());
        fd.append("retry_delay_minutes", retryDelay.toString());
        fd.append("file", csvFile);
        await api.post("/api/campaigns/create-from-csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const custRes = assignCriteria === "language"
          ? await api.get(`/api/customers/?language=${assignLanguage}`)
          : await api.get(`/api/customers/?status_filter=New`);
        const customerIds = custRes.data.map((c: any) => c.id);
        if (customerIds.length === 0) {
          setFormError(`No leads found for selected criteria. Add leads first.`);
          setIsSubmitting(false); return;
        }
        await api.post("/api/campaigns/", { name, retry_count: retryCount, retry_delay_minutes: retryDelay, customer_ids: customerIds });
      }
      setIsCreateOpen(false);
      setName(""); setCsvFile(null); setAssignCriteria("all_new");
      fetchCampaigns();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRunning = campaigns.some((c) => c.status === "Running");

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      {/* Neural glow backdrops */}
      <div className="absolute top-[-10%] left-[15%] w-[650px] h-[650px] bg-cyan-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[550px] h-[550px] bg-violet-600/10 rounded-full blur-[180px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-7 overflow-y-auto relative z-10">
        <TopBar
          title="Campaign Mission Control"
          subtitle="Orchestrate Bulk Outbound Voice Calling, Language Routing & Lead Qualification"
          activeCallsCount={liveCalls.length}
        />

        {/* ── Visual Campaign Workflow Builder ── */}
        <CampaignWorkflowBuilder
          isRunning={isRunning}
          onLaunch={() => {
            if (campaigns.length > 0) {
              handleStartAI(campaigns[0].id);
            } else {
              setIsCreateOpen(true);
            }
          }}
        />

        {/* Action Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              ACTIVE OUTBOUND CAMPAIGNS
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous dialing campaigns with sequential retry and live status telemetry.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-mono uppercase"
          >
            <Plus className="h-4 w-4" /> Create Campaign
          </button>
        </div>

        {/* ── Live Calls Banner (visible only when calls are active) ── */}
        {liveCalls.length > 0 && (
          <div className="glass-card rounded-2xl border border-blue-500/20 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {liveCalls.length} Active Real Call{liveCalls.length > 1 ? "s" : ""} in Progress
              </span>
              <span className="ml-auto text-[10px] text-slate-500">Auto-refreshing every 5s</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveCalls.map((lc) => (
                <div key={lc.call_id} className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    lc.status === "Ringing" ? "bg-amber-400 animate-ping" :
                    lc.status === "In-Progress" ? "bg-blue-400 animate-pulse" : "bg-slate-500"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{lc.customer_name}</p>
                    <p className="text-[10px] text-slate-500">{lc.mobile} · {lc.language}</p>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${statusBadge(lc.status)}`}>
                    {lc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Campaign List ── */}
        {loading && campaigns.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-slate-500 text-xs">
            <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2" />
            Loading outbound campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-card text-center py-20 text-slate-500 border border-slate-900 rounded-2xl">
            <AlertCircle className="h-10 w-10 mx-auto text-slate-700 mb-2" />
            <p className="font-semibold text-sm">No Campaigns Found</p>
            <p className="text-xs max-w-xs mx-auto pt-1">Create a campaign, assign leads, and start qualifying them automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((camp) => {
              const progressPct = camp.total_customers > 0 ? (camp.total_calls / camp.total_customers) * 100 : 0;
              const campLive = liveCalls.filter((lc) => lc.campaign_id === camp.id);

              return (
                <div
                  key={camp.id}
                  className={`glass-card rounded-2xl border p-6 flex flex-col gap-6 transition-all ${
                    expandedCampaignId === camp.id ? "border-purple-500/50 shadow-lg shadow-purple-900/10" : "border-slate-850"
                  }`}
                >
                  {/* Title & controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-200">{camp.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${statusBadge(camp.status)}`}>
                          {camp.status}
                        </span>
                        {/* Live call count bubble */}
                        {campLive.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Radio className="h-2.5 w-2.5 animate-pulse" />
                            {campLive.length} live
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Created: {new Date(camp.created_at).toLocaleDateString()} · Retry {camp.retry_count}× every {camp.retry_delay_minutes}min</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {camp.status !== "Running" && (
                        <button
                          onClick={() => handleStartAI(camp.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-purple-900/30 transition-all"
                          title="Launch AI Multilingual Outbound Calling Campaign"
                        >
                          <Radio className="h-3.5 w-3.5 animate-pulse" /> Start AI
                        </button>
                      )}
                      {camp.status !== "Running" && camp.status !== "Completed" && (
                        <button onClick={() => handleStart(camp.id)}
                          className="p-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl cursor-pointer transition-all" title="Start Manual Dial Queue">
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {camp.status === "Running" && (
                        <button onClick={() => handlePause(camp.id)}
                          className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer" title="Pause Campaign">
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      {(camp.status === "Running" || camp.status === "Paused") && (
                        <button onClick={() => handleStop(camp.id)}
                          className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer" title="Stop Campaign">
                          <Square className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)}
                        className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        {expandedCampaignId === camp.id ? "Collapse" : "View Calls"}
                      </button>
                      <button onClick={() => handleDelete(camp.id)}
                        className="px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/10 hover:bg-red-500/5 rounded-xl cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 border border-slate-900 rounded-xl text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Leads</p>
                      <p className="text-base font-bold text-slate-200 mt-0.5">{camp.total_customers}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Calls Attempted</p>
                      <p className="text-base font-bold text-slate-200 mt-0.5">{camp.total_calls}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Hot Leads</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">{camp.qualified_leads}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Conversion</p>
                      <p className="text-base font-bold text-purple-400 mt-0.5">{camp.conversion_rate}%</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Dialing Progress</span>
                      <span>{Math.round(progressPct)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>

                  {/* Expanded call queue */}
                  {expandedCampaignId === camp.id && (
                    <div className="pt-4 border-t border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400">Outbound Dial Queue — {camp.name}</h4>
                        <button onClick={() => fetchCampaignCalls(camp.id)}
                          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer">
                          <RefreshCw className="h-3 w-3" /> Refresh
                        </button>
                      </div>

                      {loadingCalls ? (
                        <div className="text-slate-500 text-xs py-4">Loading calls queue...</div>
                      ) : campaignCalls.length === 0 ? (
                        <div className="text-slate-500 text-xs py-4">No calls generated yet. Click Start ▶ to populate the dial queue.</div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-900 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-slate-900/60 text-slate-500 font-semibold">
                              <tr>
                                <th className="px-4 py-3">Lead Name</th>
                                <th className="px-4 py-3">Mobile</th>
                                <th className="px-4 py-3">Language</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">AI Summary</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900">
                              {campaignCalls.map((call) => {
                                // Check if this call is currently live (real phone ringing/in-progress)
                                const isLive = liveCalls.some((lc) => lc.call_id === call.id);
                                return (
                                  <tr key={call.id} className={`text-slate-300 ${isLive ? "bg-blue-500/5" : ""}`}>
                                    <td className="px-4 py-3 font-bold text-slate-200">
                                      {call.customer?.name}
                                      {isLive && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />}
                                    </td>
                                    <td className="px-4 py-3">{call.customer?.mobile}</td>
                                    <td className="px-4 py-3">{call.customer?.preferred_language}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${statusBadge(call.status)}`}>
                                        {call.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 max-w-xs">
                                      {call.ai_summary
                                        ? <span className="text-slate-400 truncate block">{call.ai_summary.summary}</span>
                                        : <span className="text-slate-600 italic">
                                            {isLive ? "Call in progress..." : "No summary yet"}
                                          </span>
                                      }
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                      {call.status === "Pending" && (
                                        <>
                                          <button onClick={() => triggerCallSimulation(call)}
                                            className="px-2.5 py-1 text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-600 hover:text-white rounded-lg cursor-pointer">
                                            Simulate
                                          </button>
                                          <button onClick={() => triggerAutoSimulate(call.id)}
                                            className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white rounded-lg cursor-pointer">
                                            Auto Dial
                                          </button>
                                        </>
                                      )}
                                      {call.status === "Answered" && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                          <CheckCircle2 className="h-3 w-3" /> Done
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Create Campaign Modal ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="font-bold text-slate-200 text-lg">Create Campaign</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {formError && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg">{formError}</div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Campaign Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. Q3 Sales Lead Qualifier" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Retry Count</label>
                  <input type="number" value={retryCount} onChange={(e) => setRetryCount(parseInt(e.target.value))}
                    className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    min={0} max={5} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Delay (mins)</label>
                  <input type="number" value={retryDelay} onChange={(e) => setRetryDelay(parseInt(e.target.value))}
                    className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    min={5} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Leads Selection</label>
                <select value={assignCriteria} onChange={(e) => setAssignCriteria(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-300 focus:outline-none">
                  <option value="all_new">All leads with New status</option>
                  <option value="language">By Preferred Language</option>
                  <option value="csv_upload">Upload CSV File</option>
                </select>
              </div>

              {assignCriteria === "language" && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Language Group</label>
                  <select value={assignLanguage} onChange={(e) => setAssignLanguage(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-300 focus:outline-none">
                    {["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Bengali","Marathi","Gujarati","Punjabi","Urdu","Odia","Assamese","Spanish","French","German","Arabic","Japanese"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}

              {assignCriteria === "csv_upload" && (
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">CSV File</label>
                  <input type="file" accept=".csv" required
                    onChange={(e) => { if (e.target.files?.[0]) setCsvFile(e.target.files[0]); }}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer" />
                  <p className="text-[9px] text-slate-500">Format: Name, Mobile, Language (e.g. Raju, 9876543210, Hindi)</p>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-800 pt-3 mt-4">
                <button type="button" onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 bg-slate-900 hover:bg-slate-850 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg cursor-pointer disabled:opacity-50">
                  {isSubmitting ? "Creating..." : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Call Simulator Overlay ── */}
      {activeCallSim && (
        <CallSimulator
          callId={activeCallSim.callId}
          customerName={activeCallSim.customerName}
          mobile={activeCallSim.mobile}
          preferredLanguage={activeCallSim.preferredLanguage}
          onClose={() => {
            setActiveCallSim(null);
            if (expandedCampaignId) fetchCampaignCalls(expandedCampaignId);
            fetchCampaigns();
          }}
          onCallCompleted={() => {
            if (expandedCampaignId) fetchCampaignCalls(expandedCampaignId);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}
