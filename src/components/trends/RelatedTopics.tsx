"use client";

import type { RelatedTopic } from "@/lib/types/trends";

interface RelatedTopicsProps {
  topics: RelatedTopic[];
}

export default function RelatedTopics({ topics }: RelatedTopicsProps) {
  const topTopics = topics.filter((t) => t.category === "top");
  const risingTopics = topics.filter((t) => t.category === "rising");

  if (!topics.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Topicuri Asociate
        </h3>
        <p className="text-sm text-gray-500">Nu sunt date disponibile.</p>
      </div>
    );
  }

  const maxTop = topTopics.length ? Math.max(...topTopics.map((t) => t.value), 1) : 1;
  const maxRising = risingTopics.length ? Math.max(...risingTopics.map((t) => t.value), 1) : 1;

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Topicuri Asociate
      </h3>

      {topTopics.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-emerald-500 mb-2">Top</h4>
          <div className="space-y-1.5">
            {topTopics.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-gray-300 truncate">{t.title}</span>
                      {t.type && (
                        <span className="text-[10px] text-gray-600 flex-shrink-0">
                          {t.type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{t.value}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/60 rounded-full"
                      style={{ width: `${(t.value / maxTop) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {risingTopics.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-emerald-500 mb-2">
            <span className="inline-flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              În Creștere
            </span>
          </h4>
          <div className="space-y-1.5">
            {risingTopics.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-gray-300 truncate">{t.title}</span>
                      {t.type && (
                        <span className="text-[10px] text-gray-600 flex-shrink-0">
                          {t.type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-emerald-400 flex-shrink-0 ml-2">+{t.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min((t.value / maxRising) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
