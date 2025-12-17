import { memo } from 'react'

/**
 * Offline indikator - prikazuje se kad korisnik nema internet
 */
function OfflineIndicator({ isOnline }) {
  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center shadow-lg animate-slide-down">
      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
        <span className="animate-pulse">📴</span>
        <span>Offline mod - prikazuju se zadnji poznati podaci</span>
      </div>
    </div>
  )
}

export default memo(OfflineIndicator)
