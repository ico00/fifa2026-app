import { useState, useEffect } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Groups from './components/Groups'
import Playoffs from './components/Playoffs'
import Matches from './components/Matches'
import Standings from './components/Standings'
import Knockout from './components/Knockout'
import Simulation from './components/Simulation'
import AdminLogin from './components/AdminLogin'
import CountdownTimer from './components/CountdownTimer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Debug logging za production
if (import.meta.env.VITE_API_URL) {
    console.log('🌐 Production API URL:', API_URL)
} else {
    console.log('🔧 Development API URL:', API_URL)
}

function App() {
    // Detektuj da li je production (Render.com)
    const isProduction = window.location.hostname.includes('onrender.com')
    // U production-u, aplikacija je read-only SAMO ako korisnik nije admin
    // (ne više automatski read-only za sve u production-u)

    const [activeTab, setActiveTab] = useState('home')
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        }
        return false
    })
    const [showScrollTop, setShowScrollTop] = useState(false)

    // Admin state management
    const [isAdmin, setIsAdmin] = useState(false)
    const [adminToken, setAdminToken] = useState(null)
    const [showAdminLogin, setShowAdminLogin] = useState(false)
    const [serverAvailable, setServerAvailable] = useState(true)
    
    // Data state - svi state hookovi moraju biti na vrhu
    const [teams, setTeams] = useState([])
    const [groups, setGroups] = useState({})
    const [playoffs, setPlayoffs] = useState({})
    const [matches, setMatches] = useState({ groupStage: [], knockoutStage: {} })
    const [standings, setStandings] = useState({})
    const [bestThirdPlaced, setBestThirdPlaced] = useState([])
    const [venues, setVenues] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    // Funkcija za provjeru dostupnosti servera
    const checkServerAvailability = async () => {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout od 5 sekundi (više za production)
            
            const response = await fetch(`${API_URL}/teams`, {
                method: 'GET',
                signal: controller.signal
            })
            clearTimeout(timeoutId)
            setServerAvailable(response.ok)
            
            // Ako je production i server je dostupan, ne prikazuj upozorenje
            if (isProduction && response.ok) {
                console.log('✅ Production server je dostupan:', API_URL)
            }
        } catch (error) {
            // U production-u, možda je server sporiji, ne prikazuj upozorenje odmah
            if (isProduction) {
                // U production-u, pretpostavi da je server dostupan (možda je samo spor)
                setServerAvailable(true)
                console.warn('⚠️ Production server možda je spor, ali pretpostavljamo da je dostupan')
            } else {
                setServerAvailable(false)
                console.warn('Server nije dostupan:', error.message)
            }
        }
    }

    // Funkcija za provjeru validnosti admin tokena
    const verifyAdminToken = async (token) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            if (data.valid) {
                setIsAdmin(true)
                setAdminToken(token)
            } else {
                // Token nije validan, ukloni ga
                localStorage.removeItem('adminToken')
                setIsAdmin(false)
                setAdminToken(null)
            }
        } catch (error) {
            console.error('Greška pri provjeri tokena:', error)
            localStorage.removeItem('adminToken')
            setIsAdmin(false)
            setAdminToken(null)
        }
    }

    // Provjeri dostupnost servera pri učitavanju
    useEffect(() => {
        checkServerAvailability()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Provjeri admin token pri učitavanju
    useEffect(() => {
        const token = localStorage.getItem('adminToken')
        if (token) {
            verifyAdminToken(token)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Funkcija za login
    const handleAdminLogin = (token) => {
        console.log('🔐 handleAdminLogin pozvan, token:', token ? 'postoji' : 'nema')
        setAdminToken(token)
        setIsAdmin(true)
        console.log('✅ Admin prijavljen, isAdmin postavljen na: true')
        // Ažuriraj podatke nakon prijave da se komponente osvježe
        fetchData()
    }

    // Funkcija za logout
    const handleAdminLogout = () => {
        localStorage.removeItem('adminToken')
        setAdminToken(null)
        setIsAdmin(false)
    }

    // Helper funkcija za dobivanje Authorization headera
    const getAuthHeaders = () => {
        const headers = { 'Content-Type': 'application/json' }
        if (adminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`
        }
        return headers
    }

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

            // Ažuriraj status dostupnosti servera
            setServerAvailable(true)

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
            setServerAvailable(false)
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Debug logging - provjeri da li se state pravilno ažurira
    useEffect(() => {
        console.log('🔐 Admin status promijenjen:', { 
            isAdmin, 
            effectiveReadOnly: !isAdmin, 
            adminToken: adminToken ? 'postoji' : 'nema',
            canEdit: isAdmin,
            timestamp: new Date().toISOString()
        })
    }, [isAdmin, adminToken])

    // Scroll to top funkcionalnost
    useEffect(() => {
        const handleScroll = () => {
            // Prikaži gumb ako je korisnik skrolao više od 300px
            setShowScrollTop(window.scrollY > 300)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const updateMatch = async (matchId, data) => {
        try {
            const response = await fetch(`${API_URL}/matches/${matchId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            })
            if (response.ok) {
                fetchData() // Ponovno dohvati sve podatke
            } else if (response.status === 401) {
                // Token nije validan, odjavi korisnika
                handleAdminLogout()
                alert('Vaša sesija je istekla. Molimo prijavite se ponovno.')
            }
        } catch (error) {
            console.error('Greška pri ažuriranju utakmice:', error)
        }
    }

    const setPlayoffWinner = async (playoffId, winner) => {
        try {
            const response = await fetch(`${API_URL}/playoffs/${playoffId}/winner`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ winner: winner || null })
            })
            if (response.ok) {
                fetchData()
            } else if (response.status === 401) {
                // Token nije validan, odjavi korisnika
                handleAdminLogout()
                alert('Vaša sesija je istekla. Molimo prijavite se ponovno.')
            }
        } catch (error) {
            console.error('Greška pri postavljanju pobjednika:', error)
        }
    }

    const updateKnockoutMatch = async (round, matchId, data) => {
        try {
            const response = await fetch(`${API_URL}/knockout/${round}/${matchId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            })
            if (response.ok) {
                fetchData()
            } else if (response.status === 401) {
                // Token nije validan, odjavi korisnika
                handleAdminLogout()
                alert('Vaša sesija je istekla. Molimo prijavite se ponovno.')
            }
        } catch (error) {
            console.error('Greška pri ažuriranju knockout utakmice:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white px-4">
                <div className="text-center animate-bounce mb-6">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">⚽</div>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-fifa-gold mb-3 drop-shadow-md font-sans text-center">FIFA World Cup 2026</h2>
                <p className="text-slate-400 text-sm sm:text-base md:text-lg tracking-wide uppercase">UČITAVANJE...</p>
            </div>
        )
    }

    // Aplikacija je read-only samo ako korisnik NIJE admin
    // (u production-u, admin može mijenjati podatke nakon prijave)
    const effectiveReadOnly = !isAdmin

    // Pronađi prvu sljedeću hrvatsku utakmicu
    const getNextCroatiaMatch = () => {
        if (!matches || !teams.length || !playoffs) return null

        // Funkcija za dobivanje play-off pobjednika
        const getPlayoffWinner = (playoffId) => {
            if (!playoffs || !playoffs[playoffId]) return null
            return playoffs[playoffId].winner || null
        }

        const allMatches = [
            ...(matches.groupStage || []),
            ...(matches.knockoutStage?.roundOf32 || []),
            ...(matches.knockoutStage?.roundOf16 || []),
            ...(matches.knockoutStage?.quarterFinals || []),
            ...(matches.knockoutStage?.semiFinals || []),
            ...(matches.knockoutStage?.thirdPlace ? [matches.knockoutStage.thirdPlace] : []),
            ...(matches.knockoutStage?.final ? [matches.knockoutStage.final] : [])
        ]

        const now = new Date()
        const upcomingCroatiaMatches = allMatches
            .filter(match => {
                // Provjeri da li je utakmica odigrana
                if (match.played || (match.homeScore !== null && match.awayScore !== null)) {
                    return false
                }

                // Provjeri play-off pobjednike
                const homePlayoffWinner = match.homeTeamPlayoff ? getPlayoffWinner(match.homeTeamPlayoff) : null
                const awayPlayoffWinner = match.awayTeamPlayoff ? getPlayoffWinner(match.awayTeamPlayoff) : null

                // Provjeri da li Hrvatska sudjeluje (direktno ili kroz play-off)
                const homeTeamId = match.homeTeam || homePlayoffWinner
                const awayTeamId = match.awayTeam || awayPlayoffWinner
                const isCroatiaMatch = homeTeamId === 'cro' || awayTeamId === 'cro'
                
                if (!isCroatiaMatch) return false

                // Provjeri da li je utakmica u budućnosti
                if (!match.date || !match.time) return false
                
                const [hours, minutes] = match.time.split(':').map(Number)
                const matchDate = new Date(match.date)
                matchDate.setHours(hours, minutes, 0, 0)

                return matchDate > now
            })
            .sort((a, b) => {
                // Sortiraj po datumu i vremenu
                const dateA = new Date(`${a.date}T${a.time}`)
                const dateB = new Date(`${b.date}T${b.time}`)
                return dateA - dateB
            })

        return upcomingCroatiaMatches.length > 0 ? upcomingCroatiaMatches[0] : null
    }

    const nextCroatiaMatch = getNextCroatiaMatch()

    return (
        <div className="min-h-screen flex flex-col w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:px-12 py-2 sm:py-4">
            <Header 
                darkMode={darkMode} 
                setDarkMode={setDarkMode}
                isAdmin={isAdmin}
                onAdminClick={() => setShowAdminLogin(true)}
                onLogout={handleAdminLogout}
                serverAvailable={serverAvailable}
            />
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Timer za hrvatske utakmice - ne prikazuj na Home tabu */}
            {nextCroatiaMatch && activeTab !== 'home' && (
                <div className="relative w-screen left-1/2 right-1/2 -translate-x-1/2">
                    <div className="px-3 sm:px-4 md:px-8 lg:px-12 max-w-[1920px] mx-auto">
                        <CountdownTimer
                            targetDate={nextCroatiaMatch.date}
                            targetTime={nextCroatiaMatch.time}
                            homeTeam={nextCroatiaMatch.homeTeam}
                            awayTeam={nextCroatiaMatch.awayTeam}
                            homeTeamPlayoff={nextCroatiaMatch.homeTeamPlayoff}
                            awayTeamPlayoff={nextCroatiaMatch.awayTeamPlayoff}
                            venue={nextCroatiaMatch.venue}
                            teams={teams}
                            venues={venues}
                            playoffs={playoffs}
                        />
                    </div>
                </div>
            )}

            <main className="flex-1 w-full py-4 sm:py-6 md:py-8 text-slate-900 dark:text-slate-100">
                {activeTab === 'home' && (
                    <Home />
                )}

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
                        isReadOnly={effectiveReadOnly}
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
                        isReadOnly={effectiveReadOnly}
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
                        isReadOnly={effectiveReadOnly}
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

            <footer className="text-center py-4 sm:py-6 md:py-8 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto px-2">
                <p className="mb-2 font-medium text-sm sm:text-base">🏆 FIFA World Cup 2026™</p>
                <p className="mb-2 font-medium text-sm sm:text-base">SAD 🇺🇸 | Kanada 🇨🇦 | Meksiko 🇲🇽</p>
                <p className="font-bold text-red-600 dark:text-red-500 animate-pulse text-base sm:text-lg">🇭🇷 Idemo Vatreni! 🇭🇷</p>
            </footer>

            {/* Admin Login Modal */}
            <AdminLogin
                isOpen={showAdminLogin}
                onClose={() => setShowAdminLogin(false)}
                onLogin={handleAdminLogin}
            />

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-50 bg-fifa-blue hover:bg-blue-700 dark:bg-fifa-gold dark:hover:bg-yellow-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up hover:scale-110"
                    aria-label="Povratak na vrh"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-6 w-6" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            )}
        </div>
    )
}

export default App
