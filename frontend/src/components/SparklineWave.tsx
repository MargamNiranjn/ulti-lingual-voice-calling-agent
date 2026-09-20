"use client";

import React from "react";

interface SparklineWaveProps {
  color?: "blue" | "amber" | "purple" | "emerald";
  points?: number[];
}

export default function SparklineWave({
  color = "blue",
  points = [20, 24, 18, 30, 22, 34, 26, 32, 28, 38],
}: SparklineWaveProps) {
  const strokeColors = {
    blue: "#4D88FF",
    amber: "#F59E0B",
    purple: "#8B5CF6",
    emerald: "#10B981",
  };

  const stroke = strokeColors[color] || strokeColors.blue;

  // Build SVG path
  const width = 84;
  const height = 24;
  const max = Math.max(...points, 40);
  const min = Math.min(...points, 0);

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / (max - min || 1)) * (height - 4) - 2;
    return `${x},${y}`;
  });

  // Smooth bezier curve string
  let pathD = `M ${coords[0]}`;
  for (let i = 1; i < coords.length; i++) {
    const [prevX, prevY] = coords[i - 1].split(",").map(Number);
    const [currX, currY] = coords[i].split(",").map(Number);
    const midX = (prevX + currX) / 2;
    pathD += ` C ${midX},${prevY} ${midX},${currY} ${currX},${currY}`;
  }

  return (
    <div className="w-[84px] h-[24px] flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
