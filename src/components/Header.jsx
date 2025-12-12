function Header({ darkMode, setDarkMode, isAdmin, onAdminClick, onLogout, serverAvailable = true }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-black/50 to-transparent py-4 sm:py-6 text-center">
      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fifa-gold/20 via-fifa-gold to-fifa-gold/20"></div>

      {/* Server Status Warning - samo u development okruženju */}
      {!serverAvailable && !window.location.hostname.includes('onrender.com') && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg border-2 border-red-400 flex items-center gap-2 text-sm font-semibold animate-pulse">
          <span>⚠️</span>
          <span>Backend server nije pokrenut. Pokrenite server sa: npm start</span>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        {/* Top Flags */}
        <div className="flex gap-4 text-2xl animate-fade-in-down">
          <span className="hover:scale-125 transition-transform duration-300 cursor-default">🇺🇸</span>
          <span className="hover:scale-125 transition-transform duration-300 cursor-default">🇨🇦</span>
          <span className="hover:scale-125 transition-transform duration-300 cursor-default">🇲🇽</span>
        </div>

        {/* Main Title */}
        <div className="flex items-center gap-4">
          <h1 className="font-sans text-2xl sm:text-3xl md:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-widest text-fifa-blue dark:text-fifa-gold drop-shadow-md px-2">
            FIFA WORLD CUP 2026
          </h1>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute right-2 sm:right-4 top-2 sm:top-4 p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 border border-white/10 hover:border-fifa-gold/50 group touch-manipulation"
            title={darkMode ? "Prebaci na svijetlu temu" : "Prebaci na tamnu temu"}
          >
            {darkMode ? (
              <span className="text-xl group-hover:rotate-90 transition-transform duration-500 block">☀️</span>
            ) : (
              <span className="text-xl group-hover:-rotate-12 transition-transform duration-500 block">🌙</span>
            )}
          </button>

          {/* Admin Button */}
          <div className="absolute left-2 sm:left-4 top-2 sm:top-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {isAdmin ? (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm transition-all duration-300 border border-red-400/50 hover:border-red-300 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 touch-manipulation"
                title="Odjavi se"
              >
                <span className="text-sm sm:text-base">🔓</span> <span className="hidden xs:inline">Odjavi se</span>
              </button>
            ) : (
              <button
                onClick={onAdminClick}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600/90 backdrop-blur-sm transition-all duration-300 border border-slate-500/50 hover:border-slate-400 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 touch-manipulation"
                title="Admin pristup"
              >
                <span className="text-sm sm:text-base">🔐</span> <span className="hidden xs:inline">Admin</span>
              </button>
            )}
            {isAdmin && (
              <div className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-green-500/80 backdrop-blur-sm border border-green-400/50 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1">
                <span>✓</span> <span className="hidden sm:inline">Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 font-medium tracking-[0.2em] text-xs sm:text-sm md:text-base uppercase px-2">
          11. lipnja - 19. srpnja 2026.
        </p>
      </div>
    </header>
  )
}

export default Header

