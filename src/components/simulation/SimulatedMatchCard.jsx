import Flag from '../Flag'

/**
 * Kartica za simuliranu knockout utakmicu
 */
function SimulatedMatchCard({ match, predictions, onChange, isFinal }) {
  const pred = predictions[match.id] || {}
  const home = match.homeTeamObj
  const away = match.awayTeamObj

  // Check if draw
  const isDraw = pred.homeScore !== '' && pred.awayScore !== '' && 
    parseInt(pred.homeScore) === parseInt(pred.awayScore)

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg p-3 shadow-md border-l-4 ${
      isFinal ? 'border-fifa-gold' : 'border-slate-200 dark:border-slate-700'
    }`}>
      {/* Header */}
      <div className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex justify-between">
        <span>{match.matchCode}</span>
        <span>{match.venue}</span>
      </div>

      {/* Home Team */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Flag code={home?.code} size="sm" />
          <span className="font-bold text-sm truncate w-24">{home?.name}</span>
        </div>
        <input
          type="text"
          className="w-8 h-8 text-center bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-bold"
          value={pred.homeScore ?? ''}
          onChange={(e) => onChange(match.id, 'homeScore', e.target.value)}
        />
      </div>

      {/* Away Team */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Flag code={away?.code} size="sm" />
          <span className="font-bold text-sm truncate w-24">{away?.name}</span>
        </div>
        <input
          type="text"
          className="w-8 h-8 text-center bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-bold"
          value={pred.awayScore ?? ''}
          onChange={(e) => onChange(match.id, 'awayScore', e.target.value)}
        />
      </div>

      {/* Penalties (if draw) */}
      {isDraw && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-center items-center gap-2 bg-slate-50 dark:bg-slate-700/30 rounded p-1">
          <span className="text-[10px] text-slate-400">11m:</span>
          <input
            type="text"
            placeholder="H"
            className="w-8 h-6 text-center text-xs bg-white dark:bg-slate-600 border rounded"
            value={pred.homePenalty ?? ''}
            onChange={(e) => onChange(match.id, 'homePenalty', e.target.value)}
          />
          <span className="text-slate-300">:</span>
          <input
            type="text"
            placeholder="A"
            className="w-8 h-6 text-center text-xs bg-white dark:bg-slate-600 border rounded"
            value={pred.awayPenalty ?? ''}
            onChange={(e) => onChange(match.id, 'awayPenalty', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

export default SimulatedMatchCard
