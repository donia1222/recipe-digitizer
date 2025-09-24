"use client"

import type React from "react"
import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import LandingPage from "@/components/landing-page"
import RecipeDigitizer from "@/recipe-digitizer"

export default function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'worker' | 'guest' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLandingPage, setShowLandingPage] = useState(true)

  // Check for existing session on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const savedAuth = localStorage.getItem("recipe-auth")
      const savedRole = localStorage.getItem("user-role") as 'admin' | 'worker' | 'guest' | null
      const authToken = localStorage.getItem("auth-token")
      const hasSeenLanding = localStorage.getItem("has-seen-landing")

      // If user has seen landing page and is authenticated, skip landing
      if (hasSeenLanding === "true" && savedAuth === "granted" && savedRole) {
        setShowLandingPage(false)

        // If we have an auth token, try to refresh user data from server
        if (authToken) {
          try {
            const { UserService } = await import("@/lib/services/userService")
            const result = await UserService.getCurrentUserFromServer()
            if (result.success && result.user) {
              console.log("✅ User data refreshed from server:", result.user.name)
            } else {
              console.log("ℹ️ Using cached user data")
            }
          } catch (error) {
            console.log("ℹ️ Could not refresh user data, using cached")
          }
        }

        setIsAuthenticated(true)
        setUserRole(savedRole)
      } else if (hasSeenLanding === "true") {
        // User has seen landing but is not authenticated, go to login
        setShowLandingPage(false)
      }
      // If user hasn't seen landing, showLandingPage stays true

      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const handleLogin = (role: 'admin' | 'worker' | 'guest') => {
    setIsAuthenticated(true)
    setUserRole(role)
    // Save authentication state and role to localStorage
    localStorage.setItem("recipe-auth", "granted")
    localStorage.setItem("user-role", role)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    // Remove authentication state and role from localStorage
    localStorage.removeItem("recipe-auth")
    localStorage.removeItem("user-role")
  }

  const handleAccessApp = () => {
    // Mark that user has seen the landing page
    localStorage.setItem("has-seen-landing", "true")
    setShowLandingPage(false)
  }

  const handleBackToLanding = () => {
    // Clear the landing page flag and logout user
    localStorage.removeItem("has-seen-landing")
    setShowLandingPage(true)
    setIsAuthenticated(false)
    setUserRole(null)
    localStorage.removeItem("recipe-auth")
    localStorage.removeItem("user-role")
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade...</p>
        </div>
      </div>
    )
  }

  // Show landing page if user hasn't seen it yet
  if (showLandingPage) {
    return <LandingPage onAccessApp={handleAccessApp} />
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onBackToLanding={handleBackToLanding} />
  }

  return <RecipeDigitizer handleLogout={handleLogout} userRole={userRole} onBackToLanding={handleBackToLanding} />
}