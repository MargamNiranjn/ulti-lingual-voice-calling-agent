"use client";

import React, { useState } from "react";
import { Phone, X, Sparkles, PhoneCall, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

const INDIAN_LANGUAGES = [
  { label: "Telugu (తెలుగు)", value: "Telugu" },
  { label: "Hindi (हिन्दी)", value: "Hindi" },
  { label: "English (Indian Accent)", value: "English" },
  { label: "Tamil (தமிழ்)", value: "Tamil" },
  { label: "Kannada (ಕನ್ನಡ)", value: "Kannada" },
  { label: "Malayalam (മലയാളം)", value: "Malayalam" },
  { label: "Bengali (বাংলা)", value: "Bengali" },
  { label: "Marathi (मराठी)", value: "Marathi" },
  { label: "Gujarati (ગુજરાતી)", value: "Gujarati" },
  { label: "Punjabi (ਪੰਜਾਬੀ)", value: "Punjabi" },
];

export default function FloatingDialer() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("Telugu");
  const [service, setService] = useState("Website & AI Automation");
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDial = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCallStatus(null);

    // Format phone
    let formattedPhone = phone.trim().replace(/[\s-]/g, "");
    if (!formattedPhone) {
      setError("Please enter a valid phone number");
      return;
    }
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.startsWith("91") ? `+${formattedPhone}` : `+91${formattedPhone.replace(/^0+/, "")}`;
    }

    try {
      setLoading(true);
      setCallStatus("Provisioning Lead...");

      // 1. Create or retrieve lead
      const customerRes = await api.post("/api/customers/", {
        name: name.trim() || `Prospect ${formattedPhone.slice(-4)}`,
        mobile: formattedPhone,
        preferred_language: language,
        service_of_interest: service,
        company_name: "Quick Inbound Lead",
        status: "New",
      });

      const customerId = customerRes.data.id;
      setCallStatus("Dialing via Twilio Neural Voice...");

      // 2. Trigger outbound call
      const callRes = await api.post(`/api/calls/manual?customer_id=${customerId}`);
      
      setCallSid(callRes.data.sid || "Dispatched");
      setCallStatus("Active: Ringing Recipient Phone");
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || "Dialing failed";
      setError(typeof detail === "string" ? detail : "Failed to initiate outbound call");
      setCallStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCallStatus(null);
    setCallSid(null);
    setError(null);
    setPhone("");
    setName("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-[#635BFF] via-[#7E57FF] to-[#00D4B2] text-white font-semibold text-sm shadow-2xl shadow-[#635BFF]/40 hover:shadow-[#635BFF]/60 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="relative">
            <Phone className="h-4 w-4 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <span className="tracking-wide">Quick AI Call</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest text-white/90 font-mono">
            Telugu / Indian
          </span>
        </button>
      )}

      {/* Expanded Quick-Dial Card */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] rounded-3xl bg-[#0F1222]/95 border border-slate-700/60 shadow-2xl shadow-black/80 backdrop-blur-2xl p-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#00D4B2] flex items-center justify-center text-white shadow-md shadow-[#635BFF]/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Instant Outbound Dialpad</h3>
                <p className="text-[11px] text-slate-400">Live Indian Multilingual Agent</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active Call In Progress Banner */}
          {callStatus && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <div className="flex items-center gap-2.5 mb-1.5 font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>{callStatus}</span>
              </div>
              {callSid && (
                <p className="text-[10px] font-mono text-emerald-400/80 truncate">
                  SID: {callSid}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-emerald-500/20">
                <span className="text-[11px] text-slate-300">Speaking in {language}</span>
                <button
                  onClick={handleReset}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Make Another Call
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dial Form */}
          {!callStatus && (
            <form onSubmit={handleDial} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-mono">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    placeholder="8639110218"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#161B30] border border-slate-700/80 rounded-xl pl-16 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF] font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    placeholder="Niranjan Margam"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#161B30] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#635BFF]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Spoken Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#161B30] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#635BFF]"
                  >
                    {INDIAN_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Pitch / Offering
                </label>
                <input
                  type="text"
                  placeholder="Website & AI Voice Automation"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-[#161B30] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#635BFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#00D4B2] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/30 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting Twilio Carrier...</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="h-4 w-4" />
                    <span>Call With AI Agent Now</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Twilio Outbound Active
            </span>
            <span>Latency: ~420ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
