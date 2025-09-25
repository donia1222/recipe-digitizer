"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
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
  ArrowDown,
  ArrowUp,
  Utensils,
  MessageCircle,
  Bot,
  Brain ,
  Sparkles,


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
    <div className="min-h-screen bg-gray-50">
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

      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
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

        <div
          className={`grid gap-6 max-w-6xl mx-auto mb-8 ${
            userRole === "admin"
              ? "grid-cols-1 md:grid-cols-2"
              : userRole === "worker"
                ? "grid-cols-1 md:grid-cols-2"
                : userRole === "guest"
                  ? "grid-cols-1 max-w-2xl"
                  : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          <Card
            className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
            onClick={onOpenArchive}
          >
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-emerald-200 transition-colors duration-200 mb-4">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Rezept Archiv</CardTitle>
              <CardDescription className="text-gray-600">
                Ihre digitalisierten Rezepte nach Kategorien organisieren und bearbeiten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BookOpen className="h-4 w-4" />
                  <span>Rezepte verwalten</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ChefHat className="h-4 w-4" />
                  <span>Kategorien erstellen</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Heart className="h-4 w-4" />
                  <span>Favoriten markieren</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {userRole === "worker" && (
            <Card
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
              onClick={onOpenUsers}
            >
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-200 transition-colors duration-200 mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Benutzer Profil</CardTitle>
                <CardDescription className="text-gray-600">
                  Eigene Rezepte erstellen, verwalten und zur Sammlung beitragen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Plus className="h-4 w-4" />
                    <span>Rezepte erstellen</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BookOpen className="h-4 w-4" />
                    <span>Eigene Sammlung</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Send className="h-4 w-4" />
                    <span>Admin Freigabe</span>
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
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-red-200 transition-colors duration-200 mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Administration</CardTitle>
                <CardDescription className="text-gray-600">
                  Verwalten von Benutzern, Rezepten, Subadministratoren und Systemkonfiguration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ArrowRight className="h-4 w-4" />
                  <span>Admin Panel</span>
                </div>
              </CardContent>
            </Card>
          )}
          
        </div>
           <Card className="bg-white border border-gray-200 shadow-sm">        <CardHeader>
          <CardTitle className="text-gray-900">KI-Funktionen</CardTitle>
           <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                  </div>


        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-purple-50 border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">Rezepte mit KI erstellen</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-purple-600 mt-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Bald verfügbar</span>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Lassen Sie unsere KI neue, kreative Rezepte für Sie entwickeln
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-green-50 border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Utensils className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">Gericht Analysieren</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                      <Utensils className="h-3 w-3" />
                      <span>Bald verfügbar</span>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Fotografieren Sie ein Gericht und erhalten Sie das passende Rezept
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-orange-50 border-orange-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900">Koch-Experte Chat</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-orange-600 mt-1">
                      <Bot className="h-3 w-3" />
                      <span>Bald verfügbar</span>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Stellen Sie Fragen an unseren KI-Koch-Experten
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>


      </div>
    </div>
  )
}
