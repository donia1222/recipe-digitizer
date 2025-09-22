"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users, UserCheck, ArrowLeft, Lock, User, Eye, EyeOff } from "lucide-react"

interface LoginPageProps {
  onLogin: (role: "admin" | "worker" | "guest") => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<"admin" | "worker" | "guest" | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Detect mobile keyboard
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const viewportHeight = window.visualViewport?.height || window.innerHeight
        const windowHeight = window.screen.height
        const heightDifference = windowHeight - viewportHeight

        // If height difference is significant (keyboard is showing)
        setKeyboardVisible(heightDifference > 150)
      }
    }

    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
      return () => window.visualViewport?.removeEventListener("resize", handleResize)
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
        onLogin(selectedRole as "admin" | "worker" | "guest")
      } else {
        alert("Ungültiges Passwort")
      }
      setIsLoading(false)
    }, 1000)
  }

  const handleRoleSelect = (role: "admin" | "worker" | "guest") => {
    setSelectedRole(role)
  }

  const resetSelection = () => {
    setSelectedRole(null)
    setUsername("")
    setPassword("")
    setShowPassword(false)
  }

  // Handle input focus for mobile
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(true)

    // Scroll into view on mobile with delay for keyboard
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 300)
    }
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
  }

  const getRoleConfig = (role: "admin" | "worker" | "guest") => {
    switch (role) {
      case "admin":
        return {
          icon: Shield,
          title: "Administrator",
          description: "Vollzugriff auf alle Funktionen und Einstellungen",
          color: "text-slate-700 dark:text-slate-300",
          bgColor: "bg-slate-50 dark:bg-slate-800/50",
          borderColor: "border-slate-200 dark:border-slate-700",
          buttonColor: "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900",
        }
      case "worker":
        return {
          icon: Users,
          title: "Mitarbeiter",
          description: "Zugriff auf Rezeptverwaltung und Digitalisierung",
          color: "text-blue-700 dark:text-blue-300",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
          buttonColor: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
        }
      case "guest":
        return {
          icon: UserCheck,
          title: "Gast",
          description: "Eingeschränkter Zugriff zum Durchsuchen von Rezepten",
          color: "text-emerald-700 dark:text-emerald-300",
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
          borderColor: "border-emerald-200 dark:border-emerald-800",
          buttonColor: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
        }
      default:
        return {
          icon: User,
          title: "Benutzer",
          description: "",
          color: "text-gray-700 dark:text-gray-300",
          bgColor: "bg-gray-50 dark:bg-gray-800/50",
          borderColor: "border-gray-200 dark:border-gray-700",
          buttonColor: "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900",
        }
    }
  }

  if (selectedRole) {
    const roleConfig = getRoleConfig(selectedRole)
    const IconComponent = roleConfig.icon

    return (
      <div
        className={`min-h-screen  flex justify-center p-4 transition-all duration-300 ${isInputFocused || keyboardVisible ? "items-start pt-8 md:items-center md:pt-4" : "items-center"}`}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div
              className={`w-16 h-16 ${roleConfig.bgColor} ${roleConfig.borderColor} border-2 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm`}
            >
              <IconComponent className={`h-8 w-8 ${roleConfig.color}`} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{roleConfig.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Melden Sie sich mit Ihren Anmeldedaten an</p>
          </div>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-xl font-semibold text-center text-gray-900 dark:text-white">
                Anmeldung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Benutzername
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Benutzername eingeben (optional)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="pl-10 h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="pl-10 pr-10 h-11 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetSelection}
                    className="flex-1 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || password.length === 0}
                    className={`flex-1 h-11 text-white font-medium transition-all duration-200 ${
                      isPasswordCorrect ? "bg-emerald-600 hover:bg-emerald-700" : roleConfig.buttonColor
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
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 text-balance mt-14">Willkommen</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-pretty">
            Wählen Sie Ihre Rolle, um fortzufahren
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["admin", "worker", "guest"] as const).map((role) => {
            const config = getRoleConfig(role)
            const IconComponent = config.icon

            return (
              <Card
                key={role}
                className={`${config.bgColor} ${config.borderColor} border-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group`}
                onClick={() => handleRoleSelect(role)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 mx-auto mb-4 border border-gray-200 dark:border-gray-700">
                    <IconComponent className={`h-8 w-8 ${config.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">{config.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 text-pretty">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <Lock className="h-3 w-3" />
                    <span>Anmeldung erforderlich</span>
                  </div>
                  <Button
                    className={`w-full h-10 text-white font-medium ${config.buttonColor} transition-colors duration-200`}
                  >
                    {role === "guest" ? "Als Gast fortfahren" : "Anmelden"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-16">
          <p className="text-xs text-gray-500 dark:text-gray-400">Rezept Digitalisierung System © 2025 Lweb Schweiz</p>
        </div>
      </div>
    </div>
  )
}
