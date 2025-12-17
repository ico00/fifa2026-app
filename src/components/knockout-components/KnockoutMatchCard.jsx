import Flag from '../Flag'
import { formatDateShort, formatKnockoutDescription } from '../../utils/helpers'

/**
 * Kartica za knockout utakmicu
 */
function KnockoutMatchCard({ 
  match, 
  homeTeam, 
  awayTeam, 
  venue, 
  roundKey,
  isReadOnly,
  onScoreChange 
}) {
  const hasDescription = match.description && (!homeTeam || !awayTeam)

  const handleChange = (field, value) => {
    // Allow only digits
    if (value !== '' && !/^\d+$/.test(value)) return
    const score = value === '' ? null : parseInt(value)
    onScoreChange(roundKey, match.id, field, score)
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 w-full max-w-[500px] xl:max-w-[550px] 2xl:max-w-[600px] transition-all duration-300 shadow-lg hover:-translate-y-1 hover:shadow-2xl flex flex-col gap-3 group relative hover:z-30">
      {match.matchCode && (
        <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
          {match.matchCode}
        </div>
      )}
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-white/5 relative">
        {/* Home Team */}
        <div className="flex items-center gap-3 w-5/12 justify-end text-right">
          {homeTeam ? (
            <>
              <span className="font-bold text-sm md:text-base leading-tight">{homeTeam.name}</span>
              <Flag code={homeTeam.code} />
            </>
          ) : hasDescription ? (
            <span className="text-xs italic text-slate-400 break-words" title={formatKnockoutDescription(match.description)}>
              {formatKnockoutDescription(match.description).split(' vs ')[0] || 'TBD'}
            </span>
          ) : (
            <span className="text-sm font-semibold text-slate-400">TBD</span>
          )}
        </div>

        {/* Score Inputs */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 sm:gap-2 px-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              disabled={isReadOnly}
              className={`w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold rounded-lg border border-transparent focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-all ${
                isReadOnly ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700'
              }`}
              value={match.homeScore ?? ''}
              onChange={(e) => handleChange('homeScore', e.target.value)}
              placeholder="-"
            />
            <span className="text-slate-300 font-bold">:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              disabled={isReadOnly}
              className={`w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold rounded-lg border border-transparent focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-all ${
                isReadOnly ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700'
              }`}
              value={match.awayScore ?? ''}
              onChange={(e) => handleChange('awayScore', e.target.value)}
              placeholder="-"
            />
          </div>

          {/* Penalties Input - Only show if draw and scores are present */}
          {match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore && (
            <div className="mt-2 flex items-center justify-center gap-3 bg-slate-100/80 dark:bg-slate-700/80 px-4 py-1.5 rounded-full shadow-inner animate-fade-in border border-slate-200 dark:border-slate-600/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">11m</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  disabled={isReadOnly}
                  className="w-7 h-7 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded-md border border-slate-200 dark:border-slate-500 focus:border-fifa-blue focus:ring-1 focus:ring-fifa-blue outline-none transition-all shadow-sm"
                  value={match.homePenalty ?? ''}
                  onChange={(e) => handleChange('homePenalty', e.target.value)}
                  placeholder=""
                />
                <span className="text-slate-400 text-xs font-bold">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  disabled={isReadOnly}
                  className="w-7 h-7 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded-md border border-slate-200 dark:border-slate-500 focus:border-fifa-blue focus:ring-1 focus:ring-fifa-blue outline-none transition-all shadow-sm"
                  value={match.awayPenalty ?? ''}
                  onChange={(e) => handleChange('awayPenalty', e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3 w-5/12 justify-start text-left">
          {awayTeam ? (
            <>
              <Flag code={awayTeam.code} />
              <span className="font-bold text-sm md:text-base leading-tight">{awayTeam.name}</span>
            </>
          ) : hasDescription ? (
            <span className="text-xs italic text-slate-400 break-words" title={formatKnockoutDescription(match.description)}>
              {formatKnockoutDescription(match.description).split(' vs ')[1] || 'TBD'}
            </span>
          ) : (
            <span className="text-sm font-semibold text-slate-400">TBD</span>
          )}
        </div>
      </div>

      {/* Date & Venue */}
      <div className="text-center text-xs text-slate-500 font-medium pt-1">
        {match.date && <span>{formatDateShort(match.date)}</span>}
        {venue && <span> • <span className="text-fifa-red">📍</span> {venue.city}, {venue.stadium}</span>}
      </div>
    </div>
  )
}

export default KnockoutMatchCard
