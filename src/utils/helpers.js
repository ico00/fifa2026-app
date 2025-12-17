/**
 * Centralizirane helper funkcije za FIFA 2026 aplikaciju
 */

// ============ TEAM HELPERS ============

/**
 * Pronađi tim po ID-u
 * @param {Array} teams - Lista svih timova
 * @param {string} id - ID tima
 * @returns {Object|undefined} Tim ili undefined
 */
export const getTeamById = (teams, id) => {
  if (!teams || !id) return undefined
  return teams.find(t => t.id === id)
}

/**
 * Pronađi više timova po ID-ovima
 * @param {Array} teams - Lista svih timova
 * @param {Array} ids - Lista ID-ova timova
 * @returns {Array} Lista timova
 */
export const getTeamsByIds = (teams, ids) => {
  if (!teams || !ids) return []
  return ids.map(id => getTeamById(teams, id)).filter(Boolean)
}

// ============ VENUE HELPERS ============

/**
 * Pronađi stadion po ID-u
 * @param {Array} venues - Lista svih stadiona
 * @param {string} id - ID stadiona
 * @returns {Object|undefined} Stadion ili undefined
 */
export const getVenueById = (venues, id) => {
  if (!venues || !id) return undefined
  return venues.find(v => v.id === id)
}

// ============ PLAYOFF HELPERS ============

/**
 * Dohvati pobjednika play-off grupe
 * @param {Object} playoffs - Objekt s play-off podacima
 * @param {string} playoffId - ID play-off grupe (A, B, C, D, 1, 2)
 * @returns {string|null} ID pobjednika ili null
 */
export const getPlayoffWinner = (playoffs, playoffId) => {
  if (!playoffs || !playoffId || !playoffs[playoffId]) return null
  return playoffs[playoffId].winner || null
}

/**
 * Dohvati naziv play-off grupe
 * @param {string} playoffId - ID play-off grupe
 * @returns {string} Naziv play-off grupe
 */
export const getPlayoffName = (playoffId) => {
  const names = {
    'A': 'Play-Off A',
    'B': 'Play-Off B',
    'C': 'Play-Off C',
    'D': 'Play-Off D',
    '1': 'Play-Off 1',
    '2': 'Play-Off 2'
  }
  return names[playoffId] || `Play-Off ${playoffId}`
}

/**
 * Dohvati skraćeni naziv play-off pobjednika za prikaz
 * @param {string} playoffId - ID play-off grupe
 * @returns {string} Skraćeni naziv (npr. "W Play-Off A")
 */
export const getPlayoffWinnerLabel = (playoffId) => {
  const labels = {
    'A': 'W Play-Off A',
    'B': 'W Play-Off B',
    'C': 'W Play-Off C',
    'D': 'W Play-Off D',
    '1': 'W Play-Off 1',
    '2': 'W Play-Off 2'
  }
  return labels[playoffId] || '?'
}

/**
 * Dohvati podatke o play-off grupi
 * @param {Object} playoffs - Objekt s play-off podacima
 * @param {string} playoffId - ID play-off grupe
 * @returns {Object|null} Play-off podaci ili null
 */
export const getPlayoffData = (playoffs, playoffId) => {
  if (!playoffs || !playoffId) return null
  return playoffs[playoffId] || null
}

// ============ DATE HELPERS ============

/**
 * Formatiraj datum na hrvatski način (puni format)
 * @param {string} dateStr - Datum u ISO formatu
 * @returns {string} Formatirani datum
 */
export const formatDateFull = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Formatiraj datum na hrvatski način (kratki format)
 * @param {string} dateStr - Datum u ISO formatu
 * @returns {string} Formatirani datum
 */
export const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Formatiraj datum s vremenom
 * @param {string} dateStr - Datum u ISO formatu
 * @param {string} timeStr - Vrijeme u formatu HH:MM
 * @returns {string} Formatirani datum s vremenom
 */
export const formatDateWithTime = (dateStr, timeStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const formattedDate = date.toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
  return timeStr ? `${formattedDate} u ${timeStr}` : formattedDate
}

// ============ MATCH HELPERS ============

/**
 * Provjeri da li utakmica ima rezultat
 * @param {Object} match - Objekt utakmice
 * @returns {boolean} True ako ima rezultat
 */
export const hasScore = (match) => {
  return match?.homeScore !== null && match?.awayScore !== null
}

/**
 * Provjeri da li je utakmica odigrana
 * @param {Object} match - Objekt utakmice
 * @returns {boolean} True ako je odigrana
 */
export const isMatchPlayed = (match) => {
  return match?.played || hasScore(match)
}

