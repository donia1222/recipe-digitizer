"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, Scan, ChefHat, ArrowRight, Users, Heart, BookOpen, LogOut, Shield, Plus, Send } from "lucide-react"

interface HomeDashboardProps {
  onStartDigitalization: () => void
  handleLogout: () => void
  onOpenArchive: () => void
  onOpenUsers: () => void
  userRole: 'admin' | 'worker' | 'guest' | null
}

export default function HomeDashboard({ onStartDigitalization, handleLogout, onOpenArchive, onOpenUsers, userRole }: HomeDashboardProps) {
  const router = useRouter()
  const [typedText, setTypedText] = useState("")
  const fullText = "Digitalisieren, erstellen und entdecken Sie Rezepte mit modernster KI-Technologie"

  useEffect(() => {
    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, 50) // Velocidad de escritura (50ms por caracter)

    return () => clearInterval(typingInterval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b-4 border-blue-500 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-800">
                    Büelriet
                  </h1>
                  <p className="text-sm text-blue-600/80">
                    Digitale Rezeptsammlung
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
    
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 dark:from-red-900/30 dark:to-red-800/30 border-red-200/50 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-full px-4 py-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 sm:px-6 pt-32 sm:pt-36 lg:pt-40 pb-12">
        {/* Navegación principal */}
        <div className="mb-12">
          <div className="text-center mb-8">


          </div>

          {/* Botón principal de Digitalizar - Para admin y trabajadores */}
          {(userRole === 'admin' || userRole === 'worker') && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card
                className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-600/20 dark:to-indigo-600/20 border-blue-200/50 dark:border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                onClick={onStartDigitalization}
              >
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <Scan className="h-10 w-10 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Rezepte Digitalisieren
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                        Scannen oder fotografieren Sie Ihre Rezepte, um sie zu digitalisieren
                      </p>
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-sm text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          <span>Foto machen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span>Bild hochladen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scan className="h-4 w-4" />
                          <span>Scannen</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <ArrowRight className="h-8 w-8 text-blue-500 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Contenedores principales basados en rol */}
        <div className={`grid gap-6 max-w-6xl mx-auto mb-8 ${
          userRole === 'admin' ? 'grid-cols-1 md:grid-cols-2' :
          userRole === 'worker' ? 'grid-cols-1 md:grid-cols-2' :
          userRole === 'guest' ? 'grid-cols-1 max-w-2xl' :
          'grid-cols-1 md:grid-cols-3'
        }`}>
          {/* Rezept Archiv - Visible para todos */}
          <Card
            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={onOpenArchive}
          >
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Rezept Archiv
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Ihre digitalisierten Rezepte nach Kategorien organisieren und bearbeiten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="h-4 w-4" />
                  <span>Rezepte verwalten</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <ChefHat className="h-4 w-4" />
                  <span>Kategorien erstellen</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Heart className="h-4 w-4" />
                  <span>Favoriten markieren</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benutzer Profil - Solo para trabajadores */}
          {userRole === 'worker' && (
            <Card
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={onOpenUsers}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Benutzer Profil
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Eigene Rezepte erstellen, verwalten und zur Sammlung beitragen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Plus className="h-4 w-4" />
                    <span>Rezepte erstellen</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <BookOpen className="h-4 w-4" />
                    <span>Eigene Sammlung</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Send className="h-4 w-4" />
                    <span>Admin Freigabe</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Administrator - Solo para admins */}
          {userRole === 'admin' && (
            <Card
              className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                 Administration
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Verwalten von Benutzern, Rezepten, Subadministratoren und Systemkonfiguration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <ArrowRight className="h-4 w-4" />
                  <span>Admin</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>

    </div>
  )
}