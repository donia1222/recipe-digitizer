"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Brain,
  Search,
  Download,
  Sparkles,
  Edit,


} from "lucide-react"

interface HomeDashboardProps {
  onStartDigitalization: () => void
  handleLogout: () => void
  onOpenArchive: () => void
  onOpenUsers: () => void
  onOpenManualRecipes?: () => void
  userRole: "admin" | "worker" | "guest" | null
  onBackToLanding?: () => void
}

export default function HomeDashboard({
  onStartDigitalization,
  handleLogout,
  onOpenArchive,
  onOpenUsers,
  onOpenManualRecipes,
  userRole,
  onBackToLanding,
}: HomeDashboardProps) {
  const router = useRouter()
  const [typedText, setTypedText] = useState("")
  const [pendingNotifications, setPendingNotifications] = useState(0)
  const [pendingRecipes, setPendingRecipes] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
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

  // Load pending recipes notifications (only for admin)
  useEffect(() => {
    const loadPendingRecipes = async () => {
      if (userRole !== 'admin') return

      try {
        const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/pending-recipes.php', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache'
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const pendingCount = result.data.length

            // Fix user names - convert "Usuario #3182" to proper names
            const fixedRecipes = result.data.map((recipe: any) => {
              let displayUserName = recipe.user_name || 'Unbekannt'

              // SIEMPRE convertir Usuario # a Admin
              if (displayUserName.includes('Usuario #') || displayUserName.startsWith('Usuario #')) {
                displayUserName = 'Admin'
                console.log('🔧 Converting', recipe.user_name, 'to Admin in notifications')
              }

              return {
                ...recipe,
                user_name: displayUserName
              }
            })

            setPendingNotifications(pendingCount)
            setPendingRecipes(fixedRecipes)
            console.log('📧 Loaded pending notifications:', pendingCount)
          } else {
            setPendingNotifications(0)
            setPendingRecipes([])
          }
        }
      } catch (error) {
        console.error('Error loading pending recipes:', error)
        setPendingNotifications(0)
        setPendingRecipes([])
      }
    }

    loadPendingRecipes()
  }, [userRole])

  const handleNotificationClick = () => {
    // Close dropdown and navigate to admin panel pending recipes view
    setShowNotifications(false)
    router.push('/admin?view=pending')
  }

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-notification-dropdown]')) {
          setShowNotifications(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

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
                <h1 className="text-lg font-semibold text-gray-900">Rezept Archiv</h1>
                  <p className="text-sm text-gray-600">Pflege- und Betreuungszentrum Büelriet</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications Bell - Only for Admin */}
              {userRole === 'admin' && pendingNotifications > 0 && (
                <div className="relative" data-notification-dropdown>
                  <Button
                    onClick={() => setShowNotifications(!showNotifications)}
                    variant="outline"
                    size="sm"
                    className="relative border-gray-300 hover:bg-gray-50"
                  >
                    <Shield className="h-4 w-4" />
                    {pendingNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                        {pendingNotifications}
                      </Badge>
                    )}
                  </Button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                         Ausstehende Rezepte
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {pendingRecipes.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            Keine ausstehenden Rezepte
                          </div>
                        ) : (
                          pendingRecipes.slice(0, 5).map((recipe: any) => (
                            <div
                              key={recipe.id}
                              onClick={handleNotificationClick}
                              className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  <ChefHat className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {recipe.title || 'Neues Rezept'}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Von: {recipe.user_name || 'Unbekannt'}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(recipe.created_at || Date.now()).toLocaleDateString('de-DE')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {pendingRecipes.length > 0 && (
                        <div className="p-4 border-t border-gray-200">
                          <Button
                            onClick={handleNotificationClick}
                            className="w-full text-sm"
                            size="sm"
                          >
                            Alle anzeigen ({pendingNotifications})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
          <div className="max-w-6xl mx-auto mb-12">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card
                className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={onStartDigitalization}
              >
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-200 transition-colors duration-200 mb-4">
                    <Scan className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Rezepte Digitalisieren</CardTitle>
                  <CardDescription className="text-gray-600">
                    Scannen oder fotografieren Sie Ihre Rezepte, um sie zu digitalisieren
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Camera className="h-4 w-4" />
                      <span>Foto machen</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Upload className="h-4 w-4" />
                      <span>Bild hochladen</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Scan className="h-4 w-4" />
                      <span>Scannen</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {onOpenManualRecipes && (
                <Card
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={onOpenManualRecipes}
                >
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-green-200 transition-colors duration-200 mb-4">
                      <Edit className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">Manuelle Rezepte</CardTitle>
                    <CardDescription className="text-gray-600">
                      Erstellen Sie Rezepte von Hand mit unserem benutzerfreundlichen Formular
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Edit className="h-4 w-4" />
                        <span>Rezept schreiben</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Plus className="h-4 w-4" />
                        <span>Zutaten hinzufügen</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Send className="h-4 w-4" />
                        <span>An Admin senden</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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
                {userRole === 'guest'
                  ? 'Rezepte ansehen und durchsuchen'
                  : 'Ihre digitalisierten Rezepte nach Kategorien organisieren und bearbeiten'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRole === 'guest' ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="h-4 w-4" />
                      <span>Rezepte ansehen</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Search className="h-4 w-4" />
                      <span>Bibliothek durchsuchen</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MessageCircle className="h-4 w-4" />
                      <span>Kommentare lesen</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Download className="h-4 w-4" />
                      <span>Rezepte herunterladen</span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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

        {userRole === "admin" && (
          <div className="max-w-6xl mx-auto mb-8">
            <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-200 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        KI-Funktionen
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Künstliche Intelligenz für Ihre Küche</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Admin</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Rezepte mit KI erstellen */}
                  <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                            Rezepte mit KI erstellen
                          </CardTitle>
                          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full w-fit mb-3">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">Bald verfügbar</span>
                          </div>
                          <CardDescription className="text-sm text-gray-600 leading-relaxed">
                            Lassen Sie unsere KI neue, kreative Rezepte für Sie entwickeln
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Gericht Analysieren */}
                  <Card className="group bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Utensils className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                            Gericht Analysieren
                          </CardTitle>
                          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full w-fit mb-3">
                            <Utensils className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Bald verfügbar</span>
                          </div>
                          <CardDescription className="text-sm text-gray-600 leading-relaxed">
                            Fotografieren Sie ein Gericht und erhalten Sie das passende Rezept
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Koch-Experte Chat */}
                  <Card className="group bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">
                            Koch-Experte Chat
                          </CardTitle>
                          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full w-fit mb-3">
                            <Bot className="h-3 w-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-700">Bald verfügbar</span>
                          </div>
                          <CardDescription className="text-sm text-gray-600 leading-relaxed">
                            Stellen Sie Fragen an unseren KI-Koch-Experten
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
