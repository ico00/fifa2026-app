function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', label: 'Početna', icon: '🏠' },
    { id: 'playoffs', label: 'Play-Off', icon: '🎯' },
    { id: 'groups', label: 'Grupe', icon: '📋' },
    { id: 'matches', label: 'Utakmice', icon: '⚽' },
    { id: 'standings', label: 'Tablice', icon: '📊' },
    { id: 'knockout', label: 'Knockout', icon: '🏆' },
    { id: 'simulation', label: 'Simulacija', icon: '🎰' }
  ]

  return (
    <nav className="flex justify-center gap-1.5 sm:gap-2 md:gap-4 p-2 sm:p-4 flex-wrap sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`
            flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-sm font-semibold transition-all duration-300 touch-manipulation min-h-[44px] min-w-[44px]
            ${activeTab === tab.id
              ? 'bg-gradient-to-r from-fifa-blue to-blue-900 text-white shadow-lg shadow-blue-900/50 scale-105'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }
          `}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="text-base sm:text-lg">{tab.icon}</span>
          <span className="hidden sm:inline md:inline uppercase tracking-wide text-xs">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default Navigation

