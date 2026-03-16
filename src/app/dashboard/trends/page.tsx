export default function TrendsPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Analiză Tendințe</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Tendințe de căutare, topicuri în creștere și comparații de keywords — disponibil în curând.
        </p>
      </div>
    </div>
  );
}
