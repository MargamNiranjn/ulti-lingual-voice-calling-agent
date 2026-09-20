"use client";

import React from "react";
import { motion } from "framer-motion";

interface VoiceWaveformProps {
  state?: "listening" | "thinking" | "speaking" | "silent";
  barCount?: number;
  height?: number;
  color?: "cyan" | "violet" | "emerald" | "amber";
  interactive?: boolean;
}

export default function VoiceWaveform({
  state = "speaking",
  barCount = 28,
  height = 48,
  color = "cyan",
}: VoiceWaveformProps) {
  const colorMap = {
    cyan: "from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]",
    violet: "from-violet-400 to-indigo-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]",
    emerald: "from-emerald-400 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    amber: "from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  };

  // Base profile curve (bell-shaped multiplier)
  const getBaseScale = (index: number) => {
    const center = barCount / 2;
    const dist = Math.abs(index - center) / center;
    return Math.max(0.2, 1 - Math.pow(dist, 1.8));
  };

  return (
    <div className="flex items-center justify-center gap-[3px] sm:gap-1.5 h-12 select-none">
      {Array.from({ length: barCount }).map((_, i) => {
        const base = getBaseScale(i);
        const maxHeight = height * base;

        let targetHeights = [4, maxHeight, 4];
        let duration = 0.8;

        if (state === "speaking") {
          targetHeights = [
            Math.max(4, maxHeight * 0.2),
            Math.max(8, maxHeight * (0.6 + Math.sin(i * 0.8) * 0.4)),
            Math.max(4, maxHeight * 0.3),
          ];
          duration = 0.45 + (i % 4) * 0.12;
        } else if (state === "listening") {
          targetHeights = [
            Math.max(3, maxHeight * 0.3),
            Math.max(6, maxHeight * 0.6),
            Math.max(3, maxHeight * 0.3),
          ];
          duration = 0.9 + (i % 3) * 0.2;
        } else if (state === "thinking") {
          targetHeights = [
            4 + Math.sin((i / barCount) * Math.PI * 2) * 8,
            12 + Math.cos((i / barCount) * Math.PI * 2) * 10,
            4,
          ];
          duration = 1.2;
        } else {
          // silent
          targetHeights = [3, 4, 3];
          duration = 2.0;
        }

        return (
          <motion.div
            key={i}
            animate={{
              height: targetHeights,
              opacity: state === "silent" ? 0.35 : [0.5, 1, 0.5],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 5) * 0.08,
            }}
            className={`w-[3px] sm:w-1 rounded-full bg-gradient-to-t ${colorMap[color]}`}
            style={{ minHeight: "3px" }}
          />
        );
      })}
    </div>
  );
}
