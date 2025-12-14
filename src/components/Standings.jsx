import Flag from './Flag'

function Standings({ standings, teams, bestThirdPlaced = [], groups = {}, playoffs = {} }) {
  const getTeamById = (teamId) => {
    return teams.find(t => t.id === teamId)
  }

  const getPlayoffName = (playoffSlot) => {
    if (!playoffSlot || !playoffs[playoffSlot]) return null
    return playoffs[playoffSlot]
  }

  if (!standings || Object.keys(standings).length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in-up">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
          <span>📊</span> <span className="break-words">TABLICE GRUPA</span>
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-6xl mb-4">📊</p>
          <p className="text-slate-500 text-xl">
            Tablice će se prikazati nakon što se odigraju prve utakmice.
          </p>
        </div>
      </div>
    )
  }

  // Sortiraj grupe po abecedi
  const sortedGroups = Object.entries(standings).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
        <span>📊</span> <span className="break-words">TABLICE GRUPA</span>
      </h2>

      <div className="flex flex-wrap gap-6 mb-2 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Prolaz u knockout fazu
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"></span>
          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Najbolji trećeplasirani
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Flag code="HR" size="sm" />
          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Hrvatska
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
        {sortedGroups.map(([groupKey, group]) => {
          const hasCroatia = group.teams.some(t => t && t.highlight)
          const groupInfo = groups[groupKey]
          const playoffSlot = groupInfo?.playoffSlot
          const playoff = getPlayoffName(playoffSlot)
          const playoffWinner = playoff?.winner

          // Pronađi poziciju play-off pobjednika u grupi
          const playoffPosition = groupInfo?.teams?.findIndex(t => t === null) ?? -1
          const hasPlayoffSlot = playoffSlot && !playoffWinner && playoffPosition !== -1

          // Kreiraj listu za prikaz s play-off placeholderom na pravoj poziciji
          const displayItems = []
          let teamIndex = 0

          for (let i = 0; i < (groupInfo?.teams?.length || group.teams.length); i++) {
            if (hasPlayoffSlot && i === playoffPosition) {
              // Umetni play-off placeholder
              displayItems.push({ type: 'playoff', position: displayItems.length + 1 })
            } else if (teamIndex < group.teams.length) {
              // Dodaj normalan tim
              displayItems.push({ type: 'team', data: group.teams[teamIndex], originalIndex: teamIndex, displayPosition: displayItems.length + 1 })
              teamIndex++
            }
          }

          return (
            <div
              key={groupKey}
              className={`
                rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl
                ${hasCroatia
                  ? 'border-2 border-fifa-red shadow-[0_0_15px_rgba(186,12,47,0.2)]'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }
              `}
            >
              <div className={`
                p-4 flex items-center justify-between
                ${hasCroatia
                  ? 'bg-gradient-to-r from-fifa-red/90 via-fifa-red to-fifa-red/90 text-white'
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700'
                }
              `}>
                <span className={`text-xl font-black tracking-widest ${hasCroatia ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                  {group.name}
                </span>
                {hasCroatia && <span className="text-xl font-bold">🇭🇷 VATRENI!</span>}
              </div>

              <div className="bg-white dark:bg-slate-800/50 -mx-2 sm:mx-0 pr-2 sm:pr-0">
                <table className="w-full table-fixed text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-fifa-gold/20">
                    <tr>
                      <th className="p-1.5 sm:p-2 md:p-3 pl-3 sm:pl-4 md:pl-4 text-left font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide w-[40%] sm:w-[45%] md:w-[42%]">REPREZENTACIJA</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide whitespace-nowrap w-[7.5%] md:w-[7%]">OU</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide whitespace-nowrap w-[7.5%] md:w-[7%]">P</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide whitespace-nowrap w-[7.5%] md:w-[7%]">N</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide whitespace-nowrap w-[7.5%] md:w-[7%]">I</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide hidden sm:table-cell whitespace-nowrap w-[7.5%] md:w-[7%]">G+</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide hidden sm:table-cell whitespace-nowrap w-[7.5%] md:w-[7%]">G-</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-semibold text-slate-500 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide whitespace-nowrap w-[7.5%] md:w-[7%]">GR</th>
                      <th className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-bold text-slate-700 dark:text-fifa-gold text-xs sm:text-xs md:text-sm uppercase tracking-wide whitespace-nowrap w-[8%] md:w-[8%]">BOD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item, displayIndex) => {
                      if (item.type === 'playoff') {
                        // Play-off placeholder na pozicijama 1 ili 2 prolazi u knockout (zeleno)
                        const isPlayoffQualified = item.position <= 2
                        return (
                          <tr key={`playoff-${groupKey}-${item.position}`} className={`border-b border-white/10 dark:border-white/5 ${isPlayoffQualified ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                          <td className="p-1.5 sm:p-2 md:p-3 pl-3 sm:pl-4 md:pl-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                              <span className={`
                                w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs md:text-sm font-bold shrink-0 flex-shrink-0
                                ${isPlayoffQualified
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }
                              `}>
                                {item.position}
                              </span>
                              <span className="text-sm sm:text-base md:text-xl shrink-0">❓</span>
                              <span className="italic font-semibold text-fifa-gold text-[10px] sm:text-xs md:text-xs lg:text-sm break-words min-w-0">
                                W {playoff?.name || `Play-Off ${playoffSlot}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm hidden sm:table-cell">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm hidden sm:table-cell">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-400 dark:text-slate-200 text-xs sm:text-sm">-</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-bold text-slate-400 dark:text-slate-200 text-xs sm:text-sm">-</td>
                          </tr>
                        )
                      }

                      // Normalan tim
                      const teamData = item.data
                      const team = getTeamById(teamData.id)
                      const actualIndex = item.originalIndex
                      const displayPosition = item.displayPosition
                      const isQualified = displayPosition <= 2
                      const isThirdPlaced = displayPosition === 3
                      const isBestThirdPlaced = isThirdPlaced && bestThirdPlaced.includes(teamData.id)
                      const isCroatia = teamData.highlight

                      return (
                        <tr
                          key={teamData.id}
                          className={`
                            border-b border-white/10 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50
                            ${isQualified ? 'bg-green-50/50 dark:bg-green-900/10' : ''} 
                            ${isCroatia ? 'bg-gradient-to-r from-fifa-red/5 via-transparent to-transparent' : ''}
                          `}
                        >
                          <td className="p-1.5 sm:p-2 md:p-3 pl-3 sm:pl-4 md:pl-4">
                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                              <span className={`
                                w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs md:text-sm font-bold shrink-0 flex-shrink-0
                                ${isBestThirdPlaced
                                  ? 'bg-blue-500 text-white shadow-sm'
                                  : isQualified
                                    ? 'bg-green-500 text-white shadow-sm'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                }
                              `}>
                                {displayPosition}
                              </span>
                              {team && <Flag code={team.code} size="sm" className="shrink-0" />}
                              <span className={`font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base break-words min-w-0 ${isCroatia ? 'text-fifa-red dark:text-fifa-gold font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                                {teamData.name}
                                {isCroatia && ' 🔥'}
                              </span>
                            </div>
                          </td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-600 dark:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap">{teamData.played}</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-600 dark:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap">{teamData.won}</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-600 dark:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap">{teamData.drawn}</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-600 dark:text-slate-200 text-xs sm:text-sm font-medium whitespace-nowrap">{teamData.lost}</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-600 dark:text-slate-200 text-xs sm:text-sm font-medium hidden sm:table-cell whitespace-nowrap">{teamData.goalsFor}</td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center text-slate-600 dark:text-slate-200 text-xs sm:text-sm font-medium hidden sm:table-cell whitespace-nowrap">{teamData.goalsAgainst}</td>
                          <td className={`py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-bold text-xs sm:text-sm whitespace-nowrap ${teamData.goalDifference > 0 ? 'text-green-600 dark:text-green-400' :
                            teamData.goalDifference < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-200'
                            }`}>
                            {teamData.goalDifference > 0 ? '+' : ''}{teamData.goalDifference}
                          </td>
                          <td className="py-1.5 sm:py-2 md:py-3 px-0.5 sm:px-1 md:px-1.5 text-center font-bold text-slate-600 dark:text-slate-200 text-xs sm:text-sm whitespace-nowrap">{teamData.points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Standings

