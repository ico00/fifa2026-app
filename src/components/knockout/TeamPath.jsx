import Flag from '../Flag'
import { formatDateShort } from '../../utils/helpers'

/**
 * Prikaz puta tima kroz turnir
 */
function TeamPath({ team, path, variant = 'winner' }) {
  if (!team || !path || path.length === 0) return null

  const isWinner = variant === 'winner'
  const isCroatia = variant === 'croatia'

  const containerStyles = isWinner
    ? 'bg-gradient-to-br from-yellow-50 to-white dark:from-slate-800 dark:to-slate-900 border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.3)]'
    : 'bg-gradient-to-br from-red-50 to-white dark:from-slate-800 dark:to-slate-900 border-4 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)]'

  const titleStyles = isWinner
    ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600'

  return (
    <div className={`mt-10 ${containerStyles} rounded-2xl p-8 md:p-12 text-center relative overflow-hidden`}>
      {isWinner && (
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      )}
      
      <div className="relative z-10 w-full">
        {isWinner ? (
          <>
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className={`text-2xl md:text-4xl font-black ${titleStyles} mb-6 uppercase tracking-widest`}>
              Pobjednik Svjetskog Prvenstva 2026
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10 bg-white dark:bg-slate-900/50 p-6 rounded-xl inline-flex mx-auto shadow-lg border border-yellow-200 dark:border-yellow-900/30">
              <div className="transform scale-150 p-2">
                <Flag code={team.code} size="lg" />
              </div>
              <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                {team.name}
              </span>
            </div>
          </>
        ) : (
          <h2 className={`text-3xl font-black ${titleStyles} mb-8 uppercase tracking-widest flex items-center justify-center gap-4`}>
            <span>🇭🇷</span> Put Vatrenih <span>🇭🇷</span>
          </h2>
        )}

        <div className={`${isWinner ? 'mt-8' : ''} bg-${isWinner ? 'slate-50' : 'white'} dark:bg-slate-900/80 rounded-xl p-6 md:p-8 text-left max-w-4xl mx-auto border border-${isWinner ? 'slate-200' : 'red-100'} dark:border-${isWinner ? 'slate-700' : 'red-900/30'} shadow-lg`}>
          {isWinner && (
            <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-500 mb-6 text-center flex items-center justify-center gap-2">
              <span>🗺️</span> Put do pobjede
            </h3>
          )}
          
          <div className="flex flex-col gap-3">
            {path.map((match, index) => (
              <div 
                key={index} 
                className={`
                  grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-${isCroatia ? 'transform hover:scale-[1.01]' : 'shadow'}
                  ${match.result === 'Pobjeda'
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                    : match.result === 'Poraz'
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                      : isCroatia 
                        ? 'bg-slate-50 dark:bg-slate-800 border-yellow-500'
                        : 'bg-white dark:bg-slate-800 border-slate-300'
                  }
                `}
              >
                {/* Phase Info */}
                <div className="flex flex-col items-center md:items-start justify-center">
                  <div className="font-bold text-slate-500 text-sm uppercase tracking-wide text-center md:text-left">
                    {match.phase}
                  </div>
                  <div className="text-xs font-mono text-slate-400">{match.matchCode}</div>
                </div>

                {/* Match Score */}
                <div className="flex items-center justify-center gap-2 md:gap-4 text-lg w-full">
                  <div className={`font-${isWinner && match.result === 'Pobjeda' ? 'bold' : 'black'} flex items-center gap-2 justify-end w-5/12 text-right leading-tight ${isCroatia ? 'text-slate-800 dark:text-white' : ''}`}>
                    <span className="hidden md:inline">{match.homeTeam}</span>
                    <span className="md:hidden">{match.homeTeamCode}</span>
                    <Flag code={match.homeTeamCode} size="sm" />
                  </div>

                  <span className={`font-black text-xl md:text-2xl px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-sm whitespace-nowrap ${
                    match.result === 'Pobjeda'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      : match.result === 'Poraz'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : isCroatia
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {match.homeScore}:{match.awayScore}
                  </span>

                  <div className="flex items-center gap-2 justify-start w-5/12 text-left font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                    <Flag code={match.awayTeamCode} size="sm" />
                    <span className="hidden md:inline">{match.awayTeam}</span>
                    <span className="md:hidden">{match.awayTeamCode}</span>
                  </div>
                </div>

                {/* Date & Venue */}
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 text-center md:text-right flex flex-col gap-1 min-w-[140px]">
                  <div className="flex items-center justify-center md:justify-end gap-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    <span>{formatDateShort(match.date)}</span>
                    <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-bold">
                      {match.time}
                    </span>
                  </div>
                  <div className="flex flex-col text-xs leading-tight">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{match.city}</span>
                    <span className="text-[10px] opacity-70">{match.stadium}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isWinner && (
          <div className="mt-8 inline-block bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-6 py-3 rounded-full font-bold text-lg border border-yellow-200 dark:border-yellow-700/30">
            Ukupno odigrano: {path.length} utakmica •
            Pobjeda: {path.filter(m => m.result === 'Pobjeda').length}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamPath
