import { useState, useMemo, useCallback, memo } from 'react'
import Flag from './Flag'
import {
  getTeamById,
  getVenueById,
  getPlayoffWinnerLabel,
  formatDateFull,
  hasScore,
  getMatchTeamIds
} from '../utils/helpers'

/**
 * Memoizirana kartica utakmice - sprječava nepotrebne renderiranja
 */
const MatchCard = memo(function MatchCard({ 
  match, 
  teams, 
  venues, 
  playoffs, 
  isReadOnly, 
  onScoreChange, 
  onClearScore 
}) {
  const { homeTeamId, awayTeamId } = getMatchTeamIds(match, playoffs)

  const home = homeTeamId ? getTeamById(teams, homeTeamId) : null
  const away = awayTeamId ? getTeamById(teams, awayTeamId) : null
  const venue = getVenueById(venues, match.venue)
  const isPlayed = match.played || hasScore(match)
  const isCroatiaMatch = homeTeamId === 'cro' || awayTeamId === 'cro'

  return (
    <div
      className={`
        relative rounded-xl border transition-all duration-300
        ${isCroatiaMatch
          ? 'bg-gradient-to-r from-white to-red-50 dark:from-slate-800 dark:to-red-900/20 border-red-200 dark:border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          : isPlayed
            ? 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 opacity-90 shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg hover:-translate-y-1 hover:shadow-2xl'
        }
        p-3 sm:p-4
      `}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {match.matchCode && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              {match.matchCode}
            </span>
          )}
          {match.time && !isPlayed && (
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {match.time}
            </span>
          )}
        </div>
        {match.group && (
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
            GRUPA {match.group}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex items-center gap-2 sm:gap-3 mb-2">
        {/* Home Team */}
        <div className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end ${isPlayed ? 'opacity-80' : ''}`}>
          {home ? (
            <>
              <span className={`font-semibold text-sm sm:text-base break-words text-right ${homeTeamId === 'cro' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                {home.name}
              </span>
              <Flag code={home.code} className="shrink-0" />
            </>
          ) : match.homeTeamPlayoff ? (
            <span className="text-xs font-medium text-blue-500 italic break-words text-right">{getPlayoffWinnerLabel(match.homeTeamPlayoff)}</span>
          ) : (
            <span className="text-xs font-bold text-slate-400">TBD</span>
          )}
        </div>

        {/* Score Inputs */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0">
          <input
            type="number"
            min="0"
            max="99"
            disabled={isReadOnly}
            className={`
              w-11 h-11 sm:w-12 sm:h-10 text-center font-bold text-lg sm:text-lg rounded border focus:outline-none focus:ring-2 transition-all no-spinner
              ${isPlayed || isReadOnly
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent cursor-not-allowed'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-200'
              }
            `}
            value={match.homeScore ?? ''}
            onChange={(e) => onScoreChange(match.id, 'homeScore', e.target.value)}
            placeholder="-"
          />
          <span className="text-slate-400 font-bold text-base sm:text-lg">:</span>
          <input
            type="number"
            min="0"
            max="99"
            disabled={isReadOnly}
            className={`
              w-11 h-11 sm:w-12 sm:h-10 text-center font-bold text-lg sm:text-lg rounded border focus:outline-none focus:ring-2 transition-all no-spinner
              ${isPlayed || isReadOnly
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent cursor-not-allowed'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-200'
              }
            `}
            value={match.awayScore ?? ''}
            onChange={(e) => onScoreChange(match.id, 'awayScore', e.target.value)}
            placeholder="-"
          />
          {!isReadOnly && hasScore(match) && (
            <button
              className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors text-xs shrink-0"
              onClick={() => onClearScore(match.id)}
              title="Poništi rezultat"
            >
              ✕
            </button>
          )}
        </div>

        {/* Away Team */}
        <div className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-start ${isPlayed ? 'opacity-80' : ''}`}>
          {away ? (
            <>
              <Flag code={away.code} className="shrink-0" />
              <span className={`font-semibold text-sm sm:text-base break-words ${awayTeamId === 'cro' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                {away.name}
              </span>
            </>
          ) : match.awayTeamPlayoff ? (
            <span className="text-xs font-medium text-blue-500 italic break-words">{getPlayoffWinnerLabel(match.awayTeamPlayoff)}</span>
          ) : (
            <span className="text-xs font-bold text-slate-400">TBD</span>
          )}
        </div>
      </div>

      {/* Venue */}
      {venue && (
        <div className="flex items-center justify-center pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-fifa-red mr-1 text-xs">📍</span>
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
            {venue.city}, {venue.stadium}
          </span>
        </div>
      )}
    </div>
  )
})

/**
 * Matches komponenta s optimizacijama performansi
 */
