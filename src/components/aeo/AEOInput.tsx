"use client";

import type { AEOPlatform } from "@/lib/types/aeo";

interface AEOInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  targetUrl: string;
  onTargetUrlChange: (value: string) => void;
  platforms: AEOPlatform[];
  onPlatformsChange: (platforms: AEOPlatform[]) => void;
  onTrack: () => void;
  isLoading: boolean;
}

const PLATFORM_OPTIONS: {
  value: AEOPlatform;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "perplexity",
    label: "Perplexity",
    color: "#20808D",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    value: "chatgpt",
    label: "ChatGPT",
    color: "#10a37f",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.053.494a6.02 6.02 0 00-5.742 4.164 5.971 5.971 0 00-3.997 2.9 6.049 6.049 0 00.742 7.098 5.98 5.98 0 00.516 4.911 6.05 6.05 0 006.51 2.9A5.961 5.961 0 0013.286 24a6.02 6.02 0 005.742-4.164 5.971 5.971 0 003.997-2.9 6.043 6.043 0 00-.743-7.115z" />
      </svg>
    ),
  },
  {
    value: "claude",
    label: "Claude",
    color: "#d97706",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    value: "gemini",
    label: "Gemini",
    color: "#8b5cf6",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
  },
  {
    value: "grok",
    label: "Grok",
    color: "#ef4444",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export default function AEOInput({
  prompt,
  onPromptChange,
  targetUrl,
  onTargetUrlChange,
  platforms,
  onPlatformsChange,
  onTrack,
  isLoading,
}: AEOInputProps) {
  const togglePlatform = (platform: AEOPlatform) => {
    if (platforms.includes(platform)) {
      if (platforms.length > 1) {
        onPlatformsChange(platforms.filter((p) => p !== platform));
      }
    } else {
      onPlatformsChange([...platforms, platform]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && prompt.trim()) {
      onTrack();
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 space-y-3">
      {/* Prompt input */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Ce ar întreba utilizatorii despre business-ul tău?
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ex: Care este cel mai bun CRM pentru afaceri mici?"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          disabled={isLoading}
        />
      </div>

      {/* Target URL input */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          URL-ul tău (pentru a verifica dacă apare în răspunsuri)
        </label>
        <input
          type="text"
          value={targetUrl}
          onChange={(e) => onTargetUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ex: https://example.com"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          disabled={isLoading}
        />
      </div>

      {/* Platform checkboxes */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Platforme AI de analizat
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((opt) => {
            const isChecked = platforms.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => togglePlatform(opt.value)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isChecked
                    ? "border-opacity-50 bg-opacity-15"
                    : "border-gray-700/50 bg-gray-800/30 text-gray-500 hover:text-gray-300"
                }`}
                style={
                  isChecked
                    ? {
                        borderColor: `${opt.color}80`,
                        backgroundColor: `${opt.color}15`,
                        color: opt.color,
                      }
                    : undefined
                }
              >
                <span style={isChecked ? { color: opt.color } : undefined}>
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track button */}
      <button
        onClick={onTrack}
        disabled={isLoading || !prompt.trim()}
        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        {isLoading ? "Analizez..." : "Trackează"}
      </button>
    </div>
  );
}
