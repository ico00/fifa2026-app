import Flag from '../Flag'

/**
 * Odabir pobjednika play-off utakmica
 */
function PlayoffPredictions({ playoffs, playoffPredictions, onSelect, getTeamById }) {
  if (!playoffs) return null

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-900/30 shadow-lg">
      <h4 className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-2">
        🎯 Play-off Pobjednici
      </h4>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
        Prvo odaberite tko prolazi kroz Play-off. Vaš odabir automatski će se pojaviti u grupama dolje 👇
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(playoffs).map(([pathKey, pathData]) => {
          const selectedId = playoffPredictions[pathKey]
          
          return (
            <div 
              key={pathKey} 
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-indigo-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="text-center font-bold text-indigo-600 dark:text-indigo-400 mb-3 bg-indigo-50 dark:bg-slate-700/50 py-1 rounded-lg">
                Play-off {pathKey}
              </div>
              
              <div className="flex flex-col gap-2">
                {pathData.teams.map(teamId => {
                  const team = getTeamById(teamId)
                  if (!team) return null

                  const isSelected = selectedId === teamId

                  return (
                    <button
                      key={team.id}
                      onClick={() => onSelect(pathKey, team.id)}
                      className={`
                        flex items-center gap-3 p-2 rounded-lg transition-all border
                        ${isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]'
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }
                      `}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                      <Flag code={team.code} size="sm" />
                      <span className="font-bold text-sm truncate">{team.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlayoffPredictions
