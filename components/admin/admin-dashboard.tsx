"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Shield,
  Users,
  ChefHat,
  Bell,
  Eye,
  Clock,
  AlertTriangle,
  Brain,
  Sparkles,
  MessageCircle,
  Bot,
  Utensils,
} from "lucide-react"
import RecipeManagement from "./recipe-management"
import UserManagement from "./user-management"
import SubAdminManagement from "./sub-admin-management"
import PendingRecipes from "./pending-recipes"
import type { PendingRecipe, User, SubAdmin } from "@/types" // Declare types
import { UserService } from "@/lib/services/userService"
import { RecipeService } from "@/lib/services/recipeService"

export default function AdminDashboard() {
  const router = useRouter()

  const [currentView, setCurrentView] = useState<"dashboard" | "recipes" | "users" | "subadmins" | "pending">(
    "dashboard",
  )
  const [pendingRecipes, setPendingRecipes] = useState<PendingRecipe[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [notifications, setNotifications] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [totalRecipes, setTotalRecipes] = useState(0)

  // Load users and data from database on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load users from database
        const usersFromDB = await UserService.getAllUsers()
        console.log('👥 Usuarios cargados desde BD:', usersFromDB)

        // Transform users to match the UI interface (filter out 'user' role)
        const transformedUsers = usersFromDB
          .filter(user => ['admin', 'worker', 'guest'].includes(user.role)) // Only include valid roles
          .map(user => ({
            id: user.id ? user.id.toString() : `user_${Date.now()}`,
            name: user.name || user.username || 'Sin nombre',
            email: user.email,
            role: user.role as 'admin' | 'worker' | 'guest',
            status: (user.active === 1 || user.active === true || user.status === 'active') ? 'active' : 'inactive' as 'active' | 'inactive',
            lastLogin: user.last_active || user.last_login || new Date().toISOString().split('T')[0],
            recipesCount: user.recipes_created || 0,
            joinDate: user.created_at ? user.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          }))

        setUsers(transformedUsers)

        // Load sub-admins from database
        const subAdminsFromDB = await UserService.getAllSubAdmins()
        console.log('🛡️ Sub-admins cargados desde BD:', subAdminsFromDB)

        // Transform sub-admins to match UI interface
        const transformedSubAdmins = subAdminsFromDB.map(subAdmin => ({
          id: subAdmin.id?.toString() || subAdmin.sub_admin_id,
          name: subAdmin.name,
          email: subAdmin.email,
          permissions: subAdmin.permissions,
          createdDate: subAdmin.created_at ? subAdmin.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: subAdmin.status as 'active' | 'inactive',
          lastLogin: new Date().toISOString().split('T')[0]
        }))

        setSubAdmins(transformedSubAdmins)

        // Load approved recipes count
        const recipesFromDB = await RecipeService.getAll()
        const approvedCount = recipesFromDB.length // Todos los de 'recipes' son aprobados
        setTotalRecipes(approvedCount)

        // Load PENDING recipes from pending-recipes API
        try {
          const pendingResponse = await fetch('https://web.lweb.ch/recipedigitalizer/apis/pending-recipes.php', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
          })

          if (pendingResponse.ok) {
            const pendingResult = await pendingResponse.json()
            if (pendingResult.success && pendingResult.data) {
              const pendingCount = pendingResult.data.length
              setNotifications(pendingCount)

              // Set pending recipes for the component
              const pendingRecipesList = pendingResult.data.map((r: any) => ({
                id: r.id,
                title: r.title || 'Sin título',
                author: r.user_name || 'Desconocido',
                user: r.user_name || 'Desconocido',
                date: r.created_at || new Date().toISOString(),
                submittedAt: r.created_at || new Date().toISOString(),
                status: 'pending' as const,
                image: r.image_url || r.image_base64 || '',
                analysis: r.analysis || ''
              }))
              setPendingRecipes(pendingRecipesList)
            } else {
              console.log('No pending recipes found')
              setNotifications(0)
              setPendingRecipes([])
            }
          }
        } catch (pendingError) {
          console.error('Error loading pending recipes:', pendingError)
          setNotifications(0)
          setPendingRecipes([])
        }

      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleBackToMain = () => {
    setIsNavigating(true)
    router.push("/")
  }

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    color,
    onClick,
  }: {
    title: string
    value: string | number
    description: string
    icon: any
    color: string
    onClick?: () => void
  }) => (
    <Card
      className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? "cursor-pointer hover:border-gray-300" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
            {value}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-gray-900 text-lg mb-1">{title}</CardTitle>
        <CardDescription className="text-gray-600 text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  )

  const DashboardView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        <StatCard
          title="Ausstehende Rezepte"
          value={pendingRecipes.filter((r) => r.status === "pending").length}
          description="Neue Rezepte zur Überprüfung"
          icon={Clock}
          color="bg-amber-500"
          onClick={() => setCurrentView("pending")}
        />
        <StatCard
          title="Aktive Benutzer"
          value={users.filter((u) => u.status === "active").length}
          description="Registrierte Benutzer"
          icon={Users}
          color="bg-blue-500"
          onClick={() => setCurrentView("users")}
        />
        <StatCard
          title="Gesamte Rezepte"
          value={totalRecipes}
          description="Genehmigte Rezepte"
          icon={ChefHat}
          color="bg-green-500"
          onClick={() => router.push("/recipe-archive")}
        />

      </div>

      {notifications > 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-gray-700" />
              <CardTitle className="text-gray-900">Wichtige Benachrichtigungen</CardTitle>
              <Badge className="bg-blue-500 text-white">{notifications}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-gray-800">{notifications} Rezepte warten auf Genehmigung</span>
                </div>
                <Button
                  onClick={() => setCurrentView("pending")}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Überprüfen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">Letzte Aktivitäten</CardTitle>
          <CardDescription className="text-gray-600">Neueste Aktionen im System</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRecipes.slice(0, 3).map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ChefHat className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{recipe.title}</p>
                    <p className="text-sm text-gray-600">Gesendet von {recipe.user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Ausstehend
                  </Badge>
                  <span className="text-sm text-gray-500">{recipe.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBackToMain}
                disabled={isNavigating}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg w-10 h-10 p-0 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                title="Zurück zur Startseite"
              >
                <ArrowLeft className={`h-4 w-4 ${isNavigating ? "animate-pulse" : ""}`} />
              </Button>
              <div className="flex items-center gap-3">
        
                <div>

                  <p className="text-sm text-gray-600">Verwaltungspanel</p>
                </div>
              </div>
            </div>
            

            {notifications > 0 && (
              <Button
                onClick={() => setCurrentView("pending")}
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50 relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Benachrichtigungen
                <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white">{notifications}</Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {currentView !== "dashboard" && (
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setCurrentView("dashboard")}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="text-sm text-gray-500">
                / {currentView === "recipes" && "Rezepteverwaltung"}
                {currentView === "users" && "Benutzerverwaltung"}
                {currentView === "subadmins" && "Sub-Administratoren"}
                {currentView === "pending" && "Ausstehende Rezepte"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {currentView === "dashboard" && <DashboardView />}
        {currentView === "recipes" && <RecipeManagement />}
        {currentView === "users" && <UserManagement users={users} setUsers={setUsers} />}
        {currentView === "subadmins" && <SubAdminManagement subAdmins={subAdmins} setSubAdmins={setSubAdmins} />}
        {currentView === "pending" && (
          <PendingRecipes
            pendingRecipes={pendingRecipes}
            setPendingRecipes={setPendingRecipes}
            setNotifications={setNotifications}
          />
        )}
      </div>
    </div>
  )
}
