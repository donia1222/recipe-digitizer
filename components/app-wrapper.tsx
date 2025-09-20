"use client"

import type React from "react"
import { useState, useEffect } from "react"
import LoginPage from "@/components/login-page"
import RecipeDigitizer from "@/recipe-digitizer"

export default function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'worker' | 'guest' | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("recipe-auth")
    const savedRole = localStorage.getItem("user-role") as 'admin' | 'worker' | 'guest' | null
    if (savedAuth === "granted" && savedRole) {
      setIsAuthenticated(true)
      setUserRole(savedRole)
    }
    setIsLoading(false)
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

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <RecipeDigitizer handleLogout={handleLogout} userRole={userRole} />
}