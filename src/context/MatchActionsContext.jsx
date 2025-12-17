import { createContext, useContext, useCallback } from 'react'
import { useData } from './DataContext'
import { useAuth } from './AuthContext'

// API URL
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Kreiraj context
const MatchActionsContext = createContext(null)

/**
 * MatchActionsProvider - akcije za upravljanje utakmicama
 */
export function MatchActionsProvider({ children }) {
  const { refreshData } = useData()
  const { getAuthHeaders, logout, isReadOnly } = useAuth()

  /**
   * Handle 401 Unauthorized error
   */
  const handleUnauthorized = useCallback(() => {
    logout()
    alert('Vaša sesija je istekla. Molimo prijavite se ponovno.')
  }, [logout])

  /**
   * Ažuriraj grupnu utakmicu
   */
  const updateMatch = useCallback(async (matchId, data) => {
    if (isReadOnly) {
      console.warn('Pokušaj uređivanja u read-only modu')
      return false
    }

    try {
      const response = await fetch(`${API_URL}/matches/${matchId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await refreshData()
        return true
      } else if (response.status === 401) {
        handleUnauthorized()
        return false
      } else {
        console.error('Greška pri ažuriranju utakmice:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('Greška pri ažuriranju utakmice:', error)
      return false
    }
  }, [getAuthHeaders, refreshData, handleUnauthorized, isReadOnly])

  /**
   * Ažuriraj knockout utakmicu
   */
  const updateKnockoutMatch = useCallback(async (round, matchId, data) => {
    if (isReadOnly) {
      console.warn('Pokušaj uređivanja u read-only modu')
      return false
    }

    try {
      const response = await fetch(`${API_URL}/knockout/${round}/${matchId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await refreshData()
        return true
      } else if (response.status === 401) {
        handleUnauthorized()
        return false
      } else {
        console.error('Greška pri ažuriranju knockout utakmice:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('Greška pri ažuriranju knockout utakmice:', error)
      return false
    }
  }, [getAuthHeaders, refreshData, handleUnauthorized, isReadOnly])

  /**
   * Postavi pobjednika play-off grupe
   */
  const setPlayoffWinner = useCallback(async (playoffId, winner) => {
    if (isReadOnly) {
      console.warn('Pokušaj uređivanja u read-only modu')
      return false
    }

    try {
      const response = await fetch(`${API_URL}/playoffs/${playoffId}/winner`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ winner: winner || null })
      })

      if (response.ok) {
        await refreshData()
        return true
      } else if (response.status === 401) {
        handleUnauthorized()
        return false
      } else {
        console.error('Greška pri postavljanju pobjednika:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('Greška pri postavljanju pobjednika:', error)
      return false
    }
  }, [getAuthHeaders, refreshData, handleUnauthorized, isReadOnly])

  // Context value
  const value = {
    updateMatch,
    updateKnockoutMatch,
    setPlayoffWinner
  }

  return (
    <MatchActionsContext.Provider value={value}>
      {children}
    </MatchActionsContext.Provider>
  )
}

/**
 * Custom hook za pristup akcijama nad utakmicama
 */
export function useMatchActions() {
  const context = useContext(MatchActionsContext)
  if (!context) {
    throw new Error('useMatchActions mora biti korišten unutar MatchActionsProvider-a')
  }
  return context
}

export default MatchActionsContext
