"use client";

import type { PriceRange, ShoppingProduct } from "@/lib/types/shopping";

interface PriceAnalysisProps {
  priceRange: PriceRange;
  products: ShoppingProduct[];
}

export default function PriceAnalysis({ priceRange, products }: PriceAnalysisProps) {
  // Top sellers by product count
  const sellerCounts: Record<string, number> = {};
  products.forEach((p) => {
    if (p.seller) {
      sellerCounts[p.seller] = (sellerCounts[p.seller] || 0) + 1;
    }
  });
  const topSellers = Object.entries(sellerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Price distribution buckets
  const prices = products
    .map((p) => p.extractedPrice)
    .filter((p): p is number => p !== null && p > 0)
    .sort((a, b) => a - b);

  const bucketCount = 5;
  const bucketSize = prices.length > 0 ? (priceRange.max - priceRange.min) / bucketCount : 0;
  const buckets: { label: string; count: number; pct: number }[] = [];

  if (bucketSize > 0) {
    for (let i = 0; i < bucketCount; i++) {
      const lo = priceRange.min + i * bucketSize;
      const hi = i === bucketCount - 1 ? priceRange.max + 1 : priceRange.min + (i + 1) * bucketSize;
      const count = prices.filter((p) => p >= lo && p < hi).length;
      buckets.push({
        label: `${Math.round(lo)} - ${Math.round(hi === priceRange.max + 1 ? priceRange.max : hi)}`,
        count,
        pct: prices.length > 0 ? Math.round((count / prices.length) * 100) : 0,
      });
    }
  }

  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
        <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
          Analiza Prețurilor
        </h3>
      </div>

      {/* Price stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-800/40 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Minim</p>
          <p className="text-sm font-bold text-green-400">
            {priceRange.min.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">{priceRange.currency}</span>
          </p>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Medie</p>
          <p className="text-sm font-bold text-orange-400">
            {priceRange.avg.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">{priceRange.currency}</span>
          </p>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Maxim</p>
          <p className="text-sm font-bold text-red-400">
            {priceRange.max.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">{priceRange.currency}</span>
          </p>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-2.5 text-center">
          <p className="text-[10px] text-gray-500 mb-0.5">Selleri</p>
          <p className="text-sm font-bold text-blue-400">{priceRange.sellerCount}</p>
        </div>
      </div>

      {/* Price distribution chart */}
      {buckets.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Distribuție prețuri ({priceRange.currency})</p>
          <div className="space-y-1.5">
            {buckets.map((bucket, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-28 text-right flex-shrink-0">
                  {bucket.label}
                </span>
                <div className="flex-1 h-4 bg-gray-800/50 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600/60 to-orange-500/80 rounded transition-all duration-500"
                    style={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">
                  {bucket.count} ({bucket.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top sellers */}
      {topSellers.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Top Selleri</p>
          <div className="space-y-1">
            {topSellers.map(([seller, count]) => (
              <div key={seller} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-300">{seller}</span>
                <span className="text-[10px] text-orange-400/70">{count} produse</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
