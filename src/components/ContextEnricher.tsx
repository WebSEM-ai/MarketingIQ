"use client";

import { useState } from "react";

const ROLES = [
  { label: "Expert Marketing", text: "\nEști un expert în marketing digital cu peste 10 ani de experiență." },
  { label: "Developer Senior", text: "\nEști un software developer senior cu experiență vastă în arhitecturi moderne." },
  { label: "Profesor", text: "\nEști un profesor experimentat, specializat în explicații clare și pedagogice." },
  { label: "Editor", text: "\nEști un editor profesionist cu ochi pentru detalii și stil impecabil." },
  { label: "Consultant", text: "\nEști un consultant de business cu experiență în strategii de creștere." },
  { label: "Copywriter", text: "\nEști un copywriter creativ cu experiență în texte persuasive." },
  { label: "Data Analyst", text: "\nEști un data analyst expert în interpretarea și vizualizarea datelor." },
  { label: "UX Designer", text: "\nEști un UX designer cu focus pe user research și usability." },
];

const OUTPUT_FORMATS = [
  { label: "Articol de blog", text: "\nOutputul trebuie să fie un articol de blog complet, cu titlu, subtitluri și concluzie." },
  { label: "Email profesional", text: "\nOutputul trebuie să fie un email profesional, cu subiect, salut și semnătură." },
  { label: "Social media post", text: "\nOutputul trebuie să fie o postare optimizată pentru social media, concisă și captivantă." },
  { label: "Raport tehnic", text: "\nOutputul trebuie să fie un raport tehnic structurat cu secțiuni clare." },
  { label: "Script video", text: "\nOutputul trebuie să fie un script de video cu intro, secțiuni și CTA." },
  { label: "Prezentare", text: "\nOutputul trebuie să fie structurat ca slide-uri de prezentare (slide 1, slide 2, etc.)." },
];

export default function ContextEnricher({
  onAppend,
}: {
  onAppend: (text: string, label: string) => void;
}) {
  const [customBg, setCustomBg] = useState("");

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Context
      </h4>

      {/* Roles */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Rol</p>
        <div className="flex flex-wrap gap-1">
          {ROLES.map((role) => (
            <button
              key={role.label}
              onClick={() => onAppend(role.text, `Rol: ${role.label}`)}
              className="text-[11px] text-gray-400 hover:text-purple-400 bg-gray-800/50 hover:bg-purple-500/10 border border-gray-800 hover:border-purple-500/30 px-2 py-1 rounded-md transition-all"
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output format */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Format output</p>
        <div className="flex flex-wrap gap-1">
          {OUTPUT_FORMATS.map((fmt) => (
            <button
              key={fmt.label}
              onClick={() => onAppend(fmt.text, `Format: ${fmt.label}`)}
              className="text-[11px] text-gray-400 hover:text-purple-400 bg-gray-800/50 hover:bg-purple-500/10 border border-gray-800 hover:border-purple-500/30 px-2 py-1 rounded-md transition-all"
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom background */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Background custom</p>
        <div className="flex gap-1.5">
          <input
            value={customBg}
            onChange={(e) => setCustomBg(e.target.value)}
            placeholder="Adaugă context sau background..."
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-800 rounded-md px-2 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customBg.trim()) {
                onAppend(`\nContext: ${customBg.trim()}`, `BG: ${customBg.trim().slice(0, 30)}`);
                setCustomBg("");
              }
            }}
          />
          <button
            onClick={() => {
              if (customBg.trim()) {
                onAppend(`\nContext: ${customBg.trim()}`, `BG: ${customBg.trim().slice(0, 30)}`);
                setCustomBg("");
              }
            }}
            className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 rounded-md hover:bg-purple-500/20 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
