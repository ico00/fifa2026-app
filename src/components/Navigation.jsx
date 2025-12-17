import { memo, useCallback } from 'react'

const TABS = [
  { id: 'home', label: 'Početna', icon: '🏠' },
  { id: 'playoffs', label: 'Play-Off', icon: '🎯' },
  { id: 'groups', label: 'Grupe', icon: '📋' },
  { id: 'matches', label: 'Utakmice', icon: '⚽' },
  { id: 'standings', label: 'Tablice', icon: '📊' },
  { id: 'knockout', label: 'Knockout', icon: '🏆' },
  { id: 'simulation', label: 'Simulacija', icon: '🎰' }
]

/**
 * Memoizirana tab tipka
 */
const TabButton = memo(function TabButton({ tab, isActive, onClick }) {
  return (
    <button
      className={`
        flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-full text-sm font-semibold transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px]
        ${isActive
          ? 'bg-gradient-to-r from-fifa-blue to-blue-900 text-white shadow-lg shadow-blue-900/50 scale-105'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
        }
      `}
      onClick={onClick}
    >
      <span className="text-sm sm:text-base md:text-lg">{tab.icon}</span>
      <span className="hidden sm:inline md:inline uppercase tracking-wide text-xs">{tab.label}</span>
    </button>
  )
})

/**
 * Navigation komponenta s optimizacijama performansi
 */
function Navigation({ activeTab, setActiveTab }) {
  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId)
  }, [setActiveTab])

  return (
    <nav className="flex justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-4 p-1.5 sm:p-2 md:p-4 flex-wrap sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
      {TABS.map(tab => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onClick={() => handleTabClick(tab.id)}
        />
      ))}
    </nav>
  )
}

export default memo(Navigation)
