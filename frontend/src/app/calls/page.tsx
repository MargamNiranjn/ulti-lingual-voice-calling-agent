"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import {
  FileDown,
  Activity,
  Calendar,
  Clock,
  TrendingUp,
  Smile,
  Globe,
  FileText,
  User,
  X,
  PhoneCall,
  Search,
  AlertCircle
} from "lucide-react";
import TopBar from "@/components/TopBar";

interface Call {
  id: number;
  sid: string | null;
  customer_id: number;
  campaign_id: number | null;
  status: string;
  duration: number;
  recording_url: string | null;
  created_at: string;
  customer: {
    name: string;
    mobile: string;
    preferred_language: string;
    company_name: string | null;
    service_of_interest?: string | null;
    interest_level?: string | null;
    customer_requirement?: string | null;
  };
  ai_summary: {
    transcript: string | null;
    summary: string | null;
    interest_status: string;
    interest_level?: string;
    lead_score: number;
    sentiment: string;
    service_required?: string | null;
    customer_requirement?: string | null;
    timeline?: string | null;
    follow_up_required?: boolean;
    preferred_callback_time: string | null;
    language_used: string;
    ai_notes: string | null;
  } | null;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/calls/");
      setCalls(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleExportCSV = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("leadsense_token") || "";
      window.open(`http://localhost:8000/api/analytics/export/csv?token=${token}`, "_blank");
    }
  };

  // Simple dialog dialogue bubbles formatter
  const renderTranscriptBubbles = (transcriptText: string | null) => {
    if (!transcriptText) return <p className="text-slate-500 italic text-xs">No transcript dialogue recorded.</p>;
    
    const lines = transcriptText.split("\n");
    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const parts = line.split(":");
          const sender = parts[0]?.trim();
          const content = parts.slice(1).join(":").trim();
          
          if (!content) return null;
          
          const isAgent = sender === "ASSISTANT" || sender === "AGENT";
          return (
            <div key={idx} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                isAgent 
                  ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none" 
                  : "bg-purple-600 text-white rounded-tr-none"
              }`}>
                <p className="text-[9px] opacity-60 font-bold mb-0.5 uppercase">
                  {isAgent ? "AI Voice Agent" : "Lead (Customer)"}
                </p>
                <p>{content}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Filter local call logs list
  const filteredCalls = calls.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.customer.name.toLowerCase().includes(term) ||
      c.customer.mobile.includes(term) ||
      (c.customer.company_name && c.customer.company_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-6 overflow-y-auto relative z-10">
        <TopBar
          title="Call Connected Records"
          subtitle="Real-Time Call Analytics, Multi-Turn Dialogue Transcripts & Lead Intent Extraction"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              CALL HISTORY & TRANSCRIPT AUDIT
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Browse transcripts, AI-generated lead ratings, sentiment scores, and audio playbacks.
            </p>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono uppercase"
          >
            <FileDown className="h-4 w-4" /> Export Leads Report (CSV)
          </button>
        </div>

        {/* Search tool */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Search history by customer name, mobile or company..."
            />
          </div>
        </div>

        {/* History Table Grid */}
        <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-500 text-xs">
              <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
              Loading call logs...
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <AlertCircle className="h-10 w-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold">No Call Logs Recorded</p>
              <p className="text-xs max-w-xs mx-auto">
                No outbound calls have been simulated or processed yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-900/60 border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Dial Status</th>
                    <th className="px-6 py-4">Call Duration</th>
                    <th className="px-6 py-4">Interest Rating</th>
                    <th className="px-6 py-4">Lead Score</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/55">
                  {filteredCalls.map((c) => (
                    <tr key={c.id} className="text-slate-300 hover:bg-slate-900/20">
                      <td className="px-6 py-4 font-bold text-slate-200">{c.customer.name}</td>
                      <td className="px-6 py-4">{c.customer.mobile}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          c.status === "Answered" || c.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{c.duration} seconds</td>
                      <td className="px-6 py-4">
                        {c.ai_summary ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            c.ai_summary.interest_status === "Interested"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : c.ai_summary.interest_status === "Maybe Interested"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {c.ai_summary.interest_status}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">No Summary</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-200">
                        {c.ai_summary ? `${c.ai_summary.lead_score}/100` : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCall(c)}
                          className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          View Transcript
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SIDE DRAWER: Details panel */}
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 p-6 flex flex-col h-full overflow-y-auto">
              
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                    <PhoneCall className="h-5 w-5 text-purple-400" /> Call Qualification Details
                  </h3>
                  <p className="text-xs text-slate-400">Customer: {selectedCall.customer.name} ({selectedCall.customer.mobile})</p>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-900 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedCall.ai_summary ? (
                <div className="space-y-6">
                  {/* Analysis indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Score</span>
                      </div>
                      <p className="text-sm font-black text-slate-200">{selectedCall.ai_summary.lead_score} / 100</p>
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Smile className="h-3.5 w-3.5" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Sentiment</span>
                      </div>
                      <p className="text-sm font-black text-purple-400">{selectedCall.ai_summary.sentiment}</p>
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Language</span>
                      </div>
                      <p className="text-sm font-black text-slate-200">{selectedCall.ai_summary.language_used}</p>
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Duration</span>
                      </div>
                      <p className="text-sm font-black text-slate-200">{selectedCall.duration}s</p>
                    </div>
                  </div>

                  {/* Structured Qualification Details */}
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Structured Lead Qualification Output
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Service Required</span>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {selectedCall.ai_summary.service_required || selectedCall.customer.service_of_interest || "Website Development"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Estimated Timeline</span>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {selectedCall.ai_summary.timeline || "Not specified"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Extracted Customer Requirements</span>
                        <p className="text-slate-300 mt-0.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                          {selectedCall.ai_summary.customer_requirement || selectedCall.customer.customer_requirement || "No specific technical requirements captured."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-purple-400" /> AI Executive Summary
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 border border-slate-850 rounded-xl">
                      {selectedCall.ai_summary.summary}
                    </p>
                  </div>

                  {/* Callback card */}
                  {selectedCall.ai_summary.preferred_callback_time && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Callback Request Detected
                      </p>
                      <p className="text-xs font-semibold">Lead requested callback at: {selectedCall.ai_summary.preferred_callback_time}</p>
                    </div>
                  )}

                  {/* TRAI Compliance Notice */}
                  <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-slate-300">TRAI & Telephony Compliance:</strong> Outbound calling executed within compliant hours (9 AM - 8 PM IST). Audio recording and AI disclosure stated upon pickup. Lead opt-outs are automatically honored.
                    </p>
                  </div>

                  {/* AI Notes */}
                  {selectedCall.ai_summary.ai_notes && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-purple-400" /> AI Agent Action Items
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 border border-slate-850 rounded-xl">
                        {selectedCall.ai_summary.ai_notes}
                      </p>
                    </div>
                  )}

                  {/* Transcript dialog list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-purple-400" /> Conversation Transcript Dialog
                    </h4>
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-3">
                      {renderTranscriptBubbles(selectedCall.ai_summary.transcript)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs py-20 text-center">
                  This call was not completed or answered. No AI transcript or metrics available.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
