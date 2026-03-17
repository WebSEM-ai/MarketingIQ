"use client";

import type { YouTubeChannel } from "@/lib/types/youtube";

interface ChannelListProps {
  channels: YouTubeChannel[];
}

export default function ChannelList({ channels }: ChannelListProps) {
  if (channels.length === 0) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">
          Canale ({channels.length})
        </h3>
      </div>

      <div className="space-y-2">
        {channels.map((channel) => (
          <a
            key={channel.id}
            href={channel.link || `https://www.youtube.com/channel/${channel.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 hover:border-red-500/30 rounded-xl p-3 transition-all"
          >
            {channel.thumbnail && (
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-medium text-white truncate">
                  {channel.title}
                </h4>
                {channel.isVerified && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6" className="flex-shrink-0">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              {channel.description && (
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                {channel.subscribers && <span>{channel.subscribers} abonați</span>}
                {channel.videoCount && <span>{channel.videoCount} videoclipuri</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
