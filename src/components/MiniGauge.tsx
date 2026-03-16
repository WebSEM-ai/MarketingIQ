"use client";

import { useEffect, useState } from "react";

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 70) return "#3b82f6";
  if (score >= 41) return "#f59e0b";
  return "#ef4444";
}

export default function MiniGauge({
  score,
  label,
  size = 72,
  isStale = false,
}: {
  score: number;
  label: string;
  size?: number;
  isStale?: boolean;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = getScoreColor(score);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  useEffect(() => {
    let frame: number;
    const duration = 600;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div
      className={`flex flex-col items-center gap-1 transition-opacity ${
        isStale ? "opacity-40" : ""
      }`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth="5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold"
            style={{ color, fontSize: size * 0.28 }}
          >
            {animatedScore}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
