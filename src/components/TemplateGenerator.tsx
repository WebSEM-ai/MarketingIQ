"use client";

import { useState } from "react";

export default function TemplateGenerator({
  hasVariables,
  template,
  variablesDetected,
}: {
  hasVariables: boolean;
  template: string | null;
  variablesDetected: string[];
}) {
  const [copied, setCopied] = useState(false);

  if (!hasVariables || !template) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Prompt Templating
        </h3>
        <p className="text-sm text-gray-400">
          Nu au fost detectate valori hardcodate care ar putea fi transformate în
          variabile.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Highlight [VARIABLES] in template
  const parts = template.split(/(\[[A-Z_\s]+\])/g);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Prompt Templating
      </h3>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
        {parts.map((part, i) =>
          /^\[[A-Z_\s]+\]$/.test(part) ? (
            <span
              key={i}
              className="text-purple-400 font-semibold bg-purple-400/10 px-1 rounded"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>

      {variablesDetected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {variablesDetected.map((v, i) => (
            <span
              key={i}
              className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20"
            >
              {v}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {copied ? "✓ Copiat!" : "Copiază șablon"}
      </button>
    </div>
  );
}
