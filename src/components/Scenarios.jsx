import Flag from './Flag'
import { getTeamById } from '../utils/helpers'

const STATUS_META = {
  secured: { label: 'Osiguran', cls: 'bg-green-500 text-white', dot: 'bg-green-500' },
  possible: { label: 'Još u igri', cls: 'bg-fifa-blue text-white', dot: 'bg-fifa-blue' },
  eliminated: { label: 'Ispao', cls: 'bg-slate-400 text-white', dot: 'bg-slate-400' }
}

/**
 * Prikaz jednog tima u scenarijima
 */
function TeamScenario({ team, teams }) {
  const t = getTeamById(teams, team.id)
  const q = team.qualification || { status: 'possible', summary: '' }
  const meta = STATUS_META[q.status] || STATUS_META.possible
  const o = q.outcomes

  return (
    <div className={`p-3 rounded-lg border border-slate-200 dark:border-slate-700 ${q.status === 'eliminated' ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        {t && <Flag code={t.code} size="sm" />}
        <span className="font-bold text-sm md:text-base flex-1">{team.name}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.cls}`}>
          {meta.label}
        </span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{q.summary}</p>

      {typeof team.advanceChance === 'number' && q.status !== 'eliminated' && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">🎲 Šanse za prolaz</span>
            <span className={`text-sm font-black ${
              team.advanceChance >= 75 ? 'text-green-600 dark:text-green-400'
                : team.advanceChance >= 40 ? 'text-amber-500'
                : 'text-red-500'
            }`}>
              {q.status === 'secured' ? '100%' : team.advanceChance >= 100 ? '≈100%' : team.advanceChance <= 0 ? '<1%' : `${team.advanceChance}%`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                team.advanceChance >= 75 ? 'bg-green-500' : team.advanceChance >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, team.advanceChance))}%` }}
            />
          </div>
        </div>
      )}

      {o && (o.win || o.draw || o.loss) && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
          {o.win && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded px-2 py-1">
              <span className="font-bold text-green-600 dark:text-green-400">Pobjeda:</span> {o.win}
            </div>
          )}
          {o.draw && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded px-2 py-1">
              <span className="font-bold text-slate-500">Remi:</span> {o.draw}
            </div>
          )}
          {o.loss && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded px-2 py-1">
              <span className="font-bold text-red-500">Poraz:</span> {o.loss}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Stranica sa scenarijima prolaza po grupama (razina ishoda, FIFA 2026 pravila)
 */
function Scenarios({ standings, teams }) {
  const groups = standings ? Object.entries(standings).sort(([a], [b]) => a.localeCompare(b)) : []

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in-up">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 drop-shadow-md">
          <span>🔮</span> <span>SCENARIJI</span>
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-6xl mb-4">🔮</p>
          <p className="text-slate-500 text-xl">Scenariji će se pojaviti nakon odigranih utakmica.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in-up">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-fifa-gold tracking-widest flex items-center gap-2 sm:gap-3 drop-shadow-md">
        <span>🔮</span> <span className="break-words">SCENARIJI PROLAZA</span>
      </h2>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-lg p-3 flex items-start gap-2">
        <span className="text-base leading-none mt-0.5">ℹ️</span>
        <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
          Što kojoj reprezentaciji treba za prolaz, prema dosadašnjim rezultatima i FIFA 2026 pravilima
          (prvo se gleda <span className="font-bold">međusobni susret</span>). Scenariji su na razini ishoda
          (pobjeda/remi/poraz). Postotak je <span className="font-bold">procjena iz 10.000 simulacija</span>
          preostalih utakmica (svi ishodi jednako vjerojatni).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {groups.map(([groupKey, group]) => {
          const hasCroatia = group.teams.some(t => t && t.highlight)
          return (
            <div
              key={groupKey}
              className={`rounded-xl overflow-hidden shadow-lg border ${
                hasCroatia
                  ? 'border-2 border-fifa-red'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className={`p-3 font-black tracking-widest ${
                hasCroatia
                  ? 'bg-fifa-red text-white'
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-200'
              }`}>
                {group.name}{hasCroatia && ' 🇭🇷'}
              </div>
              <div className="p-3 flex flex-col gap-2 bg-white dark:bg-slate-800/50">
                {group.teams.map(team => (
                  <TeamScenario key={team.id} team={team} teams={teams} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Scenarios