function Matches({ matches, teams, venues, groups, playoffs, updateMatch, isReadOnly }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Memoizirani handleri
  const handleScoreChange = useCallback((id, field, val) => {
    updateMatch(id, { [field]: val === '' ? null : parseInt(val) })
  }, [updateMatch])

  const handleClearScore = useCallback((id) => {
    updateMatch(id, { homeScore: null, awayScore: null })
  }, [updateMatch])

  // Memoizirano filtriranje utakmica
  const { playedMatches, upcomingMatches } = useMemo(() => {
    const filterMatches = (matchList) => {
      if (!searchQuery.trim()) return matchList

      const query = searchQuery.toLowerCase().trim()
      return matchList.filter(match => {
        const { homeTeamId, awayTeamId } = getMatchTeamIds(match, playoffs)

        const homeTeam = homeTeamId ? getTeamById(teams, homeTeamId) : null
        const awayTeam = awayTeamId ? getTeamById(teams, awayTeamId) : null

        const homeTeamName = homeTeam?.name?.toLowerCase() || ''
        const awayTeamName = awayTeam?.name?.toLowerCase() || ''

        return homeTeamName.includes(query) || awayTeamName.includes(query)
      })
    }

    const played = filterMatches(matches.filter(m => m.played || hasScore(m)))
    const upcoming = filterMatches(matches.filter(m => !m.played && !hasScore(m)))

    return { playedMatches: played, upcomingMatches: upcoming }
  }, [matches, searchQuery, teams, playoffs])

  // Memoizirano grupiranje po datumu
  const { upcomingByDate, playedByDate } = useMemo(() => {
    const upcoming = upcomingMatches.reduce((acc, m) => {
      if (!acc[m.date]) acc[m.date] = []
      acc[m.date].push(m)
      return acc
    }, {})

    const played = playedMatches.reduce((acc, m) => {
      if (!acc[m.date]) acc[m.date] = []
      acc[m.date].push(m)
      return acc
    }, {})

    return { upcomingByDate: upcoming, playedByDate: played }
  }, [upcomingMatches, playedMatches])

  // Memoizirano sortiranje datuma
  const sortedUpcomingDates = useMemo(() => 
    Object.entries(upcomingByDate).sort(([a], [b]) => new Date(a) - new Date(b)),
    [upcomingByDate]
  )

  const sortedPlayedDates = useMemo(() => 
    Object.entries(playedByDate).sort(([a], [b]) => new Date(b) - new Date(a)),
    [playedByDate]
  )

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
        <span>⚽</span> <span className="break-words">RASPORED UTAKMICA</span>
      </h2>

      {isReadOnly && (
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 mb-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-1.5">
            <span className="text-xs">🔒</span> Aplikacija je u read-only modu
          </p>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm focus-within:border-fifa-blue dark:focus-within:border-fifa-gold transition-all">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            placeholder="Pretraži po reprezentaciji"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 dark:bg-slate-700 dark:hover:bg-red-900/50 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
              title="Očisti pretragu"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>📊</span>
            <span>
              Pronađeno <span className="font-bold text-fifa-blue dark:text-fifa-gold">{upcomingMatches.length + playedMatches.length}</span> utakmica
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {/* Poruka kada nema rezultata */}
        {searchQuery && upcomingMatches.length === 0 && playedMatches.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-slate-500 dark:text-slate-400 text-xl mb-2">
              Nema utakmica za "<span className="font-bold text-fifa-blue dark:text-fifa-gold">{searchQuery}</span>"
            </p>
            <p className="text-slate-400 text-sm">
              Pokušajte s drugim nazivom reprezentacije
            </p>
          </div>
        )}

        {/* Neodigrane utakmice */}
        {sortedUpcomingDates.map(([date, dateMatches]) => (
          <div key={`upcoming-${date}`} className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 backdrop-blur-sm py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{formatDateFull(date)}</span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {dateMatches
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    venues={venues}
                    playoffs={playoffs}
                    isReadOnly={isReadOnly}
                    onScoreChange={handleScoreChange}
                    onClearScore={handleClearScore}
                  />
                ))
              }
            </div>
          </div>
        ))}

        {/* Odigrane utakmice */}
        {playedMatches.length > 0 && (
          <div className="mt-8 border-t-2 border-slate-200 dark:border-slate-700 pt-8">
            <h3 className="text-2xl font-bold text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
              <span>✅</span> Odigrane utakmice
            </h3>
            <div className="flex flex-col gap-8 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {sortedPlayedDates.map(([date, dateMatches]) => (
                <div key={`played-${date}`} className="flex flex-col gap-4">
                  <div className="py-2 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2 self-start shadow-sm">
                    <span className="text-slate-400">📅</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm capitalize">{formatDateFull(date)}</span>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {dateMatches
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          teams={teams}
                          venues={venues}
                          playoffs={playoffs}
                          isReadOnly={isReadOnly}
                          onScoreChange={handleScoreChange}
                          onClearScore={handleClearScore}
                        />
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(Matches)
