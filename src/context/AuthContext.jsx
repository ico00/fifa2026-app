import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// API URL
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Kreiraj context
const AuthContext = createContext(null)

/**
 * AuthProvider - upravljanje admin autentikacijom
 */
export function AuthProvider({ children, onAuthChange }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  /**
   * Provjeri validnost admin tokena
   */
  const verifyToken = useCallback(async (token) => {
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
        return true
      } else {
        // Token nije validan, ukloni ga
        localStorage.removeItem('adminToken')
        setIsAdmin(false)
        setAdminToken(null)
        return false
      }
    } catch (error) {
      console.error('Greška pri provjeri tokena:', error)
      localStorage.removeItem('adminToken')
      setIsAdmin(false)
      setAdminToken(null)
      return false
    }
  }, [])

  /**
   * Login - prijava admina
   */
  const login = useCallback(async (token) => {
    console.log('🔐 Admin login, token:', token ? 'postoji' : 'nema')
    setAdminToken(token)
    setIsAdmin(true)
    localStorage.setItem('adminToken', token)
    setShowAdminLogin(false)
    console.log('✅ Admin prijavljen')
    
    // Notify parent about auth change (to refresh data)
    if (onAuthChange) {
      onAuthChange()
    }
  }, [onAuthChange])

  /**
   * Logout - odjava admina
   */
  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setAdminToken(null)
    setIsAdmin(false)
    console.log('🔓 Admin odjavljen')
  }, [])

  /**
   * Dohvati Authorization header za API pozive
   */
  const getAuthHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' }
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`
    }
    return headers
  }, [adminToken])

  /**
   * Otvori/zatvori login modal
   */
  const openLoginModal = useCallback(() => setShowAdminLogin(true), [])
  const closeLoginModal = useCallback(() => setShowAdminLogin(false), [])

  // Provjeri postojeći token pri učitavanju
  useEffect(() => {
    const checkExistingToken = async () => {
      const token = localStorage.getItem('adminToken')
      if (token) {
        await verifyToken(token)
      }
      setLoading(false)
    }
    
    checkExistingToken()
  }, [verifyToken])

  // Debug logging
  useEffect(() => {
    console.log('🔐 Auth status:', { 
      isAdmin, 
      hasToken: !!adminToken,
      isReadOnly: !isAdmin
    })
  }, [isAdmin, adminToken])

  // Context value
  const value = {
    // State
    isAdmin,
    adminToken,
    showAdminLogin,
    loading,
    
    // Computed
    isReadOnly: !isAdmin,
    
    // Actions
    login,
    logout,
    verifyToken,
    getAuthHeaders,
    openLoginModal,
    closeLoginModal
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook za pristup autentikaciji
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth mora biti korišten unutar AuthProvider-a')
  }
  return context
}

export default AuthContext
