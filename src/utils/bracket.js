/**
 * Klijentska rezolucija knockout bracketa iz TRENUTNOG stanja grupa.
 *
 * Backend (updateKnockoutPairs) popunjava knockout parove tek kad je grupa
 * potpuno odigrana. Ova funkcija dodatno radi "live projekciju" - na temelju
 * trenutnog poretka u grupama predviđa tko bi bio npr. "2A" ili najbolji
 * trećeplasirani, i prije nego grupa završi. Svaki tako dobiven tim označava
 * se kao `projected: true` kako bi UI mogao jasno naznačiti da nije konačan.
 *
 * Nikad ne prepisuje već potvrđene timove (one koje je server upisao u
 * homeTeam/awayTeam) niti stvarne rezultate.
 */

// Tie-breaker: bodovi -> gol-razlika -> postignuti golovi (kao na serveru)
const byRank = (a, b) => {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
  return 0
}

/**
 * Odredi pobjednika utakmice samo iz stvarnog rezultata (uklj. penale).
 * @returns {'home'|'away'|null}
 */
const resultWinner = (match) => {
  if (!match || match.homeScore == null || match.awayScore == null) return null
  if (match.homeScore > match.awayScore) return 'home'
  if (match.awayScore > match.homeScore) return 'away'
  if (match.homePenalty != null && match.awayPenalty != null) {
    if (match.homePenalty > match.awayPenalty) return 'home'
    if (match.awayPenalty > match.homePenalty) return 'away'
  }
  return null
}

/**
 * Razriješi knockout bracket iz trenutnog stanja grupa.
 *
 * @param {Object} knockoutStage - { roundOf32, roundOf16, quarterFinals, semiFinals, thirdPlace, final }
 * @param {Array} groupMatches - sve utakmice grupne faze
 * @param {Object} standings - { A: { teams: [...] }, ... } (sortirano po poretku)
 * @returns {Object} kopija knockoutStage s popunjenim homeTeam/awayTeam te
 *                    zastavicama _homeProjected / _awayProjected
 */
