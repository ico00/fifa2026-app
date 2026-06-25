/**
 * Sinkronizacija rezultata iz openfootball/worldcup.json (javna domena, bez ključa).
 *
 * Izvor: https://github.com/openfootball/worldcup.json
 * Shema meča: { round, num?, date, time, team1, team2, score:{ft:[h,a],ht,p?}, group, ground }
 *  - grupni mečevi: puna engleska imena timova + group "Group A"
 *  - knockout mečevi: num (73-104) === interni matchCode M73-M104
 *
 * Modul je čist: čita izvor i primjenjuje rezultate na objekt matches.json.
 * Orkestraciju (pisanje + recalculateStandings) radi server/index.cjs.
 */

const SOURCE_URL =
  process.env.OPENFOOTBALL_URL ||
  'https://cdn.jsdelivr.net/gh/openfootball/worldcup.json@master/2026/worldcup.json'

// Normaliziraj naziv: mala slova, bez dijakritike i ne-alfanumerika
// NFD razdvaja dijakritiku (é -> e + kombinirajući znak), a strip ne-alfanumerika
// uklanja i te znakove pa "Türkiye" -> "turkiye", "Côte d'Ivoire" -> "cotedivoire"
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '')

// Engleski naziv (openfootball) -> interni ID tima. Uključuje aliase.
const ENGLISH_TO_ID = {
  albania: 'alb',
  algeria: 'alg',
  argentina: 'arg',
  australia: 'aus',
  austria: 'aut',
  belgium: 'bel',
  bolivia: 'bol',
  bosniaandherzegovina: 'bih', bosniaherzegovina: 'bih', bosnia: 'bih',
  brazil: 'bra',
  czechia: 'cze', czechrepublic: 'cze',
  curacao: 'cur',
  denmark: 'den',
  egypt: 'egy',
  ecuador: 'ecu',
  england: 'eng',
  france: 'fra',
  ghana: 'gha',
  haiti: 'hai',
  croatia: 'cro',
  iraq: 'irq',
  iran: 'irn', iranislamicrepublic: 'irn',
  ireland: 'irl', republicofireland: 'irl',
  italy: 'ita',
  jamaica: 'jam',
  japan: 'jpn',
  jordan: 'jor',
  southafrica: 'rsa',
  southkorea: 'kor', korearepublic: 'kor', korea: 'kor',
  canada: 'can',
  qatar: 'qat',
  colombia: 'col',
  drcongo: 'cgo', congodr: 'cgo', democraticrepublicofthecongo: 'cgo', congo: 'cgo',
  kosovo: 'kos',
  northmacedonia: 'mkd', macedonia: 'mkd',
  morocco: 'mar',
  mexico: 'mex',
  netherlands: 'ned',
  germany: 'ger',
  norway: 'nor',
  newcaledonia: 'ncl',
  newzealand: 'nzl',
  ivorycoast: 'civ', cotedivoire: 'civ',
  panama: 'pan',
  paraguay: 'par',
  poland: 'pol',
  portugal: 'por',
  romania: 'rou',
  unitedstates: 'usa', usa: 'usa', unitedstatesofamerica: 'usa', us: 'usa',
  saudiarabia: 'ksa',
  senegal: 'sen',
  northernireland: 'nir',
  scotland: 'sco',
  slovakia: 'svk',
  spain: 'esp',
  suriname: 'sur',
  sweden: 'swe',
  switzerland: 'sui',
  tunisia: 'tun',
  turkey: 'tur', turkiye: 'tur',
  ukraine: 'ukr',
  uruguay: 'uru',
  uzbekistan: 'uzb',
  wales: 'wal',
  capeverde: 'cpv', caboverde: 'cpv'
}

const idForName = (name) => ENGLISH_TO_ID[norm(name)] || null

