export default function KeywordsPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Planificator Cuvinte Cheie</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Cercetare keywords, volume de căutare și sugestii inteligente — disponibil în curând.
        </p>
      </div>
    </div>
  );
}
