"use client";

import type { RelatedQuery } from "@/lib/types/trends";
import SynergyActionButton from "@/components/synergy/SynergyActionButton";

interface RelatedQueriesProps {
  queries: RelatedQuery[];
}

export default function RelatedQueries({ queries }: RelatedQueriesProps) {
  const topQueries = queries.filter((q) => q.type === "top");
  const risingQueries = queries.filter((q) => q.type === "rising");

  if (!queries.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Interogări Asociate
        </h3>
        <p className="text-sm text-gray-500">Nu sunt date disponibile.</p>
      </div>
    );
  }

  const maxTop = topQueries.length ? Math.max(...topQueries.map((q) => q.value), 1) : 1;
  const maxRising = risingQueries.length ? Math.max(...risingQueries.map((q) => q.value), 1) : 1;

  const renderQueryRow = (q: RelatedQuery, i: number, max: number, isRising: boolean) => (
    <div key={i} className="flex items-center gap-2 group">
      <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">
        {q.position}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-gray-300 truncate">{q.query}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <span className={`text-xs ${isRising ? "text-emerald-400" : "text-gray-500"}`}>
              {isRising ? `+${q.value}%` : q.value}
            </span>
            {/* Synergy buttons */}
            <SynergyActionButton
              source="trends"
              target="keywords"
              data={{ seed: q.query }}
              label={q.query}
              icon="keywords"
              title="Cercetează cuvinte cheie"
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100"
            />
            <SynergyActionButton
              source="trends"
              target="aeo"
              data={{ prompt: q.query }}
              label={q.query}
              icon="aeo"
              title="Verifică vizibilitate AEO"
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100"
            />
          </div>
        </div>
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isRising ? "bg-emerald-500" : "bg-emerald-500/60"}`}
            style={{ width: `${Math.min((q.value / max) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Interogări Asociate
      </h3>

      {topQueries.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-emerald-500 mb-2">Top</h4>
          <div className="space-y-1.5">
            {topQueries.slice(0, 10).map((q, i) => renderQueryRow(q, i, maxTop, false))}
          </div>
        </div>
      )}

      {risingQueries.length > 0 && (
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
            {risingQueries.slice(0, 10).map((q, i) => renderQueryRow(q, i, maxRising, true))}
          </div>
        </div>
      )}
    </div>
  );
}
