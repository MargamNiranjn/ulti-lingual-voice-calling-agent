"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, Sparkles, MessageSquare, PhoneCall } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Agent");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, registerUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await registerUser(username, email, password, role);
        setSuccess("Registration successful! Please sign in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Authentication request failed. Please check inputs."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07090e] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/40 mb-4 animate-float-gentle">
            <PhoneCall className="h-8 w-8" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            LeadSense <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase font-bold tracking-wide">PRO</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400 font-medium tracking-wide">
            Autonomous Multilingual Lead Qualification Platform
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-slate-850 shadow-2xl bg-gradient-to-b from-[#10172b]/90 to-[#0a0f1d]/90 backdrop-blur-2xl">
          <div className="flex justify-center border-b border-slate-800/80 pb-4 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 text-center py-2 font-bold text-sm transition-all duration-200 border-b-2 cursor-pointer ${
                isLogin ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 text-center py-2 font-bold text-sm transition-all duration-200 border-b-2 cursor-pointer ${
                !isLogin ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-900/20 border border-emerald-500/30 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="e.g. janesmith"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Organizational Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  >
                    <option value="Agent">Agent (Outbound dialer access)</option>
                    <option value="Sales Manager">Sales Manager (Campaign manager)</option>
                    <option value="Admin">Administrator (Full settings control)</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all glow-btn cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing..."
                  : isLogin
                  ? "Sign In to Dashboard"
                  : "Register Workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
