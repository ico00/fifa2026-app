import KnockoutMatchCard from './KnockoutMatchCard'
import { getTeamById, getVenueById } from '../../utils/helpers'

/**
 * Prikaz jedne runde knockout faze
 */
function KnockoutRound({ 
  roundKey,
  name, 
  matches: roundMatches, 
  allMatches,
  teams, 
  venues, 
  isReadOnly,
  onScoreChange 
}) {
  const getRoundKey = (match) => {
    if (allMatches.roundOf32?.some(m => m.id === match.id)) return 'roundOf32'
    if (allMatches.roundOf16?.some(m => m.id === match.id)) return 'roundOf16'
    if (allMatches.quarterFinals?.some(m => m.id === match.id)) return 'quarterFinals'
    if (allMatches.semiFinals?.some(m => m.id === match.id)) return 'semiFinals'
    return roundKey
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-center text-fifa-blue dark:text-fifa-gold mb-6 sm:mb-8 uppercase tracking-widest relative pb-3 sm:pb-4">
        {name}
        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-fifa-gold rounded-full"></span>
      </h3>

      {roundMatches.length > 0 ? (
        <div className="flex flex-wrap gap-5 justify-center">
          {roundMatches.map((match, index) => {
            const homeTeam = getTeamById(teams, match.homeTeam)
            const awayTeam = getTeamById(teams, match.awayTeam)
            const venue = getVenueById(venues, match.venue)
            const matchRoundKey = getRoundKey(match)

            return (
              <KnockoutMatchCard
                key={match.id || index}
                match={match}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                venue={venue}
                roundKey={matchRoundKey}
                isReadOnly={isReadOnly}
                onScoreChange={onScoreChange}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <p className="text-lg">Utakmice će biti određene nakon završetka grupne faze.</p>
        </div>
      )}
    </div>
  )
}

export default KnockoutRound
