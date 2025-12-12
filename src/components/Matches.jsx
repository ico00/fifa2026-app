import { useState, useEffect } from 'react'
import Flag from './Flag'

function Matches({ matches, teams, venues, groups, playoffs, updateMatch, isReadOnly }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Debug logging
  useEffect(() => {
    console.log('📝 Matches komponenta - isReadOnly:', isReadOnly, 'canEdit:', !isReadOnly)
  }, [isReadOnly])

  const getTeamById = (id) => teams.find(t => t.id === id)
  const getVenueById = (id) => venues.find(v => v.id === id)
  const formatDate = (d) => new Date(d).toLocaleDateString('hr-HR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hasScore = (m) => m.homeScore !== null && m.awayScore !== null
  const getPlayoffName = (id) => ({ 'A': 'W Play-Off A', 'B': 'W Play-Off B', 'C': 'W Play-Off C', 'D': 'W Play-Off D', '1': 'W Play-Off 1', '2': 'W Play-Off 2' }[id] || '?')

  // Funkcija za dobivanje play-off pobjednika
  const getPlayoffWinner = (playoffId) => {
    if (!playoffs || !playoffs[playoffId]) return null
    return playoffs[playoffId].winner || null
  }

  // Funkcija za filtriranje utakmica po imenu tima
  const filterMatches = (matchList) => {
    if (!searchQuery.trim()) return matchList

    const query = searchQuery.toLowerCase().trim()
    return matchList.filter(match => {
      // Provjeri play-off pobjednike
      const homePlayoffWinner = match.homeTeamPlayoff ? getPlayoffWinner(match.homeTeamPlayoff) : null
      const awayPlayoffWinner = match.awayTeamPlayoff ? getPlayoffWinner(match.awayTeamPlayoff) : null

      const homeTeamId = match.homeTeam || homePlayoffWinner
      const awayTeamId = match.awayTeam || awayPlayoffWinner

      const homeTeam = homeTeamId ? getTeamById(homeTeamId) : null
      const awayTeam = awayTeamId ? getTeamById(awayTeamId) : null

      const homeTeamName = homeTeam?.name?.toLowerCase() || ''
      const awayTeamName = awayTeam?.name?.toLowerCase() || ''

      return homeTeamName.includes(query) || awayTeamName.includes(query)
    })
  }

  // Razdvoji odigrane i neodigrane utakmice
  const playedMatches = filterMatches(matches.filter(m => m.played || (m.homeScore !== null && m.awayScore !== null)))
  const upcomingMatches = filterMatches(matches.filter(m => !m.played && (m.homeScore === null || m.awayScore === null)))

  // Grupiraj po datumu
  const upcomingByDate = upcomingMatches.reduce((acc, m) => { if (!acc[m.date]) acc[m.date] = []; acc[m.date].push(m); return acc }, {})
  const playedByDate = playedMatches.reduce((acc, m) => { if (!acc[m.date]) acc[m.date] = []; acc[m.date].push(m); return acc }, {})

  const handleScoreChange = (id, field, val) => updateMatch(id, { [field]: val === '' ? null : parseInt(val) })
  const handleClearScore = (id) => updateMatch(id, { homeScore: null, awayScore: null })

  const renderMatch = (match) => {
    // Provjeri play-off pobjednike
    const homePlayoffWinner = match.homeTeamPlayoff ? getPlayoffWinner(match.homeTeamPlayoff) : null
    const awayPlayoffWinner = match.awayTeamPlayoff ? getPlayoffWinner(match.awayTeamPlayoff) : null

    // Ako postoji play-off pobjednik, koristi ga umjesto play-off ID-a
    const homeTeamId = match.homeTeam || homePlayoffWinner
    const awayTeamId = match.awayTeam || awayPlayoffWinner

    const home = homeTeamId ? getTeamById(homeTeamId) : null
    const away = awayTeamId ? getTeamById(awayTeamId) : null
    const venue = getVenueById(match.venue)
    const isPlayed = match.played || (match.homeScore !== null && match.awayScore !== null)
    const isCroatiaMatch = homeTeamId === 'cro' || awayTeamId === 'cro'

    return (
      <div
        key={match.id}
        className={`
          relative rounded-xl border transition-all duration-300
          ${isCroatiaMatch
            ? 'bg-gradient-to-r from-white to-red-50 dark:from-slate-800 dark:to-red-900/20 border-red-200 dark:border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            : isPlayed
              ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 opacity-90'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
          }
          p-3 sm:p-4
        `}
      >
        {/* Top Bar - Match Code, Time, Group (slično slici) */}
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

        {/* Main Content - Horizontal Layout (slično slici) */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          {/* Home Team - lijevo */}
          <div className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end ${isPlayed ? 'opacity-80' : ''}`}>
            {home ? (
              <>
                <span className={`font-semibold text-sm sm:text-base break-words text-right ${homeTeamId === 'cro' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                  {home.name}
                </span>
                <Flag code={home.code} className="shrink-0" />
              </>
            ) : match.homeTeamPlayoff ? (
              <span className="text-xs font-medium text-blue-500 italic break-words text-right">{getPlayoffName(match.homeTeamPlayoff)}</span>
            ) : (
              <span className="text-xs font-bold text-slate-400">TBD</span>
            )}
          </div>

          {/* Score Inputs - centrirano */}
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
              onChange={(e) => handleScoreChange(match.id, 'homeScore', e.target.value)}
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
              onChange={(e) => handleScoreChange(match.id, 'awayScore', e.target.value)}
              placeholder="-"
            />
            {!isReadOnly && hasScore(match) && (
              <button
                className="ml-1 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors text-xs shrink-0"
                onClick={() => handleClearScore(match.id)}
                title="Poništi rezultat"
              >
                ✕
              </button>
            )}
          </div>

          {/* Away Team - desno */}
          <div className={`flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-start ${isPlayed ? 'opacity-80' : ''}`}>
            {away ? (
              <>
                <Flag code={away.code} className="shrink-0" />
                <span className={`font-semibold text-sm sm:text-base break-words ${awayTeamId === 'cro' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                  {away.name}
                </span>
              </>
            ) : match.awayTeamPlayoff ? (
              <span className="text-xs font-medium text-blue-500 italic break-words">{getPlayoffName(match.awayTeamPlayoff)}</span>
            ) : (
              <span className="text-xs font-bold text-slate-400">TBD</span>
            )}
          </div>
        </div>

        {/* Venue - na dnu (slično slici) */}
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
  }

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
        {Object.entries(upcomingByDate).sort(([a], [b]) => new Date(a) - new Date(b)).map(([date, dateMatches]) => (
          <div key={`upcoming-${date}`} className="flex flex-col gap-4">
            <div className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-sm py-2 px-4 rounded-lg border-l-4 border-fifa-blue dark:border-fifa-gold shadow-sm flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{formatDate(date)}</span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
              {dateMatches.sort((a, b) => a.time.localeCompare(b.time)).map(renderMatch)}
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
              {Object.entries(playedByDate).sort(([a], [b]) => new Date(b) - new Date(a)).map(([date, dateMatches]) => (
                <div key={`played-${date}`} className="flex flex-col gap-4">
                  <div className="py-2 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2 self-start">
                    <span className="text-slate-400">📅</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-sm capitalize">{formatDate(date)}</span>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {dateMatches.sort((a, b) => a.time.localeCompare(b.time)).map(renderMatch)}
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

export default Matches