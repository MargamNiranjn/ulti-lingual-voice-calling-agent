"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LeadScoreGaugeProps {
  score?: number; // 0 - 100
  label?: string;
  size?: number;
  intent?: number;
  budget?: number;
  urgency?: number;
  engagement?: number;
}

export default function LeadScoreGauge({
  score = 92,
  label = "HOT LEAD",
  size = 190,
  intent = 94,
  budget = 86,
  urgency = 91,
  engagement = 89,
}: LeadScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * (circumference * 0.75);

  const getTier = (s: number) => {
    if (s >= 75) return { name: "HOT LEAD", color: "#00f0ff", glow: "rgba(0,240,255,0.4)" };
    if (s >= 50) return { name: "WARM LEAD", color: "#f59e0b", glow: "rgba(245,158,11,0.4)" };
    return { name: "COLD LEAD", color: "#64748b", glow: "rgba(100,116,139,0.3)" };
  };

  const tier = getTier(score);

  return (
    <div className="flex flex-col items-center justify-center p-5 relative select-none">
      {/* Gauge Circular Visualization */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-[135deg]" width={size} height={size}>
          {/* Track background */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />

          {/* Active Gradient Meter */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#leadGaugeGradient)"
            strokeWidth="11"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${tier.glow})` }}
          />

          <defs>
            <linearGradient id="leadGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="60%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Readout Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
            LEAD SCORE
          </span>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]"
          >
            {displayScore}
          </motion.div>
          <span
            className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 mt-0.5 rounded-full border tracking-wider"
            style={{
              borderColor: `${tier.color}40`,
              backgroundColor: `${tier.color}15`,
              color: tier.color,
            }}
          >
            {label || tier.name}
          </span>
        </div>
      </div>

      {/* Sub-Dimension Breakdown Metrics */}
      <div className="w-full grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Purchase Intent</span>
            <span className="text-cyan-400 font-bold">{intent}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"
              style={{ width: `${intent}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Budget Fit</span>
            <span className="text-blue-400 font-bold">{budget}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
              style={{ width: `${budget}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Urgency</span>
            <span className="text-emerald-400 font-bold">{urgency}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
              style={{ width: `${urgency}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Engagement</span>
            <span className="text-violet-400 font-bold">{engagement}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
              style={{ width: `${engagement}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
