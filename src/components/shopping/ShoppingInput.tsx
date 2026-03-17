"use client";

interface ShoppingInputProps {
  query: string;
  country: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onSubmit: () => void;
}

const COUNTRY_OPTIONS = [
  { label: "Romania", value: "ro" },
  { label: "SUA", value: "us" },
  { label: "UK", value: "uk" },
  { label: "Germania", value: "de" },
  { label: "Franța", value: "fr" },
];

const CONDITION_OPTIONS = [
  { label: "Toate", value: "" },
  { label: "Noi", value: "new" },
  { label: "Folosite", value: "used" },
  { label: "Recondiționat", value: "refurbished" },
];

export default function ShoppingInput({
  query,
  country,
  minPrice,
  maxPrice,
  condition,
  isLoading,
  onQueryChange,
  onCountryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onConditionChange,
  onSubmit,
}: ShoppingInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && query.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Caută produse (ex: laptop gaming, iPhone 15)..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
            disabled={isLoading}
          />
        </div>
        <select
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
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
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
        >
          {isLoading ? "Caut..." : "Caută Produse"}
        </button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Preț:</span>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Min"
            className="w-20 bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            disabled={isLoading}
          />
          <span className="text-xs text-gray-600">—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Max"
            className="w-20 bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            disabled={isLoading}
          />
        </div>
        <select
          value={condition}
          onChange={(e) => onConditionChange(e.target.value)}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-orange-500/50 appearance-none cursor-pointer"
          disabled={isLoading}
        >
          {CONDITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
