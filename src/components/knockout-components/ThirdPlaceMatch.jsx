import Flag from '../Flag'
import { getTeamById, getVenueById, formatDateShort, formatKnockoutDescription } from '../../utils/helpers'

/**
 * Utakmica za 3. mjesto
 */
function ThirdPlaceMatch({ match, teams, venues, isReadOnly, onScoreChange }) {
  if (!match) return null

  const homeTeam = getTeamById(teams, match.homeTeam)
  const awayTeam = getTeamById(teams, match.awayTeam)
  const hasDescription = match.description && (!homeTeam || !awayTeam)
  const venue = getVenueById(venues, match.venue)

  const handleChange = (field, value) => {
    if (value !== '' && !/^\d+$/.test(value)) return
    const score = value === '' ? null : parseInt(value)
    onScoreChange('thirdPlace', match.id, field, score)
  }

  return (
    <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-2xl font-black text-center text-slate-700 dark:text-slate-300 mb-8 uppercase tracking-widest flex justify-center items-center gap-2">
        <span className="text-3xl">🥉</span> Utakmica za 3. mjesto
      </h3>
      
      <div className="flex justify-center">
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-[600px] shadow-lg flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          {match.matchCode && (
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {match.matchCode}
            </div>
          )}
          
          <div className="flex justify-between items-center gap-4">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-2 w-1/3 text-center">
              {homeTeam ? (
                <>
                  <Flag code={homeTeam.code} size="lg" />
                  <span className="font-bold text-lg leading-tight">{homeTeam.name}</span>
                </>
              ) : hasDescription ? (
                <span className="text-sm italic text-slate-400 font-medium">
                  {formatKnockoutDescription(match.description).split(' vs ')[0]}
                </span>
              ) : (
                <span className="text-sm italic text-slate-400">TBD</span>
              )}
            </div>

            {/* Score */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                disabled={isReadOnly}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-fifa-blue ${
                  isReadOnly ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700'
                }`}
                value={match.homeScore ?? ''}
                onChange={(e) => handleChange('homeScore', e.target.value)}
              />
              <span className="text-2xl text-slate-300">:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                disabled={isReadOnly}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-fifa-blue ${
                  isReadOnly ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-700'
                }`}
                value={match.awayScore ?? ''}
                onChange={(e) => handleChange('awayScore', e.target.value)}
              />
            </div>

            {/* Penalties for Third Place */}
            {match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore && (
              <div className="flex flex-col items-center justify-center gap-1 mt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">11m</span>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    disabled={isReadOnly}
                    className="w-10 h-8 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue"
                    value={match.homePenalty ?? ''}
                    onChange={(e) => handleChange('homePenalty', e.target.value)}
                  />
                  <span className="text-slate-400 font-bold">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    disabled={isReadOnly}
                    className="w-10 h-8 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue"
                    value={match.awayPenalty ?? ''}
                    onChange={(e) => handleChange('awayPenalty', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Away Team */}
            <div className="flex flex-col items-center gap-2 w-1/3 text-center">
              {awayTeam ? (
                <>
                  <Flag code={awayTeam.code} size="lg" />
                  <span className="font-bold text-lg leading-tight">{awayTeam.name}</span>
                </>
              ) : hasDescription ? (
                <span className="text-sm italic text-slate-400 font-medium">
                  {formatKnockoutDescription(match.description).split(' vs ')[1]}
                </span>
              ) : (
                <span className="text-sm italic text-slate-400">TBD</span>
              )}
            </div>
          </div>
          
          <div className="text-center text-sm text-slate-500 font-medium mt-2 border-t border-slate-100 dark:border-slate-700 pt-3">
            {match.date && <span>{formatDateShort(match.date)}</span>}
            {venue && <span> • <span className="text-fifa-red">📍</span> {venue.city}, {venue.stadium}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThirdPlaceMatch
