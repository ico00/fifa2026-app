function Header({ darkMode, setDarkMode, isAdmin, onAdminClick, onLogout }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-black/50 to-transparent py-6 text-center">
      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fifa-gold/20 via-fifa-gold to-fifa-gold/20"></div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        {/* Top Flags */}
        <div className="flex gap-4 text-2xl animate-fade-in-down">
          <span className="hover:scale-125 transition-transform duration-300 cursor-default">🇺🇸</span>
          <span className="hover:scale-125 transition-transform duration-300 cursor-default">🇨🇦</span>
          <span className="hover:scale-125 transition-transform duration-300 cursor-default">🇲🇽</span>
        </div>

        {/* Main Title */}
        <div className="flex items-center gap-4">
          <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-black tracking-widest text-fifa-blue dark:text-fifa-gold drop-shadow-md">
            FIFA WORLD CUP 2026
          </h1>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-fifa-gold/50 group"
            title={darkMode ? "Prebaci na svijetlu temu" : "Prebaci na tamnu temu"}
          >
            {darkMode ? (
              <span className="text-xl group-hover:rotate-90 transition-transform duration-500 block">☀️</span>
            ) : (
              <span className="text-xl group-hover:-rotate-12 transition-transform duration-500 block">🌙</span>
            )}
          </button>

          {/* Admin Button */}
          <div className="absolute left-4 top-4 flex items-center gap-2">
            {isAdmin ? (
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm transition-all duration-300 border border-red-400/50 hover:border-red-300 text-white text-sm font-semibold flex items-center gap-2"
                title="Odjavi se"
              >
                <span>🔓</span> Odjavi se
              </button>
            ) : (
              <button
                onClick={onAdminClick}
                className="px-4 py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600/90 backdrop-blur-sm transition-all duration-300 border border-slate-500/50 hover:border-slate-400 text-white text-sm font-semibold flex items-center gap-2"
                title="Admin pristup"
              >
                <span>🔐</span> Admin
              </button>
            )}
            {isAdmin && (
              <div className="px-3 py-1 rounded-full bg-green-500/80 backdrop-blur-sm border border-green-400/50 text-white text-xs font-bold flex items-center gap-1">
                <span>✓</span> Admin
              </div>
            )}
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 font-medium tracking-[0.2em] text-sm md:text-base uppercase">
          11. lipnja - 19. srpnja 2026.
        </p>
      </div>
    </header>
  )
}

export default Header

