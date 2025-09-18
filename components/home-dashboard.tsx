"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, Scan, ChefHat, Brain, Eye, MessageCircle, ArrowRight, Sparkles, Utensils, Bot, Users, Heart, BookOpen, LogOut, Shield } from "lucide-react"

interface HomeDashboardProps {
  onStartDigitalization: () => void
  handleLogout: () => void
}

export default function HomeDashboard({ onStartDigitalization, handleLogout }: HomeDashboardProps) {
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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
       
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                className="bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 rounded-full px-4 py-2"
                title="Panel de Administración"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
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

          {/* Botón principal de Digitalizar */}
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
        </div>

        {/* 3 Contenedores principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
          {/* Rezept Archiv - PRIMER LUGAR */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Rezept Archiv
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Das Archiv der digitalisierten Rezepte durchsuchen und entdecken
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <BookOpen className="h-4 w-4" />
                <span>Bald verfügbar</span>
              </div>
            </CardContent>
          </Card>

          {/* Benutzer Management - SEGUNDO LUGAR */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Benutzer
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Ihre Rezepte verwalten, neue Rezepte zum Inventar hinzufügen, Zusammenarbeit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Heart className="h-4 w-4" />
                <span>Bald verfügbar</span>
              </div>
            </CardContent>
          </Card>

          {/* Administrator - TERCER LUGAR */}
          <Card
            className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={() => window.location.href = '/admin'}
          >
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
               Administrationsbereich
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
        </div>

        {/* 3 Contenedores adicionales rectangulares */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Crear recetas con IA */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-700/50 shadow-md hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Rezepte mit KI erstellen
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 mt-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Bald verfügbar</span>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                Lassen Sie unsere KI neue, kreative Rezepte für Sie entwickeln
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Analizar plato */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50 shadow-md hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Gericht Analysieren
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mt-1">
                    <Utensils className="h-3 w-3" />
                    <span>Bald verfügbar</span>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                Fotografieren Sie ein Gericht und erhalten Sie das passende Rezept
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Bot experto */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/50 dark:border-orange-700/50 shadow-md hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Koch-Experte Chat
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 mt-1">
                    <Bot className="h-3 w-3" />
                    <span>Bald verfügbar</span>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                Stellen Sie Fragen an unseren KI-Koch-Experten
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}