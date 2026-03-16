"use client";

interface AEOEntry {
  id: string;
  timestamp: string;
  prompt: string;
  targetUrl: string;
  platformCount: number;
  avgVisibility: number;
  data: {
    prompt: string;
    targetUrl: string;
    platforms: {
      platform: string;
      responseQuality: number;
      visibility: string;
      targetUrlFound: boolean;
      topUrls: string[];
    }[];
  };
}

interface AEOComparisonProps {
  entryA: AEOEntry;
  entryB: AEOEntry;
}

const PLATFORM_LABELS: Record<string, string> = {
  perplexity: "Perplexity",
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  grok: "Grok",
};

const PLATFORM_COLORS: Record<string, string> = {
  perplexity: "#20808D",
  chatgpt: "#10a37f",
  claude: "#d97706",
  gemini: "#8b5cf6",
  grok: "#ef4444",
};

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AEOComparison({ entryA, entryB }: AEOComparisonProps) {
  // Get all platform names across both entries
  const allPlatforms = Array.from(
    new Set([
      ...entryA.data.platforms.map((p) => p.platform),
      ...entryB.data.platforms.map((p) => p.platform),
    ])
  );

  // Count wins
  let winsA = 0;
  let winsB = 0;
  allPlatforms.forEach((platform) => {
    const a = entryA.data.platforms.find((p) => p.platform === platform);
    const b = entryB.data.platforms.find((p) => p.platform === platform);
    if (a && b) {
      if (a.responseQuality > b.responseQuality) winsA++;
      else if (b.responseQuality > a.responseQuality) winsB++;
    }
  });

  return (
    <div className="space-y-4">
      {/* Header comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3">
          <p className="text-xs text-cyan-500 font-semibold mb-1">Analiză A</p>
          <p className="text-sm text-white font-medium truncate">&ldquo;{entryA.prompt}&rdquo;</p>
          {entryA.targetUrl && (
            <p className="text-[10px] text-gray-500 truncate">{entryA.targetUrl}</p>
          )}
          <p className="text-[10px] text-gray-600 mt-1">{formatDate(entryA.timestamp)}</p>
          <div className="mt-2">
            <span className={`text-lg font-bold ${getScoreColor(entryA.avgVisibility)}`}>
              {entryA.avgVisibility}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vizibilitate medie</span>
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
          <p className="text-xs text-amber-500 font-semibold mb-1">Analiză B</p>
          <p className="text-sm text-white font-medium truncate">&ldquo;{entryB.prompt}&rdquo;</p>
          {entryB.targetUrl && (
            <p className="text-[10px] text-gray-500 truncate">{entryB.targetUrl}</p>
          )}
          <p className="text-[10px] text-gray-600 mt-1">{formatDate(entryB.timestamp)}</p>
          <div className="mt-2">
            <span className={`text-lg font-bold ${getScoreColor(entryB.avgVisibility)}`}>
              {entryB.avgVisibility}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vizibilitate medie</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-300">
          {winsA > winsB ? (
            <>
              <span className="text-cyan-400 font-semibold">Analiza A</span> este mai vizibilă pe{" "}
              <span className="text-white font-bold">{winsA}/{allPlatforms.length}</span> platforme
            </>
          ) : winsB > winsA ? (
            <>
              <span className="text-amber-400 font-semibold">Analiza B</span> este mai vizibilă pe{" "}
              <span className="text-white font-bold">{winsB}/{allPlatforms.length}</span> platforme
            </>
          ) : (
            <span className="text-gray-400">Vizibilitate egală pe ambele analize</span>
          )}
        </p>
      </div>

      {/* Per-platform comparison */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Comparație per Platformă
        </h3>
        <div className="space-y-4">
          {allPlatforms.map((platform) => {
            const a = entryA.data.platforms.find((p) => p.platform === platform);
            const b = entryB.data.platforms.find((p) => p.platform === platform);
            const color = PLATFORM_COLORS[platform] || "#6b7280";
            const label = PLATFORM_LABELS[platform] || platform;
            const scoreA = a?.responseQuality || 0;
            const scoreB = b?.responseQuality || 0;
            const diff = scoreA - scoreB;

            return (
              <div key={platform}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium text-white">{label}</span>
                  {diff !== 0 && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        diff > 0
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {diff > 0 ? `A +${diff}` : `B +${Math.abs(diff)}`}
                    </span>
                  )}
                </div>

                {/* Comparative bars */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-cyan-500">A</span>
                      <span className={`text-xs font-semibold ${getScoreColor(scoreA)}`}>
                        {scoreA}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${scoreA}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-amber-500">B</span>
                      <span className={`text-xs font-semibold ${getScoreColor(scoreB)}`}>
                        {scoreB}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${scoreB}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* URL differences */}
                {(a?.topUrls?.length || b?.topUrls?.length) ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      {a?.topUrls?.slice(0, 3).map((url, i) => (
                        <p key={i} className="text-[10px] text-gray-500 truncate">{url}</p>
                      ))}
                      {!a?.topUrls?.length && (
                        <p className="text-[10px] text-gray-600">Fără URL-uri</p>
                      )}
                    </div>
                    <div>
                      {b?.topUrls?.slice(0, 3).map((url, i) => (
                        <p key={i} className="text-[10px] text-gray-500 truncate">{url}</p>
                      ))}
                      {!b?.topUrls?.length && (
                        <p className="text-[10px] text-gray-600">Fără URL-uri</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
