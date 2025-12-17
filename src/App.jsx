import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import Header from './components/Header'
import Navigation from './components/Navigation'
import AdminLogin from './components/AdminLogin'
import CountdownTimer from './components/CountdownTimer'
import { TabErrorBoundary } from './components/ErrorBoundary'
import { OfflineIndicator, InstallPrompt, UpdatePrompt } from './components/pwa'
import { useData, useAuth, useMatchActions } from './context'
import { usePWA } from './hooks/usePWA'
import { getPlayoffWinner, sortMatchesByDate } from './utils/helpers'

// Lazy load tab komponente za bolje performanse
const Home = lazy(() => import('./components/Home'))
const Groups = lazy(() => import('./components/Groups'))
const Playoffs = lazy(() => import('./components/Playoffs'))
const Matches = lazy(() => import('./components/Matches'))
const Standings = lazy(() => import('./components/Standings'))
const Knockout = lazy(() => import('./components/Knockout'))
const Simulation = lazy(() => import('./components/Simulation'))

// Loading fallback komponenta
const TabLoader = () => (
    <div className="flex items-center justify-center py-20">
        <div className="text-center">
            <div className="text-4xl animate-bounce mb-4">⚽</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Učitavanje...</p>
        </div>
    </div>
)

function App() {
    // Context hooks
    const { 
        teams, 
        groups, 
        playoffs, 
        matches, 
        standings, 
        bestThirdPlaced, 
        venues, 
        loading,
        error,
        serverAvailable,
        refreshData
    } = useData()
    
    const { 
        isAdmin, 
        isReadOnly, 
        showAdminLogin, 
        login, 
        logout, 
        openLoginModal, 
        closeLoginModal 
    } = useAuth()
    
    const { 
        updateMatch, 
        updateKnockoutMatch, 
        setPlayoffWinner 
    } = useMatchActions()

    // PWA hook
    const {
        isOnline,
        isInstallable,
        isIOS,
        showIOSInstall,
        updateAvailable,
        installPrompt,
        dismissInstall,
        updateApp
    } = usePWA()

    // Local UI state
    const [activeTab, setActiveTab] = useState('home')
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
        }
        return false
    })
    const [showScrollTop, setShowScrollTop] = useState(false)

    // Dark mode effect
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    // Scroll to top funkcionalnost
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = useCallback(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }, [])

    // Pronađi prvu sljedeću hrvatsku utakmicu (memoizirano)
    const nextCroatiaMatch = useMemo(() => {
        if (!matches || !teams.length || !playoffs) return null

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
                const homePlayoffWinner = match.homeTeamPlayoff ? getPlayoffWinner(playoffs, match.homeTeamPlayoff) : null
                const awayPlayoffWinner = match.awayTeamPlayoff ? getPlayoffWinner(playoffs, match.awayTeamPlayoff) : null

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

        // Sortiraj po datumu i vremenu
        return sortMatchesByDate(upcomingCroatiaMatches, 'asc')[0] || null
    }, [matches, teams, playoffs])

    // Loading screen
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

    // Error screen - prikaži ako je došlo do greške pri učitavanju podataka
    if (error && !teams.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 text-white px-4">
                <div className="text-center mb-6">
                    <div className="text-6xl sm:text-7xl md:text-8xl mb-4">😕</div>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-red-400 mb-3 drop-shadow-md font-sans text-center">
                    Greška pri učitavanju
                </h2>
                <p className="text-slate-400 text-sm sm:text-base md:text-lg text-center max-w-md mb-6">
                    Nije moguće učitati podatke. Provjerite je li backend server pokrenut.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                    <button
                        onClick={refreshData}
                        className="px-8 py-3 bg-fifa-gold hover:bg-yellow-500 text-slate-900 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        <span>🔄</span> Pokušaj ponovno
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all flex items-center gap-2"
                    >
                        <span>↻</span> Osvježi stranicu
                    </button>
                </div>
                {import.meta.env.DEV && (
                    <p className="mt-6 text-xs text-slate-500 font-mono">
                        Greška: {error}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-8 lg:px-12 py-2 sm:py-4">
            {/* PWA Components */}
            <OfflineIndicator isOnline={isOnline} />
            <UpdatePrompt updateAvailable={updateAvailable} onUpdate={updateApp} />
            <InstallPrompt
                isInstallable={isInstallable}
                isIOS={isIOS}
                showIOSInstall={showIOSInstall}
                onInstall={installPrompt}
                onDismiss={dismissInstall}
            />

            <Header 
                darkMode={darkMode} 
                setDarkMode={setDarkMode}
                isAdmin={isAdmin}
                onAdminClick={openLoginModal}
                onLogout={logout}
                serverAvailable={serverAvailable}
            />
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Timer za hrvatske utakmice - prikazuj samo na tabu Utakmice */}
            {nextCroatiaMatch && activeTab === 'matches' && (
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
                <Suspense fallback={<TabLoader />}>
                    {activeTab === 'home' && (
                        <TabErrorBoundary tabName="Početna">
                            <Home />
                        </TabErrorBoundary>
                    )}

                    {activeTab === 'groups' && (
                        <TabErrorBoundary tabName="Grupe">
                            <Groups
                                groups={groups}
                                teams={teams}
                                playoffs={playoffs}
                            />
                        </TabErrorBoundary>
                    )}

                    {activeTab === 'playoffs' && (
                        <TabErrorBoundary tabName="Play-Off">
                            <Playoffs
                                playoffs={playoffs}
                                teams={teams}
                                setPlayoffWinner={setPlayoffWinner}
                                isReadOnly={isReadOnly}
                            />
                        </TabErrorBoundary>
                    )}

                    {activeTab === 'matches' && (
                        <TabErrorBoundary tabName="Utakmice">
                            <Matches
                                matches={matches.groupStage}
                                teams={teams}
                                venues={venues}
                                groups={groups}
                                playoffs={playoffs}
                                updateMatch={updateMatch}
                                isReadOnly={isReadOnly}
                            />
                        </TabErrorBoundary>
                    )}

                    {activeTab === 'standings' && (
                        <TabErrorBoundary tabName="Tablice">
                            <Standings
                                standings={standings}
                                teams={teams}
                                bestThirdPlaced={bestThirdPlaced}
                                groups={groups}
                                playoffs={playoffs}
                            />
                        </TabErrorBoundary>
                    )}

                    {activeTab === 'knockout' && (
                        <TabErrorBoundary tabName="Knockout">
                            <Knockout
                                matches={matches.knockoutStage}
                                groupMatches={matches.groupStage}
                                teams={teams}
                                venues={venues}
                                updateKnockoutMatch={updateKnockoutMatch}
                                isReadOnly={isReadOnly}
                            />
                        </TabErrorBoundary>
                    )}

                    {activeTab === 'simulation' && (
                        <TabErrorBoundary tabName="Simulacija">
                            <Simulation
                                groups={groups}
                                matches={matches}
                                teams={teams}
                                playoffs={playoffs}
                            />
                        </TabErrorBoundary>
                    )}
                </Suspense>
            </main>

            <footer className="text-center py-4 sm:py-6 md:py-8 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto px-2">
                <p className="mb-2 font-medium text-sm sm:text-base">🏆 FIFA World Cup 2026™</p>
                <p className="mb-2 font-medium text-sm sm:text-base">SAD 🇺🇸 | Kanada 🇨🇦 | Meksiko 🇲🇽</p>
                <p className="font-bold text-red-600 dark:text-red-500 animate-pulse text-base sm:text-lg">🇭🇷 Idemo Vatreni! 🇭🇷</p>
            </footer>

            {/* Admin Login Modal */}
            <AdminLogin
                isOpen={showAdminLogin}
                onClose={closeLoginModal}
                onLogin={login}
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
