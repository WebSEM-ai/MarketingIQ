"use client";

import { useState } from "react";

export default function PromptInput({
  onAnalyze,
  isLoading,
}: {
  onAnalyze: (prompt: string) => void;
  isLoading: boolean;
}) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onAnalyze(prompt.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Lipește promptul tău aici..."
        className="w-full h-48 bg-gray-900 border border-gray-700 rounded-2xl p-5 text-gray-100 placeholder-gray-500 text-base resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
        disabled={isLoading}
      />
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          {prompt.length} / 10.000 caractere
        </span>
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isLoading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all text-base"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analizez...
            </span>
          ) : (
            "Analizează"
          )}
        </button>
      </div>
    </div>
  );
}
