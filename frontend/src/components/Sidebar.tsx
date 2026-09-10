"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Info
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, theme, toggleTheme } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Campaigns", href: "/campaigns", icon: PhoneCall },
    { name: "Call History", href: "/calls", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "About Platform", href: "/about", icon: Info },
  ];

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile top navigation bar */}
      <div className="flex items-center justify-between bg-[#0a0d16] border-b border-slate-800 px-4 py-3 md:hidden w-full sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <PhoneCall className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-base text-white flex items-center gap-1.5">
            LeadSense <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">PRO</span>
          </span>
        </div>
        <button onClick={handleToggle} className="text-slate-300 focus:outline-none">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar background overlay for mobile */}
      {isOpen && (
        <div
          onClick={handleToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        ></div>
      )}

      {/* Main Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-45 w-64 bg-[#090d18]/90 backdrop-blur-2xl border-r border-slate-800/90 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8">
          {/* Logo brand */}
          <Link href="/" className="hidden md:flex items-center gap-3 group">
            <div className="h-11 w-11 flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/35 group-hover:scale-105 transition-transform">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white flex items-center gap-1.5 leading-tight">
                LeadSense <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase">Pro</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                AI Voice Qualification
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile area */}
        <div className="space-y-4">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 w-full px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 text-sm font-semibold transition-all"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-5 w-5 text-amber-500" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-indigo-400" />
                <span>Dark Theme</span>
              </>
            )}
          </button>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-sm">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="truncate w-32">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.username}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800/50"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
