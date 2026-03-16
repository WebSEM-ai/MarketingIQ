"use client";

interface TrendInsightsProps {
  insights: string;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    // Bold headers (lines starting with **)
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-emerald-400 mt-3 mb-1">
          {trimmed.replace(/\*\*/g, "")}
        </h4>
      );
      return;
    }

    // Lines containing bold text
    if (trimmed.includes("**")) {
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={i} className="text-sm text-gray-300 mb-1">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="text-white font-semibold">
                {part.replace(/\*\*/g, "")}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      );
      return;
    }

    // Bullet points
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 mb-1 pl-2">
          <span className="text-emerald-500 mt-1.5 text-[6px]">&#9679;</span>
          <span className="text-sm text-gray-300">{trimmed.slice(2)}</span>
        </div>
      );
      return;
    }

    // Numbered items
    const numberedMatch = trimmed.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2 mb-1 pl-2">
          <span className="text-emerald-500 text-xs font-medium min-w-[16px]">
            {numberedMatch[1]}.
          </span>
          <span className="text-sm text-gray-300">{numberedMatch[2]}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-300 mb-1">
        {trimmed}
      </p>
    );
  });

  return elements;
}

export default function TrendInsights({ insights }: TrendInsightsProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
          Insights AI
        </h3>
      </div>
      <div className="space-y-0">{renderMarkdown(insights)}</div>
    </div>
  );
}
