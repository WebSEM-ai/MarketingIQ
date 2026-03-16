export default function CompetitorsPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Monitor Competitori</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Monitorizare competitori, scanare site-uri și detecție schimbări — disponibil în curând.
        </p>
      </div>
    </div>
  );
}
