"use client";

import React from "react";
import { Search, Bell, Heart } from "lucide-react";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  activeCallsCount?: number;
  onSearch?: (query: string) => void;
}

export default function TopBar({
  title = "Dashboard",
  subtitle,
  activeCallsCount,
  onSearch,
}: TopBarProps) {
  return (
    <header className="w-full flex items-center justify-between gap-4 pb-6">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right Controls: Search, Bell, Heart, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Pill Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search.."
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-48 sm:w-64 pl-10 pr-4 py-2 text-xs rounded-full bg-[#121524] border border-slate-800/80 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]/30 transition-all"
          />
        </div>

        {/* Notifications Icon Button */}
        <button
          title="Notifications"
          className="h-9 w-9 rounded-full bg-[#121524] border border-slate-800/80 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Favorites Heart Button */}
        <button
          title="Favorites"
          className="h-9 w-9 rounded-full bg-[#121524] border border-slate-800/80 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <Heart className="h-4 w-4" />
        </button>

        {/* User Profile Avatar */}
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#635BFF] to-[#A28FFF] p-[1.5px] cursor-pointer hover:scale-105 transition-transform shrink-0 ml-1">
          <div className="h-full w-full rounded-full bg-[#171a2e] flex items-center justify-center overflow-hidden">
            {/* Minimalist modern avatar representation */}
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80"
              alt="User profile"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback if image doesn't load
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
