"use client";

import type { YouTubeShort } from "@/lib/types/youtube";

interface ShortsGridProps {
  shorts: YouTubeShort[];
}

function formatViews(n: number | null): string {
  if (n === null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function ShortsGrid({ shorts }: ShortsGridProps) {
  if (shorts.length === 0) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <polygon points="10 9 15 12 10 15" fill="#ef4444" stroke="none" />
        </svg>
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
          Shorts ({shorts.length})
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {shorts.map((short) => (
          <a
            key={short.id}
            href={short.link || `https://www.youtube.com/shorts/${short.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-32 group"
          >
            <div className="w-32 h-56 rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/30 group-hover:border-red-500/30 transition-all relative">
              {short.thumbnail ? (
                <img
                  src={short.thumbnail}
                  alt={short.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              {short.views !== null && (
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
                  {formatViews(short.views)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 line-clamp-2 mt-1.5 leading-relaxed group-hover:text-white transition-colors">
              {short.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
