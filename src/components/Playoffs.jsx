import { useState } from 'react'
import Flag from './Flag'

function Playoffs({ playoffs, teams, setPlayoffWinner, isReadOnly }) {
  const [selectedWinners, setSelectedWinners] = useState({})

  const getTeamById = (teamId) => {
    return teams.find(t => t.id === teamId)
  }

  const handleTeamClick = (playoffId, teamId) => {
    // Ako je već određen pobjednik, omogući promjenu
    if (playoffs[playoffId]?.winner) {
      setSelectedWinners(prev => ({
        ...prev,
        [playoffId]: teamId
      }))
    } else {
      setSelectedWinners(prev => ({
        ...prev,
        [playoffId]: teamId
      }))
    }
  }

  const handleSaveWinner = (playoffId) => {
    const winner = selectedWinners[playoffId]
    if (winner) {
      setPlayoffWinner(playoffId, winner)
      // Resetiraj lokalni odabir nakon spremanja
      setSelectedWinners(prev => {
        const newState = { ...prev }
        delete newState[playoffId]
        return newState
      })
    }
  }

  const handleRemoveWinner = (playoffId) => {
    setPlayoffWinner(playoffId, null)
    setSelectedWinners(prev => {
      const newState = { ...prev }
      delete newState[playoffId]
      return newState
    })
  }

  // Provjeri jesu li svi pobjednici odabrani
  const allWinnersSelected = playoffs && Object.keys(playoffs).length > 0 &&
    Object.values(playoffs).every(playoff => playoff && playoff.winner !== null && playoff.winner !== undefined)

  return (
    <div className={`flex flex-col gap-6 w-full animate-fade-in-up transition-opacity duration-500 ${allWinnersSelected ? 'opacity-50 grayscale-[0.3] pointer-events-none' : ''}`}>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
        <span>🎯</span> <span className="break-words">PLAY-OFF KVALIFIKACIJE</span>
      </h2>
      {isReadOnly ? (
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 mb-4">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium flex items-center gap-1.5">
            <span className="text-xs">🔒</span> Aplikacija je u read-only modu
          </p>
        </div>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-lg">
          Klikni na reprezentaciju za odabir pobjednika. Pobjednik svake grupe prolazi na Svjetsko prvenstvo.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {Object.entries(playoffs).map(([playoffId, playoff]) => {
          const currentWinner = playoff.winner || selectedWinners[playoffId]

          return (
            <div
              key={playoffId}
              className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col h-full"
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-4 flex flex-col gap-1 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{playoff.type}</span>
                <span className="text-2xl font-black tracking-widest text-slate-700 dark:text-slate-200">{playoff.name}</span>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-grow">
                {playoff.teams.map(teamId => {
                  const team = getTeamById(teamId)
                  if (!team) return null

                  const isWinner = currentWinner === teamId
                  const isSavedWinner = playoff.winner === teamId

                  return (
                    <div
                      key={teamId}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border-2
                        ${isWinner
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-md transform scale-[1.02]'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600'
                        }
                        ${!isReadOnly ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                      `}
                      onClick={() => !isReadOnly && handleTeamClick(playoffId, teamId)}
                    >
                      <Flag code={team.code} />
                      <span className="font-semibold flex-grow">{team.name}</span>
                      {isWinner && (
                        <span className={`text-xs font-bold px-2 py-1 rounded text-white ${isSavedWinner ? 'bg-green-600' : 'bg-blue-500'}`}>
                          {isSavedWinner ? 'KVALIFICIRAN' : 'ODABRAN'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {!isReadOnly && (selectedWinners[playoffId] || playoff.winner) && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex flex-col gap-2">
                  {selectedWinners[playoffId] && selectedWinners[playoffId] !== playoff.winner && (
                    <button
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm active:transform active:scale-95"
                      onClick={() => handleSaveWinner(playoffId)}
                    >
                      💾 {playoff.winner ? 'Promijeni pobjednika' : 'Spremi pobjednika'}
                    </button>
                  )}
                  {playoff.winner && (
                    <button
                      className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-sm active:transform active:scale-95 flex items-center justify-center gap-2"
                      onClick={() => handleRemoveWinner(playoffId)}
                    >
                      <span>🗑️</span> Ukloni pobjednika
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Playoffs