export function resolveKnockoutBracket(knockoutStage, groupMatches, standings) {
  if (!knockoutStage) return knockoutStage
  if (!standings || Object.keys(standings).length === 0) return knockoutStage

  // --- Pripremi rangirane grupe (defenzivno sortirano) ---
  const ranks = {}
  Object.entries(standings).forEach(([key, group]) => {
    ranks[key] = [...(group.teams || [])].sort(byRank)
  })

  const matchesForGroup = (g) =>
    (groupMatches || []).filter(m => m.group === g)

  const isGroupFinished = (g) => {
    const ms = matchesForGroup(g)
    return ms.length > 0 && ms.every(m => m.played && m.homeScore != null && m.awayScore != null)
  }

  const groupHasPlayed = (g) =>
    (ranks[g] || []).some(t => (t.played || 0) > 0)

  // Dohvati tim na poziciji `pos` (1-based) u grupi `g`.
  // Vraća { id, projected } ili null ako se još ne može projicirati.
  const teamAtPosition = (pos, g) => {
    const ranked = ranks[g]
    if (!ranked || ranked.length < pos) return null
    if (!groupHasPlayed(g)) return null // nema niti jedne odigrane -> bez projekcije
    const team = ranked[pos - 1]
    if (!team || !team.id) return null
    return { id: team.id, projected: !isGroupFinished(g) }
  }

  // --- Projekcija najboljih trećeplasiranih ---
  const allGroupsFinished = Object.keys(ranks).every(isGroupFinished)
  const thirdPlacedRanked = Object.keys(ranks)
    .map(g => {
      const t = ranks[g]?.[2]
      return t && t.id && groupHasPlayed(g) ? { group: g, ...t } : null
    })
    .filter(Boolean)
    .sort(byRank)
  const best8ThirdGroups = thirdPlacedRanked.slice(0, 8).map(t => t.group)

  // Greedy dodjela trećeplasiranih po slotovima (npr. "3A/B/C/D/F")
  const usedThird = new Set()
  const resetThird = () => usedThird.clear()
  const pickThird = (optionGroups) => {
    // kandidati: trećeplasirani iz traženih grupa koji su među 8 najboljih i nisu iskorišteni
    const candidates = thirdPlacedRanked.filter(
      t => optionGroups.includes(t.group) &&
        best8ThirdGroups.includes(t.group) &&
        !usedThird.has(t.id)
    )
    if (candidates.length === 0) return null
    const best = candidates[0] // već sortirano byRank
    usedThird.add(best.id)
    return { id: best.id, projected: !allGroupsFinished }
  }

  // Razriješi jedan token opisa (npr. "1A", "2B", "3C", "3A/B/C/D/F")
  const resolveGroupToken = (token) => {
    const t = token.trim()
    // Trećeplasirani s više opcija: "3A/B/C/D/F"
    if (/^3[A-L](\/[A-L])+$/.test(t)) {
      const groups = t.slice(1).split('/')
      return pickThird(groups)
    }
    // Jedna grupa: "1A".."3L"
    const single = t.match(/^([1-3])([A-L])$/)
    if (single) {
      const pos = parseInt(single[1], 10)
      const g = single[2]
      if (pos === 3) {
        // jednoznačni trećeplasirani - tretiraj kao wildcard s jednom opcijom
        return pickThird([g])
      }
      return teamAtPosition(pos, g)
    }
    return null // play-off ("W Play-Off X") i ostalo prepuštamo postojećem mehanizmu
  }

  // --- Pomoćno: popuni jednu stranu meča ako je prazna ---
  const applySide = (match, side, resolved) => {
    const teamField = side === 'home' ? 'homeTeam' : 'awayTeam'
    const flagField = side === 'home' ? '_homeProjected' : '_awayProjected'
    // Ne diraj već potvrđeni tim
    if (match[teamField]) {
      match[flagField] = false
      return
    }
    if (resolved && resolved.id) {
      match[teamField] = resolved.id
      match[flagField] = !!resolved.projected
    }
  }

  // --- Duboka(ish) kopija da ne mutiramo izvorne podatke ---
  const clone = {
    roundOf32: (knockoutStage.roundOf32 || []).map(m => ({ ...m })),
    roundOf16: (knockoutStage.roundOf16 || []).map(m => ({ ...m })),
    quarterFinals: (knockoutStage.quarterFinals || []).map(m => ({ ...m })),
    semiFinals: (knockoutStage.semiFinals || []).map(m => ({ ...m })),
    thirdPlace: knockoutStage.thirdPlace ? { ...knockoutStage.thirdPlace } : knockoutStage.thirdPlace,
    final: knockoutStage.final ? { ...knockoutStage.final } : knockoutStage.final
  }

  // --- Round of 32: projekcija iz grupa ---
  resetThird()
  clone.roundOf32.forEach(match => {
    if (!match.description) return
    const [home, away] = match.description.split(' vs ')
    if (!home || !away) return
    applySide(match, 'home', resolveGroupToken(home))
    applySide(match, 'away', resolveGroupToken(away))
  })

  // --- Propagacija pobjednika kroz daljnje runde (samo iz stvarnih rezultata) ---
  // Indeks svih knockout mečeva po matchCode za pretragu "W73", "Loser M101"...
  const byCode = {}
  ;[...clone.roundOf32, ...clone.roundOf16, ...clone.quarterFinals, ...clone.semiFinals]
    .forEach(m => { if (m.matchCode) byCode[m.matchCode] = m })

  const winnerOf = (code) => {
    const m = byCode[code]
    if (!m) return null
    const w = resultWinner(m)
    if (!w) return null
    const id = w === 'home' ? m.homeTeam : m.awayTeam
    if (!id) return null
    const projected = w === 'home' ? !!m._homeProjected : !!m._awayProjected
    return { id, projected }
  }
  const loserOf = (code) => {
    const m = byCode[code]
    if (!m) return null
    const w = resultWinner(m)
    if (!w) return null
    const id = w === 'home' ? m.awayTeam : m.homeTeam
    if (!id) return null
    const projected = w === 'home' ? !!m._awayProjected : !!m._homeProjected
    return { id, projected }
  }

  // Opisi tipa "W73 vs W74"
  const resolveWinnerRound = (round) => {
    round.forEach(match => {
      if (!match.description) return
      const codes = match.description.match(/W(\d+)/g)
      if (!codes || codes.length < 2) return
      applySide(match, 'home', winnerOf(`M${codes[0].slice(1)}`))
      applySide(match, 'away', winnerOf(`M${codes[1].slice(1)}`))
      if (match.matchCode) byCode[match.matchCode] = match
    })
  }

  resolveWinnerRound(clone.roundOf16)
  resolveWinnerRound(clone.quarterFinals)
  resolveWinnerRound(clone.semiFinals)

  // Finale: "Winner M101 vs Winner M102"
  if (clone.final?.description) {
    const codes = clone.final.description.match(/M(\d+)/g)
    if (codes && codes.length >= 2) {
      applySide(clone.final, 'home', winnerOf(codes[0]))
      applySide(clone.final, 'away', winnerOf(codes[1]))
    }
  }

  // Utakmica za 3. mjesto: "Loser M101 vs Loser M102"
  if (clone.thirdPlace?.description) {
    const codes = clone.thirdPlace.description.match(/M(\d+)/g)
    if (codes && codes.length >= 2) {
      applySide(clone.thirdPlace, 'home', loserOf(codes[0]))
      applySide(clone.thirdPlace, 'away', loserOf(codes[1]))
    }
  }

  return clone
}

/**
 * Izgradi kolone turnirskog stabla iz razriješenog knockout objekta.
 * Redoslijed unutar svake runde slijedi topologiju (W-kodove u opisima) tako
 * da se linije u stablu ne križaju.
 *
 * @param {Object} ks - razriješeni knockoutStage
 * @returns {{ columns: Array<Array>, thirdPlace: Object|null }|null}
 *          columns[0] = šesnaestina finala ... columns[n-1] = finale
 */
// Indeksiraj sve knockout mečeve po matchCode
const indexByCode = (ks) => {
  const byCode = {}
  const add = (arr) => {
    (Array.isArray(arr) ? arr : [arr]).forEach(m => {
      if (m && m.matchCode) byCode[m.matchCode] = m
    })
  }
  add(ks.roundOf32); add(ks.roundOf16); add(ks.quarterFinals); add(ks.semiFinals); add(ks.final)
  return byCode
}

// Kodovi mečeva koji "hrane" zadani meč (prazno za prvu rundu)
const feedersOf = (m) => {
  const d = m.description || ''
  const w = d.match(/W(\d+)/g)
  if (w) return w.map(s => `M${s.slice(1)}`)
  if (/Winner/i.test(d)) {
    const mm = d.match(/M(\d+)/g)
    if (mm) return mm
  }
  return []
}

// Skupi mečeve po razinama (DFS od korijena), vrati [prva runda ... korijen]
const collectColumns = (rootCode, byCode) => {
  const levels = []
  const visit = (code, depth) => {
    const m = byCode[code]
    if (!m) return
    if (!levels[depth]) levels[depth] = []
    levels[depth].push(m)
    feedersOf(m).forEach(c => visit(c, depth + 1))
  }
  visit(rootCode, 0)
  return levels.slice().reverse()
}

/**
 * Jednostrano stablo (lijevo-desno): columns[0] = prva runda ... zadnja = finale.
 * @returns {{ columns: Array<Array>, thirdPlace: Object|null }|null}
 */
export function buildBracketColumns(ks) {
  if (!ks || !ks.final || !ks.final.matchCode) return null
  const byCode = indexByCode(ks)
  const columns = collectColumns(ks.final.matchCode, byCode)
  if (columns.length === 0) return null
  return { columns, thirdPlace: ks.thirdPlace || null }
}

/**
 * Dvostrano stablo - dvije polovice se spajaju u finalu u sredini.
 * Lijeva/desna polovica izvedene su iz dva polufinala (dva hranitelja finala).
 *
 * @returns {{ left: Array<Array>, right: Array<Array>, final: Object,
 *             thirdPlace: Object|null }|null}
 *          left/right: [prva runda ... polufinale]
 */
export function buildBracketSides(ks) {
  if (!ks || !ks.final || !ks.final.matchCode) return null
  const byCode = indexByCode(ks)
  const finalMatch = byCode[ks.final.matchCode]
  const sfCodes = feedersOf(finalMatch)
  if (sfCodes.length < 2) {
    // Nema dvije grane - vrati jednostrano kao zamjenu
    return null
  }
  const left = collectColumns(sfCodes[0], byCode)
  const right = collectColumns(sfCodes[1], byCode)
  if (left.length === 0 || right.length === 0) return null
  return { left, right, final: finalMatch, thirdPlace: ks.thirdPlace || null }
}
