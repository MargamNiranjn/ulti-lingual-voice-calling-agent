"use client";

import React from "react";

interface NativeLanguageBadgeProps {
  language: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface LanguageMeta {
  native: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
}

const LANGUAGE_META_MAP: Record<string, LanguageMeta> = {
  Telugu: {
    native: "తెలుగు",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-400",
    dotColor: "bg-amber-400",
  },
  Hindi: {
    native: "हिन्दी",
    badgeBg: "bg-sky-500/10",
    badgeBorder: "border-sky-500/30",
    badgeText: "text-sky-400",
    dotColor: "bg-sky-400",
  },
  Tamil: {
    native: "தமிழ்",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  Kannada: {
    native: "ಕನ್ನಡ",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/30",
    badgeText: "text-purple-400",
    dotColor: "bg-purple-400",
  },
  Malayalam: {
    native: "മലയാളം",
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/30",
    badgeText: "text-teal-400",
    dotColor: "bg-teal-400",
  },
  Bengali: {
    native: "বাংলা",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/30",
    badgeText: "text-rose-400",
    dotColor: "bg-rose-400",
  },
  Marathi: {
    native: "मराठी",
    badgeBg: "bg-orange-500/10",
    badgeBorder: "border-orange-500/30",
    badgeText: "text-orange-400",
    dotColor: "bg-orange-400",
  },
  Gujarati: {
    native: "ગુજરાતી",
    badgeBg: "bg-yellow-500/10",
    badgeBorder: "border-yellow-500/30",
    badgeText: "text-yellow-400",
    dotColor: "bg-yellow-400",
  },
  Punjabi: {
    native: "ਪੰਜਾਬੀ",
    badgeBg: "bg-pink-500/10",
    badgeBorder: "border-pink-500/30",
    badgeText: "text-pink-400",
    dotColor: "bg-pink-400",
  },
  Urdu: {
    native: "اردو",
    badgeBg: "bg-lime-500/10",
    badgeBorder: "border-lime-500/30",
    badgeText: "text-lime-400",
    dotColor: "bg-lime-400",
  },
  Odia: {
    native: "ଓଡ଼ିଆ",
    badgeBg: "bg-cyan-500/10",
    badgeBorder: "border-cyan-500/30",
    badgeText: "text-cyan-400",
    dotColor: "bg-cyan-400",
  },
  English: {
    native: "English",
    badgeBg: "bg-indigo-500/10",
    badgeBorder: "border-indigo-500/30",
    badgeText: "text-indigo-400",
    dotColor: "bg-indigo-400",
  },
  Spanish: {
    native: "Español",
    badgeBg: "bg-red-500/10",
    badgeBorder: "border-red-500/30",
    badgeText: "text-red-400",
    dotColor: "bg-red-400",
  },
  French: {
    native: "Français",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-400",
    dotColor: "bg-blue-400",
  },
  German: {
    native: "Deutsch",
    badgeBg: "bg-stone-500/10",
    badgeBorder: "border-stone-500/30",
    badgeText: "text-stone-300",
    dotColor: "bg-stone-400",
  },
  Arabic: {
    native: "العربية",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  Japanese: {
    native: "日本語",
    badgeBg: "bg-violet-500/10",
    badgeBorder: "border-violet-500/30",
    badgeText: "text-violet-400",
    dotColor: "bg-violet-400",
  },
};

export default function NativeLanguageBadge({
  language,
  size = "md",
  className = "",
}: NativeLanguageBadgeProps) {
  const meta = LANGUAGE_META_MAP[language] || {
    native: language,
    badgeBg: "bg-slate-800/50",
    badgeBorder: "border-slate-700/50",
    badgeText: "text-slate-300",
    dotColor: "bg-slate-400",
  };

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-2",
    lg: "text-sm px-3 py-1.5 gap-2.5",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md transition-all duration-200 ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} ${sizeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${meta.dotColor}`} />
      <span className="font-semibold">{language}</span>
      {meta.native !== language && (
        <span className="opacity-75 font-normal tracking-wide">({meta.native})</span>
      )}
    </span>
  );
}
