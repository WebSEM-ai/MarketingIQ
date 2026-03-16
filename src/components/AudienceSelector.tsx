"use client";

const AGE_GROUPS = [
  { label: "Copii", text: "\nPublic țintă: copii (6-12 ani). Folosește limbaj simplu și exemple pe înțelesul lor." },
  { label: "Adolescenți", text: "\nPublic țintă: adolescenți (13-18 ani). Folosește un limbaj actual și relatable." },
  { label: "Tineri adulți", text: "\nPublic țintă: tineri adulți (18-30 ani)." },
  { label: "Adulți", text: "\nPublic țintă: adulți (30-55 ani) cu experiență profesională." },
  { label: "Seniori", text: "\nPublic țintă: persoane 55+ ani. Folosește un ton respectuos și clar." },
];

const EXPERTISE = [
  { label: "Începător", text: "\nNivel audiență: începător. Explică conceptele de bază și evită jargonul tehnic." },
  { label: "Intermediar", text: "\nNivel audiență: intermediar. Poți folosi terminologie de bază fără explicații detaliate." },
  { label: "Expert", text: "\nNivel audiență: expert. Poți folosi terminologie avansată și presupui cunoștințe solide." },
];

const DEMOGRAPHICS = [
  { label: "General", text: "\nAudiență generalistă, fără specializare." },
  { label: "Tehnic", text: "\nAudiență tehnică: developeri, ingineri, IT." },
  { label: "Business", text: "\nAudiență business: antreprenori, manageri, decidenți." },
  { label: "Academic", text: "\nAudiență academică: cercetători, studenți, profesori." },
  { label: "Creativ", text: "\nAudiență creativă: designeri, artiști, content creators." },
];

function ChipGroup({
  title,
  items,
  onAppend,
}: {
  title: string;
  items: { label: string; text: string }[];
  onAppend: (text: string, label: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onAppend(item.text, item.label)}
            className="text-[11px] text-gray-400 hover:text-blue-400 bg-gray-800/50 hover:bg-blue-500/10 border border-gray-800 hover:border-blue-500/30 px-2 py-1 rounded-md transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AudienceSelector({
  onAppend,
}: {
  onAppend: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Targetare
      </h4>
      <ChipGroup title="Vârstă" items={AGE_GROUPS} onAppend={onAppend} />
      <ChipGroup title="Nivel" items={EXPERTISE} onAppend={onAppend} />
      <ChipGroup title="Profil" items={DEMOGRAPHICS} onAppend={onAppend} />
    </div>
  );
}
