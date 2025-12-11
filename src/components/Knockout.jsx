import { useState, useEffect } from 'react'
import Flag from './Flag'

function Knockout({ matches, groupMatches, teams, venues, updateKnockoutMatch }) {
  const [winner, setWinner] = useState(null)
  const [winnerPath, setWinnerPath] = useState([])
  const [croatiaPath, setCroatiaPath] = useState([])

  const getTeamById = (teamId) => {
    return teams.find(t => t.id === teamId)
  }

  const getVenueById = (venueId) => {
    return venues.find(v => v.id === venueId)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatDescription = (description) => {
    if (!description) return ''
    return description
      .replace(/Loser/gi, 'L')
      .replace(/Winner/gi, 'W')
  }

  const handleScoreChange = (round, matchId, field, value) => {
    // Allow only digits
    if (value !== '' && !/^\d+$/.test(value)) return

    const score = value === '' ? null : parseInt(value)
    updateKnockoutMatch(round, matchId, { [field]: score })
  }

  // Funkcija za pronalaženje puta tima kroz natjecanje
  const getTeamPath = (teamId) => {
    if (!teamId) return []

    const path = []

    // Pronađi sve grupne utakmice
    const groupStageMatches = groupMatches.filter(m =>
      (m.homeTeam === teamId || m.awayTeam === teamId) &&
      m.played &&
      m.homeScore !== null &&
      m.awayScore !== null
    )

    groupStageMatches.forEach(match => {
      const opponent = match.homeTeam === teamId ? match.awayTeam : match.homeTeam
      const opponentTeam = getTeamById(opponent)
      const isWin = (match.homeTeam === teamId && match.homeScore > match.awayScore) ||
        (match.awayTeam === teamId && match.awayScore > match.homeScore)
      const isDraw = match.homeScore === match.awayScore

      path.push({
        phase: `Grupa ${match.group}`,
        matchCode: match.matchCode,
        homeTeam: getTeamById(match.homeTeam)?.name || match.homeTeam,
        homeTeamCode: getTeamById(match.homeTeam)?.code || '',
        awayTeam: getTeamById(match.awayTeam)?.name || match.awayTeam,
        awayTeamCode: getTeamById(match.awayTeam)?.code || '',
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        result: isWin ? 'Pobjeda' : isDraw ? 'Neriješeno' : 'Poraz',
        date: match.date,
        time: match.time,
        city: getVenueById(match.venue)?.city || '',
        stadium: getVenueById(match.venue)?.stadium || ''
      })
    })

    // Pronađi sve knockout utakmice
    const knockoutRounds = [
      { key: 'roundOf32', name: 'Šesnaestina finala' },
      { key: 'roundOf16', name: 'Osmina finala' },
      { key: 'quarterFinals', name: 'Četvrtfinale' },
      { key: 'semiFinals', name: 'Polufinale' },
      { key: 'final', name: 'Finale' },
      { key: 'thirdPlace', name: 'Utakmica za 3. mjesto' }
    ]

    knockoutRounds.forEach(round => {
      const roundMatches = Array.isArray(matches[round.key])
        ? matches[round.key]
        : matches[round.key] ? [matches[round.key]] : []

      roundMatches.forEach(match => {
        if ((match.homeTeam === teamId || match.awayTeam === teamId) &&
          match.played &&
          match.homeScore !== null &&
          match.awayScore !== null) {
          const opponent = match.homeTeam === teamId ? match.awayTeam : match.homeTeam
          const opponentTeam = getTeamById(opponent)
          const isWin = (match.homeTeam === teamId && match.homeScore > match.awayScore) ||
            (match.awayTeam === teamId && match.awayScore > match.homeScore)
          const isDraw = match.homeScore === match.awayScore

          path.push({
            phase: round.name,
            matchCode: match.matchCode,
            homeTeam: getTeamById(match.homeTeam)?.name || match.homeTeam,
            homeTeamCode: getTeamById(match.homeTeam)?.code || '',
            awayTeam: getTeamById(match.awayTeam)?.name || match.awayTeam,
            awayTeamCode: getTeamById(match.awayTeam)?.code || '',
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            result: isWin ? 'Pobjeda' : isDraw ? 'Neriješeno' : 'Poraz',
            date: match.date,
            time: match.time,
            city: getVenueById(match.venue)?.city || '',
            stadium: getVenueById(match.venue)?.stadium || ''
          })
        }
      })
    })

    // Sortiraj po datumu
    path.sort((a, b) => new Date(a.date) - new Date(b.date))

    return path
  }

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
        const winnerTeam = getTeamById(winnerId)
        if (winnerTeam) {
          setWinner(winnerTeam)
          const path = getTeamPath(winnerId)
          setWinnerPath(path)
        }
      }
    } else {
      setWinner(null)
      setWinnerPath([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches?.final?.homeScore, matches?.final?.awayScore, matches?.final?.played])

  // Uvijek prikaži put Hrvatske
  useEffect(() => {
    const croatiaTeam = teams.find(t => t.id === 'cro')
    if (croatiaTeam) {
      const path = getTeamPath('cro')
      setCroatiaPath(path)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, groupMatches, teams])

  const getRoundKey = (match) => {
    // Odredi u kojoj rundi je utakmica
    if (matches.roundOf32?.some(m => m.id === match.id)) return 'roundOf32'
    if (matches.roundOf16?.some(m => m.id === match.id)) return 'roundOf16'
    if (matches.quarterFinals?.some(m => m.id === match.id)) return 'quarterFinals'
    if (matches.semiFinals?.some(m => m.id === match.id)) return 'semiFinals'
    if (matches.thirdPlace && matches.thirdPlace.id === match.id) return 'thirdPlace'
    if (matches.final && matches.final.id === match.id) return 'final'
    return null
  }

  const rounds = [
    { key: 'roundOf32', name: '⚽ Šesnaestina finala', count: 16 },
    { key: 'roundOf16', name: '⚽ Osmina finala', count: 8 },
    { key: 'quarterFinals', name: '🏆 Četvrtfinale', count: 4 },
    { key: 'semiFinals', name: '🥇 Polufinale', count: 2 }
  ]

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <h2 className="text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-3 drop-shadow-md">
        <span>🏆</span> KNOCKOUT FAZA
      </h2>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center mb-8">
        <h3 className="text-2xl font-bold text-fifa-gold mb-4 tracking-wide font-sans">
          Format natjecanja
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed max-w-3xl mx-auto">
          Iz svake grupe prolaze <strong className="text-green-600 dark:text-green-400 font-bold">prva 2 mjesta</strong>,
          plus <strong className="text-yellow-600 dark:text-yellow-400 font-bold">8 najboljih trećeplasiranih</strong> reprezentacija.
          <br />
          Ukupno 32 reprezentacije ulaze u knockout fazu.
        </p>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg inline-block text-sm text-slate-700 dark:text-slate-300 border border-yellow-200 dark:border-yellow-700/50">
          <strong className="text-yellow-600 dark:text-yellow-500 font-bold block mb-1">💡 Automatska logika:</strong>
          Parovi se automatski određuju na temelju finalnih pozicija u grupama.
          <br />
          Pobjednici prethodnih rundi automatski napreduju u sljedeću rundu.
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
            <div className="text-3xl font-black text-slate-800 dark:text-white">32</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Šest. finala</div>
          </div>
          <div className="text-slate-400 self-center">→</div>
          <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
            <div className="text-3xl font-black text-slate-800 dark:text-white">16</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Osmina finala</div>
          </div>
          <div className="text-slate-400 self-center">→</div>
          <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
            <div className="text-3xl font-black text-slate-800 dark:text-white">8</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Četvrtfinale</div>
          </div>
          <div className="text-slate-400 self-center">→</div>
          <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg min-w-[120px]">
            <div className="text-3xl font-black text-slate-800 dark:text-white">4</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Polufinale</div>
          </div>
          <div className="text-slate-400 self-center">→</div>
          <div className="bg-gradient-to-r from-fifa-gold to-yellow-500 p-4 rounded-lg min-w-[120px] text-white shadow-lg shadow-yellow-500/20">
            <div className="text-3xl">🏆</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1">Finale</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {rounds.map(round => {
          const roundMatches = matches?.[round.key] || []

          return (
            <div key={round.key} className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-3xl font-black text-center text-fifa-blue dark:text-fifa-gold mb-8 uppercase tracking-widest relative pb-4">
                {round.name}
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-fifa-gold rounded-full"></span>
              </h3>

              {roundMatches.length > 0 ? (
                <div className="flex flex-wrap gap-5 justify-center">
                  {roundMatches.map((match, index) => {
                    const homeTeam = getTeamById(match.homeTeam)
                    const awayTeam = getTeamById(match.awayTeam)
                    const hasDescription = match.description && (!homeTeam || !awayTeam)

                    const venue = getVenueById(match.venue)
                    const roundKey = getRoundKey(match)

                    return (
                      <div key={match.id || index} className="bg-slate-50 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-fifa-blue dark:hover:border-fifa-gold rounded-xl p-4 w-full max-w-[500px] transition-all duration-300 hover:shadow-lg flex flex-col gap-3 group relative hover:z-30">
                        {match.matchCode && (
                          <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{match.matchCode}</div>
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
                              <span className="text-xs italic text-slate-400 break-words" title={formatDescription(match.description)}>
                                {formatDescription(match.description).split(' vs ')[0] || 'TBD'}
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
                                className="w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold bg-slate-100 dark:bg-slate-700 rounded-lg border border-transparent focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-all"
                                value={match.homeScore ?? ''}
                                onChange={(e) => roundKey && handleScoreChange(roundKey, match.id, 'homeScore', e.target.value)}
                                placeholder="-"
                              />
                              <span className="text-slate-300 font-bold">:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={2}
                                className="w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold bg-slate-100 dark:bg-slate-700 rounded-lg border border-transparent focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-all"
                                value={match.awayScore ?? ''}
                                onChange={(e) => roundKey && handleScoreChange(roundKey, match.id, 'awayScore', e.target.value)}
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
                                    className="w-7 h-7 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded-md border border-slate-200 dark:border-slate-500 focus:border-fifa-blue focus:ring-1 focus:ring-fifa-blue outline-none transition-all shadow-sm"
                                    value={match.homePenalty ?? ''}
                                    onChange={(e) => roundKey && handleScoreChange(roundKey, match.id, 'homePenalty', e.target.value)}
                                    placeholder=""
                                  />
                                  <span className="text-slate-400 text-xs font-bold">:</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-7 h-7 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded-md border border-slate-200 dark:border-slate-500 focus:border-fifa-blue focus:ring-1 focus:ring-fifa-blue outline-none transition-all shadow-sm"
                                    value={match.awayPenalty ?? ''}
                                    onChange={(e) => roundKey && handleScoreChange(roundKey, match.id, 'awayPenalty', e.target.value)}
                                    placeholder=""
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 w-5/12 justify-start text-left">
                            {awayTeam ? (
                              <>
                                <Flag code={awayTeam.code} />
                                <span className="font-bold text-sm md:text-base leading-tight">{awayTeam.name}</span>
                              </>
                            ) : hasDescription ? (
                              <span className="text-xs italic text-slate-400 break-words" title={formatDescription(match.description)}>
                                {formatDescription(match.description).split(' vs ')[1] || 'TBD'}
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-400">TBD</span>
                            )}
                          </div>
                        </div>

                        <div className="text-center text-xs text-slate-500 font-medium pt-1">
                          {match.date && <span>{formatDate(match.date)}</span>}
                          {venue && <span> • <span className="text-fifa-red">📍</span> {venue.city}, {venue.stadium}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-lg">Utakmice će biti određene nakon završetka grupne faze.</p>
                  <p className="text-sm mt-2 font-semibold">
                    {round.count === 1 ? '1 utakmica' : `${round.count} utakmica`}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {/* Third Place Match */}
        {matches?.thirdPlace && (
          <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 md:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-black text-center text-slate-700 dark:text-slate-300 mb-8 uppercase tracking-widest flex justify-center items-center gap-2">
              <span className="text-3xl">🥉</span> Utakmica za 3. mjesto
            </h3>
            <div className="flex justify-center">
              {(() => {
                const match = matches.thirdPlace;
                const homeTeam = getTeamById(match.homeTeam);
                const awayTeam = getTeamById(match.awayTeam);
                const hasDescription = match.description && (!homeTeam || !awayTeam);
                const venue = getVenueById(match.venue);

                return (
                  <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-[600px] shadow-lg flex flex-col gap-4">
                    {match.matchCode && (
                      <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{match.matchCode}</div>
                    )}
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                        {homeTeam ? (
                          <>
                            <Flag code={homeTeam.code} size="lg" />
                            <span className="font-bold text-lg leading-tight">{homeTeam.name}</span>
                          </>
                        ) : hasDescription ? (
                          <span className="text-sm italic text-slate-400 font-medium">
                            {formatDescription(match.description).split(' vs ')[0]}
                          </span>
                        ) : (
                          <span className="text-sm italic text-slate-400">TBD</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          className="w-14 h-14 text-center text-2xl font-bold bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-fifa-blue"
                          value={match.homeScore ?? ''}
                          onChange={(e) => handleScoreChange('thirdPlace', match.id, 'homeScore', e.target.value)}
                        />
                        <span className="text-2xl text-slate-300">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          className="w-14 h-14 text-center text-2xl font-bold bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-fifa-blue"
                          value={match.awayScore ?? ''}
                          onChange={(e) => handleScoreChange('thirdPlace', match.id, 'awayScore', e.target.value)}
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
                              className="w-10 h-8 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue"
                              value={match.homePenalty ?? ''}
                              onChange={(e) => handleScoreChange('thirdPlace', match.id, 'homePenalty', e.target.value)}
                            />
                            <span className="text-slate-400 font-bold">:</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              className="w-10 h-8 text-center text-sm font-bold bg-white dark:bg-slate-600 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-fifa-blue"
                              value={match.awayPenalty ?? ''}
                              onChange={(e) => handleScoreChange('thirdPlace', match.id, 'awayPenalty', e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2 w-1/3 text-center">
                        {awayTeam ? (
                          <>
                            <Flag code={awayTeam.code} size="lg" />
                            <span className="font-bold text-lg leading-tight">{awayTeam.name}</span>
                          </>
                        ) : hasDescription ? (
                          <span className="text-sm italic text-slate-400 font-medium">
                            {formatDescription(match.description).split(' vs ')[1]}
                          </span>
                        ) : (
                          <span className="text-sm italic text-slate-400">TBD</span>
                        )}
                      </div>
                    </div>
                    <div className="text-center text-sm text-slate-500 font-medium mt-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                      {match.date && <span>{formatDate(match.date)}</span>}
                      {venue && <span> • <span className="text-fifa-red">📍</span> {venue.city}, {venue.stadium}</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Final */}
        {matches?.final && (
          <div className="bg-gradient-to-b from-fifa-gold/10 to-transparent dark:from-fifa-gold/5 rounded-2xl p-4 md:p-10 shadow-2xl border border-fifa-gold/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>
            <h3 className="text-4xl md:text-5xl font-black text-center text-fifa-blue dark:text-fifa-gold mb-10 uppercase tracking-widest drop-shadow-sm flex flex-col items-center gap-4">
              <span className="text-6xl mb-2 filter drop-shadow-lg">🏆</span>
              FINALE 2026
            </h3>

            <div className="flex justify-center">
              {(() => {
                const match = matches.final;
                const homeTeam = getTeamById(match.homeTeam);
                const awayTeam = getTeamById(match.awayTeam);
                const hasDescription = match.description && (!homeTeam || !awayTeam);
                const venue = getVenueById(match.venue);

                return (
                  <div className="bg-white dark:bg-slate-800 border-2 border-fifa-gold/50 rounded-2xl p-6 md:p-10 w-full max-w-[800px] shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col gap-6 relative z-10">
                    {match.matchCode && (
                      <div className="text-center text-sm font-bold text-fifa-gold uppercase tracking-[0.2em] mb-4 border-b border-fifa-gold/20 pb-4">{match.matchCode}</div>
                    )}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                      {/* Home Team Final */}
                      <div className="flex flex-col items-center gap-4 w-full md:w-1/3 text-center">
                        {homeTeam ? (
                          <>
                            <div className="transform scale-150 mb-2 filter drop-shadow-xl"><Flag code={homeTeam.code} size="lg" /></div>
                            <span className="font-black text-2xl md:text-3xl leading-tight uppercase tracking-tight">{homeTeam.name}</span>
                          </>
                        ) : hasDescription ? (
                          <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full font-medium">
                            {formatDescription(match.description).split(' vs ')[0]}
                          </span>
                        ) : (
                          <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full">Finalist 1</span>
                        )}
                      </div>

                      {/* Score Final */}
                      <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-black bg-white dark:bg-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-fifa-gold text-slate-800 dark:text-white"
                          value={match.homeScore ?? ''}
                          onChange={(e) => handleScoreChange('final', match.id, 'homeScore', e.target.value)}
                          placeholder="-"
                        />
                        <span className="text-4xl md:text-5xl font-black text-slate-300 dark:text-slate-600">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl md:text-4xl font-black bg-white dark:bg-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-fifa-gold text-slate-800 dark:text-white"
                          value={match.awayScore ?? ''}
                          onChange={(e) => handleScoreChange('final', match.id, 'awayScore', e.target.value)}
                          placeholder="-"
                        />
                      </div>

                      {/* Away Team Final */}
                      <div className="flex flex-col items-center gap-4 w-full md:w-1/3 text-center">
                        {awayTeam ? (
                          <>
                            <div className="transform scale-150 mb-2 filter drop-shadow-xl"><Flag code={awayTeam.code} size="lg" /></div>
                            <span className="font-black text-2xl md:text-3xl leading-tight uppercase tracking-tight">{awayTeam.name}</span>
                          </>
                        ) : hasDescription ? (
                          <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full font-medium">
                            {formatDescription(match.description).split(' vs ')[1]}
                          </span>
                        ) : (
                          <span className="text-lg italic text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-full">Finalist 2</span>
                        )}
                      </div>
                    </div>
                    <div className="text-center text-base text-slate-500 font-medium mt-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                      {match.date && <span>{formatDate(match.date)}</span>}
                      {venue && <span> • <span className="text-fifa-red">📍</span> {venue.city}, {venue.stadium}</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Prikaz pobjednika i puta do pobjede */}
      {
        winner && winnerPath.length > 0 && (
          <div className="mt-10 bg-gradient-to-br from-yellow-50 to-white dark:from-slate-800 dark:to-slate-900 border-4 border-yellow-400 rounded-2xl p-8 md:p-12 text-center shadow-[0_0_40px_rgba(250,204,21,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-2xl md:text-4xl font-black text-yellow-600 dark:text-yellow-400 mb-6 uppercase tracking-widest">
                Pobjednik Svjetskog Prvenstva 2026
              </h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10 bg-white dark:bg-slate-900/50 p-6 rounded-xl inline-flex mx-auto shadow-lg border border-yellow-200 dark:border-yellow-900/30">
                <div className="transform scale-150 p-2"><Flag code={winner.code} size="lg" /></div>
                <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                  {winner.name}
                </span>
              </div>

              <div className="mt-8 bg-slate-50 dark:bg-slate-900/80 rounded-xl p-6 md:p-8 text-left max-w-4xl mx-auto border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-500 mb-6 text-center flex items-center justify-center gap-2">
                  <span>🗺️</span> Put do pobjede
                </h3>
                <div className="flex flex-col gap-3">
                  {winnerPath.map((match, index) => (
                    <div key={index} className={`
                    grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow
                    ${match.result === 'Pobjeda'
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                        : match.result === 'Poraz'
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                          : 'bg-white dark:bg-slate-800 border-slate-300'
                      }
                  `}>
                      <div className="flex flex-col items-center md:items-start justify-center">
                        <div className="font-bold text-slate-500 text-sm uppercase tracking-wide text-center md:text-left">{match.phase}</div>
                        <div className="text-xs font-mono text-slate-400">{match.matchCode}</div>
                      </div>

                      <div className="flex items-center justify-center gap-2 md:gap-4 text-lg w-full">
                        <div className="font-bold flex items-center gap-2 justify-end w-5/12 text-right leading-tight">
                          <span className="hidden md:inline">{match.homeTeam}</span>
                          <span className="md:hidden">{match.homeTeamCode}</span>
                          <Flag code={match.homeTeamCode} size="sm" />
                        </div>

                        <span className={`font-black text-xl md:text-2xl px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-sm whitespace-nowrap ${match.result === 'Pobjeda'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
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

                      <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 text-center md:text-right flex flex-col gap-1 min-w-[140px]">
                        <div className="flex items-center justify-center md:justify-end gap-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span>{formatDate(match.date)}</span>
                          <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-bold">{match.time}</span>
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

              <div className="mt-8 inline-block bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 px-6 py-3 rounded-full font-bold text-lg border border-yellow-200 dark:border-yellow-700/30">
                Ukupno odigrano: {winnerPath.length} utakmica •
                Pobjeda: {winnerPath.filter(m => m.result === 'Pobjeda').length}
              </div>
            </div>
          </div>
        )
      }

      {/* Posebna sekcija za Hrvatsku */}
      {
        croatiaPath.length > 0 && (
          <div className="mt-10 bg-gradient-to-br from-red-50 to-white dark:from-slate-800 dark:to-slate-900 border-4 border-red-500 rounded-2xl p-8 md:p-12 text-center shadow-[0_0_40px_rgba(239,68,68,0.3)] relative overflow-hidden">
            <div className="relative z-10 w-full">
              <h2 className="text-3xl font-black text-red-600 mb-8 uppercase tracking-widest flex items-center justify-center gap-4">
                <span>🇭🇷</span> Put Vatrenih <span>🇭🇷</span>
              </h2>

              <div className="bg-white dark:bg-slate-900/80 rounded-xl p-6 text-left max-w-4xl mx-auto border border-red-100 dark:border-red-900/30 shadow-lg">
                <div className="flex flex-col gap-3">
                  {croatiaPath.map((match, index) => (
                    <div key={index} className={`
                    grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] items-center gap-4 p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-transform hover:scale-[1.01]
                    ${match.result === 'Pobjeda'
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-500'
                        : match.result === 'Poraz'
                          ? 'bg-red-50 dark:bg-red-900/10 border-red-500'
                          : 'bg-slate-50 dark:bg-slate-800 border-yellow-500'
                      }
                  `}>
                      <div className="flex flex-col items-center md:items-start justify-center">
                        <div className="font-bold text-slate-500 text-sm uppercase tracking-wide text-center md:text-left">{match.phase}</div>
                        <div className="text-xs font-mono text-slate-400">{match.matchCode}</div>
                      </div>

                      <div className="flex items-center justify-center gap-2 md:gap-4 text-lg w-full">
                        <div className="font-black flex items-center gap-2 justify-end w-5/12 text-right leading-tight text-slate-800 dark:text-white">
                          <span className="hidden md:inline">{match.homeTeam}</span>
                          <span className="md:hidden">{match.homeTeamCode}</span>
                          <Flag code={match.homeTeamCode} size="sm" />
                        </div>

                        <span className={`font-black text-xl md:text-2xl px-3 py-1 md:px-4 md:py-2 rounded-lg shadow-sm whitespace-nowrap ${match.result === 'Pobjeda' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          match.result === 'Poraz' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                          {match.homeScore}:{match.awayScore}
                        </span>

                        <div className="flex items-center gap-2 justify-start w-5/12 text-left font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                          <Flag code={match.awayTeamCode} size="sm" />
                          <span className="hidden md:inline">{match.awayTeam}</span>
                          <span className="md:hidden">{match.awayTeamCode}</span>
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 text-center md:text-right flex flex-col gap-1 min-w-[140px]">
                        <div className="flex items-center justify-center md:justify-end gap-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <span>{formatDate(match.date)}</span>
                          <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-bold">{match.time}</span>
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
            </div>
          </div>
        )
      }
    </div >
  )
}

export default Knockout
