import { useState, useEffect, useMemo } from 'react'
import Flag from './Flag'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function Simulation({ groups, matches, teams, playoffs }) {
    const [activeView, setActiveView] = useState('input') // 'input' or 'leaderboard'
    const [username, setUsername] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userPredictions, setUserPredictions] = useState({}) // matchId -> { homeScore, awayScore, homePenalty, awayPenalty }
    const [playoffPredictions, setPlayoffPredictions] = useState({}) // pathId -> teamId
    const [allPredictions, setAllPredictions] = useState([])
    const [loading, setLoading] = useState(false)
    const [saveStatus, setSaveStatus] = useState(null) // 'success', 'error', null
    const [simulatedStandings, setSimulatedStandings] = useState({})
    const [simulatedKnockout, setSimulatedKnockout] = useState(null)

    // Calculate points for a single prediction vs actual result
    const calculatePoints = (prediction, actual) => {
        if (!prediction || !actual || actual.homeScore === null || actual.awayScore === null) return 0

        // Exact score: 3 points
        if (prediction.homeScore === actual.homeScore && prediction.awayScore === actual.awayScore) {
            return 3
        }

        // Correct outcome (1X2): 1 point
        const predDiff = prediction.homeScore - prediction.awayScore
        const actualDiff = actual.homeScore - actual.awayScore

        if (
            (predDiff > 0 && actualDiff > 0) || // Home win
            (predDiff < 0 && actualDiff < 0) || // Away win
            (predDiff === 0 && actualDiff === 0)    // Draw
        ) {
            return 1
        }

        return 0
    }

    const fetchLeaderboard = async () => {
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
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!username.trim()) return

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/predictions/${username}`)
            if (res.ok) {
                const data = await res.json()
                setUserPredictions(data.predictions || {})
                setPlayoffPredictions(data.playoffPredictions || {})
            } else {
                // User doesn't exist yet, start with empty predictions
                setUserPredictions({})
                setPlayoffPredictions({})
            }
            setIsLoggedIn(true)
        } catch (error) {
            console.error('Error logging in:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePredictionChange = (matchId, field, value) => {
        // Digits only
        if (value !== '' && !/^\d+$/.test(value)) return

        setUserPredictions(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [field]: value === '' ? '' : parseInt(value)
            }
        }))
    }

    const handlePlayoffPrediction = (pathId, teamId) => {
        setPlayoffPredictions(prev => ({
            ...prev,
            [pathId]: teamId
        }))
    }

    const savePredictions = async () => {
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
    }

    const getTeamById = (id) => teams.find(t => t.id === id)

    // Helper to resolve team (handling playoff placeholders)
    const resolveTeam = (teamId, playoffKey) => {
        if (teamId) return getTeamById(teamId)

        if (playoffKey) {
            const predictedWinnerId = playoffPredictions[playoffKey]

            if (predictedWinnerId) {
                return getTeamById(predictedWinnerId)
            } else {
                return {
                    name: `Play-off ${playoffKey}`,
                    code: 'FIFA',
                    type: 'placeholder',
                    pathKey: playoffKey
                }
            }
        }
        return null
    }

    // --- SIMULATION LOGIC ---

    // 1. Calculate Group Standings based on PREDICTIONS
    const calculateSimulatedStandings = () => {
        // Basic logic similar to Groups.jsx but using `userPredictions`
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
                            h.ga += pred.awayScore; a.ga += pred.homeScore; // Bug fix: inverted GA assignment

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

            // Sort logic (Points > GD > GF)
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
    }

    // 2. Determine Knockout Grid
    const simulateKnockoutStructure = () => {
        const st = calculateSimulatedStandings()

        // Best 3rd place logic (for 12 groups of 4, top 8 go through)
        // Flatten 3rd place teams
        const thirdPlaced = []
        Object.keys(st).forEach(g => {
            if (st[g][2]) thirdPlaced.push({ ...st[g][2], group: g })
        })

        // Sort 3rd placed to find Top 8
        thirdPlaced.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts
            const gdA = a.gf - a.ga
            const gdB = b.gf - b.ga
            if (gdB !== gdA) return gdB - gdA
            return b.gf - a.gf
        })

        const best8Groups = thirdPlaced.slice(0, 8).map(t => t.group)

        // --- MAPPING LOGIC FOR R32 --- 
        // This is complex for 48 teams. We will use a simplified mapping for now 
        // or rely on static mapping if defined. The official FIFA 2026 grid depends on 
        // WHICH groups provide the best 3rd placed teams.

        // For this simulation, we will construct the R32 matches by reading 'matches.knockoutStage.roundOf32' descriptions
        // identifying placeholders like "2A", "1E", "3A/B/C..." and resolving them.

        // Helper to resolve string like "1A" to Team object
        const resolvePlace = (placeStr) => {
            if (!placeStr) return null

            // Handle "Winner M74" (Recursion for later rounds)
            if (placeStr.startsWith('W') || placeStr.startsWith('Winner')) {
                // Handled in next step
                return null
            }

            // Handle "2A" -> 2nd in Group A
            const pos = parseInt(placeStr.charAt(0))
            const grp = placeStr.substring(1) // "A" or "A/B/C..."

            if (grp.includes('/')) {
                // It's a Wildcard slot (e.g. 3C/D/F/G/H). 
                // In a real app we'd need the exact FIFA grid. 
                // For MVP Simulation: We pick the first Available Best 3rd form the list that matches
                const options = grp.split('/')
                const found = best8Groups.find(g => options.includes(g))
                if (found) {
                    return st[found][2] // Return the 3rd placed team
                }
                // Fallback if simulation incomplete or logic mismatch
                return { name: `3. iz ${grp}`, code: 'FIFA' }
            }

            if (st[grp] && st[grp][pos - 1]) {
                return st[grp][pos - 1]
            }

            return { name: placeStr, code: 'FIFA' }
        }

        // Construct Round 32
        const r32 = matches.knockoutStage.roundOf32.map(m => {
            const parts = m.description.split(' vs ')
            return {
                ...m,
                homeTeamObj: resolvePlace(parts[0]),
                awayTeamObj: resolvePlace(parts[1])
            }
        })

        setSimulatedKnockout({ roundOf32: r32 })
    }

    // Effect: When active view changes to 'input', recalc standings to keep UI fresh
    useEffect(() => {
        if (Object.keys(userPredictions).length > 0) {
            calculateSimulatedStandings()
        }
    }, [userPredictions, playoffPredictions])

    // Compute full bracket whenever needed (e.g. valid group predictions)
    const getKnockoutTree = () => {
        if (Object.keys(simulatedStandings).length === 0) calculateSimulatedStandings()

        // 1. Round of 32
        // We need to resolve placeholders again dynamically because render happens often
        // But better to use the function logic above.
        // Let's create a derived state or just compute on fly.

        // RE-COMPUTE EVERYTHING based on current `userPredictions`
        const st = simulatedStandings
        if (!st || Object.keys(st).length === 0) return null

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

            if (placeStr.startsWith('W') || placeStr.startsWith('Winner')) {
                return null
            }

            const pos = parseInt(placeStr.charAt(0))
            const grp = placeStr.substring(1)

            if (grp.includes('/')) {
                const options = grp.split('/')

                // 1. Strict match: Best 8 team + Matches Wildcard Options + Unused
                let bestMatch = best8Groups.find(bg => options.includes(bg) && !usedWildcardGroups.has(bg))

                // 2. Fallback: Any Best 8 team + Unused (Ignore Wildcard Options to ensure bracket fill)
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

        // Resolve Winner of a Match ID
        const getWinner = (match) => {
            if (!match || !match.homeTeamObj || !match.awayTeamObj) return null
            const pred = userPredictions[match.id]
            if (!pred || pred.homeScore === undefined) return null

            let winner = null
            if (pred.homeScore > pred.awayScore) winner = match.homeTeamObj
            else if (pred.awayScore > pred.homeScore) winner = match.awayTeamObj
            else {
                // Penalties
                if (pred.homePenalty > pred.awayPenalty) winner = match.homeTeamObj
                else if (pred.awayPenalty > pred.homePenalty) winner = match.awayTeamObj
            }
            return winner
        }

        // --- Build Levels ---

        // R32
        const r32 = matches.knockoutStage.roundOf32.map(m => {
            const parts = m.description.split(' vs ')
            return { ...m, homeTeamObj: resolvePlace(parts[0]), awayTeamObj: resolvePlace(parts[1]) }
        })

        // R16
        const r16 = matches.knockoutStage.roundOf16.map(m => {
            // desc: "W74 vs W77"
            // parse IDs
            const ids = m.description.match(/W(\d+)/g)?.map(s => parseInt(s.substring(1)))
            if (!ids) return m
            const m1 = r32.find(x => x.id === ids[0])
            const m2 = r32.find(x => x.id === ids[1])
            return { ...m, homeTeamObj: getWinner(m1), awayTeamObj: getWinner(m2) }
        })

        // QF
        const qf = matches.knockoutStage.quarterFinals.map(m => {
            const ids = m.description.match(/W(\d+)/g)?.map(s => parseInt(s.substring(1)))
            if (!ids) return m
            const m1 = r16.find(x => x.id === ids[0])
            const m2 = r16.find(x => x.id === ids[1])
            return { ...m, homeTeamObj: getWinner(m1), awayTeamObj: getWinner(m2) }
        })

        // SF
        const sf = matches.knockoutStage.semiFinals.map(m => {
            const ids = m.description.match(/W(\d+)/g)?.map(s => parseInt(s.substring(1)))
            if (!ids) return m
            const m1 = qf.find(x => x.id === ids[0])
            const m2 = qf.find(x => x.id === ids[1])
            return { ...m, homeTeamObj: getWinner(m1), awayTeamObj: getWinner(m2) }
        })

        // Final
        const final = {
            ...matches.knockoutStage.final,
            homeTeamObj: getWinner(sf[0]),
            awayTeamObj: getWinner(sf[1])
        }

        const thirdPlace = {
            ...matches.knockoutStage.thirdPlace,
            // Logic for Loser needed? MVP: skip or implement later
            homeTeamObj: { name: 'Gubitnik SF1', code: 'FIFA' },
            awayTeamObj: { name: 'Gubitnik SF2', code: 'FIFA' }
        }

        return { r32, r16, qf, sf, final, thirdPlace }
    }


    // Render Login Screen
    if (!isLoggedIn) {
        return (
            <div className="max-w-md mx-auto mt-10 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                <h2 className="text-3xl font-black text-center text-fifa-blue dark:text-fifa-gold mb-8 uppercase tracking-widest">
                    🔮 Simulacija Prvenstva
                </h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Vaše Ime / Nadimak</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-xl font-bold text-lg border-2 border-transparent focus:border-fifa-blue dark:focus:border-fifa-gold focus:outline-none transition-all"
                            placeholder="Upišite ime..."
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!username.trim() || loading}
                        className="w-full bg-gradient-to-r from-fifa-blue to-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Učitavanje...' : 'ZAPOČNI PROGNOZU'}
                    </button>
                </form>
            </div>
        )
    }

    // CALCULATE TREE FOR RENDER
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
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'input'
                            ? 'bg-white dark:bg-slate-600 text-fifa-blue dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        ✏️ Prognoza
                    </button>
                    <button
                        onClick={() => { setActiveView('leaderboard'); fetchLeaderboard(); }}
                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'leaderboard'
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
                            className={`
                px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                ${saveStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-fifa-blue hover:bg-blue-700'}
              `}
                        >
                            {loading ? 'Spremanje...' : saveStatus === 'success' ? '✅ Spremljeno!' : '💾 Spremi Sve'}
                        </button>
                    </div>

                    {/* PLAYOFF Predictions Section */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-900/30 shadow-lg">
                        <h4 className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                            🎯 Play-off Pobjednici
                        </h4>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                            Prvo odaberite tko prolazi kroz Play-off. Vaš odabir automatski će se pojaviti u grupama dolje 👇
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {playoffs && Object.entries(playoffs).map(([pathKey, pathData]) => {
                                const selectedId = playoffPredictions[pathKey]
                                return (
                                    <div key={pathKey} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-indigo-100 dark:border-slate-700">
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
                                                        onClick={() => handlePlayoffPrediction(pathKey, team.id)}
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

                    {/* Group Matches */}
                    {Object.entries(groups).map(([groupKey, group]) => (
                        <div key={groupKey} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="text-2xl font-black text-fifa-gold mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                                Grupa {groupKey}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {matches.groupStage
                                    .filter(m => m.group === groupKey)
                                    .map(match => {
                                        const homeFn = resolveTeam(match.homeTeam, match.homeTeamPlayoff)
                                        const awayFn = resolveTeam(match.awayTeam, match.awayTeamPlayoff)
                                        const pred = userPredictions[match.id] || {}

                                        const isHomePlaceholder = homeFn?.type === 'placeholder'
                                        const isAwayPlaceholder = awayFn?.type === 'placeholder'

                                        return (
                                            <div key={match.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <div className={`flex items-center gap-2 w-1/3 ${isHomePlaceholder ? 'opacity-50' : ''}`}>
                                                        <span className="font-bold text-sm truncate" title={homeFn?.name}>{homeFn?.name}</span>
                                                        <Flag code={homeFn?.code} size="sm" />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={2}
                                                            value={pred.homeScore ?? ''}
                                                            onChange={(e) => handlePredictionChange(match.id, 'homeScore', e.target.value)}
                                                            className="w-10 h-10 text-center font-bold bg-white dark:bg-slate-700 rounded-lg border focus:ring-2 focus:ring-fifa-blue outline-none"
                                                        />
                                                        <span className="text-slate-400 font-bold">:</span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={2}
                                                            value={pred.awayScore ?? ''}
                                                            onChange={(e) => handlePredictionChange(match.id, 'awayScore', e.target.value)}
                                                            className="w-10 h-10 text-center font-bold bg-white dark:bg-slate-700 rounded-lg border focus:ring-2 focus:ring-fifa-blue outline-none"
                                                        />
                                                    </div>

                                                    <div className={`flex items-center gap-2 w-1/3 justify-end ${isAwayPlaceholder ? 'opacity-50' : ''}`}>
                                                        <Flag code={awayFn?.code} size="sm" />
                                                        <span className="font-bold text-sm truncate text-right" title={awayFn?.name}>{awayFn?.name}</span>
                                                    </div>
                                                </div>
                                                {(isHomePlaceholder || isAwayPlaceholder) && (
                                                    <div className="text-[10px] text-center text-red-400 font-bold uppercase">
                                                        ⚠️ Odaberite pobjednika playoffa gore!
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}

                    {/* --- KNOCKOUT SIMULATION RENDER --- */}
                    {tree && (
                        <div className="animate-fade-in-up">
                            <div className="bg-fifa-blue dark:bg-slate-900 p-8 rounded-2xl shadow-xl mb-8">
                                <h2 className="text-3xl font-black text-white text-center uppercase tracking-[0.2em] mb-4">
                                    ⚔️ Knockout Simulacija
                                </h2>
                                <p className="text-white/60 text-center mb-8">
                                    Na temelju vaših prognoza u grupama, generirali smo kostur natjecanja.
                                </p>

                                {/* Round of 32 */}
                                <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">Round of 32</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                    {tree.r32.map(m => <SimulatedMatchCard key={m.id} match={m} predictions={userPredictions} onChange={handlePredictionChange} />)}
                                </div>

                                {/* Round of 16 */}
                                <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">Round of 16</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                    {tree.r16.map(m => m.homeTeamObj && m.awayTeamObj ? <SimulatedMatchCard key={m.id} match={m} predictions={userPredictions} onChange={handlePredictionChange} /> : null)}
                                </div>

                                {/* QF */}
                                <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">Quarter Finals</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                    {tree.qf.map(m => m.homeTeamObj && m.awayTeamObj ? <SimulatedMatchCard key={m.id} match={m} predictions={userPredictions} onChange={handlePredictionChange} /> : null)}
                                </div>

                                {/* SF */}
                                <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">Semi Finals</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                                    {tree.sf.map(m => m.homeTeamObj && m.awayTeamObj ? <SimulatedMatchCard key={m.id} match={m} predictions={userPredictions} onChange={handlePredictionChange} /> : null)}
                                </div>

                                {/* FINAL */}
                                <h3 className="text-xl font-bold text-fifa-gold mb-6 border-b border-white/10 pb-2">FINAL 🏆</h3>
                                <div className="flex justify-center">
                                    {tree.final.homeTeamObj && tree.final.awayTeamObj ?
                                        <div className="w-full max-w-lg">
                                            <SimulatedMatchCard match={tree.final} predictions={userPredictions} onChange={handlePredictionChange} isFinal />
                                        </div>
                                        : null}
                                </div>

                            </div>
                        </div>
                    )}

                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* LEADERBOARD VIEW (Unchanged) */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-2xl font-black text-fifa-blue dark:text-fifa-gold uppercase tracking-widest text-center">
                            🏆 Ljestvica Predviđanja
                        </h3>
                        <p className="text-center text-slate-500 text-sm mt-2">
                            3 boda za točan rezultat • 1 bod za pogođen ishod
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 text-center w-16">#</th>
                                    <th className="p-4">Korisnik</th>
                                    <th className="p-4 text-center">Točno</th>
                                    <th className="p-4 text-center">Ishod</th>
                                    <th className="p-4 text-center text-fifa-blue dark:text-fifa-gold text-lg">Bodovi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {allPredictions
                                    .map(user => {
                                        let points = 0
                                        let exact = 0
                                        let outcome = 0

                                        // Calculate total points
                                        matches.groupStage.forEach(m => {
                                            if (m.played && m.homeScore !== null && m.awayScore !== null) {
                                                const pred = user.predictions[m.id]
                                                const pts = calculatePoints(pred, m)
                                                points += pts
                                                if (pts === 3) exact++
                                                if (pts === 1) outcome++
                                            }
                                        });
                                        // (TODO: Add knockout points calculation here if standard results exist)

                                        return { ...user, points, exact, outcome }
                                    })
                                    .sort((a, b) => b.points - a.points)
                                    .map((user, index) => (
                                        <tr key={user.username} className={user.username === username ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                                            <td className="p-4 text-center font-bold text-slate-400">
                                                {index + 1}.
                                            </td>
                                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                                                {user.username}
                                                {user.username === username && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">VI</span>}
                                            </td>
                                            <td className="p-4 text-center font-mono text-green-600 font-bold">{user.exact}</td>
                                            <td className="p-4 text-center font-mono text-yellow-600 font-bold">{user.outcome}</td>
                                            <td className="p-4 text-center font-black text-xl text-fifa-blue dark:text-fifa-gold">
                                                {user.points}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {allPredictions.length === 0 && (
                            <div className="p-10 text-center text-slate-400 italic">
                                Još nema unesenih prognoza. Budite prvi!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function SimulatedMatchCard({ match, predictions, onChange, isFinal }) {
    const pred = predictions[match.id] || {}
    const home = match.homeTeamObj
    const away = match.awayTeamObj

    // Check if draw
    const isDraw = pred.homeScore !== '' && pred.awayScore !== '' && parseInt(pred.homeScore) === parseInt(pred.awayScore)

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg p-3 shadow-md border-l-4 ${isFinal ? 'border-fifa-gold' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex justify-between">
                <span>{match.matchCode}</span>
                <span>{match.venue}</span>
            </div>

            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Flag code={home?.code} size="sm" />
                    <span className="font-bold text-sm truncate w-24">{home?.name}</span>
                </div>
                <input
                    type="text"
                    className="w-8 h-8 text-center bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-bold"
                    value={pred.homeScore ?? ''}
                    onChange={(e) => onChange(match.id, 'homeScore', e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Flag code={away?.code} size="sm" />
                    <span className="font-bold text-sm truncate w-24">{away?.name}</span>
                </div>
                <input
                    type="text"
                    className="w-8 h-8 text-center bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-bold"
                    value={pred.awayScore ?? ''}
                    onChange={(e) => onChange(match.id, 'awayScore', e.target.value)}
                />
            </div>

            {isDraw && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-center items-center gap-2 bg-slate-50 dark:bg-slate-700/30 rounded p-1">
                    <span className="text-[10px] text-slate-400">11m:</span>
                    <input
                        type="text"
                        placeholder="H"
                        className="w-8 h-6 text-center text-xs bg-white dark:bg-slate-600 border rounded"
                        value={pred.homePenalty ?? ''}
                        onChange={(e) => onChange(match.id, 'homePenalty', e.target.value)}
                    />
                    <span className="text-slate-300">:</span>
                    <input
                        type="text"
                        placeholder="A"
                        className="w-8 h-6 text-center text-xs bg-white dark:bg-slate-600 border rounded"
                        value={pred.awayPenalty ?? ''}
                        onChange={(e) => onChange(match.id, 'awayPenalty', e.target.value)}
                    />
                </div>
            )}
        </div>
    )
}

export default Simulation
