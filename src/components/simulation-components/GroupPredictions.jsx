import Flag from '../Flag'

// Hrvatski oblik riječi "bod" prema broju
const bodLabel = (n) => (n === 1 ? 'bod' : n >= 2 && n <= 4 ? 'boda' : 'bodova')

/**
 * Prognoze za grupne utakmice.
 * Odigrane utakmice prikazuju stvarni rezultat + tvoju prognozu + osvojene bodove.
 * Neodigrane se mogu prognozirati.
 */
function GroupPredictions({
  groups,
  matches,
  userPredictions,
  onPredictionChange,
  resolveTeam,
  calculatePoints
}) {
  return (
    <>
      {Object.entries(groups).map(([groupKey]) => (
        <div
          key={groupKey}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
          <h4 className="text-2xl font-black text-fifa-gold mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            Grupa {groupKey}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.groupStage
              .filter(m => m.group === groupKey)
              .map(match => {
                const homeFn = resolveTeam(match.homeTeam, match.homeTeamPlayoff)
                const awayFn = resolveTeam(match.awayTeam, match.awayTeamPlayoff)
                const pred = userPredictions[match.id] || {}

                const isPlayed = match.played && match.homeScore != null && match.awayScore != null
                const hasPred = pred.homeScore !== undefined && pred.homeScore !== '' &&
                  pred.awayScore !== undefined && pred.awayScore !== ''
                const points = (isPlayed && hasPred && calculatePoints)
                  ? calculatePoints({ homeScore: Number(pred.homeScore), awayScore: Number(pred.awayScore) }, match)
                  : null

                const isHomePlaceholder = homeFn?.type === 'placeholder'
                const isAwayPlaceholder = awayFn?.type === 'placeholder'

                return (
                  <div
                    key={match.id}
                    className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center">
                      {/* Home Team */}
                      <div className={`flex items-center gap-2 w-1/3 ${isHomePlaceholder ? 'opacity-50' : ''}`}>
                        <span className="font-bold text-sm truncate" title={homeFn?.name}>
                          {homeFn?.name}
                        </span>
                        <Flag code={homeFn?.code} size="sm" />
                      </div>

                      {/* Sredina: stvarni rezultat (odigrano) ili polja za prognozu */}
                      {isPlayed ? (
                        <div className="flex items-center gap-2 font-black text-lg" title="Stvarni rezultat">
                          <span className="w-10 text-center">{match.homeScore}</span>
                          <span className="text-slate-400">:</span>
                          <span className="w-10 text-center">{match.awayScore}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={pred.homeScore ?? ''}
                            onChange={(e) => onPredictionChange(match.id, 'homeScore', e.target.value)}
                            className="w-10 h-10 text-center font-bold bg-white dark:bg-slate-700 rounded-lg border focus:ring-2 focus:ring-fifa-blue outline-none"
                          />
                          <span className="text-slate-400 font-bold">:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={pred.awayScore ?? ''}
                            onChange={(e) => onPredictionChange(match.id, 'awayScore', e.target.value)}
                            className="w-10 h-10 text-center font-bold bg-white dark:bg-slate-700 rounded-lg border focus:ring-2 focus:ring-fifa-blue outline-none"
                          />
                        </div>
                      )}

                      {/* Away Team */}
                      <div className={`flex items-center gap-2 w-1/3 justify-end ${isAwayPlaceholder ? 'opacity-50' : ''}`}>
                        <Flag code={awayFn?.code} size="sm" />
                        <span className="font-bold text-sm truncate text-right" title={awayFn?.name}>
                          {awayFn?.name}
                        </span>
                      </div>
                    </div>

                    {/* Donja linija */}
                    {isPlayed ? (
                      <div className="text-[11px] text-center font-medium flex items-center justify-center gap-2 flex-wrap">
                        {hasPred ? (
                          <>
                            <span className="text-slate-500 dark:text-slate-400">
                              Tvoja prognoza: <span className="font-bold text-slate-700 dark:text-slate-200">{pred.homeScore}:{pred.awayScore}</span>
                            </span>
                            <span className={`font-black px-1.5 py-0.5 rounded-full text-[10px] ${
                              points === 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : points === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                              +{points} {bodLabel(points)}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Odigrano · nisi prognozirao (0)</span>
                        )}
                      </div>
                    ) : (isHomePlaceholder || isAwayPlaceholder) && (
                      <div className="text-[10px] text-center text-red-400 font-bold uppercase">
                        ⚠️ Odaberite pobjednika playoffa gore!
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      ))}
    </>
  )
}

export default GroupPredictions
