"use client";

import { useState, useCallback, useEffect } from "react";
import PromptEditor from "@/components/PromptEditor";
import MiniGauge from "@/components/MiniGauge";
import SuggestionChips from "@/components/SuggestionChips";
import ToneSelector from "@/components/ToneSelector";
import AudienceSelector from "@/components/AudienceSelector";
import ConstraintsPanel from "@/components/ConstraintsPanel";
import ContextEnricher from "@/components/ContextEnricher";
import CompactTokens from "@/components/CompactTokens";
import CompactBias from "@/components/CompactBias";
import CompactHallucination from "@/components/CompactHallucination";
import CompactModels from "@/components/CompactModels";
import Collapsible from "@/components/Collapsible";
import { AnalysisResult, TokenEstimate, AppliedSuggestion } from "@/lib/types";
import { estimateTokens } from "@/lib/tokenCounter";

export default function PromptIQPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tokenData, setTokenData] = useState<TokenEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedPrompt, setLastAnalyzedPrompt] = useState("");
  const [appliedSuggestions, setAppliedSuggestions] = useState<AppliedSuggestion[]>([]);
  const [appliedChipIds, setAppliedChipIds] = useState<Set<string>>(new Set());

  const isDirty = result !== null && prompt !== lastAnalyzedPrompt;

  useEffect(() => {
    if (prompt.trim()) {
      setTokenData(estimateTokens(prompt));
    } else {
      setTokenData(null);
    }
  }, [prompt]);

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la analiză.");
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
      setLastAnalyzedPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  const appendToPrompt = useCallback(
    (text: string, label: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPrompt((prev) => prev + text);
      setAppliedSuggestions((prev) => [...prev, { id, label, text }]);
    },
    []
  );

  const removeSuggestion = useCallback((id: string) => {
    setAppliedSuggestions((prev) => {
      const suggestion = prev.find((s) => s.id === id);
      if (suggestion) {
        setPrompt((p) => p.replace(suggestion.text, ""));
      }
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const applySuggestionChip = useCallback(
    (text: string, label: string, chipId: string) => {
      appendToPrompt(text, label);
      setAppliedChipIds((prev) => new Set(prev).add(chipId));
    },
    [appendToPrompt]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800/50 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold">
            <span className="text-blue-500">Prompt</span>
            <span className="text-white">IQ</span>
          </h2>
          {result && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Score:</span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    result.overall_score >= 90
                      ? "#22c55e"
                      : result.overall_score >= 70
                      ? "#3b82f6"
                      : result.overall_score >= 41
                      ? "#f59e0b"
                      : "#ef4444",
                }}
              >
                {result.overall_score}
              </span>
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-400 max-w-xs truncate">
            {error}
          </span>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="flex-1 grid grid-cols-[320px_1fr_280px] min-h-0">
        {/* LEFT PANEL — Scores & Analysis */}
        <div className="border-r border-gray-800/50 panel-scroll p-4 space-y-4">
          {result ? (
            <>
              {/* Gauge cluster */}
              <div className="flex flex-wrap justify-center gap-3 pb-3 border-b border-gray-800/30">
                <MiniGauge
                  score={result.overall_score}
                  label="IQ Score"
                  size={80}
                  isStale={isDirty}
                />
                <MiniGauge
                  score={result.clarity.score}
                  label="Claritate"
                  isStale={isDirty}
                />
                <MiniGauge
                  score={result.context.score}
                  label="Context"
                  isStale={isDirty}
                />
                <MiniGauge
                  score={result.structure.score}
                  label="Structură"
                  isStale={isDirty}
                />
                <MiniGauge
                  score={result.constraints.score}
                  label="Constrângeri"
                  isStale={isDirty}
                />
              </div>

              {/* Actionable suggestions per category */}
              <div className="space-y-4">
                <SuggestionChips
                  title="Claritate"
                  score={result.clarity.score}
                  label={result.clarity.label}
                  explanation={result.clarity.explanation}
                  suggestions={result.clarity.actionable_suggestions || []}
                  onApply={(text, label) =>
                    applySuggestionChip(text, label, `Claritate-${label}`)
                  }
                  appliedIds={appliedChipIds}
                />
                <SuggestionChips
                  title="Context"
                  score={result.context.score}
                  label={result.context.label}
                  explanation={result.context.explanation}
                  suggestions={result.context.actionable_suggestions || []}
                  onApply={(text, label) =>
                    applySuggestionChip(text, label, `Context-${label}`)
                  }
                  appliedIds={appliedChipIds}
                />
                <SuggestionChips
                  title="Structură"
                  score={result.structure.score}
                  label={result.structure.label}
                  explanation={result.structure.explanation}
                  suggestions={result.structure.actionable_suggestions || []}
                  onApply={(text, label) =>
                    applySuggestionChip(text, label, `Structură-${label}`)
                  }
                  appliedIds={appliedChipIds}
                />
                <SuggestionChips
                  title="Constrângeri"
                  score={result.constraints.score}
                  label={result.constraints.label}
                  explanation={result.constraints.explanation}
                  suggestions={result.constraints.actionable_suggestions || []}
                  onApply={(text, label) =>
                    applySuggestionChip(text, label, `Constrângeri-${label}`)
                  }
                  appliedIds={appliedChipIds}
                />
              </div>

              {/* Collapsible analysis sections */}
              <div className="space-y-2 pt-2 border-t border-gray-800/30">
                <Collapsible
                  title="Bias Check"
                  badge={result.bias.level}
                  badgeColor={
                    result.bias.level === "Ridicat"
                      ? "#ef4444"
                      : result.bias.level === "Mediu"
                      ? "#f59e0b"
                      : "#22c55e"
                  }
                >
                  <CompactBias
                    level={result.bias.level}
                    score={result.bias.score}
                    issues={result.bias.issues}
                  />
                </Collapsible>

                <Collapsible
                  title="Hallucination Risk"
                  badge={`${result.hallucination_risk.score}%`}
                  badgeColor={
                    result.hallucination_risk.score > 66
                      ? "#ef4444"
                      : result.hallucination_risk.score > 33
                      ? "#f59e0b"
                      : "#22c55e"
                  }
                >
                  <CompactHallucination
                    score={result.hallucination_risk.score}
                    level={result.hallucination_risk.level}
                    risks={result.hallucination_risk.risks}
                  />
                </Collapsible>

                <Collapsible title="Model Compatibility">
                  <CompactModels data={result.model_compatibility} />
                </Collapsible>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-700">IQ</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Scorurile și analiza vor apărea aici
              </p>
              <p className="text-xs text-gray-700">
                Lipește un prompt și apasă &ldquo;Analizează&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* CENTER PANEL — Prompt Editor */}
        <div className="p-4 flex flex-col min-h-0 relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-3 flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-300">Analizez promptul...</span>
              </div>
            </div>
          )}

          <PromptEditor
            prompt={prompt}
            setPrompt={setPrompt}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            isDirty={isDirty}
            appliedSuggestions={appliedSuggestions}
            onRemoveSuggestion={removeSuggestion}
          />
        </div>

        {/* RIGHT PANEL — Optimization Tools */}
        <div className="border-l border-gray-800/50 panel-scroll p-4 space-y-5">
          <ToneSelector
            primary={result?.tone.primary}
            breakdown={result?.tone.breakdown}
            onAppend={appendToPrompt}
          />

          <div className="border-t border-gray-800/30 pt-4">
            <AudienceSelector onAppend={appendToPrompt} />
          </div>

          <div className="border-t border-gray-800/30 pt-4">
            <ConstraintsPanel onAppend={appendToPrompt} />
          </div>

          <div className="border-t border-gray-800/30 pt-4">
            <ContextEnricher onAppend={appendToPrompt} />
          </div>

          {tokenData && (
            <div className="border-t border-gray-800/30 pt-4">
              <CompactTokens data={tokenData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
