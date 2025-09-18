"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Users, ChefHat, Bell, Settings, BookOpen, UserCheck, UserPlus, Trash2, Eye, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import RecipeManagement from "./recipe-management"
import UserManagement from "./user-management"
import SubAdminManagement from "./sub-admin-management"
import PendingRecipes from "./pending-recipes"

interface PendingRecipe {
  id: string
  title: string
  user: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
}

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'worker' | 'guest'
  status: 'active' | 'inactive'
  lastLogin: string
}

interface SubAdmin {
  id: string
  name: string
  email: string
  permissions: string[]
  createdDate: string
  status: 'active' | 'inactive'
}

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'recipes' | 'users' | 'subadmins' | 'pending'>('dashboard')
  const [pendingRecipes, setPendingRecipes] = useState<PendingRecipe[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([])
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    // Simular datos iniciales
    setPendingRecipes([
      {
        id: '1',
        title: 'Traditionelle Spaghetti Carbonara',
        user: 'Maria Schmidt',
        date: '2025-01-18',
        status: 'pending'
      },
      {
        id: '2',
        title: 'Authentische Paella Valenciana',
        user: 'Hans Müller',
        date: '2025-01-17',
        status: 'pending'
      },
      {
        id: '3',
        title: 'Hausgemachte Schokoladentorte',
        user: 'Anna Weber',
        date: '2025-01-16',
        status: 'pending'
      }
    ])

    setUsers([
      {
        id: '1',
        name: 'Maria Schmidt',
        email: 'maria.schmidt@email.com',
        role: 'user',
        status: 'active',
        lastLogin: '2025-01-18'
      },
      {
        id: '2',
        name: 'Hans Müller',
        email: 'hans.mueller@email.com',
        role: 'user',
        status: 'active',
        lastLogin: '2025-01-17'
      },
      {
        id: '3',
        name: 'Anna Weber',
        email: 'anna.weber@email.com',
        role: 'worker',
        status: 'active',
        lastLogin: '2025-01-16'
      }
    ])

    setSubAdmins([
      {
        id: '1',
        name: 'Klaus Administrator',
        email: 'klaus@admin.com',
        permissions: ['recipes', 'users'],
        createdDate: '2025-01-10',
        status: 'active'
      }
    ])

    setNotifications(pendingRecipes.filter(r => r.status === 'pending').length)
  }, [])

  const handleBackToMain = () => {
    window.location.href = '/'
  }

  const StatCard = ({ title, value, description, icon: Icon, color, onClick }: {
    title: string
    value: string | number
    description: string
    icon: any
    color: string
    onClick?: () => void
  }) => (
    <Card
      className={`${color} border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Icon className="h-8 w-8 text-white" />
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {value}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-white text-lg mb-1">{title}</CardTitle>
        <CardDescription className="text-white/80 text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  )

  const DashboardView = () => (
    <div className="space-y-8">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ausstehende Rezepte"
          value={pendingRecipes.filter(r => r.status === 'pending').length}
          description="Neue Rezepte zur Überprüfung"
          icon={Clock}
          color="bg-gradient-to-br from-yellow-500 to-amber-600"
          onClick={() => setCurrentView('pending')}
        />
        <StatCard
          title="Aktive Benutzer"
          value={users.filter(u => u.status === 'active').length}
          description="Registrierte Benutzer"
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          onClick={() => setCurrentView('users')}
        />
        <StatCard
          title="Gesamte Rezepte"
          value="127"
          description="Genehmigte Rezepte"
          icon={ChefHat}
          color="bg-gradient-to-br from-green-500 to-emerald-600"
          onClick={() => setCurrentView('recipes')}
        />
        <StatCard
          title="Sub-Administratoren"
          value={subAdmins.length}
          description="Delegierte Administratoren"
          icon={Shield}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          onClick={() => setCurrentView('subadmins')}
        />
      </div>

      {/* Sección de notificaciones */}
      {notifications > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              <CardTitle className="text-gray-800 dark:text-gray-200">
                Wichtige Benachrichtigungen
              </CardTitle>
              <Badge variant="destructive" className="bg-slate-600">{notifications}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-800 dark:text-gray-200">
                    {notifications} Rezepte warten auf Genehmigung
                  </span>
                </div>
                <Button
                  onClick={() => setCurrentView('pending')}
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Überprüfen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schnellaktionen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Schnellaktionen
          </CardTitle>
          <CardDescription>
            Verwalten Sie die Hauptaspekte des Systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setCurrentView('recipes')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-16 flex-col gap-2"
            >
              <BookOpen className="h-5 w-5" />
              Rezepte verwalten
            </Button>
            <Button
              onClick={() => setCurrentView('users')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-16 flex-col gap-2"
            >
              <UserCheck className="h-5 w-5" />
              Benutzer verwalten
            </Button>
            <Button
              onClick={() => setCurrentView('subadmins')}
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white h-16 flex-col gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Sub-Administratoren
            </Button>
            <Button
              onClick={() => setCurrentView('pending')}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white h-16 flex-col gap-2"
            >
              <Clock className="h-5 w-5" />
              Ausstehende Rezepte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Letzte Aktivitäten */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
          <CardDescription>Neueste Aktionen im System</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRecipes.slice(0, 3).map((recipe) => (
              <div key={recipe.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <ChefHat className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{recipe.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gesendet von {recipe.user}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-600 border-slate-600">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-xl border-b border-blue-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleBackToMain}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full w-10 h-10 p-0"
                title="Zurück zur Startseite"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Verwaltungspanel
                  </h1>
                  <p className="text-sm text-blue-100">
                    Vollständige Systemverwaltung
                  </p>
                </div>
              </div>
            </div>

            {notifications > 0 && (
              <Button
                onClick={() => setCurrentView('pending')}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Benachrichtigungen
                <Badge className="absolute -top-2 -right-2 bg-slate-600 text-white">
                  {notifications}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navegación de vistas */}
      {currentView !== 'dashboard' && (
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setCurrentView('dashboard')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                / {currentView === 'recipes' && 'Rezepteverwaltung'}
                {currentView === 'users' && 'Benutzerverwaltung'}
                {currentView === 'subadmins' && 'Sub-Administratoren'}
                {currentView === 'pending' && 'Ausstehende Rezepte'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-8">
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'recipes' && <RecipeManagement />}
        {currentView === 'users' && <UserManagement users={users} setUsers={setUsers} />}
        {currentView === 'subadmins' && <SubAdminManagement subAdmins={subAdmins} setSubAdmins={setSubAdmins} />}
        {currentView === 'pending' && <PendingRecipes pendingRecipes={pendingRecipes} setPendingRecipes={setPendingRecipes} setNotifications={setNotifications} />}
      </div>
    </div>
  )
}