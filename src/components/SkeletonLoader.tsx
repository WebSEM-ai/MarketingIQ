"use client";

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-32 bg-gray-800 rounded" />
        <div className="h-8 w-16 bg-gray-800 rounded" />
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-800 rounded" />
        <div className="h-3 w-3/4 bg-gray-800 rounded" />
      </div>
      <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
        <div className="h-3 w-5/6 bg-gray-800 rounded" />
      </div>
    </div>
  );
}

export default function SkeletonLoader() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Score gauge skeleton */}
      <div className="flex justify-center">
        <div className="w-48 h-48 rounded-full bg-gray-900 border border-gray-800 animate-pulse" />
      </div>

      {/* Sub-scores grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Other modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
