"use client";

import type { YouTubeVideo } from "@/lib/types/youtube";

interface VideoGridProps {
  videos: YouTubeVideo[];
}

function formatViews(n: number | null): string {
  if (n === null) return "N/A";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M vizualizări`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K vizualizări`;
  return `${n} vizualizări`;
}

export default function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500">Nu s-au găsit videoclipuri.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
          Videoclipuri ({videos.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 hover:border-red-500/30 rounded-xl overflow-hidden transition-all"
          >
            {/* Thumbnail */}
            {video.thumbnail?.static && (
              <div className="relative w-full aspect-video bg-gray-900/50">
                <img
                  src={video.thumbnail.static}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {video.length && (
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                    {video.length}
                  </span>
                )}
              </div>
            )}

            <div className="p-3">
              <h4 className="text-xs font-medium text-white line-clamp-2 mb-1.5 leading-relaxed group-hover:text-red-300 transition-colors">
                {video.title}
              </h4>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-400 truncate max-w-[60%]">
                  {video.channel.title}
                  {video.channel.isVerified && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#3b82f6" className="inline ml-0.5 -mt-px">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>{formatViews(video.views)}</span>
                {video.publishedTime && (
                  <>
                    <span>&middot;</span>
                    <span>{video.publishedTime}</span>
                  </>
                )}
              </div>

              {video.badges && video.badges.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {video.badges.map((badge, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
