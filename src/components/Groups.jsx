import { memo, useMemo } from 'react'
import Flag from './Flag'
import { getTeamById, getPlayoffData } from '../utils/helpers'

/**
 * Memoizirana kartica grupe
 */
const GroupCard = memo(function GroupCard({ groupKey, group, teams, playoffs }) {
  const getPlayoffInfo = (playoffSlot) => {
    return getPlayoffData(playoffs, playoffSlot)
  }

  const hasHighlight = useMemo(() => 
    group.teams.some(teamId => {
      const team = getTeamById(teams, teamId)
      return team?.highlight
    }),
    [group.teams, teams]
  )

  return (
    <div
      className={`
        rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
        ${hasHighlight
          ? 'border-2 border-fifa-red shadow-[0_0_15px_rgba(186,12,47,0.3)]'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        }
      `}
    >
      <div className={`
        p-4 flex items-center justify-between
        ${hasHighlight
          ? 'bg-gradient-to-r from-fifa-red/90 via-fifa-red to-fifa-red/90 text-white'
          : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700'
        }
      `}>
        <span className={`text-2xl font-black tracking-widest ${hasHighlight ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
          {group.name}
        </span>
        {hasHighlight && <span className="text-2xl font-bold">🇭🇷 VATRENI!</span>}
      </div>

      <div className="p-4 flex flex-col gap-2 bg-white dark:bg-slate-800/50">
        {group.teams.map((teamId, index) => {
          if (teamId === null) {
            const playoff = getPlayoffInfo(group.playoffSlot)
            return (
              <div key={`playoff-${index}`} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-600/50">
                <span className="text-xl">❓</span>
                <span className="font-bold italic text-fifa-gold">
                  W {playoff?.name || `Play-Off ${group.playoffSlot}`}
                </span>
              </div>
            )
          }

          const team = getTeamById(teams, teamId)
          if (!team) return null

          const isCroatia = team.highlight

          return (
            <div
              key={teamId}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-colors
                ${isCroatia
                  ? 'bg-gradient-to-r from-fifa-red/10 via-transparent to-fifa-blue/10 border-l-4 border-fifa-red'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }
              `}
            >
              <Flag code={team.code} className="shadow-sm rounded-sm" />
              <span className={`font-semibold text-lg ${isCroatia ? 'text-fifa-red dark:text-fifa-gold font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                {team.name}
                {isCroatia && ' 🔥'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

/**
 * Groups komponenta s optimizacijama performansi
 */
function Groups({ groups, teams, playoffs }) {
  // Memoizirani popis grupa
  const groupEntries = useMemo(() => 
    Object.entries(groups),
    [groups]
  )

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
        <span>📋</span> <span className="break-words">GRUPE SVJETSKOG PRVENSTVA</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
        {groupEntries.map(([groupKey, group]) => (
          <GroupCard
            key={groupKey}
            groupKey={groupKey}
            group={group}
            teams={teams}
            playoffs={playoffs}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(Groups)
