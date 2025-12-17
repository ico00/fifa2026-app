import { memo } from 'react'

/**
 * Update Prompt - obavještava korisnika o novoj verziji
 */
function UpdatePrompt({ updateAvailable, onUpdate }) {
  if (!updateAvailable) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[90] animate-slide-down">
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-2xl p-4 max-w-md mx-auto text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
            🆕
          </div>
          <div className="flex-1">
            <h3 className="font-bold">
              Nova verzija dostupna!
            </h3>
            <p className="text-sm text-white/80">
              Osvježite za najnovije značajke
            </p>
          </div>
          
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-white text-emerald-600 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Ažuriraj
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(UpdatePrompt)
