"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  Phone,
  X,
  Upload,
  AlertCircle,
  Zap,
  Flame,
  Clock,
  ArrowUpRight
} from "lucide-react";
import TopBar from "@/components/TopBar";
import CallSimulator from "@/components/CallSimulator";

interface Customer {
  id: number;
  name: string;
  mobile: string;
  preferred_language: string;
  company_name: string | null;
  service_of_interest?: string | null;
  interest_level?: string | null;
  customer_requirement?: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada",
  "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi",
  "Urdu", "Odia", "Assamese", "Spanish", "French",
  "German", "Arabic", "Japanese"
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeCallSim, setActiveCallSim] = useState<any | null>(null);

  // ── Quick Simulate modal ──
  const [isQuickSimOpen, setIsQuickSimOpen] = useState(false);
  const [qsName, setQsName] = useState("");
  const [qsMobile, setQsMobile] = useState("");
  const [qsLang, setQsLang] = useState("English");
  const [qsError, setQsError] = useState("");
  const [qsLoading, setQsLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [lang, setLang] = useState("English");
  const [company, setCompany] = useState("");
  const [serviceOfInterest, setServiceOfInterest] = useState("");
  const [customerRequirement, setCustomerRequirement] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Import file state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (languageFilter) params.language = languageFilter;
      if (statusFilter) params.status_filter = statusFilter;
      const res = await api.get("/api/customers/", { params });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, languageFilter, statusFilter]);

  // ── Launch simulation for a customer already in the DB ──
  const triggerCallSimulation = async (customer: Customer) => {
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
      alert("Outbound dialer could not connect.");
    }
  };

  // ── Quick Simulate: create a temporary customer then launch simulation ──
  const handleQuickSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setQsError("");
    if (!qsName.trim() || !qsMobile.trim()) {
      setQsError("Name and mobile number are required.");
      return;
    }
    setQsLoading(true);
    try {
      // Check if customer already exists; if not, create temporarily
      let customerId: number;
      try {
        const existing = await api.get(`/api/customers/?search=${encodeURIComponent(qsMobile.trim())}`);
        const found = existing.data.find((c: Customer) => c.mobile === qsMobile.trim());
        if (found) {
          customerId = found.id;
        } else {
          const created = await api.post("/api/customers/", {
            name: qsName.trim(),
            mobile: qsMobile.trim(),
            preferred_language: qsLang,
          });
          customerId = created.data.id;
        }
      } catch {
        const created = await api.post("/api/customers/", {
          name: qsName.trim(),
          mobile: qsMobile.trim(),
          preferred_language: qsLang,
        });
        customerId = created.data.id;
      }

      // Create the call record
      const callRes = await api.post(`/api/calls/manual?customer_id=${customerId}`);
      setIsQuickSimOpen(false);
      setQsName(""); setQsMobile(""); setQsLang("English");
      setActiveCallSim({
        callId: callRes.data.id,
        customerName: qsName.trim(),
        mobile: qsMobile.trim(),
        preferredLanguage: qsLang
      });
      fetchCustomers();
    } catch (err: any) {
      setQsError(err.response?.data?.detail || "Failed to start simulation. Check backend.");
    } finally {
      setQsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || !mobile.trim()) {
      setFormError("Name and Mobile Number are required");
      return;
    }
    try {
      await api.post("/api/customers/", {
        name, mobile, preferred_language: lang,
        company_name: company || null,
        service_of_interest: serviceOfInterest || null,
        customer_requirement: customerRequirement || null,
        notes: notes || null
      });
      setIsAddOpen(false);
      setName(""); setMobile(""); setLang("English"); setCompany("");
      setServiceOfInterest(""); setCustomerRequirement(""); setNotes("");
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create customer.");
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError("");
    if (!importFile) { setImportError("Please select a valid CSV or Excel file"); return; }
    const formData = new FormData();
    formData.append("file", importFile);
    try {
      setImporting(true);
      await api.post("/api/customers/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIsImportOpen(false);
      setImportFile(null);
      fetchCustomers();
    } catch (err: any) {
      setImportError(err.response?.data?.detail || "Import parsing failed.");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer? All call records will be purged.")) return;
    try {
      await api.delete(`/api/customers/${id}`);
      fetchCustomers();
    } catch { alert("Failed to delete customer."); }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-6 overflow-y-auto relative z-10">
        <TopBar
          title="Lead Intelligence & CRM Directory"
          subtitle="Real-Time Qualification Scores, Multi-Turn Transcripts & Language Preferences"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              PROSPECT LEADS DIRECTORY
            </h3>
            <p className="text-xs text-slate-400 font-medium">Filter qualified high-intent leads and schedule human sales follow-ups.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* ── Quick Simulate button ── */}
            <button
              onClick={() => { setIsQuickSimOpen(true); setQsError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] font-mono uppercase"
            >
              <Zap className="h-4 w-4" /> Quick Simulate
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 cursor-pointer transition-all font-mono"
            >
              <FileSpreadsheet className="h-4 w-4" /> Import CSV/Excel
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all font-mono uppercase"
            >
              <UserPlus className="h-4 w-4" /> Add Lead
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-850 pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Search leads by name, mobile number or company..." />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
            <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}
              className="rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-400 font-semibold focus:outline-none">
              <option value="">All Languages</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-400 font-semibold focus:outline-none">
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Interested">Interested</option>
              <option value="Maybe Interested">Maybe Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Callback Scheduled">Callback Scheduled</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Customer Table */}
        <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-500 text-xs">
              <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
              Loading customer leads data...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2">
              <AlertCircle className="h-10 w-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No Leads Found</p>
              <p className="text-xs max-w-xs mx-auto">Add a manual customer or import a CSV. Or use Quick Simulate to demo with any number.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Language</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">AI Interest Level</th>
                    <th className="px-6 py-4">Dial Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/55">
                  {customers.map((c) => (
                    <tr key={c.id} className="text-slate-300 hover:bg-slate-900/20">
                      <td className="px-6 py-4 font-bold text-slate-200">{c.name}</td>
                      <td className="px-6 py-4">{c.mobile}</td>
                      <td className="px-6 py-4 text-slate-400">{c.company_name || "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {c.preferred_language}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {c.service_of_interest || "Website Development"}
                      </td>
                      <td className="px-6 py-4">
                        {c.interest_level ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                            c.interest_level === "HIGH" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : c.interest_level === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : c.interest_level === "CALL_BACK" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : c.interest_level === "NOT_INTERESTED" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>{c.interest_level}</span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Unrated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                          c.status === "Interested" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : c.status === "Maybe Interested" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : c.status === "Callback Scheduled" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : c.status === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2.5">
                        <button onClick={() => triggerCallSimulation(c)}
                          className="p-2 bg-purple-600/15 border border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Simulate AI Call">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="p-2 bg-red-600/15 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Delete Lead">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── MODAL: Quick Simulate with any number ── */}
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
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg">
                  {qsError}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Customer Name
                </label>
                <input type="text" required value={qsName} onChange={(e) => setQsName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Ravi Kumar" />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Mobile Number
                </label>
                <input type="text" required value={qsMobile} onChange={(e) => setQsMobile(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. +919876543210" />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                  Preferred Language
                </label>
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

      {/* MODAL: Add manual customer */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="font-bold text-slate-200 text-lg">Add Manual Lead</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg">{formError}</div>}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Mobile Number</label>
                <input type="text" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. 9876543210" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Preferred Language</label>
                <select value={lang} onChange={(e) => setLang(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-300 focus:outline-none">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Company Name (Optional)</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. Apex Solutions" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Service of Interest (Optional)</label>
                <input type="text" value={serviceOfInterest} onChange={(e) => setServiceOfInterest(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. Website Development, E-commerce Store" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Customer Requirements (Optional)</label>
                <input type="text" value={customerRequirement} onChange={(e) => setCustomerRequirement(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="e.g. Payment gateway, mobile app, 5-page site" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">General Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none h-16 resize-none"
                  placeholder="Background context..." />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 bg-slate-900 hover:bg-slate-850 rounded-lg">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg cursor-pointer">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import CSV/Excel */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <h3 className="font-bold text-slate-200 text-lg">Import Leads File</h3>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleImportSubmit} className="space-y-5">
              {importError && <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/30 p-2.5 rounded-lg">{importError}</div>}
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center flex flex-col items-center space-y-2 hover:border-purple-500/40 transition-colors">
                <Upload className="h-10 w-10 text-slate-500 animate-bounce" />
                <p className="text-xs font-semibold text-slate-300">Click or Drag CSV/Excel file here</p>
                <p className="text-[10px] text-slate-500">Required columns: Name, Mobile</p>
                <input type="file" accept=".csv,.xls,.xlsx"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-lg focus:outline-none" />
              </div>
              {importFile && (
                <div className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-lg flex items-center justify-between text-xs">
                  <span className="truncate max-w-[280px] text-slate-300 font-semibold">{importFile.name}</span>
                  <button type="button" onClick={() => setImportFile(null)} className="text-red-400 hover:text-red-200">Clear</button>
                </div>
              )}
              <div className="flex gap-3 border-t border-slate-800 pt-3">
                <button type="button" onClick={() => setIsImportOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 bg-slate-900 hover:bg-slate-850 rounded-lg">Cancel</button>
                <button type="submit" disabled={importing}
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg cursor-pointer disabled:opacity-50">
                  {importing ? "Importing..." : "Process Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Simulator overlay */}
      {activeCallSim && (
        <CallSimulator
          callId={activeCallSim.callId}
          customerName={activeCallSim.customerName}
          mobile={activeCallSim.mobile}
          preferredLanguage={activeCallSim.preferredLanguage}
          onClose={() => { setActiveCallSim(null); fetchCustomers(); }}
          onCallCompleted={fetchCustomers}
        />
      )}
    </div>
  );
}
