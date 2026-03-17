"use client";

interface YouTubeInputProps {
  query: string;
  country: string;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSubmit: () => void;
}

const COUNTRY_OPTIONS = [
  { label: "Romania", value: "ro" },
  { label: "Global", value: "us" },
  { label: "UK", value: "uk" },
  { label: "Germania", value: "de" },
  { label: "Franța", value: "fr" },
];

export default function YouTubeInput({
  query,
  country,
  isLoading,
  onQueryChange,
  onCountryChange,
  onSubmit,
}: YouTubeInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && query.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Caută pe YouTube (ex: SEO tutorial, marketing digital)..."
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
          disabled={isLoading}
        />
      </div>
      <select
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
        className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
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
        disabled={isLoading || !query.trim()}
        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
      >
        {isLoading ? "Caut..." : "Caută"}
      </button>
    </div>
  );
}