/**
 * Provjeri da li je Hrvatska u utakmici
 * @param {Object} match - Objekt utakmice
 * @param {Object} playoffs - Play-off podaci (opcionalno)
 * @returns {boolean} True ako Hrvatska igra
 */
export const isCroatiaMatch = (match, playoffs = null) => {
  if (!match) return false
  
  // Direktna provjera
  if (match.homeTeam === 'cro' || match.awayTeam === 'cro') return true
  
  // Provjera kroz play-off pobjednike
  if (playoffs) {
    const homePlayoffWinner = match.homeTeamPlayoff 
      ? getPlayoffWinner(playoffs, match.homeTeamPlayoff) 
      : null
    const awayPlayoffWinner = match.awayTeamPlayoff 
      ? getPlayoffWinner(playoffs, match.awayTeamPlayoff) 
      : null
    
    if (homePlayoffWinner === 'cro' || awayPlayoffWinner === 'cro') return true
  }
  
  return false
}

/**
 * Dohvati ID-ove timova iz utakmice (uključujući play-off pobjednike)
 * @param {Object} match - Objekt utakmice
 * @param {Object} playoffs - Play-off podaci
 * @returns {Object} { homeTeamId, awayTeamId }
 */
export const getMatchTeamIds = (match, playoffs) => {
  if (!match) return { homeTeamId: null, awayTeamId: null }
  
  const homePlayoffWinner = match.homeTeamPlayoff 
    ? getPlayoffWinner(playoffs, match.homeTeamPlayoff) 
    : null
  const awayPlayoffWinner = match.awayTeamPlayoff 
    ? getPlayoffWinner(playoffs, match.awayTeamPlayoff) 
    : null
  
  return {
    homeTeamId: match.homeTeam || homePlayoffWinner,
    awayTeamId: match.awayTeam || awayPlayoffWinner
  }
}

/**
 * Odredi pobjednika utakmice
 * @param {Object} match - Objekt utakmice
 * @returns {string|null} 'home', 'away', 'draw' ili null
 */
export const getMatchWinner = (match) => {
  if (!hasScore(match)) return null
  
  if (match.homeScore > match.awayScore) return 'home'
  if (match.awayScore > match.homeScore) return 'away'
  
  // Provjeri penale za knockout utakmice
  if (match.homePenalty !== null && match.awayPenalty !== null) {
    if (match.homePenalty > match.awayPenalty) return 'home'
    if (match.awayPenalty > match.homePenalty) return 'away'
  }
  
  return 'draw'
}

/**
 * Dohvati ID pobjedničkog tima
 * @param {Object} match - Objekt utakmice
 * @param {Object} playoffs - Play-off podaci
 * @returns {string|null} ID pobjednika ili null
 */
export const getMatchWinnerTeamId = (match, playoffs) => {
  const winner = getMatchWinner(match)
  if (!winner || winner === 'draw') return null
  
  const { homeTeamId, awayTeamId } = getMatchTeamIds(match, playoffs)
  return winner === 'home' ? homeTeamId : awayTeamId
}

// ============ KNOCKOUT HELPERS ============

/**
 * Formatiraj opis knockout utakmice
 * @param {string} description - Originalni opis (npr. "Winner M74 vs Loser M75")
 * @returns {string} Skraćeni opis
 */
export const formatKnockoutDescription = (description) => {
  if (!description) return ''
  return description
    .replace(/Loser/gi, 'L')
    .replace(/Winner/gi, 'W')
}

// ============ GROUP HELPERS ============

/**
 * Provjeri da li grupa sadrži Hrvatsku
 * @param {Object} group - Objekt grupe
 * @param {Array} teams - Lista timova
 * @returns {boolean} True ako grupa sadrži Hrvatsku
 */
export const groupHasCroatia = (group, teams) => {
  if (!group?.teams) return false
  return group.teams.some(teamId => {
    const team = getTeamById(teams, teamId)
    return team?.highlight === true
  })
}

// ============ SORTING HELPERS ============

/**
 * Sortiraj utakmice po datumu i vremenu
 * @param {Array} matches - Lista utakmica
 * @param {string} order - 'asc' ili 'desc'
 * @returns {Array} Sortirane utakmice
 */
export const sortMatchesByDate = (matches, order = 'asc') => {
  if (!matches) return []
  return [...matches].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
    return order === 'asc' ? dateA - dateB : dateB - dateA
  })
}

/**
 * Grupiraj utakmice po datumu
 * @param {Array} matches - Lista utakmica
 * @returns {Object} Objekt s datumima kao ključevima
 */
export const groupMatchesByDate = (matches) => {
  if (!matches) return {}
  return matches.reduce((acc, match) => {
    if (!acc[match.date]) acc[match.date] = []
    acc[match.date].push(match)
    return acc
  }, {})
}
