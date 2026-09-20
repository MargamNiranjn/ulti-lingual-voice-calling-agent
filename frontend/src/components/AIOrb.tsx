"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AIOrbProps {
  status?: "idle" | "listening" | "thinking" | "speaking" | "active";
  size?: "sm" | "md" | "lg" | "xl";
  amplitude?: number;
  interactive?: boolean;
}

export default function AIOrb({
  status = "active",
  size = "lg",
  amplitude = 1,
  interactive = false,
}: AIOrbProps) {
  const [pulseScale, setPulseScale] = useState(1);

  const sizeDimensions = {
    sm: "w-28 h-28",
    md: "w-44 h-44",
    lg: "w-64 h-64",
    xl: "w-80 h-80",
  }[size];

  const ringSizes = {
    sm: ["w-32 h-32", "w-40 h-40", "w-48 h-48"],
    md: ["w-52 h-52", "w-64 h-64", "w-76 h-76"],
    lg: ["w-72 h-72", "w-88 h-88", "w-[26rem] h-[26rem]"],
    xl: ["w-96 h-96", "w-[28rem] h-[28rem]"],
  }[size];

  return (
    <div className={`relative flex items-center justify-center ${sizeDimensions} select-none`}>
      {/* Expanding Atmospheric Glow Layers */}
      <motion.div
        animate={{
          scale: status === "speaking" ? [1, 1.25, 1] : [1, 1.08, 1],
          opacity: status === "speaking" ? [0.6, 0.9, 0.6] : [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: status === "speaking" ? 1.4 : 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/30 to-violet-600/25 blur-2xl pointer-events-none"
      />

      {/* Outer Pulse Ring 1 */}
      <motion.div
        animate={{
          scale: status === "speaking" ? [1, 1.35, 1.45] : [1, 1.15, 1.25],
          opacity: [0.6, 0.2, 0],
          rotate: 360,
        }}
        transition={{
          duration: status === "speaking" ? 2 : 4,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className={`absolute rounded-full border border-cyan-400/40 ${ringSizes[0]} pointer-events-none`}
      />

      {/* Outer Pulse Ring 2 */}
      <motion.div
        animate={{
          scale: status === "speaking" ? [1, 1.5, 1.65] : [1, 1.28, 1.42],
          opacity: [0.4, 0.1, 0],
          rotate: -360,
        }}
        transition={{
          duration: status === "speaking" ? 2.6 : 5,
          repeat: Infinity,
          ease: "easeOut",
          delay: 0.6,
        }}
        className={`absolute rounded-full border border-blue-500/30 border-dashed ${ringSizes[1] || ringSizes[0]} pointer-events-none`}
      />

      {/* Rotating Orbital Track with Data Nodes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-14px] rounded-full border border-cyan-500/15 pointer-events-none"
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
        <span className="absolute bottom-2 right-4 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#3b82f6]" />
      </motion.div>

      {/* Counter Rotating Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-28px] rounded-full border border-violet-500/15 pointer-events-none"
      >
        <span className="absolute top-1/4 right-0 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#8b5cf6]" />
      </motion.div>

      {/* Central High-Density Core Sphere */}
      <motion.div
        animate={{
          scale: status === "speaking" ? [0.96, 1.06, 0.96] : status === "thinking" ? [0.98, 1.03, 0.98] : [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: status === "speaking" ? 0.8 : 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-[#0c1b30] via-[#050b16] to-[#120e29] border border-cyan-400/40 shadow-[inset_0_0_35px_rgba(6,182,212,0.45),0_0_40px_rgba(6,182,212,0.25)] flex items-center justify-center overflow-hidden"
      >
        {/* Internal Shimmering Plasma Waves */}
        <motion.div
          animate={{
            x: ["-25%", "25%", "-25%"],
            y: ["-20%", "20%", "-20%"],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: status === "speaking" ? 6 : 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-[160%] h-[160%] rounded-full bg-gradient-to-tr from-cyan-500/35 via-transparent to-blue-600/40 blur-xl pointer-events-none"
        />

        {/* Neural Waveform Center Rings */}
        <div className="relative z-20 flex items-center justify-center gap-1.5 px-4">
          {[4, 12, 22, 34, 46, 34, 22, 12, 4].map((height, i) => (
            <motion.span
              key={i}
              animate={{
                height:
                  status === "speaking"
                    ? [height * 0.5, height * 1.6, height * 0.7]
                    : status === "listening"
                    ? [height * 0.7, height * 1.2, height * 0.6]
                    : [height * 0.8, height, height * 0.8],
                opacity: status === "speaking" ? [0.6, 1, 0.6] : [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: status === "speaking" ? 0.35 + (i % 3) * 0.1 : 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
              }}
              className="w-1 md:w-1.5 rounded-full bg-gradient-to-t from-cyan-400 to-blue-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              style={{ minHeight: "4px" }}
            />
          ))}
        </div>

        {/* Status Center Glint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none" />
      </motion.div>
    </div>
  );
}