// Dohvati izvor (Node 18+ ima globalni fetch)
async function fetchSource() {
  const res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// Validni rezultat punog vremena?
const validFt = (ft) => Array.isArray(ft) && typeof ft[0] === 'number' && typeof ft[1] === 'number'

// Penali iz izvora (openfootball koristi score.p; podržavamo i pen)
const penaltiesOf = (score) => {
  const p = score && (score.p || score.pen)
  return Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' ? p : null
}

/**
 * Primijeni rezultate iz izvora na matches.json objekt (mutira ga).
 * Ne dira mečeve s match.manual === true (ručni override admina).
 *
 * Play-off slotovi u grupama su u app-u trajno `null` u fixtureima (razrješava
 * ih recalculateStandings preko groups.json). Zato null stranu meča razrješavamo
 * iz groups.json kako bismo je mogli spojiti s konkretnim timom iz izvora.
 *
 * @param {Object} data - matches.json objekt
 * @param {Object} source - openfootball JSON
 * @param {Object} [groups] - groups.json "groups" objekt (za razrješavanje null slotova)
 * @returns {{ changed, updated, skipped, pending, unmatched }}
 */
function applyResults(data, source, groups) {
  const stats = { changed: false, updated: 0, skipped: 0, pending: [], unmatched: [] }
  if (!data || !source || !Array.isArray(source.matches)) return stats

  const groupMatches = data.groupStage || []

  // Za svaku grupu odredi tim koji zauzima play-off slot (onaj iz groups.json
  // koji se ne pojavljuje kao konkretni tim u fixtureima te grupe).
  const slotTeam = {}
  if (groups) {
    for (const [g, info] of Object.entries(groups)) {
      const concrete = new Set()
      groupMatches.filter((m) => m.group === g).forEach((m) => {
        if (m.homeTeam) concrete.add(m.homeTeam)
        if (m.awayTeam) concrete.add(m.awayTeam)
      })
      const missing = (info.teams || []).filter((t) => t && !concrete.has(t))
      slotTeam[g] = missing.length === 1 ? missing[0] : null
    }
  }
  const ks = data.knockoutStage || {}
  const knockoutById = {}
  ;[
    ...(ks.roundOf32 || []),
    ...(ks.roundOf16 || []),
    ...(ks.quarterFinals || []),
    ...(ks.semiFinals || []),
    ...(ks.thirdPlace ? [ks.thirdPlace] : []),
    ...(ks.final ? [ks.final] : [])
  ].forEach((m) => { if (m && m.id != null) knockoutById[m.id] = m })

  // Upiši rezultat u ciljni meč uz pravilnu orijentaciju (swap = obrnuti dom/gost)
  const applyScore = (target, ft, pen, swap, isKnockout) => {
    if (!target) return
    if (target.manual) { stats.skipped++; return }

    const homeScore = swap ? ft[1] : ft[0]
    const awayScore = swap ? ft[0] : ft[1]
    const homePen = pen ? (swap ? pen[1] : pen[0]) : null
    const awayPen = pen ? (swap ? pen[0] : pen[1]) : null

    // Grupni meč s rezultatom je uvijek odigran (remi je validan ishod).
    // U knockoutu remi nije odlučen bez penala.
    let played
    if (isKnockout && homeScore === awayScore) {
      played = homePen !== null && awayPen !== null
    } else {
      played = true
    }

    const unchanged =
      target.homeScore === homeScore &&
      target.awayScore === awayScore &&
      target.played === played &&
      (target.homePenalty ?? null) === homePen &&
      (target.awayPenalty ?? null) === awayPen
    if (unchanged) return

    target.homeScore = homeScore
    target.awayScore = awayScore
    target.homePenalty = homePen
    target.awayPenalty = awayPen
    target.played = played
    stats.updated++
    stats.changed = true
  }

  for (const sm of source.matches) {
    const ft = sm.score && sm.score.ft
    if (!validFt(ft)) continue // još nije odigrana
    const pen = penaltiesOf(sm.score)
    const id1 = idForName(sm.team1)
    const id2 = idForName(sm.team2)

    if (sm.num != null) {
      // --- Knockout: spoji po broju meča ---
      const target = knockoutById[sm.num]
      if (!target) { stats.unmatched.push(`M${sm.num}`); continue }
      // Orijentacija prema timovima koje je app već popunio
      if (!target.homeTeam || !target.awayTeam || !id1 || !id2) {
        // Timovi još nisu poznati u app-u; preskoči (popunit će se nakon recalc-a)
        continue
      }
      if (target.homeTeam === id1 && target.awayTeam === id2) applyScore(target, ft, pen, false, true)
      else if (target.homeTeam === id2 && target.awayTeam === id1) applyScore(target, ft, pen, true, true)
      else stats.unmatched.push(`M${sm.num} (${sm.team1} v ${sm.team2})`)
    } else if (sm.group) {
      // --- Grupna faza: spoji po grupi + paru timova (null slot -> iz groups.json) ---
      if (!id1 || !id2) { stats.unmatched.push(`${sm.team1} v ${sm.team2}`); continue }
      const g = sm.group.replace(/^group\s+/i, '').trim()
      const slot = slotTeam[g] || null
      const eff = (m) => ({ h: m.homeTeam || slot, a: m.awayTeam || slot })
      const inGroup = groupMatches.filter((m) => m.group === g)

      let target = inGroup.find((m) => { const e = eff(m); return e.h === id1 && e.a === id2 })
      if (target) { applyScore(target, ft, pen, false, false); continue }
      target = inGroup.find((m) => { const e = eff(m); return e.h === id2 && e.a === id1 })
      if (target) { applyScore(target, ft, pen, true, false); continue }

      // Nije spojeno: ako grupa ima nerazriješen play-off slot, ovo je "pending"
      if (!slot && inGroup.some((m) => !m.homeTeam || !m.awayTeam)) {
        stats.pending.push(`${g}: ${sm.team1} v ${sm.team2}`)
      } else {
        stats.unmatched.push(`${g}: ${sm.team1} v ${sm.team2}`)
      }
    }
  }

  return stats
}

module.exports = { SOURCE_URL, fetchSource, applyResults, idForName }
