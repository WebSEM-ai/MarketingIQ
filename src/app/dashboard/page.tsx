"use client";

import Link from "next/link";

const modules = [
  {
    href: "/dashboard/prompt-iq",
    label: "PromptIQ",
    description: "Analizează și optimizează prompturi AI cu scoruri detaliate și sugestii inteligente.",
    color: "#3b82f6",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    status: "activ",
  },
  {
    href: "/dashboard/competitors",
    label: "Competitori",
    description: "Monitorizează competitorii, scanează site-uri și detectează schimbări în conținut.",
    color: "#f59e0b",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    status: "în curând",
  },
  {
    href: "/dashboard/trends",
    label: "Tendințe",
    description: "Analizează tendințe de căutare, topicuri în creștere și comparații de keywords.",
    color: "#22c55e",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    status: "în curând",
  },
  {
    href: "/dashboard/keywords",
    label: "Cuvinte Cheie",
    description: "Cercetează keywords, analizează volume de căutare și obține sugestii relevante.",
    color: "#a855f7",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    status: "în curând",
  },
  {
    href: "/dashboard/content",
    label: "Conținut",
    description: "Generează calendare de conținut, clustere tematice și analize de gap-uri.",
    color: "#f43f5e",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    status: "în curând",
  },
];

export default function DashboardPage() {
  return (
    <div className="h-full panel-scroll p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Marketing<span className="text-blue-400">IQ</span> Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Platforma ta de marketing intelligence. Selectează un modul pentru a începe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 hover:bg-gray-900/80 hover:border-gray-700/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                {mod.status === "în curând" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700/50">
                    În curând
                  </span>
                )}
                {mod.status === "activ" && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${mod.color}15`,
                      borderColor: `${mod.color}30`,
                      color: mod.color,
                    }}
                  >
                    Activ
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-gray-100">
                {mod.label}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {mod.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
