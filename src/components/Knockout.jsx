import { useState, useEffect, useCallback } from 'react'
import { getTeamById, getVenueById } from '../utils/helpers'
import { 
  KnockoutRound, 
  FinalMatch, 
  ThirdPlaceMatch, 
  TeamPath, 
  FormatInfo 
} from './knockout-components'

function Knockout({ matches, groupMatches, teams, venues, updateKnockoutMatch, isReadOnly }) {
  const [winner, setWinner] = useState(null)
  const [winnerPath, setWinnerPath] = useState([])
  const [croatiaPath, setCroatiaPath] = useState([])

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
      const roundMatches = Array.isArray(matches[round.key])
        ? matches[round.key]
        : matches[round.key] ? [matches[round.key]] : []

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
  }, [groupMatches, matches, teams, venues])

  // Provjeri je li final odigran i odredi pobjednika
  useEffect(() => {
    if (matches?.final &&
      matches.final.played &&
      matches.final.homeScore !== null &&
      matches.final.awayScore !== null) {
      const final = matches.final
      const winnerId = final.homeScore > final.awayScore
        ? final.homeTeam
        : final.awayScore > final.homeScore
          ? final.awayTeam
          : null

      if (winnerId) {
        const winnerTeam = getTeamById(teams, winnerId)
        if (winnerTeam) {
          setWinner(winnerTeam)
          setWinnerPath(getTeamPath(winnerId))
        }
      }
    } else {
      setWinner(null)
      setWinnerPath([])
    }
  }, [matches?.final?.homeScore, matches?.final?.awayScore, matches?.final?.played, teams, getTeamPath])

  // Uvijek prikaži put Hrvatske
  useEffect(() => {
    const croatiaTeam = teams.find(t => t.id === 'cro')
    if (croatiaTeam) {
      setCroatiaPath(getTeamPath('cro'))
    }
  }, [matches, groupMatches, teams, getTeamPath])

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

      {/* Format Info */}
      <FormatInfo />

      {/* Runde */}
      <div className="flex flex-col gap-10">
        {rounds.map(round => (
          <KnockoutRound
            key={round.key}
            roundKey={round.key}
            name={round.name}
            matches={matches?.[round.key] || []}
            allMatches={matches}
            teams={teams}
            venues={venues}
            isReadOnly={isReadOnly}
            onScoreChange={handleScoreChange}
          />
        ))}

        {/* Third Place Match */}
        <ThirdPlaceMatch
          match={matches?.thirdPlace}
          teams={teams}
          venues={venues}
          isReadOnly={isReadOnly}
          onScoreChange={handleScoreChange}
        />

        {/* Final */}
        <FinalMatch
          match={matches?.final}
          teams={teams}
          venues={venues}
          isReadOnly={isReadOnly}
          onScoreChange={handleScoreChange}
        />
      </div>

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
