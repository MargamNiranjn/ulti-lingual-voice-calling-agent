"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AIBotMascot() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center select-none">
      {/* Background Outer Soft Glow */}
      <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      {/* Floating Speech Bubble */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-2 left-3 sm:left-4 z-20 bg-white/95 rounded-2xl px-3 py-1.5 shadow-lg flex items-center gap-1"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </motion.div>

      {/* Floating Yellow Call Badge */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="absolute bottom-6 right-1 sm:right-3 z-20 h-9 w-9 rounded-2xl bg-[#FFD027] text-slate-900 flex items-center justify-center shadow-lg shadow-black/20"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </motion.div>

      {/* Main Bot Figure */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)]"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="55%" stopColor="#E9EBFF" />
              <stop offset="100%" stopColor="#CCD2FF" />
            </linearGradient>

            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#12162B" />
              <stop offset="100%" stopColor="#0B0E1B" />
            </linearGradient>

            <linearGradient id="headphoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A48EFF" />
              <stop offset="100%" stopColor="#6C52FF" />
            </linearGradient>

            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#7E57FF" />
              <stop offset="100%" stopColor="#FF6584" />
            </linearGradient>

            <filter id="glowEyes" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Bottom Circuit Ring & Glow */}
          <ellipse cx="100" cy="172" rx="65" ry="14" fill="none" stroke="url(#ringGrad)" strokeWidth="3" opacity="0.6" strokeDasharray="6 4" />
          <path d="M 60 168 Q 100 182 140 168" fill="none" stroke="#6C52FF" strokeWidth="2.5" />
          <circle cx="50" cy="170" r="3" fill="#00F0FF" />
          <circle cx="150" cy="170" r="3" fill="#00F0FF" />

          {/* Headphone Band */}
          <path
            d="M 45 92 C 45 42, 155 42, 155 92"
            fill="none"
            stroke="url(#headphoneGrad)"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Headphone Antenna Tip */}
          <circle cx="100" cy="46" r="5" fill="#FFD027" />

          {/* Bot Head Shape (Rounded Squircle) */}
          <rect
            x="50"
            y="54"
            width="100"
            height="86"
            rx="34"
            fill="url(#bodyGrad)"
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />

          {/* Inner Visor / Face Screen */}
          <rect
            x="60"
            y="64"
            width="80"
            height="66"
            rx="24"
            fill="url(#screenGrad)"
            stroke="#2B3054"
            strokeWidth="1.5"
          />

          {/* Face Screen Glow Highlight */}
          <ellipse cx="80" cy="74" rx="14" ry="4" fill="#FFFFFF" opacity="0.12" />

          {/* Glowing Eyes */}
          <circle cx="82" cy="94" r="6" fill="#38EF7D" filter="url(#glowEyes)" />
          <circle cx="118" cy="94" r="6" fill="#38EF7D" filter="url(#glowEyes)" />
          <circle cx="84" cy="92" r="2" fill="#FFFFFF" />
          <circle cx="120" cy="92" r="2" fill="#FFFFFF" />

          {/* Friendly Smiling Mouth */}
          <path
            d="M 94 104 Q 100 112 106 104"
            fill="none"
            stroke="#38EF7D"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glowEyes)"
          />

          {/* Left Headphone Ear Cushion */}
          <rect
            x="38"
            y="76"
            width="14"
            height="34"
            rx="7"
            fill="url(#headphoneGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* Right Headphone Ear Cushion */}
          <rect
            x="148"
            y="76"
            width="14"
            height="34"
            rx="7"
            fill="url(#headphoneGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* Lower Neck / Body collar */}
          <path
            d="M 76 140 L 82 162 L 118 162 L 124 140 Z"
            fill="url(#bodyGrad)"
            stroke="#D8DCFF"
            strokeWidth="1.5"
          />

          {/* Cute subtle blush */}
          <circle cx="72" cy="104" r="4" fill="#FF76AC" opacity="0.4" />
          <circle cx="128" cy="104" r="4" fill="#FF76AC" opacity="0.4" />
        </svg>
      </motion.div>
    </div>
  );
}
