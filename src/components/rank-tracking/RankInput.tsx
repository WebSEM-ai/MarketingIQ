"use client";

import { useState } from "react";

interface RankInputProps {
  domain: string;
  keywords: string;
  country: string;
  device: string;
  isLoading: boolean;
  onDomainChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onDeviceChange: (value: string) => void;
  onSubmit: () => void;
}

const COUNTRY_OPTIONS = [
  { label: "Romania", value: "ro" },
  { label: "Global", value: "us" },
  { label: "UK", value: "uk" },
  { label: "Germania", value: "de" },
  { label: "Franța", value: "fr" },
];

const DEVICE_OPTIONS = [
  { label: "Desktop", value: "desktop" },
  { label: "Mobile", value: "mobile" },
  { label: "Tablet", value: "tablet" },
];

export default function RankInput({
  domain,
  keywords,
  country,
  device,
  isLoading,
  onDomainChange,
  onKeywordsChange,
  onCountryChange,
  onDeviceChange,
  onSubmit,
}: RankInputProps) {
  const [expanded, setExpanded] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading && domain.trim() && keywords.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const keywordCount = keywords.split("\n").filter((k) => k.trim()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Domeniu (ex: farmaciatei.ro)"
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            disabled={isLoading}
          />
        </div>
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
          disabled={isLoading}
        >
          {COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-0.5">
          {DEVICE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDeviceChange(opt.value)}
              disabled={isLoading}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                device === opt.value
                  ? "bg-emerald-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={onSubmit}
          disabled={isLoading || !domain.trim() || !keywords.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          {isLoading ? "Verific..." : `Verifică ${keywordCount > 0 ? `(${keywordCount})` : ""}`}
        </button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500">
            Cuvinte cheie (câte unul pe linie, max 50)
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? "Minimizează" : "Extinde"}
          </button>
        </div>
        <textarea
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"biseptol\nfarmacii online\nmedicamente fara reteta"}
          rows={expanded ? 10 : 3}
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none font-mono"
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
