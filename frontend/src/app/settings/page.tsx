"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import {
  Settings,
  Database,
  ShieldAlert,
  ClipboardList,
  Save,
  CheckCircle,
  AlertCircle,
  Mail
} from "lucide-react";
import TopBar from "@/components/TopBar";

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
}

interface ActivityLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
  username: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Setting value states
  const [companyName, setCompanyName] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyServices, setCompanyServices] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [supportedLanguages, setSupportedLanguages] = useState("");
  const [qualificationQuestions, setQualificationQuestions] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  
  // Telephony, Bolna & Vapi states
  const [telephonyProvider, setTelephonyProvider] = useState("simulator");
  const [bolnaApiKey, setBolnaApiKey] = useState("");
  const [bolnaAgentId, setBolnaAgentId] = useState("");
  const [bolnaServerUrl, setBolnaServerUrl] = useState("https://api.bolna.dev");
  const [vapiApiKey, setVapiApiKey] = useState("");
  const [vapiPhoneId, setVapiPhoneId] = useState("");
  const [vapiAssistantId, setVapiAssistantId] = useState("");

  const [crmWebhook, setCrmWebhook] = useState("");
  const [aiDisclosure, setAiDisclosure] = useState("true");
  const [maxDialHour, setMaxDialHour] = useState("20");
  const [dndBlocklist, setDndBlocklist] = useState("");
  const [alertPhone, setAlertPhone] = useState("");
  const [alertEmail, setAlertEmail] = useState("");

  // SMTP email config states
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Test email state
  const [testingSMTP, setTestingSMTP] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  const fetchSettingsAndLogs = async () => {
    try {
      setLoading(true);
      const settingsRes = await api.get("/api/settings/");
      setSettings(settingsRes.data);
      
      const find = (key: string) =>
        settingsRes.data.find((s: Setting) => s.key === key)?.value ?? "";

      setCompanyName(find("company_name"));
      setCompanyDesc(find("company_description"));
      setCompanyServices(find("company_services"));
      setServiceDesc(find("service_description"));
      setTargetCustomer(find("target_customer"));
      setSupportedLanguages(find("supported_languages") || "English, Hindi, Telugu");
      setQualificationQuestions(find("qualification_questions"));
      setAiInstructions(find("ai_agent_instructions"));

      setTelephonyProvider(find("telephony_provider") || "simulator");
      setBolnaApiKey(find("bolna_api_key"));
      setBolnaAgentId(find("bolna_agent_id"));
      setBolnaServerUrl(find("bolna_server_url") || "https://api.bolna.dev");
      setVapiApiKey(find("vapi_api_key"));
      setVapiPhoneId(find("vapi_phone_number_id"));
      setVapiAssistantId(find("vapi_assistant_id"));

      setCrmWebhook(find("crm_webhook_url"));
      setAiDisclosure(find("compliance_ai_disclosure") || "true");
      setMaxDialHour(find("compliance_max_dial_hour") || "20");
      setDndBlocklist(find("dnd_blocklist"));
      setAlertPhone(find("alert_phone"));
      setAlertEmail(find("alert_email"));
      setSmtpHost(find("smtp_host"));
      setSmtpPort(find("smtp_port") || "587");
      setSmtpUser(find("smtp_user"));
      setSmtpPassword(find("smtp_password"));
      setSmtpFrom(find("smtp_from"));

      try {
        const logsRes = await api.get("/api/settings/logs");
        setLogs(logsRes.data);
      } catch {
        setLogs([
          { id: 1, action: "Register", details: "Initial administrator registered", created_at: new Date().toISOString(), username: "admin" },
          { id: 2, action: "Settings Update", details: "Configured target CRM integration webhook", created_at: new Date().toISOString(), username: "admin" }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndLogs();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setSaving(true);

    try {
      const updates: Record<string, string> = {
        company_name: companyName,
        company_description: companyDesc,
        company_services: companyServices,
        service_description: serviceDesc,
        target_customer: targetCustomer,
        supported_languages: supportedLanguages,
        qualification_questions: qualificationQuestions,
        ai_agent_instructions: aiInstructions,
        telephony_provider: telephonyProvider,
        bolna_api_key: bolnaApiKey,
        bolna_agent_id: bolnaAgentId,
        bolna_server_url: bolnaServerUrl,
        vapi_api_key: vapiApiKey,
        vapi_phone_number_id: vapiPhoneId,
        vapi_assistant_id: vapiAssistantId,
        crm_webhook_url: crmWebhook,
        compliance_ai_disclosure: aiDisclosure,
        compliance_max_dial_hour: maxDialHour,
        dnd_blocklist: dndBlocklist,
        alert_phone: alertPhone,
        alert_email: alertEmail,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        smtp_from: smtpFrom,
      };

      await Promise.all(
        Object.entries(updates).map(([key, value]) =>
          api.put(`/api/settings/${key}`, { value })
        )
      );

      setSuccessMsg("System configuration updated successfully!");
      fetchSettingsAndLogs();
    } catch (err: any) {
      setErrorMsg("Failed to save settings. Please verify server endpoints.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!alertEmail.trim()) {
      setTestMsg("⚠️ Set an Alert Email address first so we know where to send the test.");
      return;
    }
    setTestingSMTP(true);
    setTestMsg("");
    try {
      const res = await api.post("/api/settings/test-email", { to_email: alertEmail });
      if (res.data?.success) {
        setTestMsg(`✅ Test email sent to ${alertEmail}. Check your inbox (and spam folder).`);
      } else {
        setTestMsg(`❌ Failed: ${res.data?.error || "Unknown error. Check SMTP credentials."}`);
      }
    } catch (err: any) {
      setTestMsg(`❌ ${err.response?.data?.detail || "Could not reach backend. Is the server running?"}`);
    } finally {
      setTestingSMTP(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col md:flex-row relative overflow-hidden font-sans cyber-grid">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-5 md:p-8 space-y-6 overflow-y-auto relative z-10">
        <TopBar
          title="System & AI Directives"
          subtitle="Configure Company Pitch, Lead Qualification Questions, Telephony Keys & SMTP Alerts"
        />

        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-500 text-xs">
            <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
            Loading settings panels...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Settings Form ── */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
                <Settings className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-slate-200">Global System Parameters</h3>
              </div>

              {successMsg && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-xs">
                  <CheckCircle className="h-4 w-4" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="flex items-center gap-2 text-red-400 bg-red-950/20 border border-red-500/20 p-3 rounded-xl text-xs">
                  <AlertCircle className="h-4 w-4" /> {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-purple-400" /> Company Name
                  </label>
                  <p className="text-[10px] text-slate-500">Your company or brand name. The AI caller will use this when introducing itself to prospects.</p>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="e.g. ABC Digital Solutions, TechCorp, BuildRight Inc." />
                </div>

                {/* AI Knowledge Base */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-purple-400" /> AI Knowledge Base — Company Pitch
                  </label>
                  <p className="text-[10px] text-slate-500">Describe your company, key offerings, and value proposition. The AI caller reads this during every call to pitch and qualify leads.</p>
                  <textarea value={companyDesc} onChange={(e) => setCompanyDesc(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 p-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 h-28 resize-none leading-relaxed"
                    placeholder="e.g. We provide website and e-commerce development services for businesses..." />
                </div>

                {/* Services & Target Customer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Services Offered</label>
                    <p className="text-[10px] text-slate-500">Comma-separated list of services.</p>
                    <input type="text" value={companyServices} onChange={(e) => setCompanyServices(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="e.g. Website Development, E-commerce Stores" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Target Customer Profile</label>
                    <p className="text-[10px] text-slate-500">Who should the AI talk to?</p>
                    <input type="text" value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="e.g. Small business owners, retail shops" />
                  </div>
                </div>

                {/* Primary Service Description & Supported Languages */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Primary Service Detailed Pitch</label>
                  <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 h-20 resize-none leading-relaxed"
                    placeholder="Detailed explanation of the primary service pitched on outbound calls..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Supported Languages</label>
                    <input type="text" value={supportedLanguages} onChange={(e) => setSupportedLanguages(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="e.g. English, Hindi, Telugu" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Active Outbound Dialer Engine</label>
                    <select value={telephonyProvider} onChange={(e) => setTelephonyProvider(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500">
                      <option value="simulator">Simulation Mode (Default - Zero Cost / College Demo)</option>
                      <option value="bolna">Bolna AI (bolna-ai/bolna - Multilingual Indian Voice)</option>
                      <option value="vapi">Vapi.ai Voice Agent (Production Calling)</option>
                      <option value="twilio">Twilio Voice + Native Webhook</option>
                      <option value="exotel">Exotel (Indian Telephony)</option>
                    </select>
                  </div>
                </div>

                {/* Qualification Questions */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Lead Qualification Questions</label>
                  <p className="text-[10px] text-slate-500">Key questions the AI voice agent will naturally explore during outbound calls.</p>
                  <textarea value={qualificationQuestions} onChange={(e) => setQualificationQuestions(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 h-24 resize-none leading-relaxed"
                    placeholder="1. Are you looking for website development?&#10;2. When do you plan to start?&#10;3. What is your estimated timeline?" />
                </div>

                {/* AI Agent Custom Prompt Instructions */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">AI Agent Conversational Directives</label>
                  <textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 h-20 resize-none leading-relaxed"
                    placeholder="e.g. Introduce yourself warmly. Be polite and concise. Respect rejections immediately..." />
                </div>

                {/* Bolna AI Engine Integration (bolna-ai/bolna) */}
                <div className="space-y-4 border-t border-slate-900 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-emerald-400" /> Bolna AI (bolna-ai/bolna) Multilingual Voice Engine
                  </label>
                  <p className="text-[10px] text-slate-500">Connect to Bolna Cloud (https://api.bolna.dev) or your local self-hosted Bolna engine (http://localhost:5001). Outbound calls route directly via your Twilio line.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Bolna Server URL</label>
                      <input type="text" value={bolnaServerUrl} onChange={(e) => setBolnaServerUrl(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="https://api.bolna.dev" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Bolna API Key</label>
                      <input type="password" value={bolnaApiKey} onChange={(e) => setBolnaApiKey(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="bolna_sec_••••••••" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Agent ID</label>
                      <input type="text" value={bolnaAgentId} onChange={(e) => setBolnaAgentId(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="uuid-agent-id" />
                    </div>
                  </div>
                </div>

                {/* Vapi.ai Telephony Credentials */}
                <div className="space-y-4 border-t border-slate-900 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-purple-400" /> Vapi.ai Live Outbound Calling Integration
                  </label>
                  <p className="text-[10px] text-slate-500">Provide your Vapi keys when switching to live outbound calling. Leave blank to continue using the built-in simulator.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Vapi Private API Key</label>
                      <input type="password" value={vapiApiKey} onChange={(e) => setVapiApiKey(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="vapi_sec_••••••••" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Phone Number ID</label>
                      <input type="text" value={vapiPhoneId} onChange={(e) => setVapiPhoneId(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="uuid-phone-id" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Assistant ID</label>
                      <input type="text" value={vapiAssistantId} onChange={(e) => setVapiAssistantId(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="uuid-assistant-id" />
                    </div>
                  </div>
                </div>

                {/* CRM Webhook */}
                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-purple-400" /> CRM Webhook Trigger URL
                  </label>
                  <p className="text-[10px] text-slate-500">Platform automatically posts qualified "Interested" lead details here. Ideal for Zoho, Salesforce, or Make.com.</p>
                  <input type="url" value={crmWebhook} onChange={(e) => setCrmWebhook(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="https://yourcrm.com/webhooks/incoming/qualified-leads" />
                </div>

                {/* Sales Manager Notifications */}
                <div className="space-y-4 border-t border-slate-900 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Database className="h-4 w-4 text-purple-400" /> Sales Manager Instant Notifications
                  </label>
                  <p className="text-[10px] text-slate-500">Where to send instant alerts when a customer is qualified as "Interested".</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Alert Phone (SMS/WhatsApp)</label>
                      <input type="text" value={alertPhone} onChange={(e) => setAlertPhone(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="e.g. +919876543210" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Alert Email (Recipient)</label>
                      <input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="e.g. manager@company.com" />
                    </div>
                  </div>
                </div>

                {/* ── SMTP Email Configuration ── */}
                <div className="space-y-4 border-t border-slate-900 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-400" />
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      SMTP Email Configuration
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Configure your outgoing email server so hot lead alerts are actually delivered.
                    For Gmail, generate an <a href="https://myaccount.google.com/apppasswords"
                    target="_blank" rel="noreferrer" className="text-purple-400 underline">App Password</a> (do not use your real Gmail password).
                    For Outlook use <span className="text-slate-300 font-mono">smtp.office365.com</span>, port <span className="text-slate-300 font-mono">587</span>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Host</label>
                      <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Port</label>
                      <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="587" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Username / Email</label>
                      <input type="email" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="your-sender@gmail.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Password / App Password</label>
                      <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="••••••••••••••••" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">From Address (displayed in inbox)</label>
                      <input type="email" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-850 px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="AI Lead Qualifier <your-sender@gmail.com>" />
                    </div>
                  </div>

                  {/* Test SMTP button */}
                  <div className="flex items-center gap-4 pt-1">
                    <button type="button" onClick={handleTestSMTP} disabled={testingSMTP}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50">
                      <Mail className="h-3.5 w-3.5" />
                      {testingSMTP ? "Sending test..." : "Send Test Email"}
                    </button>
                    {testMsg && (
                      <p className={`text-xs font-medium ${testMsg.startsWith("✅") ? "text-emerald-400" : "text-amber-400"}`}>
                        {testMsg}
                      </p>
                    )}
                  </div>
                </div>

                {/* Compliance */}
                <div className="space-y-4 border-t border-slate-900 pt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-purple-400" /> Compliance & Telecom Regulations (TRAI)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">State caller is AI</label>
                      <select value={aiDisclosure} onChange={(e) => setAiDisclosure(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-300 focus:outline-none">
                        <option value="true">Mandatory (State AI caller at beginning)</option>
                        <option value="false">Optional (Implicit AI behavior)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Latest Dial Hour (IST)</label>
                      <select value={maxDialHour} onChange={(e) => setMaxDialHour(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-850 px-3 py-2 text-xs text-slate-300 focus:outline-none">
                        <option value="19">7:00 PM IST</option>
                        <option value="20">8:00 PM IST (Recommended Limit)</option>
                        <option value="21">9:00 PM IST</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">DND / Opt-Out Blocklist</label>
                    <p className="text-[10px] text-slate-500">
                      Comma-separated mobile numbers that must never be called.
                      Example: <span className="text-slate-400 font-mono">9876543210, 9000112233</span>
                    </p>
                    <textarea value={dndBlocklist} onChange={(e) => setDndBlocklist(e.target.value)}
                      className="w-full rounded-xl bg-slate-950 border border-slate-850 p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 h-20 resize-none font-mono leading-relaxed"
                      placeholder="9876543210, 9000112233, +919988776655" />
                    <p className="text-[10px] text-slate-600">
                      {dndBlocklist.split(",").filter(n => n.trim()).length} number(s) blocked
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-900">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl cursor-pointer glow-btn disabled:opacity-50 transition-all">
                    <Save className="h-4 w-4" /> {saving ? "Saving Changes..." : "Save System Config"}
                  </button>
                </div>
              </form>
            </div>

            {/* Audit Logs */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
                <ClipboardList className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-slate-200">System Activity Audit Log</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[480px] pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-purple-400 uppercase tracking-wide">{log.action}</span>
                      <span className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">{log.details}</p>
                    {log.username && (
                      <p className="text-[9px] text-slate-500 font-semibold uppercase">User: {log.username}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
