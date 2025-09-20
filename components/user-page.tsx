"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft, ChefHat, Plus, Clock, Users, Send, Check, Bell, X,
  BookOpen, Image as ImageIcon, Utensils, Timer, Star, Calendar, LogOut
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface UserRecipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  preparation: string
  estimatedTime: string
  servings: number
  image?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  approvedAt?: string
  createdBy: string
}

interface Notification {
  id: string
  type: 'recipe_approved' | 'recipe_rejected'
  recipeId: string
  recipeName: string
  timestamp: string
  read: boolean
}

interface UserPageProps {
  onBack: () => void
  onOpenArchive: () => void
  onLogout?: () => void
}

const UserPage: React.FC<UserPageProps> = ({ onBack, onOpenArchive, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'history'>('overview')
  const [userRecipes, setUserRecipes] = useState<UserRecipe[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<UserRecipe | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const hasInitializedRef = useRef(false)

  // Emergency localStorage cleanup function
  const cleanupLocalStorage = () => {
    try {
      console.log('Starting emergency localStorage cleanup...')

      // Get all keys
      const allKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) allKeys.push(key)
      }

      // Remove unnecessary keys
      const keepKeys = ['userRecipes', 'userNotifications', 'recipeHistory', 'recipeFolders']
      allKeys.forEach(key => {
        if (!keepKeys.includes(key)) {
          localStorage.removeItem(key)
          console.log('Removed unnecessary key:', key)
        }
      })

      // Limit data in kept keys
      keepKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const parsed = JSON.parse(data)
            if (Array.isArray(parsed)) {
              let limited
              switch (key) {
                case 'userRecipes':
                  limited = parsed.slice(-5) // Keep only 5 user recipes
                  break
                case 'userNotifications':
                  limited = parsed.slice(-3) // Keep only 3 notifications
                  break
                case 'recipeHistory':
                  limited = parsed.slice(-10) // Keep only 10 history items
                  break
                case 'recipeFolders':
                  limited = parsed.slice(-5) // Keep only 5 folders
                  break
                default:
                  limited = parsed.slice(-5)
              }
              localStorage.setItem(key, JSON.stringify(limited))
              console.log(`Limited ${key} to ${limited.length} items`)
            }
          }
        } catch (error) {
          console.warn(`Error processing ${key}:`, error)
          localStorage.removeItem(key)
        }
      })

      console.log('Emergency cleanup completed')
    } catch (error) {
      console.error('Emergency cleanup failed:', error)
    }
  }

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [''],
    preparation: '',
    estimatedTime: '',
    servings: 2,
    image: ''
  })

  // Load user recipes and notifications from localStorage
  useEffect(() => {
    if (!hasInitializedRef.current) {
      try {
        // Run emergency cleanup first
        cleanupLocalStorage()

        const savedRecipes = localStorage.getItem('userRecipes')
        const savedNotifications = localStorage.getItem('userNotifications')

        if (savedRecipes) {
          try {
            const recipes = JSON.parse(savedRecipes)
            // Add createdBy field to existing recipes if missing
            const updatedRecipes = recipes.map((recipe: any) => ({
              ...recipe,
              createdBy: recipe.createdBy || 'Andrea Salvador'
            }))
            console.log('Loaded recipes:', updatedRecipes) // Debug log
            setUserRecipes(updatedRecipes)
          } catch (error) {
            console.error('Error loading recipes:', error)
            localStorage.removeItem('userRecipes')
            setUserRecipes([])
          }
        } else {
          setUserRecipes([])
        }

        if (savedNotifications) {
          try {
            const notifications = JSON.parse(savedNotifications)
            // Keep only last 10 notifications
            const limitedNotifications = notifications.slice(-10)
            setNotifications(limitedNotifications)
          } catch (error) {
            console.error('Error loading notifications:', error)
            localStorage.removeItem('userNotifications')
            setNotifications([])
          }
        } else {
          setNotifications([])
        }

        hasInitializedRef.current = true
      } catch (error) {
        console.error('Error during initialization:', error)
        hasInitializedRef.current = true
      }
    }
  }, [])

  // Save to localStorage when data changes (only after initialization)
  useEffect(() => {
    if (hasInitializedRef.current) {
      try {
        // Always limit to max 3 recipes to prevent quota issues
        const limitedRecipes = userRecipes.slice(-3)

        if (limitedRecipes.length !== userRecipes.length) {
          console.warn('🔧 Limiting user recipes to last 3 to prevent quota issues')
          setUserRecipes(limitedRecipes)
          return
        }

        console.log('💾 Saving recipes to localStorage:', limitedRecipes)
        localStorage.setItem('userRecipes', JSON.stringify(limitedRecipes))
      } catch (error) {
        console.error('❌ Error saving recipes to localStorage:', error)
        // Emergency: run cleanup and save only the most recent recipe
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('🚨 Emergency cleanup needed')
          cleanupLocalStorage()

          try {
            const mostRecent = userRecipes.slice(-1)
            localStorage.setItem('userRecipes', JSON.stringify(mostRecent))
            setUserRecipes(mostRecent)
            console.log('✅ Saved only most recent recipe after cleanup')
          } catch (emergencyError) {
            console.error('❌ Emergency save failed completely:', emergencyError)
          }
        }
      }
    }
  }, [userRecipes])

  useEffect(() => {
    if (hasInitializedRef.current) {
      try {
        localStorage.setItem('userNotifications', JSON.stringify(notifications))
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error)
        // If quota exceeded, keep only last 5 notifications
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          try {
            const limitedNotifications = notifications.slice(-5)
            localStorage.setItem('userNotifications', JSON.stringify(limitedNotifications))
            setNotifications(limitedNotifications)
          } catch (retryError) {
            console.error('Failed to save even limited notifications:', retryError)
          }
        }
      }
    }
  }, [notifications])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = value
    setFormData(prev => ({ ...prev, ingredients: newIngredients }))
  }

  const addIngredient = () => {
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, ''] }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, ingredients: newIngredients }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ingredients: [''],
      preparation: '',
      estimatedTime: '',
      servings: 2,
      image: ''
    })
  }

  const submitRecipe = () => {
    console.log('submitRecipe called with formData:', formData) // Debug log
    if (!formData.title || !formData.preparation || formData.ingredients.filter(i => i.trim()).length === 0) {
      console.log('Form validation failed') // Debug log
      return
    }

    if (editingRecipe) {
      // Update existing recipe
      const updatedRecipe: UserRecipe = {
        ...editingRecipe,
        title: formData.title,
        description: formData.description,
        ingredients: formData.ingredients.filter(i => i.trim()),
        preparation: formData.preparation,
        estimatedTime: formData.estimatedTime,
        servings: formData.servings,
        image: formData.image,
        createdBy: editingRecipe.createdBy // Keep original creator
      }

      console.log('Updating existing recipe:', updatedRecipe) // Debug log
      setUserRecipes(prev => prev.map(r => r.id === editingRecipe.id ? updatedRecipe : r))
      setEditingRecipe(null)
    } else {
      // Create new recipe
      const newRecipe: UserRecipe = {
        id: `user-recipe-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        ingredients: formData.ingredients.filter(i => i.trim()),
        preparation: formData.preparation,
        estimatedTime: formData.estimatedTime,
        servings: formData.servings,
        image: formData.image,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: 'Andrea Salvador'
      }

      console.log('Creating new recipe:', newRecipe) // Debug log
      setUserRecipes(prev => {
        const updated = [...prev, newRecipe]
        console.log('Updated recipes array:', updated) // Debug log
        return updated
      })

      // Simulate admin approval after 3 seconds only for new recipes
      setTimeout(() => {
        simulateApproval(newRecipe)
      }, 3000)
    }

    setShowSuccessModal(true)
    resetForm()
    setShowCreateForm(false)
    setActiveTab('overview') // Return to dashboard after creating/editing recipe
  }

  const simulateApproval = (recipe: UserRecipe) => {
    console.log('simulateApproval called for recipe:', recipe.title) // Debug log

    // Update recipe status to approved
    setUserRecipes(prev =>
      prev.map(r =>
        r.id === recipe.id
          ? { ...r, status: 'approved', approvedAt: new Date().toISOString() }
          : r
      )
    )

    // Add to main recipe history (simulate adding to public archive)
    try {
      const historyItem = {
        id: Date.now(),
        recipeId: recipe.id,
        image: recipe.image || '/placeholder.svg',
        analysis: formatRecipeForArchive(recipe),
        date: new Date().toISOString(),
        title: recipe.title,
        isFavorite: false
      }

      // Aggressive approach: always start with limited history
      const existingHistory = JSON.parse(localStorage.getItem('recipeHistory') || '[]')

      // Always keep only the last 5 items plus the new one
      const limitedExisting = existingHistory.slice(-5)
      const finalHistory = [...limitedExisting, historyItem]

      try {
        localStorage.setItem('recipeHistory', JSON.stringify(finalHistory))
        console.log('✅ Recipe added to archive successfully:', historyItem.title)
      } catch (quotaError) {
        console.warn('⚠️ Still quota exceeded, emergency cleanup...')
        // Emergency: run full cleanup and try again
        cleanupLocalStorage()

        try {
          localStorage.setItem('recipeHistory', JSON.stringify([historyItem]))
          console.log('✅ Recipe saved after emergency cleanup:', historyItem.title)
        } catch (emergencyError) {
          console.error('❌ Emergency save failed:', emergencyError)
          alert('Error: No se pudo guardar la receta en el archivo. Por favor, actualiza la página.')
        }
      }
    } catch (error) {
      console.error('❌ Critical error saving to archive:', error)
      alert('Error crítico al guardar la receta.')
    }

    // Create notification
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type: 'recipe_approved',
      recipeId: recipe.id,
      recipeName: recipe.title,
      timestamp: new Date().toISOString(),
      read: false
    }

    console.log('Creating notification:', notification) // Debug log
    setNotifications(prev => {
      const updated = [...prev, notification]
      console.log('Updated notifications:', updated) // Debug log
      return updated
    })
  }

  const formatRecipeForArchive = (recipe: UserRecipe): string => {
    return `${recipe.title}

${recipe.description ? recipe.description + '\n\n' : ''}Zutaten:
${recipe.ingredients.map(ing => `• ${ing}`).join('\n')}

Zubereitung:
${recipe.preparation}

${recipe.estimatedTime ? `Zubereitungszeit: ${recipe.estimatedTime}\n` : ''}Portionen: ${recipe.servings}

Erstellt von: ${recipe.createdBy || 'Andrea Salvador'}
Erstellt am: ${formatDate(recipe.createdAt)}`
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark ALL notifications as read when clicking any notification
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setShowNotifications(false)
    onOpenArchive()
  }

  const handleNotificationPanelClose = () => {
    // Mark all notifications as read when closing panel
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setShowNotifications(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ausstehend</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Genehmigt</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Abgelehnt</Badge>
      default:
        return <Badge variant="secondary">Entwurf</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const startEditRecipe = (recipe: UserRecipe) => {
    setEditingRecipe(recipe)
    setFormData({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      preparation: recipe.preparation,
      estimatedTime: recipe.estimatedTime,
      servings: recipe.servings,
      image: recipe.image || ''
    })
    setActiveTab('create')
  }

  const deleteRecipe = (recipeId: string) => {
    setUserRecipes(prev => prev.filter(r => r.id !== recipeId))
    setShowDeleteModal(null)
  }

  const cancelEdit = () => {
    setEditingRecipe(null)
    resetForm()
  }

  const resubmitToAdmin = (recipeId: string) => {
    setUserRecipes(prev => prev.map(r =>
      r.id === recipeId
        ? { ...r, status: 'pending' as const }
        : r
    ))

    // Simulate admin approval after 3 seconds
    setTimeout(() => {
      const recipe = userRecipes.find(r => r.id === recipeId)
      if (recipe) {
        simulateApproval({ ...recipe, status: 'pending' })
      }
    }, 3000)
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b-4 border-blue-500 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                size="lg"
                className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10 p-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

            </div>

            {/* User info and Notifications */}
            <div className="flex items-center gap-3">
              {/* User name button */}
              <Button
                variant="outline"
                size="lg"
                className="bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 cursor-default"
                disabled
              >
                <span className="text-gray-700 dark:text-gray-300 font-medium">Andrea Salvador</span>
              </Button>

              {/* Logout button */}
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="bg-red-50/70 hover:bg-red-100/70 dark:bg-red-900/30 dark:hover:bg-red-800/30 border-red-200/50 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs px-3 py-1"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Abmelden
              </Button>

              {/* Notifications Bell */}
              <div className="relative">
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="outline"
                  size="lg"
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-white">Benachrichtigungen</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          Keine Benachrichtigungen
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <Check className="h-5 w-5 text-green-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                  Rezept genehmigt!
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  "{notification.recipeName}" wurde zur Rezept-Sammlung hinzugefügt
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {formatDate(notification.timestamp)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 pt-32 sm:pt-36 lg:pt-40 pb-12">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 bg-white/70 dark:bg-gray-800/70 p-2 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
            <Button
              onClick={() => setActiveTab('overview')}
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className={`flex-1 ${activeTab === 'overview' ? 'bg-blue-500 text-white' : ''}`}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Übersicht
            </Button>
            <Button
              onClick={() => setActiveTab('create')}
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              className={`flex-1 ${activeTab === 'create' ? 'bg-blue-500 text-white' : ''}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Rezept erstellen
            </Button>
            <Button
              onClick={() => setActiveTab('history')}
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              className={`flex-1 ${activeTab === 'history' ? 'bg-blue-500 text-white' : ''}`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Meine Rezepte
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{userRecipes.length}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Erstellte Rezepte</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {userRecipes.filter(r => r.status === 'approved').length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Genehmigte Rezepte</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200/50 dark:border-yellow-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {userRecipes.filter(r => r.status === 'pending').length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ausstehend</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200/50 dark:border-purple-700/50">
                  <CardContent className="p-6" onClick={() => setActiveTab('create')}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Plus className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Neues Rezept erstellen</h3>
                        <p className="text-gray-600 dark:text-gray-400">Teile dein Lieblingsrezept mit anderen</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200/50 dark:border-teal-700/50">
                  <CardContent className="p-6" onClick={onOpenArchive}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Rezept-Archiv besuchen</h3>
                        <p className="text-gray-600 dark:text-gray-400">Entdecke alle verfügbaren Rezepte</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Recipes */}
              {userRecipes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Letzte Rezepte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userRecipes.slice(-3).reverse().map(recipe => (
                        <div key={recipe.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {recipe.image && (
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 dark:text-white">{recipe.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(recipe.createdAt)}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Por: {recipe.createdBy || 'Andrea Salvador'}
                            </p>
                          </div>
                          {getStatusBadge(recipe.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Neues Rezept erstellen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Rezeptname *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="z.B. Schokoladenkuchen"
                        className="bg-white/70 dark:bg-gray-800/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servings">Portionen</Label>
                      <Input
                        id="servings"
                        type="number"
                        min="1"
                        max="20"
                        value={formData.servings}
                        onChange={(e) => handleInputChange('servings', parseInt(e.target.value))}
                        className="bg-white/70 dark:bg-gray-800/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung (optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Kurze Beschreibung des Rezepts..."
                      rows={3}
                      className="bg-white/70 dark:bg-gray-800/70"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Zubereitungszeit</Label>
                    <Input
                      id="estimatedTime"
                      value={formData.estimatedTime}
                      onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                      placeholder="z.B. 45 Minuten"
                      className="bg-white/70 dark:bg-gray-800/70"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label>Rezeptbild (optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      {formData.image ? (
                        <div className="space-y-4">
                          <Image
                            src={formData.image}
                            alt="Preview"
                            width={200}
                            height={150}
                            className="mx-auto rounded-lg object-cover"
                          />
                          <Button
                            onClick={() => handleInputChange('image', '')}
                            variant="outline"
                            size="sm"
                          >
                            Bild entfernen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                          <div>
                            <Label htmlFor="image-upload" className="cursor-pointer">
                              <span className="text-blue-600 hover:text-blue-500">Bild hochladen</span>
                            </Label>
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Zutaten *</Label>
                      <Button onClick={addIngredient} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Zutat hinzufügen
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={ingredient}
                            onChange={(e) => handleIngredientChange(index, e.target.value)}
                            placeholder={`Zutat ${index + 1}...`}
                            className="flex-1 bg-white/70 dark:bg-gray-800/70"
                          />
                          {formData.ingredients.length > 1 && (
                            <Button
                              onClick={() => removeIngredient(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preparation */}
                  <div className="space-y-2">
                    <Label htmlFor="preparation">Zubereitung *</Label>
                    <Textarea
                      id="preparation"
                      value={formData.preparation}
                      onChange={(e) => handleInputChange('preparation', e.target.value)}
                      placeholder="Beschreibe die Zubereitungsschritte..."
                      rows={6}
                      className="bg-white/70 dark:bg-gray-800/70"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={() => {
                        if (editingRecipe) {
                          cancelEdit()
                        } else {
                          resetForm()
                        }
                        setActiveTab('overview')
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      {editingRecipe ? 'Abbrechen' : 'Zurücksetzen'}
                    </Button>
                    <Button
                      onClick={submitRecipe}
                      disabled={!formData.title || !formData.preparation || formData.ingredients.filter(i => i.trim()).length === 0}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {editingRecipe ? 'Änderungen speichern' : 'An Admin senden'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Meine Rezepte ({userRecipes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userRecipes.length === 0 ? (
                    <div className="text-center py-12">
                      <ChefHat className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        Noch keine Rezepte erstellt
                      </h3>
                      <p className="text-gray-400 dark:text-gray-500 mb-4">
                        Erstelle dein erstes Rezept und teile es mit anderen!
                      </p>
                      <Button onClick={() => setActiveTab('create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Erstes Rezept erstellen
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userRecipes.map(recipe => (
                        <div key={recipe.id} className="bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                          {recipe.image && (
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              width={300}
                              height={200}
                              className="w-full h-40 object-cover rounded-lg mb-4"
                            />
                          )}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-semibold text-gray-800 dark:text-white line-clamp-2">
                                {recipe.title}
                              </h4>
                              {getStatusBadge(recipe.status)}
                            </div>

                            {recipe.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {recipe.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {recipe.servings} Portionen
                              </div>
                              {recipe.estimatedTime && (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {recipe.estimatedTime}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                {formatDate(recipe.createdAt)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                <ChefHat className="h-3 w-3" />
                                Creado por: {recipe.createdBy || 'Andrea Salvador'}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-1 pt-2">
                              <Button
                                onClick={() => startEditRecipe(recipe)}
                                size="sm"
                                variant="outline"
                                className="flex-1 text-[10px] px-2 py-1 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                              >
                                Bearbeiten
                              </Button>
                              {recipe.status === 'approved' && (
                                <Button
                                  onClick={() => resubmitToAdmin(recipe.id)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-[10px] px-2 py-1 h-7 bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                                >
                                  Admin
                                </Button>
                              )}
                              <Button
                                onClick={() => setShowDeleteModal(recipe.id)}
                                size="sm"
                                variant="outline"
                                className="flex-1 text-[10px] px-2 py-1 h-7 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                              >
                                Löschen
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Erfolgreich gesendet!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ihr Rezept wurde zur Überprüfung an den Administrator gesendet. Sie erhalten eine Benachrichtigung, sobald es genehmigt wurde.
              </p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full"
              >
                Verstanden
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Rezept löschen?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sind Sie sicher, dass Sie dieses Rezept dauerhaft löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => deleteRecipe(showDeleteModal)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Löschen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserPage