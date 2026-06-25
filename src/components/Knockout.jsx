import { useState, useCallback, useMemo } from 'react'
import { getTeamById, getVenueById } from '../utils/helpers'
import { resolveKnockoutBracket } from '../utils/bracket'
import {
  KnockoutRound,
  FinalMatch,
  ThirdPlaceMatch,
  TeamPath,
  FormatInfo,
  BracketTree
} from './knockout-components'

function Knockout({ matches, groupMatches, teams, venues, standings, updateKnockoutMatch, isReadOnly }) {
  // Razriješi parove iz TRENUTNOG stanja grupa (live projekcija prije nego
  // grupa završi). Ne prepisuje potvrđene timove ni rezultate.
  const resolvedMatches = useMemo(
    () => resolveKnockoutBracket(matches, groupMatches, standings),
    [matches, groupMatches, standings]
  )

  // Ima li ijedan projicirani (još nepotvrđeni) tim - za prikaz legende
  const hasProjection = useMemo(() => {
    if (!resolvedMatches) return false
    const all = [
      ...(resolvedMatches.roundOf32 || []),
      ...(resolvedMatches.roundOf16 || []),
      ...(resolvedMatches.quarterFinals || []),
      ...(resolvedMatches.semiFinals || []),
      ...(resolvedMatches.thirdPlace ? [resolvedMatches.thirdPlace] : []),
      ...(resolvedMatches.final ? [resolvedMatches.final] : [])
    ]
    return all.some(m => m._homeProjected || m._awayProjected)
  }, [resolvedMatches])
  const [viewMode, setViewMode] = useState('list') // 'list' | 'bracket'

  // Handleri za promjenu rezultata
  const handleScoreChange = useCallback((round, matchId, field, value) => {
    updateKnockoutMatch(round, matchId, { [field]: value })
  }, [updateKnockoutMatch])

  // Funkcija za pronalaženje puta tima kroz natjecanje
  const getTeamPath = useCallback((teamId) => {
    if (!teamId) return []

    const path = []
    const knockoutRounds = [
      { key: 'roundOf32', name: 'Šesnaestina finala' },
      { key: 'roundOf16', name: 'Osmina finala' },
      { key: 'quarterFinals', name: 'Četvrtfinale' },
      { key: 'semiFinals', name: 'Polufinale' },
      { key: 'final', name: 'Finale' },
      { key: 'thirdPlace', name: 'Utakmica za 3. mjesto' }
    ]

    // Pronađi sve grupne utakmice
    const groupStageMatches = groupMatches.filter(m =>
      (m.homeTeam === teamId || m.awayTeam === teamId) &&
      m.played &&
      m.homeScore !== null &&
      m.awayScore !== null
    )

    groupStageMatches.forEach(match => {
      const isWin = (match.homeTeam === teamId && match.homeScore > match.awayScore) ||
        (match.awayTeam === teamId && match.awayScore > match.homeScore)
      const isDraw = match.homeScore === match.awayScore

      path.push({
        phase: `Grupa ${match.group}`,
        matchCode: match.matchCode,
        homeTeam: getTeamById(teams, match.homeTeam)?.name || match.homeTeam,
        homeTeamCode: getTeamById(teams, match.homeTeam)?.code || '',
        awayTeam: getTeamById(teams, match.awayTeam)?.name || match.awayTeam,
        awayTeamCode: getTeamById(teams, match.awayTeam)?.code || '',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        result: isWin ? 'Pobjeda' : isDraw ? 'Neriješeno' : 'Poraz',
        date: match.date,
        time: match.time,
        city: getVenueById(venues, match.venue)?.city || '',
        stadium: getVenueById(venues, match.venue)?.stadium || ''
      })
    })

    // Pronađi sve knockout utakmice
    knockoutRounds.forEach(round => {
      const roundMatches = Array.isArray(resolvedMatches[round.key])
        ? resolvedMatches[round.key]
        : resolvedMatches[round.key] ? [resolvedMatches[round.key]] : []

      roundMatches.forEach(match => {
        if ((match.homeTeam === teamId || match.awayTeam === teamId) &&
          match.played &&
          match.homeScore !== null &&
          match.awayScore !== null) {
          const isWin = (match.homeTeam === teamId && match.homeScore > match.awayScore) ||
            (match.awayTeam === teamId && match.awayScore > match.homeScore)
          const isDraw = match.homeScore === match.awayScore

          path.push({
            phase: round.name,
            matchCode: match.matchCode,
            homeTeam: getTeamById(teams, match.homeTeam)?.name || match.homeTeam,
            homeTeamCode: getTeamById(teams, match.homeTeam)?.code || '',
            awayTeam: getTeamById(teams, match.awayTeam)?.name || match.awayTeam,
            awayTeamCode: getTeamById(teams, match.awayTeam)?.code || '',
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            result: isWin ? 'Pobjeda' : isDraw ? 'Neriješeno' : 'Poraz',
            date: match.date,
            time: match.time,
            city: getVenueById(venues, match.venue)?.city || '',
            stadium: getVenueById(venues, match.venue)?.stadium || ''
          })
        }
      })
    })

    // Sortiraj po datumu
    path.sort((a, b) => new Date(a.date) - new Date(b.date))
    return path
  }, [groupMatches, resolvedMatches, teams, venues])

  // Pobjednik i njegov put kroz natjecanje (kad je finale odigrano)
  const { winner, winnerPath } = useMemo(() => {
    const final = resolvedMatches?.final
    if (final?.played && final.homeScore !== null && final.awayScore !== null) {
      const winnerId = final.homeScore > final.awayScore
        ? final.homeTeam
        : final.awayScore > final.homeScore
          ? final.awayTeam
          : null
      const winnerTeam = winnerId ? getTeamById(teams, winnerId) : null
      if (winnerTeam) {
        return { winner: winnerTeam, winnerPath: getTeamPath(winnerId) }
      }
    }
    return { winner: null, winnerPath: [] }
  }, [resolvedMatches, teams, getTeamPath])

  // Put Hrvatske kroz natjecanje (uvijek prikazan)
  const croatiaPath = useMemo(
    () => (teams.some(t => t.id === 'cro') ? getTeamPath('cro') : []),
    [teams, getTeamPath]
  )

  // Definicija rundi
  const rounds = [
    { key: 'roundOf32', name: '⚽ Šesnaestina finala' },
    { key: 'roundOf16', name: '⚽ Osmina finala' },
    { key: 'quarterFinals', name: '🏆 Četvrtfinale' },
    { key: 'semiFinals', name: '🥇 Polufinale' }
  ]

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
        <span>🏆</span> <span className="break-words">KNOCKOUT FAZA</span>
      </h2>

      {isReadOnly && (
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 mb-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-1.5">
            <span className="text-xs">🔒</span> Aplikacija je u read-only modu
          </p>
        </div>
      )}

      {/* Prebacivanje prikaza: Lista / Stablo */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-600 text-fifa-blue dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            🗂️ Lista
          </button>
          <button
            onClick={() => setViewMode('bracket')}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              viewMode === 'bracket'
                ? 'bg-white dark:bg-slate-600 text-fifa-blue dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            🌳 Stablo
          </button>
        </div>
      </div>

      {/* Format Info - samo u prikazu liste */}
      {viewMode === 'list' && <FormatInfo />}

      {/* Legenda za projekciju iz trenutnog stanja grupa */}
      {hasProjection && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-lg p-3 flex items-start gap-2">
          <span className="text-base leading-none mt-0.5">📊</span>
          <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
            Timovi označeni isprekidanim okvirom su <span className="font-bold">projekcija</span> na
            temelju trenutnog poretka u grupama i mogu se promijeniti dok grupe ne završe.
          </p>
        </div>
      )}

      {viewMode === 'bracket' ? (
        /* Turnirsko stablo */
        <BracketTree
          matches={resolvedMatches}
          teams={teams}
          venues={venues}
        />
      ) : (
        /* Runde (lista) */
        <div className="flex flex-col gap-10">
          {rounds.map(round => (
            <KnockoutRound
              key={round.key}
              roundKey={round.key}
              name={round.name}
              matches={resolvedMatches?.[round.key] || []}
              allMatches={resolvedMatches}
              teams={teams}
              venues={venues}
              isReadOnly={isReadOnly}
              onScoreChange={handleScoreChange}
            />
          ))}

          {/* Third Place Match */}
          <ThirdPlaceMatch
            match={resolvedMatches?.thirdPlace}
            teams={teams}
            venues={venues}
            isReadOnly={isReadOnly}
            onScoreChange={handleScoreChange}
          />

          {/* Final */}
          <FinalMatch
            match={resolvedMatches?.final}
            teams={teams}
            venues={venues}
            isReadOnly={isReadOnly}
            onScoreChange={handleScoreChange}
          />
        </div>
      )}

      {/* Prikaz pobjednika i puta do pobjede */}
      {winner && winnerPath.length > 0 && (
        <TeamPath team={winner} path={winnerPath} variant="winner" />
      )}

      {/* Posebna sekcija za Hrvatsku */}
      {croatiaPath.length > 0 && (
        <TeamPath 
          team={teams.find(t => t.id === 'cro')} 
          path={croatiaPath} 
          variant="croatia" 
        />
      )}
    </div>
  )
}

export default Knockout
