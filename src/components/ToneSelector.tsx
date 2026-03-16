"use client";

import { ToneBreakdown } from "@/lib/types";

const TONES: { key: keyof ToneBreakdown; color: string; instruction: string }[] = [
  { key: "Formal", color: "#6366f1", instruction: "\nTon: Folosește un ton formal și profesional." },
  { key: "Casual", color: "#f59e0b", instruction: "\nTon: Folosește un ton casual, relaxat și conversațional." },
  { key: "Autoritar", color: "#ef4444", instruction: "\nTon: Folosește un ton autoritar, direct și asertiv." },
  { key: "Tehnic", color: "#3b82f6", instruction: "\nTon: Folosește un ton tehnic cu terminologie de specialitate." },
  { key: "Creativ", color: "#a855f7", instruction: "\nTon: Folosește un ton creativ, expresiv și original." },
  { key: "Prietenos", color: "#22c55e", instruction: "\nTon: Folosește un ton prietenos, cald și accesibil." },
];

export default function ToneSelector({
  primary,
  breakdown,
  onAppend,
}: {
  primary?: string;
  breakdown?: ToneBreakdown;
  onAppend: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Ton
      </h4>

      <div className="grid grid-cols-3 gap-1.5">
        {TONES.map((t) => {
          const isActive = primary === t.key;
          const value = breakdown?.[t.key] ?? 0;

          return (
            <button
              key={t.key}
              onClick={() => onAppend(t.instruction, `Ton: ${t.key}`)}
              className={`relative text-[11px] font-medium px-2 py-2 rounded-lg border transition-all text-center ${
                isActive
                  ? "border-opacity-50"
                  : "border-gray-800 hover:border-gray-700"
              }`}
              style={
                isActive
                  ? {
                      color: t.color,
                      backgroundColor: `${t.color}10`,
                      borderColor: `${t.color}40`,
                    }
                  : { color: "#9ca3af" }
              }
            >
              {t.key}
              {value > 0 && (
                <div className="mt-1 w-full bg-gray-800 rounded-full h-0.5">
                  <div
                    className="h-0.5 rounded-full"
                    style={{ width: `${value}%`, backgroundColor: t.color }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
