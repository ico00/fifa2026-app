import { useState, useEffect, useCallback } from 'react'
import { getTeamById as getTeamByIdHelper } from '../utils/helpers'
import {
  LoginForm,
  Leaderboard,
  PlayoffPredictions,
  GroupPredictions,
  KnockoutSimulation
} from './simulation-components'

// API URL
const API_URL = import.meta.env.VITE_API_URL || '/api'

function Simulation({ groups, matches, teams, playoffs }) {
  // Helper wrapper za getTeamById
  const getTeamById = useCallback((id) => getTeamByIdHelper(teams, id), [teams])

  // State
  const [activeView, setActiveView] = useState('input')
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPredictions, setUserPredictions] = useState({})
  const [playoffPredictions, setPlayoffPredictions] = useState({})
  const [allPredictions, setAllPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [simulatedStandings, setSimulatedStandings] = useState({})

  // Calculate points for a single prediction vs actual result
  const calculatePoints = useCallback((prediction, actual) => {
    if (!prediction || !actual || actual.homeScore === null || actual.awayScore === null) return 0

    // Exact score: 3 points
    if (prediction.homeScore === actual.homeScore && prediction.awayScore === actual.awayScore) {
      return 3
    }

    // Correct outcome (1X2): 1 point
    const predDiff = prediction.homeScore - prediction.awayScore
    const actualDiff = actual.homeScore - actual.awayScore

    if (
      (predDiff > 0 && actualDiff > 0) ||
      (predDiff < 0 && actualDiff < 0) ||
      (predDiff === 0 && actualDiff === 0)
    ) {
      return 1
    }

    return 0
  }, [])

  // Helper to resolve team (handling playoff placeholders)
  const resolveTeam = useCallback((teamId, playoffKey) => {
    if (teamId) return getTeamById(teamId)

    if (playoffKey) {
      const predictedWinnerId = playoffPredictions[playoffKey]
      if (predictedWinnerId) {
        return getTeamById(predictedWinnerId)
      }
      return {
        name: `Play-off ${playoffKey}`,
        code: 'FIFA',
        type: 'placeholder',
        pathKey: playoffKey
      }
    }
    return null
  }, [getTeamById, playoffPredictions])

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/predictions`)
      if (res.ok) {
        const data = await res.json()
        setAllPredictions(data)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle login
  const handleLogin = useCallback(async () => {
    if (!username.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/predictions/${username}`)
      if (res.ok) {
        const data = await res.json()
        setUserPredictions(data.predictions || {})
        setPlayoffPredictions(data.playoffPredictions || {})
      } else {
        setUserPredictions({})
        setPlayoffPredictions({})
      }
      setIsLoggedIn(true)
    } catch (error) {
      console.error('Error logging in:', error)
    } finally {
      setLoading(false)
    }
  }, [username])

  // Handle prediction change
  const handlePredictionChange = useCallback((matchId, field, value) => {
    if (value !== '' && !/^\d+$/.test(value)) return

    setUserPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value === '' ? '' : parseInt(value)
      }
    }))
  }, [])

  // Handle playoff prediction
  const handlePlayoffPrediction = useCallback((pathId, teamId) => {
    setPlayoffPredictions(prev => ({
      ...prev,
      [pathId]: teamId
    }))
  }, [])

  // Save predictions
  const savePredictions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          predictions: userPredictions,
          playoffPredictions
        })
      })

      if (res.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      setSaveStatus('error')
    } finally {
      setLoading(false)
    }
  }, [username, userPredictions, playoffPredictions])

  // Calculate simulated standings
  const calculateSimulatedStandings = useCallback(() => {
    const standings = {}

    Object.keys(groups).forEach(group => {
      standings[group] = []

      // Init teams
      matches.groupStage
        .filter(m => m.group === group)
        .forEach(m => {
          const homeT = resolveTeam(m.homeTeam, m.homeTeamPlayoff)
          const awayT = resolveTeam(m.awayTeam, m.awayTeamPlayoff)

          if (homeT && !standings[group].find(x => x.id === homeT.id)) {
            standings[group].push({ ...homeT, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 })
          }
          if (awayT && !standings[group].find(x => x.id === awayT.id)) {
            standings[group].push({ ...awayT, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 })
          }
        })

      // Calculate
      matches.groupStage
        .filter(m => m.group === group)
        .forEach(m => {
          const pred = userPredictions[m.id]
          if (pred && pred.homeScore !== undefined && pred.awayScore !== undefined && pred.homeScore !== '' && pred.awayScore !== '') {
            const homeId = resolveTeam(m.homeTeam, m.homeTeamPlayoff)?.id
            const awayId = resolveTeam(m.awayTeam, m.awayTeamPlayoff)?.id

            if (!homeId || !awayId) return

            const h = standings[group].find(t => t.id === homeId)
            const a = standings[group].find(t => t.id === awayId)

            if (h && a) {
              h.played++; a.played++;
              h.gf += pred.homeScore; a.gf += pred.awayScore;
              h.ga += pred.awayScore; a.ga += pred.homeScore;

              if (pred.homeScore > pred.awayScore) {
                h.won++; h.pts += 3; a.lost++;
              } else if (pred.homeScore < pred.awayScore) {
                a.won++; a.pts += 3; h.lost++;
              } else {
                h.drawn++; a.drawn++; h.pts += 1; a.pts += 1;
              }
            }
          }
        })

      // Sort
      standings[group].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts
        const gdA = a.gf - a.ga
        const gdB = b.gf - b.ga
        if (gdB !== gdA) return gdB - gdA
        return b.gf - a.gf
      })
    })

    setSimulatedStandings(standings)
    return standings
  }, [groups, matches, userPredictions, resolveTeam])

  // Get knockout tree
  const getKnockoutTree = useCallback(() => {
    if (Object.keys(simulatedStandings).length === 0) return null

    const st = simulatedStandings

    // Best 3rd place logic
    const thirdPlaced = []
    Object.keys(st).forEach(g => {
      if (st[g][2]) thirdPlaced.push({ ...st[g][2], group: g })
    })
    thirdPlaced.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      const gdA = a.gf - a.ga
      const gdB = b.gf - b.ga
      if (gdB !== gdA) return gdB - gdA
      return b.gf - a.gf
    })
    const best8Groups = thirdPlaced.slice(0, 8).map(t => t.group)
    const usedWildcardGroups = new Set()

    const resolvePlace = (placeStr) => {
      if (!placeStr) return null
      if (placeStr.startsWith('W') || placeStr.startsWith('Winner')) return null

      const pos = parseInt(placeStr.charAt(0))
      const grp = placeStr.substring(1)

      if (grp.includes('/')) {
        const options = grp.split('/')
        let bestMatch = best8Groups.find(bg => options.includes(bg) && !usedWildcardGroups.has(bg))
        if (!bestMatch) {
          bestMatch = best8Groups.find(bg => !usedWildcardGroups.has(bg))
        }
        if (bestMatch) {
          usedWildcardGroups.add(bestMatch)
          return st[bestMatch][2]
        }
        return { name: `3. mjesto (${grp})`, code: 'FIFA' }
      }

      return st[grp] ? st[grp][pos - 1] : { name: placeStr, code: 'FIFA' }
    }

    const getWinner = (match) => {
      if (!match || !match.homeTeamObj || !match.awayTeamObj) return null
      const pred = userPredictions[match.id]
      if (!pred || pred.homeScore === undefined) return null

      if (pred.homeScore > pred.awayScore) return match.homeTeamObj
      if (pred.awayScore > pred.homeScore) return match.awayTeamObj
      if (pred.homePenalty > pred.awayPenalty) return match.homeTeamObj
      if (pred.awayPenalty > pred.homePenalty) return match.awayTeamObj
      return null
    }

    // Build rounds
    const r32 = matches.knockoutStage.roundOf32.map(m => {
      const parts = m.description.split(' vs ')
      return { ...m, homeTeamObj: resolvePlace(parts[0]), awayTeamObj: resolvePlace(parts[1]) }
    })

    const r16 = matches.knockoutStage.roundOf16.map(m => {
      const ids = m.description.match(/W(\d+)/g)?.map(s => parseInt(s.substring(1)))
      if (!ids) return m
      const m1 = r32.find(x => x.id === ids[0])
      const m2 = r32.find(x => x.id === ids[1])
      return { ...m, homeTeamObj: getWinner(m1), awayTeamObj: getWinner(m2) }
    })

    const qf = matches.knockoutStage.quarterFinals.map(m => {
      const ids = m.description.match(/W(\d+)/g)?.map(s => parseInt(s.substring(1)))
      if (!ids) return m
      const m1 = r16.find(x => x.id === ids[0])
      const m2 = r16.find(x => x.id === ids[1])
      return { ...m, homeTeamObj: getWinner(m1), awayTeamObj: getWinner(m2) }
    })

    const sf = matches.knockoutStage.semiFinals.map(m => {
      const ids = m.description.match(/W(\d+)/g)?.map(s => parseInt(s.substring(1)))
      if (!ids) return m
      const m1 = qf.find(x => x.id === ids[0])
      const m2 = qf.find(x => x.id === ids[1])
      return { ...m, homeTeamObj: getWinner(m1), awayTeamObj: getWinner(m2) }
    })

    const final = {
      ...matches.knockoutStage.final,
      homeTeamObj: getWinner(sf[0]),
      awayTeamObj: getWinner(sf[1])
    }

    return { r32, r16, qf, sf, final }
  }, [simulatedStandings, matches, userPredictions])

  // Effects
  useEffect(() => {
    if (Object.keys(userPredictions).length > 0) {
      calculateSimulatedStandings()
    }
  }, [userPredictions, playoffPredictions, calculateSimulatedStandings])

  // Render login form if not logged in
  if (!isLoggedIn) {
    return (
      <LoginForm
        username={username}
        setUsername={setUsername}
        onSubmit={handleLogin}
        loading={loading}
      />
    )
  }

  const tree = activeView === 'input' ? getKnockoutTree() : null

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in-up">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-fifa-gold text-white flex items-center justify-center text-2xl font-bold shadow-md">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Prijavljeni ste kao</div>
            <div className="text-xl font-black text-slate-800 dark:text-white">{username}</div>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('input')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeView === 'input'
                ? 'bg-white dark:bg-slate-600 text-fifa-blue dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            ✏️ Prognoza
          </button>
          <button
            onClick={() => { setActiveView('leaderboard'); fetchLeaderboard() }}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeView === 'leaderboard'
                ? 'bg-white dark:bg-slate-600 text-fifa-blue dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            🏆 Ljestvica
          </button>
        </div>
      </div>

      {activeView === 'input' ? (
        <div className="flex flex-col gap-8">
          {/* Action Bar */}
          <div className="sticky top-[80px] z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">Vaše Prognoze</h3>
            <button
              onClick={savePredictions}
              disabled={loading}
              className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                saveStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-fifa-blue hover:bg-blue-700'
              }`}
            >
              {loading ? 'Spremanje...' : saveStatus === 'success' ? '✅ Spremljeno!' : '💾 Spremi Sve'}
            </button>
          </div>

          {/* Playoff Predictions */}
          <PlayoffPredictions
            playoffs={playoffs}
            playoffPredictions={playoffPredictions}
            onSelect={handlePlayoffPrediction}
            getTeamById={getTeamById}
          />

          {/* Group Predictions */}
          <GroupPredictions
            groups={groups}
            matches={matches}
            userPredictions={userPredictions}
            onPredictionChange={handlePredictionChange}
            resolveTeam={resolveTeam}
          />

          {/* Knockout Simulation */}
          <KnockoutSimulation
            tree={tree}
            predictions={userPredictions}
            onChange={handlePredictionChange}
          />
        </div>
      ) : (
        <Leaderboard
          allPredictions={allPredictions}
          matches={matches}
          currentUser={username}
          calculatePoints={calculatePoints}
        />
      )}
    </div>
  )
}

export default Simulation
