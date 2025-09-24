"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Camera,
  Upload,
  Scan,
  ChefHat,
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  BookOpen,
  LogOut,
  Shield,
  Plus,
  Send,
  Cookie,
  UtensilsCrossed,
  Coffee,
  Apple,
  Wheat,
  Droplets,
} from "lucide-react"

interface HomeDashboardProps {
  onStartDigitalization: () => void
  handleLogout: () => void
  onOpenArchive: () => void
  onOpenUsers: () => void
  userRole: "admin" | "worker" | "guest" | null
  onBackToLanding?: () => void
}

export default function HomeDashboard({
  onStartDigitalization,
  handleLogout,
  onOpenArchive,
  onOpenUsers,
  userRole,
  onBackToLanding,
}: HomeDashboardProps) {
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
    }, 50)

    return () => clearInterval(typingInterval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        {/* Floating cooking icons with subtle animations */}
        <div className="absolute top-20 left-16 animate-pulse">
          <ChefHat className="h-8 w-8 text-blue-300/30" style={{ animationDuration: '4s' }} />
        </div>
        <div className="absolute top-32 right-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '6s' }}>
          <Cookie className="h-6 w-6 text-green-300/30" />
        </div>
        <div className="absolute top-64 left-1/4 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}>
          <UtensilsCrossed className="h-7 w-7 text-blue-400/25" />
        </div>
        <div className="absolute top-80 right-1/3 animate-bounce" style={{ animationDelay: '3s', animationDuration: '7s' }}>
          <Coffee className="h-5 w-5 text-green-400/30" />
        </div>
        <div className="absolute bottom-32 left-20 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }}>
          <Apple className="h-6 w-6 text-green-300/25" />
        </div>
        <div className="absolute bottom-48 right-24 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '6.5s' }}>
          <Wheat className="h-8 w-8 text-blue-300/20" />
        </div>
        <div className="absolute top-1/2 left-12 animate-pulse" style={{ animationDelay: '4s', animationDuration: '5.5s' }}>
          <Droplets className="h-5 w-5 text-blue-400/30" />
        </div>
        <div className="absolute bottom-20 right-1/4 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '8s' }}>
          <Heart className="h-6 w-6 text-green-300/20" />
        </div>
        <div className="absolute top-1/3 right-16 animate-pulse" style={{ animationDelay: '3.5s', animationDuration: '4s' }}>
          <Scan className="h-7 w-7 text-blue-300/25" />
        </div>

        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/10 to-transparent rounded-full blur-xl"></div>
        <div className="absolute top-20 right-0 w-24 h-24 bg-gradient-to-bl from-green-200/10 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-gradient-to-tr from-blue-200/08 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-gradient-to-tl from-green-200/08 to-transparent rounded-full blur-xl"></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
     

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-blue-600" />
                </div>
                <div>
      
                  <p className="text-sm text-gray-600">Rezeptsammlung</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleLogout}
                variant="outline"
               className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 bg-transparent"
              >
                <LogOut className="h-4 w-4 " />
              
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12 relative z-10">
        <div className="text-center mb-12">
      
        </div>

        {(userRole === "admin" || userRole === "worker") && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={onStartDigitalization}
            >
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors duration-200">
                      <Scan className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Rezepte Digitalisieren</h3>
                    <p className="text-lg text-gray-600 mb-6">
                      Scannen oder fotografieren Sie Ihre Rezepte, um sie zu digitalisieren
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-gray-500">
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
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col gap-6 max-w-4xl mx-auto mb-8">
          <Card
            className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
            onClick={onOpenArchive}
          >
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-200 transition-colors duration-200">
                    <BookOpen className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Rezept Archiv</h3>
                  <p className="text-gray-600 mb-4">
                    Ihre digitalisierten Rezepte nach Kategorien organisieren und bearbeiten
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Rezepte verwalten</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      <span>Kategorien erstellen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      <span>Favoriten markieren</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === "worker" && (
            <Card
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
              onClick={onOpenUsers}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-200 transition-colors duration-200">
                      <Users className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Benutzer Profil</h3>
                    <p className="text-gray-600 mb-4">
                      Eigene Rezepte erstellen, verwalten und zur Sammlung beitragen
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Rezepte erstellen</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Eigene Sammlung</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        <span>Admin Freigabe</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {userRole === "admin" && (
            <Card
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
              onClick={() => router.push("/admin")}
            >
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-red-200 transition-colors duration-200">
                      <Shield className="h-7 w-7 text-red-600" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Administration</h3>
                    <p className="text-gray-600 mb-4">
                      Verwalten von Benutzern, Rezepten, Subadministratoren und Systemkonfiguration
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Shield className="h-4 w-4" />
                      <span>Admin Panel öffnen</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
