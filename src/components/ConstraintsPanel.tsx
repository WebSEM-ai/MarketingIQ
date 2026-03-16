"use client";

import { useState } from "react";

const LENGTH_OPTIONS = [
  { label: "Max 100 cuvinte", text: "\nLimită: maximum 100 de cuvinte." },
  { label: "Max 300 cuvinte", text: "\nLimită: maximum 300 de cuvinte." },
  { label: "Max 500 cuvinte", text: "\nLimită: maximum 500 de cuvinte." },
  { label: "Max 1000 cuvinte", text: "\nLimită: maximum 1000 de cuvinte." },
];

const FORMAT_OPTIONS = [
  { label: "Bullet points", text: "\nFormat: organizează răspunsul în bullet points." },
  { label: "Liste numerotate", text: "\nFormat: organizează răspunsul în liste numerotate." },
  { label: "Tabel", text: "\nFormat: prezintă informațiile într-un tabel structurat." },
  { label: "JSON", text: "\nFormat: returnează răspunsul în format JSON valid." },
  { label: "Markdown", text: "\nFormat: folosește formatare Markdown cu headings, bold, italic." },
  { label: "Pas cu pas", text: "\nFormat: organizează ca ghid pas cu pas (Step 1, Step 2, etc.)." },
];

export default function ConstraintsPanel({
  onAppend,
}: {
  onAppend: (text: string, label: string) => void;
}) {
  const [customDo, setCustomDo] = useState("");
  const [customDont, setCustomDont] = useState("");

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Constrângeri
      </h4>

      {/* Length */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Lungime</p>
        <div className="flex flex-wrap gap-1">
          {LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onAppend(opt.text, opt.label)}
              className="text-[11px] text-gray-400 hover:text-blue-400 bg-gray-800/50 hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/30 px-2 py-1 rounded-md transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Format</p>
        <div className="flex flex-wrap gap-1">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onAppend(opt.text, opt.label)}
              className="text-[11px] text-gray-400 hover:text-blue-400 bg-gray-800/50 hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/30 px-2 py-1 rounded-md transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Do */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Reguli custom</p>
        <div className="flex gap-1.5 mb-1.5">
          <input
            value={customDo}
            onChange={(e) => setCustomDo(e.target.value)}
            placeholder="Trebuie să..."
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-800 rounded-md px-2 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customDo.trim()) {
                onAppend(`\nTREBUIE: ${customDo.trim()}`, `Do: ${customDo.trim()}`);
                setCustomDo("");
              }
            }}
          />
          <button
            onClick={() => {
              if (customDo.trim()) {
                onAppend(`\nTREBUIE: ${customDo.trim()}`, `Do: ${customDo.trim()}`);
                setCustomDo("");
              }
            }}
            className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 rounded-md hover:bg-green-500/20 transition-colors"
          >
            +Do
          </button>
        </div>
        <div className="flex gap-1.5">
          <input
            value={customDont}
            onChange={(e) => setCustomDont(e.target.value)}
            placeholder="NU trebuie să..."
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-800 rounded-md px-2 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customDont.trim()) {
                onAppend(`\nNU: ${customDont.trim()}`, `Don't: ${customDont.trim()}`);
                setCustomDont("");
              }
            }}
          />
          <button
            onClick={() => {
              if (customDont.trim()) {
                onAppend(`\nNU: ${customDont.trim()}`, `Don't: ${customDont.trim()}`);
                setCustomDont("");
              }
            }}
            className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 rounded-md hover:bg-red-500/20 transition-colors"
          >
            +Don&apos;t
          </button>
        </div>
      </div>
    </div>
  );
}
