"use client";

import { useState } from "react";
import type { ShoppingProduct } from "@/lib/types/shopping";

interface ProductGridProps {
  products: ShoppingProduct[];
  onViewDetails?: (productId: string) => void;
}

export default function ProductGrid({ products, onViewDetails }: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (products.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500">Nu s-au găsit produse.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
            Produse ({products.length})
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 rounded ${viewMode === "grid" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"} transition-colors`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded ${viewMode === "list" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"} transition-colors`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => (
            <div
              key={product.productId || product.position}
              className="group bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 hover:border-orange-500/30 rounded-xl p-3 transition-all cursor-pointer"
              onClick={() => onViewDetails?.(product.productId)}
            >
              {product.thumbnail && (
                <div className="w-full h-32 mb-2 rounded-lg overflow-hidden bg-gray-900/50 flex items-center justify-center">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <h4 className="text-xs font-medium text-white line-clamp-2 mb-1.5 leading-relaxed">
                {product.title}
              </h4>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-orange-400">
                  {product.price}
                </span>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="text-[10px] text-gray-400">
                      {product.rating}
                      {product.reviews ? ` (${product.reviews})` : ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 truncate max-w-[60%]">
                  {product.seller}
                </span>
                {product.delivery && (
                  <span className="text-[10px] text-green-500/70">
                    {product.delivery}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.productId || product.position}
              className="group flex items-center gap-3 bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 hover:border-orange-500/30 rounded-xl p-3 transition-all cursor-pointer"
              onClick={() => onViewDetails?.(product.productId)}
            >
              {product.thumbnail && (
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-900/50 flex items-center justify-center">
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-white truncate mb-1">
                  {product.title}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-orange-400">
                    {product.price}
                  </span>
                  <span className="text-[10px] text-gray-500">{product.seller}</span>
                  {product.rating && (
                    <div className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-[10px] text-gray-400">
                        {product.rating}{product.reviews ? ` (${product.reviews})` : ""}
                      </span>
                    </div>
                  )}
                  {product.delivery && (
                    <span className="text-[10px] text-green-500/70">{product.delivery}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-gray-600 flex-shrink-0">
                #{product.position}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
