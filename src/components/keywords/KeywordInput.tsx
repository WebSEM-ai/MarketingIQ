"use client";

interface KeywordInputProps {
  seed: string;
  domain: string;
  country: string;
  isLoading: boolean;
  onSeedChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSubmit: () => void;
}

const COUNTRY_OPTIONS = [
  { label: "România", value: "RO" },
  { label: "Global", value: "" },
  { label: "SUA", value: "US" },
  { label: "UK", value: "GB" },
];

export default function KeywordInput({
  seed,
  domain,
  country,
  isLoading,
  onSeedChange,
  onDomainChange,
  onCountryChange,
  onSubmit,
}: KeywordInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && seed.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={seed}
          onChange={(e) => onSeedChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Cuvânt cheie principal..."
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
          disabled={isLoading}
        />
      </div>
      <div className="w-48">
        <input
          type="text"
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Domeniu (opțional)"
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
          disabled={isLoading}
        />
      </div>
      <select
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
        disabled={isLoading}
      >
        {COUNTRY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={onSubmit}
        disabled={isLoading || !seed.trim()}
        className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        {isLoading ? "Cercetez..." : "Cercetează"}
      </button>
    </div>
  );
}
