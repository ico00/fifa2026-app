import { useState, useEffect } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Groups from './components/Groups'
import Playoffs from './components/Playoffs'
import Matches from './components/Matches'
import Standings from './components/Standings'
import Knockout from './components/Knockout'
import Simulation from './components/Simulation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function App() {
    const [activeTab, setActiveTab] = useState('playoffs')
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        }
        return false
    })

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    const [teams, setTeams] = useState([])
    const [groups, setGroups] = useState({})
    const [playoffs, setPlayoffs] = useState({})
    const [matches, setMatches] = useState({ groupStage: [], knockoutStage: {} })
    const [standings, setStandings] = useState({})
    const [bestThirdPlaced, setBestThirdPlaced] = useState([])
    const [venues, setVenues] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            const [teamsRes, groupsRes, playoffsRes, matchesRes, standingsRes, venuesRes] = await Promise.all([
                fetch(`${API_URL}/teams`),
                fetch(`${API_URL}/groups`),
                fetch(`${API_URL}/playoffs`),
                fetch(`${API_URL}/matches`),
                fetch(`${API_URL}/standings`),
                fetch(`${API_URL}/venues`)
            ])

            const teamsData = await teamsRes.json()
            const groupsData = await groupsRes.json()
            const playoffsData = await playoffsRes.json()
            const matchesData = await matchesRes.json()
            const standingsData = await standingsRes.json()
            const venuesData = await venuesRes.json()

            setTeams(teamsData?.teams || [])
            setGroups(groupsData?.groups || {})
            setPlayoffs(playoffsData?.playoffs || {})
            setMatches(matchesData || { groupStage: [], knockoutStage: {} })
            setStandings(standingsData?.standings || {})
            setBestThirdPlaced(standingsData?.bestThirdPlaced || [])
            setVenues(venuesData?.venues || [])
            setLoading(false)
        } catch (error) {
            console.error('Greška pri dohvaćanju podataka:', error)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const updateMatch = async (matchId, data) => {
        try {
            const response = await fetch(`${API_URL}/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (response.ok) {
                fetchData() // Ponovno dohvati sve podatke
            }
        } catch (error) {
            console.error('Greška pri ažuriranju utakmice:', error)
        }
    }

    const setPlayoffWinner = async (playoffId, winner) => {
        try {
            const response = await fetch(`${API_URL}/playoffs/${playoffId}/winner`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winner: winner || null })
            })
            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Greška pri postavljanju pobjednika:', error)
        }
    }

    const updateKnockoutMatch = async (round, matchId, data) => {
        try {
            const response = await fetch(`${API_URL}/knockout/${round}/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Greška pri ažuriranju knockout utakmice:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
                <div className="text-center animate-bounce">
                    <div className="text-6xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">⚽</div>
                </div>
                <h2 className="text-4xl font-black tracking-widest text-fifa-gold mb-2 drop-shadow-md font-sans">FIFA World Cup 2026</h2>
                <p className="text-slate-400 text-lg tracking-wide uppercase">Učitavanje...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4">
            <Header darkMode={darkMode} setDarkMode={setDarkMode} />
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 w-full py-8 text-slate-900 dark:text-slate-100">
                {activeTab === 'groups' && (
                    <Groups
                        groups={groups}
                        teams={teams}
                        playoffs={playoffs}
                    />
                )}

                {activeTab === 'playoffs' && (
                    <Playoffs
                        playoffs={playoffs}
                        teams={teams}
                        setPlayoffWinner={setPlayoffWinner}
                    />
                )}

                {activeTab === 'matches' && (
                    <Matches
                        matches={matches.groupStage}
                        teams={teams}
                        venues={venues}
                        groups={groups}
                        playoffs={playoffs}
                        updateMatch={updateMatch}
                    />
                )}

                {activeTab === 'standings' && (
                    <Standings
                        standings={standings}
                        teams={teams}
                        bestThirdPlaced={bestThirdPlaced}
                        groups={groups}
                        playoffs={playoffs}
                    />
                )}

                {activeTab === 'knockout' && (
                    <Knockout
                        matches={matches.knockoutStage}
                        groupMatches={matches.groupStage}
                        teams={teams}
                        venues={venues}
                        updateKnockoutMatch={updateKnockoutMatch}
                    />
                )}

                {activeTab === 'simulation' && (
                    <Simulation
                        groups={groups}
                        matches={matches}
                        teams={teams}
                        playoffs={playoffs}
                    />
                )}
            </main>

            <footer className="text-center py-8 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto">
                <p className="mb-2 font-medium">🏆 FIFA World Cup 2026™ - SAD 🇺🇸 | Kanada 🇨🇦 | Meksiko 🇲🇽</p>
                <p className="font-bold text-red-600 dark:text-red-500 animate-pulse text-lg">🇭🇷 Idemo Vatreni! 🇭🇷</p>
            </footer>
        </div>
    )
}

export default App
