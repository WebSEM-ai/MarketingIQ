"use client";

import { TokenEstimate } from "@/lib/types";

export default function TokenEstimator({ data }: { data: TokenEstimate }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Token Estimator
      </h3>

      <div className="flex gap-6 mb-5">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Cuvinte
          </span>
          <p className="text-2xl font-bold text-white">{data.wordCount}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Tokeni (est.)
          </span>
          <p className="text-2xl font-bold text-blue-400">{data.tokenCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50">
              <th className="text-left px-4 py-2.5 text-gray-400 font-medium">
                Model
              </th>
              <th className="text-right px-4 py-2.5 text-gray-400 font-medium">
                Preț / 1M tokeni
              </th>
              <th className="text-right px-4 py-2.5 text-gray-400 font-medium">
                Cost estimat
              </th>
            </tr>
          </thead>
          <tbody>
            {data.costs.map((c) => (
              <tr key={c.model} className="border-t border-gray-800">
                <td className="px-4 py-2.5 text-white font-medium">
                  {c.model}
                </td>
                <td className="px-4 py-2.5 text-gray-300 text-right">
                  ${c.costPer1M}
                </td>
                <td className="px-4 py-2.5 text-green-400 text-right font-mono">
                  ${c.estimatedCost.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
