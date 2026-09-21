"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutGrid,
  Bot,
  Volume2,
  MessageSquare,
  FlaskConical,
  Cable,
  HelpCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "AI Agent", href: "/ai-studio", icon: Bot },
    { name: "Voice Campaign", href: "/campaigns", icon: Volume2 },
    { name: "Chat", href: "/calls", icon: MessageSquare },
    { name: "Playground", href: "/calls/live", icon: FlaskConical },
    { name: "Integration", href: "/integrations", icon: Cable },
    { name: "Help", href: "/compliance", icon: HelpCircle },
    { name: "Setting", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="flex items-center justify-between bg-[#0B0D17]/95 border-b border-slate-800/80 px-5 py-4 md:hidden w-full sticky top-0 z-50 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#8F75FF] flex items-center justify-center text-white shadow-lg shadow-[#635BFF]/30">
            <Sparkles className="h-5 w-5 fill-white" />
          </div>
          <span className="font-extrabold text-xs text-white tracking-tight uppercase leading-snug">
            MULTI LINGUAL GENERATIVE<br/>VOICE CALLING AGENT
          </span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-slate-300 p-2 rounded-xl border border-slate-800 bg-[#121524]"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-45 w-60 bg-[#0B0D17] border-r border-slate-800/50 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8">
          {/* Brand Logo */}
          <Link href="/dashboard" className="hidden md:flex items-center gap-3 group">
            <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#635BFF] via-[#7B61FF] to-[#9B82FF] text-white shadow-lg shadow-[#635BFF]/30 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-xs leading-snug tracking-tight text-white uppercase">
                MULTI LINGUAL GENERATIVE<br/>
                <span className="text-[#9B82FF]">VOICE CALLING AGENT</span>
              </h1>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/35 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#15192c]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Minimal User Profile & Logout at Bottom */}
        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#635BFF] to-[#8C74FF] p-[1.5px] shrink-0">
              <div className="h-full w-full rounded-full bg-[#121524] flex items-center justify-center text-xs font-bold text-white">
                {user?.username?.substring(0, 2).toUpperCase() || "OP"}
              </div>
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.username || "Admin"}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.role || "Manager"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-[#161a2e] transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
