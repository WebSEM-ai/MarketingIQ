"use client";

import type { SEOData } from "@/lib/types/competitors";

interface SEOReportProps {
  seo: SEOData;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-400 w-8 text-right">{score}</span>
    </div>
  );
}

export default function SEOReport({ seo }: SEOReportProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
        Raport SEO
      </h3>

      {seo.score !== undefined && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Scor general</span>
            <span className="text-sm font-bold text-white">{seo.score}/100</span>
          </div>
          <ScoreBar score={seo.score} />
        </div>
      )}

      <div className="space-y-3">
        {seo.title && (
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">Titlu</span>
            <p className="text-sm text-white">{seo.title}</p>
          </div>
        )}

        {seo.description && (
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">Meta descriere</span>
            <p className="text-sm text-gray-300">{seo.description}</p>
          </div>
        )}

        {seo.h1 && seo.h1.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">H1 ({seo.h1.length})</span>
            {seo.h1.map((h, i) => (
              <p key={i} className="text-sm text-gray-300">{h}</p>
            ))}
          </div>
        )}

        {seo.h2 && seo.h2.length > 0 && (
          <div>
            <span className="text-xs text-gray-500 block mb-0.5">H2 ({seo.h2.length})</span>
            <div className="space-y-0.5">
              {seo.h2.slice(0, 5).map((h, i) => (
                <p key={i} className="text-xs text-gray-400">{h}</p>
              ))}
              {seo.h2.length > 5 && (
                <p className="text-xs text-gray-600">+{seo.h2.length - 5} altele</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {seo.wordCount !== undefined && (
            <div className="bg-gray-800/30 rounded-lg p-2 text-center">
              <span className="text-lg font-bold text-white block">{seo.wordCount.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500">Cuvinte</span>
            </div>
          )}
          {seo.images !== undefined && (
            <div className="bg-gray-800/30 rounded-lg p-2 text-center">
              <span className="text-lg font-bold text-white block">{seo.images}</span>
              <span className="text-[10px] text-gray-500">Imagini</span>
            </div>
          )}
          {seo.loadTime !== undefined && (
            <div className="bg-gray-800/30 rounded-lg p-2 text-center">
              <span className="text-lg font-bold text-white block">{seo.loadTime.toFixed(1)}s</span>
              <span className="text-[10px] text-gray-500">Încărcare</span>
            </div>
          )}
        </div>

        {seo.links && (
          <div className="flex gap-4">
            <div>
              <span className="text-xs text-gray-500">Link-uri interne:</span>
              <span className="text-sm text-white ml-1">{seo.links.internal}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">Link-uri externe:</span>
              <span className="text-sm text-white ml-1">{seo.links.external}</span>
            </div>
          </div>
        )}
      </div>

      {seo.issues && seo.issues.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 block mb-2">
            Probleme ({seo.issues.length})
          </span>
          <div className="space-y-1.5">
            {seo.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-xs text-gray-400">{issue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
