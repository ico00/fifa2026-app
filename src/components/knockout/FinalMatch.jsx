import Flag from '../Flag'
import { getTeamById, getVenueById, formatDateShort, formatKnockoutDescription } from '../../utils/helpers'

/**
 * Finale - posebna stilizacija
 */
function FinalMatch({ match, teams, venues, isReadOnly, onScoreChange }) {
  if (!match) return null

  const homeTeam = getTeamById(teams, match.homeTeam)
  const awayTeam = getTeamById(teams, match.awayTeam)
  const hasDescription = match.description && (!homeTeam || !awayTeam)
  const venue = getVenueById(venues, match.venue)

  const handleChange = (field, value) => {
    if (value !== '' && !/^\d+$/.test(value)) return
    const score = value === '' ? null : parseInt(value)
    onScoreChange('final', match.id, field, score)
  }

  return (
    <div className="bg-gradient-to-b from-fifa-gold/10 to-transparent dark:from-fifa-gold/5 rounded-2xl p-4 md:p-10 shadow-2xl border border-fifa-gold/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>
      
      <h3 className="text-4xl md:text-5xl font-black text-center text-fifa-blue dark:text-fifa-gold mb-10 uppercase tracking-widest drop-shadow-sm flex flex-col items-center gap-4">
        <span className="text-6xl mb-2 filter drop-shadow-lg">🏆</span>
        FINALE 2026
      </h3>

      <div className="flex justify-center">
        <div className="bg-white dark:bg-slate-800 border-2 border-fifa-gold/50 rounded-2xl p-6 md:p-10 w-full max-w-[800px] shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col gap-6 relative z-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(234,179,8,0.3)]">
          {match.matchCode && (
            <div className="text-center text-sm font-bold text-fifa-gold uppercase tracking-[0.2em] mb-4 border-b border-fifa-gold/20 pb-4">
              {match.matchCode}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Home Team Final */}
            <div className="flex flex-col items-center gap-4 w-full md:w-1/3 text-center">
              {homeTeam ? (
                <>
                  <div className="transform scale-150 mb-2 filter drop-shadow-xl">
                    <Flag code={homeTeam.code} size="lg" />
                  </div>
                  <span className="font-black text-2xl md:text-3xl leading-tight uppercase tracking-tight">
                    {homeTeam.name}
                  </span>
                </>
              ) : hasDescription ? (
                <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full font-medium">
                  {formatKnockoutDescription(match.description).split(' vs ')[0]}
                </span>
              ) : (
                <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full">
                  Finalist 1
                </span>
              )}
            </div>

            {/* Score Final */}
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                disabled={isReadOnly}
                className={`w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-black rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-fifa-gold text-slate-800 dark:text-white ${
                  isReadOnly ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800'
                }`}
                value={match.homeScore ?? ''}
                onChange={(e) => handleChange('homeScore', e.target.value)}
                placeholder="-"
              />
              <span className="text-4xl md:text-5xl font-black text-slate-300 dark:text-slate-600">:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                disabled={isReadOnly}
                className={`w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-black rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-fifa-gold text-slate-800 dark:text-white ${
                  isReadOnly ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800'
                }`}
                value={match.awayScore ?? ''}
                onChange={(e) => handleChange('awayScore', e.target.value)}
                placeholder="-"
              />
            </div>

            {/* Away Team Final */}
            <div className="flex flex-col items-center gap-4 w-full md:w-1/3 text-center">
              {awayTeam ? (
                <>
                  <div className="transform scale-150 mb-2 filter drop-shadow-xl">
                    <Flag code={awayTeam.code} size="lg" />
                  </div>
                  <span className="font-black text-2xl md:text-3xl leading-tight uppercase tracking-tight">
                    {awayTeam.name}
                  </span>
                </>
              ) : hasDescription ? (
                <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full font-medium">
                  {formatKnockoutDescription(match.description).split(' vs ')[1]}
                </span>
              ) : (
                <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full">
                  Finalist 2
                </span>
              )}
            </div>
          </div>
          
          <div className="text-center text-base text-slate-500 font-medium mt-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
            {match.date && <span>{formatDateShort(match.date)}</span>}
            {venue && <span> • <span className="text-fifa-red">📍</span> {venue.city}, {venue.stadium}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinalMatch
