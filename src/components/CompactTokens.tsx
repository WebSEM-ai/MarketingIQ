"use client";

import { TokenEstimate } from "@/lib/types";

export default function CompactTokens({ data }: { data: TokenEstimate }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tokeni
        </span>
        <span className="text-sm font-bold text-blue-400">{data.tokenCount}</span>
      </div>
      <div className="space-y-1">
        {data.costs.map((c) => (
          <div key={c.model} className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500">{c.model}</span>
            <span className="text-gray-400 font-mono">${c.estimatedCost.toFixed(6)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
