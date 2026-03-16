"use client";

import type { CalendarItem } from "@/lib/types/content";

interface ContentCalendarProps {
  calendar: CalendarItem[];
}

const TYPE_COLORS: Record<CalendarItem["type"], string> = {
  blog: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  social: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  video: "bg-red-500/20 text-red-400 border-red-500/30",
  email: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  landing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  infographic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const TYPE_LABELS: Record<CalendarItem["type"], string> = {
  blog: "Blog",
  social: "Social",
  video: "Video",
  email: "Email",
  landing: "Landing",
  infographic: "Infografic",
};

export default function ContentCalendar({ calendar }: ContentCalendarProps) {
  if (!calendar.length) return null;

  // Group by week
  const weeks = new Map<number, CalendarItem[]>();
  calendar.forEach((item) => {
    const existing = weeks.get(item.week) || [];
    existing.push(item);
    weeks.set(item.week, existing);
  });

  const sortedWeeks = Array.from(weeks.entries()).sort(
    ([a], [b]) => a - b
  );

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
          Calendar de Conținut — 4 Săptămâni
        </h3>
      </div>

      <div className="space-y-4">
        {sortedWeeks.map(([week, items]) => (
          <div key={week}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-white bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded">
                Săptămâna {week}
              </span>
              <div className="flex-1 h-px bg-gray-800/50" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-medium text-white flex-1">
                      {item.title}
                    </h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        TYPE_COLORS[item.type] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }`}
                    >
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-1.5">{item.topic}</p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                      {item.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                      {item.goal}
                    </span>
                  </div>

                  {item.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.keywords.map((kw, ki) => (
                        <span
                          key={ki}
                          className="text-[10px] text-gray-400 bg-gray-800/50 border border-gray-700/30 px-1.5 py-0.5 rounded"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
