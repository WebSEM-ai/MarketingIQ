"use client";

import { useState } from "react";

interface AddCompetitorFormProps {
  onScan: (url: string, keywords: string[]) => void;
  isLoading: boolean;
}

export default function AddCompetitorForm({ onScan, isLoading }: AddCompetitorFormProps) {
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState("");

  const handleSubmit = () => {
    if (!url.trim()) return;
    const kws = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    onScan(url.trim(), kws);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
        Adaugă Competitor
      </h3>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">URL competitor</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplu.ro"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Cuvinte cheie (separate prin virgulă)
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="seo, marketing digital, optimizare"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
          disabled={isLoading}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!url.trim() || isLoading}
        className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanez...
          </>
        ) : (
          "Scanează"
        )}
      </button>
    </div>
  );
}
