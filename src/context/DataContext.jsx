import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// API URL - u produkciji koristi relativni /api
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Kreiraj context
const DataContext = createContext(null)

/**
 * DataProvider - centralizirano upravljanje podacima aplikacije
 */
export function DataProvider({ children }) {
  // Data state
  const [teams, setTeams] = useState([])
  const [groups, setGroups] = useState({})
  const [playoffs, setPlayoffs] = useState({})
  const [matches, setMatches] = useState({ groupStage: [], knockoutStage: {} })
  const [standings, setStandings] = useState({})
  const [bestThirdPlaced, setBestThirdPlaced] = useState([])
  const [venues, setVenues] = useState([])
  
  // Loading i error state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [serverAvailable, setServerAvailable] = useState(true)

  /**
   * Dohvati sve podatke s API-ja
   */
  const fetchData = useCallback(async (silent = false) => {
    try {
      // Tihi (pozadinski) refresh ne pali fullscreen loading ekran -> nema
      // blinkanja ni skoka na vrh; podaci se ažuriraju u mjestu.
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      const [teamsRes, groupsRes, playoffsRes, matchesRes, standingsRes, venuesRes] = await Promise.all([
        fetch(`${API_URL}/teams`),
        fetch(`${API_URL}/groups`),
        fetch(`${API_URL}/playoffs`),
        fetch(`${API_URL}/matches`),
        fetch(`${API_URL}/standings`),
        fetch(`${API_URL}/venues`)
      ])

      // Provjeri da li su svi odgovori OK
      if (!teamsRes.ok || !groupsRes.ok || !playoffsRes.ok || !matchesRes.ok || !standingsRes.ok || !venuesRes.ok) {
        throw new Error('Greška pri dohvaćanju podataka')
      }

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
    } catch (err) {
      console.error('Greška pri dohvaćanju podataka:', err)
      // Kod tihog refresha ne ruši UI greškom - samo preskoči ovaj ciklus
      if (!silent) {
        setError(err.message)
        setServerAvailable(false)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  /**
   * Provjeri dostupnost servera
   */
  const checkServerAvailability = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${API_URL}/teams`, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      setServerAvailable(response.ok)
      
      if (response.ok) {
        console.log('✅ Server je dostupan:', API_URL)
      }
    } catch (err) {
      // U production-u, pretpostavi da je server dostupan
      const isProduction = window.location.hostname.includes('onrender.com') || 
                          window.location.hostname.includes('fly.dev')
      if (isProduction) {
        setServerAvailable(true)
        console.warn('⚠️ Server možda je spor, ali pretpostavljamo da je dostupan')
      } else {
        setServerAvailable(false)
        console.warn('Server nije dostupan:', err.message)
      }
    }
  }, [])

  // Inicijalno dohvaćanje podataka + periodično osvježavanje (live rezultati)
  useEffect(() => {
    checkServerAvailability()
    fetchData()

    // Auto-refresh svakih 60s da se uhvate novi rezultati sa servera.
    // Pauziraj kad je kartica u pozadini da ne trošimo zahtjeve bezveze.
    const REFRESH_MS = 60000
    const interval = setInterval(() => {
      if (!document.hidden) fetchData(true) // tihi refresh
    }, REFRESH_MS)

    return () => clearInterval(interval)
  }, [checkServerAvailability, fetchData])

  // Context value
  const value = {
    // Data
    teams,
    groups,
    playoffs,
    matches,
    standings,
    bestThirdPlaced,
    venues,
    
    // Status
    loading,
    error,
    serverAvailable,
    
    // Actions
    refreshData: fetchData,
    
    // Setteri za lokalno ažuriranje (koriste se nakon API poziva)
    setTeams,
    setGroups,
    setPlayoffs,
    setMatches,
    setStandings,
    setBestThirdPlaced,
    setVenues
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

/**
 * Custom hook za pristup podacima
 */
export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData mora biti korišten unutar DataProvider-a')
  }
  return context
}

export default DataContext
