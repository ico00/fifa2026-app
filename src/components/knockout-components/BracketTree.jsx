import { useMemo, useRef, useState, useEffect } from 'react'
import Flag from '../Flag'
import { buildBracketSides } from '../../utils/bracket'
import {
  getTeamById,
  getMatchWinner,
  formatKnockoutDescription,
  formatDateShort
} from '../../utils/helpers'

// Geometrija stabla (px) - koordinate konektora računamo analitički
const NODE_W = 140
const NODE_H = 46
const COL_GAP = 40
const ROW_H = 54
const LEAVES_PER_SIDE = 8
const H = LEAVES_PER_SIDE * ROW_H
const COL_STRIDE = NODE_W + COL_GAP
const HEADER_H = 22
const HEADER_MB = 8
const CONTENT_H = HEADER_H + HEADER_MB + H

// Naslov runde prema broju mečeva u koloni
const ROUND_NAME = { 8: 'Šesnaestina', 4: 'Osmina', 2: 'Četvrtfinale', 1: 'Polufinale' }

const centerY = (i, n) => (H * (i + 0.5)) / n

/**
 * Jedan red (tim) unutar čvora meča
 */
function TeamRow({ team, token, score, penalty, isWinner, isLoserDecided, projected, isCroatia }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 h-1/2 border-b last:border-b-0 border-slate-100 dark:border-slate-700/50 ${
        isWinner ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
      } ${isLoserDecided ? 'opacity-50' : ''}`}
    >
      {team ? (
        <Flag code={team.code} size="sm" />
      ) : (
        <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
      )}
      <span
        className={`flex-1 truncate text-[11px] leading-none ${
          isWinner ? 'font-extrabold' : 'font-medium'
        } ${projected ? 'italic text-amber-700 dark:text-amber-300' : ''} ${
          isCroatia ? 'text-fifa-red font-bold' : ''
        } ${!team ? 'text-slate-400 not-italic' : ''}`}
        title={team ? team.name : token}
      >
        {team ? team.name : token}
      </span>
      {score != null && (
        <span className={`text-[11px] tabular-nums ${isWinner ? 'font-extrabold' : 'font-semibold text-slate-500'}`}>
          {score}
          {penalty != null && <sup className="text-[8px] text-slate-400 ml-0.5">({penalty})</sup>}
        </span>
      )}
    </div>
  )
}

/**
 * Čvor jednog meča u stablu (apsolutno pozicioniran)
 */
function MatchNode({ match, teams, x, y, projectedHome, projectedAway, isFinal }) {
  const homeTeam = getTeamById(teams, match.homeTeam)
  const awayTeam = getTeamById(teams, match.awayTeam)
  const winner = getMatchWinner(match)
  const decided = winner === 'home' || winner === 'away'
  const [homeToken, awayToken] = (formatKnockoutDescription(match.description) || ' vs ').split(' vs ')
  const isCroatiaNode = match.homeTeam === 'cro' || match.awayTeam === 'cro'
  const isDrawPen = match.homeScore != null && match.homeScore === match.awayScore

  return (
    <div
      className={`absolute rounded-lg border bg-white dark:bg-slate-800 shadow-sm overflow-hidden flex flex-col ${
        isFinal ? 'border-fifa-gold ring-2 ring-fifa-gold/40 shadow-md' : ''
      } ${
        isCroatiaNode ? 'border-fifa-red/60 ring-1 ring-fifa-red/30' : 'border-slate-200 dark:border-slate-700'
      } ${(projectedHome || projectedAway) ? 'border-dashed border-amber-400/80 dark:border-amber-500/70' : ''}`}
      style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
    >
      <TeamRow
        team={homeTeam}
        token={homeToken}
        score={match.homeScore}
        penalty={isDrawPen ? match.homePenalty : null}
        isWinner={winner === 'home'}
        isLoserDecided={decided && winner !== 'home'}
        projected={projectedHome}
        isCroatia={match.homeTeam === 'cro'}
      />
      <TeamRow
        team={awayTeam}
        token={awayToken}
        score={match.awayScore}
        penalty={isDrawPen ? match.awayPenalty : null}
        isWinner={winner === 'away'}
        isLoserDecided={decided && winner !== 'away'}
        projected={projectedAway}
        isCroatia={match.awayTeam === 'cro'}
      />
    </div>
  )
}

/**
 * Dvostrano turnirsko stablo - dvije polovice se spajaju u finalu u sredini.
 * Read-only vizualni pregled; uređivanje rezultata ostaje u prikazu "Lista".
 */
function BracketTree({ matches, teams, venues }) {
  const data = useMemo(() => buildBracketSides(matches), [matches])
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)

  // Skaliraj stablo da uvijek stane u širinu kontejnera (bez horizontalnog scrolla)
  const fitWidth = data ? (data.left.length * 2 + 1 - 1) * COL_STRIDE + NODE_W : 0
  useEffect(() => {
    const el = containerRef.current
    if (!el || !fitWidth) return
    const update = () => {
      const avail = el.clientWidth
      setScale(avail >= fitWidth ? 1 : avail / fitWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fitWidth])

  if (!data) {
    return (
      <div className="text-center py-10 text-slate-400">
        <p className="text-lg">Stablo će biti dostupno nakon generiranja parova.</p>
      </div>
    )
  }

  const { left, right, final, thirdPlace } = data
  const FINAL_COL = left.length // lijeva strana zauzima kolone 0..left.length-1
  const RIGHT_BASE = FINAL_COL * 2 // zrcalni indeks za desnu stranu
  const totalCols = FINAL_COL * 2 + 1
  const totalW = (totalCols - 1) * COL_STRIDE + NODE_W
  const midY = H / 2

  // visualni colIndex desne kolone c (0 = prva runda, najdesnije)
  const rightColIndex = (c) => RIGHT_BASE - c

  // --- Konektori ---
  const connectors = []

  // Lijeva strana (linije idu udesno)
  for (let c = 1; c < left.length; c++) {
    const nParent = left[c].length
    const nPrev = left[c - 1].length
    const feederRightX = (c - 1) * COL_STRIDE + NODE_W
    const parentLeftX = c * COL_STRIDE
    const midX = (feederRightX + parentLeftX) / 2
    for (let j = 0; j < nParent; j++) {
      const ny = centerY(j, nParent)
      ;[2 * j, 2 * j + 1].forEach(fi => {
        if (fi >= nPrev) return
        const fy = centerY(fi, nPrev)
        connectors.push(`M ${feederRightX} ${fy} H ${midX} V ${ny} H ${parentLeftX} ${ny}`)
      })
    }
  }
  // Lijevo polufinale -> finale
  {
    const sfRightX = (left.length - 1) * COL_STRIDE + NODE_W
    const finalLeftX = FINAL_COL * COL_STRIDE
    connectors.push(`M ${sfRightX} ${midY} H ${finalLeftX}`)
  }

  // Desna strana (linije idu ulijevo, zrcalno)
  for (let c = 1; c < right.length; c++) {
    const nParent = right[c].length
    const nPrev = right[c - 1].length
    const parentRightX = rightColIndex(c) * COL_STRIDE + NODE_W
    const feederLeftX = rightColIndex(c - 1) * COL_STRIDE
    const midX = (parentRightX + feederLeftX) / 2
    for (let j = 0; j < nParent; j++) {
      const ny = centerY(j, nParent)
      ;[2 * j, 2 * j + 1].forEach(fi => {
        if (fi >= nPrev) return
        const fy = centerY(fi, nPrev)
        connectors.push(`M ${feederLeftX} ${fy} H ${midX} V ${ny} H ${parentRightX} ${ny}`)
      })
    }
  }
  // Desno polufinale -> finale
  {
    const sfLeftX = rightColIndex(right.length - 1) * COL_STRIDE
    const finalRightX = FINAL_COL * COL_STRIDE + NODE_W
    connectors.push(`M ${sfLeftX} ${midY} H ${finalRightX}`)
  }

  // Naslov za zadani visualni colIndex
  const headerFor = (colIndex) => {
    if (colIndex === FINAL_COL) return 'Finale'
    if (colIndex < FINAL_COL) return ROUND_NAME[left[colIndex]?.length] ?? ''
    const c = RIGHT_BASE - colIndex
    return ROUND_NAME[right[c]?.length] ?? ''
  }

  const finalVenue = venues && final ? venues.find(v => v.id === final.venue) : null

  // Render jedne kolone čvorova
  const renderColumn = (col, colIndex) =>
    col.map((match, i) => (
      <MatchNode
        key={match.id || `${colIndex}-${i}`}
        match={match}
        teams={teams}
        x={colIndex * COL_STRIDE}
        y={centerY(i, col.length) - NODE_H / 2}
        projectedHome={match._homeProjected}
        projectedAway={match._awayProjected}
      />
    ))

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-5 shadow-lg border border-slate-200 dark:border-slate-700">
      <div
        ref={containerRef}
        className="overflow-hidden flex"
        style={{ height: CONTENT_H * scale, justifyContent: scale === 1 ? 'center' : 'flex-start' }}
      >
        <div style={{ width: totalW, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {/* Naslovi rundi */}
          <div className="flex" style={{ height: HEADER_H, marginBottom: HEADER_MB }}>
            {Array.from({ length: totalCols }).map((_, colIndex) => (
              <div
                key={colIndex}
                style={{ width: NODE_W, marginRight: colIndex < totalCols - 1 ? COL_GAP : 0 }}
                className={`text-center text-[11px] md:text-xs font-bold uppercase tracking-wider truncate ${
                  colIndex === FINAL_COL ? 'text-fifa-gold' : 'text-fifa-blue dark:text-fifa-gold'
                }`}
              >
                {headerFor(colIndex)}
              </div>
            ))}
          </div>

          {/* Stablo */}
          <div className="relative" style={{ width: totalW, height: H }}>
            <svg className="absolute inset-0 pointer-events-none" width={totalW} height={H} fill="none">
              {connectors.map((d, i) => (
                <path key={i} d={d} className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="1.5" />
              ))}
            </svg>

            {/* Lijeva strana */}
            {left.map((col, c) => renderColumn(col, c))}

            {/* Finale (sredina) */}
            <MatchNode
              match={final}
              teams={teams}
              x={FINAL_COL * COL_STRIDE}
              y={midY - NODE_H / 2}
              projectedHome={final._homeProjected}
              projectedAway={final._awayProjected}
              isFinal
            />

            {/* Desna strana */}
            {right.map((col, c) => renderColumn(col, rightColIndex(c)))}
          </div>
        </div>
      </div>

      {/* Utakmica za 3. mjesto - odvojeni čvor */}
      {thirdPlace && (
        <div className="mt-4 flex flex-col items-center gap-1 border-t border-slate-100 dark:border-slate-700 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <span>🥉</span> Za 3. mjesto
          </span>
          <div className="relative" style={{ width: NODE_W, height: NODE_H }}>
            <MatchNode
              match={thirdPlace}
              teams={teams}
              x={0}
              y={0}
              projectedHome={thirdPlace._homeProjected}
              projectedAway={thirdPlace._awayProjected}
            />
          </div>
          {thirdPlace.date && (
            <span className="text-[10px] text-slate-400">{formatDateShort(thirdPlace.date)}</span>
          )}
        </div>
      )}

      {finalVenue && (
        <p className="text-center text-[11px] text-slate-400 mt-3">
          🏆 Finale: <span className="text-fifa-red">📍</span> {finalVenue.city}, {finalVenue.stadium}
        </p>
      )}
    </div>
  )
}

export default BracketTree
