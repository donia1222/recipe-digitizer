"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users, UserCheck, ChefHat, Lock, User, Mail } from "lucide-react"

interface LoginPageProps {
  onLogin: (role: 'admin' | 'worker' | 'guest') => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'worker' | 'guest' | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Detect mobile keyboard
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const viewportHeight = window.visualViewport?.height || window.innerHeight
        const windowHeight = window.screen.height
        const heightDifference = windowHeight - viewportHeight

        // If height difference is significant (keyboard is showing)
        setKeyboardVisible(heightDifference > 150)
      }
    }

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => window.visualViewport.removeEventListener('resize', handleResize)
    }
  }, [])

  // Check if password is correct
  const correctPassword = process.env.NEXT_PUBLIC_RECIPE
  const isPasswordCorrect = password === correctPassword && password.length > 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setIsLoading(true)

    // Simulate login verification
    setTimeout(() => {
      // Username can be empty, only password matters
      if (isPasswordCorrect) {
        onLogin(selectedRole as 'admin' | 'worker' | 'guest')
      } else {
        alert("Ungültiges Passwort")
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleRoleSelect = (role: 'admin' | 'worker' | 'guest') => {
    setSelectedRole(role)
    // All roles now require login
  }

  const resetSelection = () => {
    setSelectedRole(null)
    setUsername("")
    setPassword("")
  }

  // Handle input focus for mobile
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(true)

    // Scroll into view on mobile with delay for keyboard
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
    }
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
  }

  // Get role-specific styling
  const getRoleConfig = (role: 'admin' | 'worker' | 'guest') => {
    switch (role) {
      case 'admin':
        return {
          bgColor: 'from-red-500 to-rose-500',
          cardBorder: 'border-red-200/50 dark:border-red-700/50',
          title: 'Administrator',
          buttonColor: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
        }
      case 'worker':
        return {
          bgColor: 'from-blue-500 to-indigo-500',
          cardBorder: 'border-blue-200/50 dark:border-blue-700/50',
          title: 'Mitarbeiter',
          buttonColor: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
        }
      case 'guest':
        return {
          bgColor: 'from-green-500 to-emerald-500',
          cardBorder: 'border-green-200/50 dark:border-green-700/50',
          title: 'Gast',
          buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
        }
      default:
        return {
          bgColor: 'from-gray-500 to-gray-600',
          cardBorder: 'border-gray-200/50 dark:border-gray-700/50',
          title: 'Benutzer',
          buttonColor: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
        }
    }
  }

  if (selectedRole) {
    const roleConfig = getRoleConfig(selectedRole)
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex justify-center p-4 transition-all duration-300 ${(isInputFocused || keyboardVisible) ? 'items-start pt-8 md:items-center md:pt-4' : 'items-center'}`}>
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 bg-gradient-to-r ${roleConfig.bgColor} rounded-full flex items-center justify-center shadow-lg mx-auto mb-4`}>
              {selectedRole === 'admin' && <Shield className="h-10 w-10 text-white" />}
              {selectedRole === 'worker' && <Users className="h-10 w-10 text-white" />}
              {selectedRole === 'guest' && <UserCheck className="h-10 w-10 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {roleConfig.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Melden Sie sich mit Ihren Anmeldedaten an
            </p>
          </div>

          {/* Login Form */}
          <Card className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl ${roleConfig.cardBorder} shadow-2xl`}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-center text-gray-900 dark:text-white">
                Anmeldung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Benutzername
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Benutzername eingeben (optional)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="pl-10 bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="pl-10 bg-white/70 dark:bg-gray-700/70 border-gray-200 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetSelection}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Zurück
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || password.length === 0}
                    className={`flex-1 text-white shadow-lg transition-all duration-300 ${
                      isPasswordCorrect
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        : roleConfig.buttonColor
                    }`}
                  >
                    {isLoading ? "Anmelden..." : "Anmelden"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl mx-auto mb-6">
            <ChefHat className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Wählen Sie Ihre Rolle, um fortzufahren
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Administrator */}
          <Card
            className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelect('admin')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-4">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Administrator
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Vollzugriff auf alle Funktionen und Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 mb-4">
                <Lock className="h-4 w-4" />
                <span>Anmeldung erforderlich</span>
              </div>
              <Button className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md">
                Anmelden
              </Button>
            </CardContent>
          </Card>

          {/* Trabajadores */}
          <Card
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelect('worker')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-4">
                <Users className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Mitarbeiter
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Zugriff auf Rezeptverwaltung und Digitalisierung
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-4">
                <Lock className="h-4 w-4" />
                <span>Anmeldung erforderlich</span>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md">
                Fortfahren
              </Button>
            </CardContent>
          </Card>

          {/* Invitados */}
          <Card
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
            onClick={() => handleRoleSelect('guest')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto mb-4">
                <UserCheck className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Gast
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Eingeschränkter Zugriff zum Durchsuchen von Rezepten
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
                <Lock className="h-4 w-4" />
                <span>Anmeldung erforderlich</span>
              </div>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md">
                Als Gast fortfahren
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rezept Digitalisierung System © 2025 Lweb Schweiz
          </p>
        </div>
      </div>
    </div>
  )
}