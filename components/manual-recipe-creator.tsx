"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Send,
  Check,
  X,
  ImageIcon,
  PlusCircle,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { RecipeService } from "@/lib/services/recipeService"

interface UserRecipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  preparation: string
  estimatedTime: string
  servings: number
  image?: string
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  approvedAt?: string
  createdBy: string
}

interface ManualRecipeCreatorProps {
  onRecipeCreated?: () => void
}

const ManualRecipeCreator: React.FC<ManualRecipeCreatorProps> = ({ onRecipeCreated }) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const hasInitializedRef = useRef(false)

  // Emergency localStorage cleanup function
  const cleanupLocalStorage = () => {
    try {
      console.log("Starting emergency localStorage cleanup...")

      // Get all keys
      const allKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) allKeys.push(key)
      }

      // Remove unnecessary keys
      const keepKeys = ["userRecipes", "userNotifications", "recipeHistory", "recipeFolders"]
      allKeys.forEach((key) => {
        if (!keepKeys.includes(key)) {
          localStorage.removeItem(key)
          console.log("Removed unnecessary key:", key)
        }
      })

      // Limit data in kept keys
      keepKeys.forEach((key) => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const parsed = JSON.parse(data)
            if (Array.isArray(parsed)) {
              let limited
              switch (key) {
                case "userRecipes":
                  limited = parsed.slice(-5) // Keep only 5 user recipes
                  break
                case "userNotifications":
                  limited = parsed.slice(-3) // Keep only 3 notifications
                  break
                case "recipeHistory":
                  limited = parsed.slice(-10) // Keep only 10 history items
                  break
                case "recipeFolders":
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

      console.log("Emergency cleanup completed")
    } catch (error) {
      console.error("Emergency cleanup failed:", error)
    }
  }

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: [""],
    preparation: "",
    estimatedTime: "",
    servings: 2,
    image: "",
  })

  // Load current user from localStorage (updated from database)
  React.useEffect(() => {
    try {
      const currentUserStr = localStorage.getItem('current-user')
      const userRole = localStorage.getItem('user-role')

      if (currentUserStr) {
        const user = JSON.parse(currentUserStr)

        // SIEMPRE convertir Usuario # a Admin
        let displayName = user.name
        if (displayName && displayName.includes('Usuario #')) {
          displayName = 'Admin'
          console.log('🔧 Convirtiendo', user.name, 'a Admin')
        }

        setCurrentUser({ id: user.id, name: displayName })
        console.log("✅ Current user loaded:", displayName, "ID:", user.id)
        console.log("🔍 Full user object:", user)
      } else if (userRole) {
        // Fallback when no user data but we have role (like admin login with env password)
        let userName = 'Usuario'
        let userId = 'fallback-user'

        if (userRole === 'admin') {
          userName = 'Admin'
          userId = 'admin-001'
        } else if (userRole === 'worker') {
          userName = 'Mitarbeiter'
          userId = 'worker-001'
        } else if (userRole === 'guest') {
          userName = 'Gast'
          userId = 'guest-001'
        }

        setCurrentUser({ id: userId, name: userName })
        console.log("✅ Fallback user created from role:", userName, "Role:", userRole)
      }
    } catch (error) {
      console.error("Error loading current user:", error)
      setCurrentUser(null)
    }
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = value
    setFormData((prev) => ({ ...prev, ingredients: newIngredients }))
  }

  const addIngredient = () => {
    setFormData((prev) => ({ ...prev, ingredients: [...prev.ingredients, ""] }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, ingredients: newIngredients }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, image: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      ingredients: [""],
      preparation: "",
      estimatedTime: "",
      servings: 2,
      image: "",
    })
  }

  const submitRecipe = async () => {
    console.log("submitRecipe called with formData:", formData) // Debug log
    if (!formData.title || !formData.preparation || formData.ingredients.filter((i) => i.trim()).length === 0) {
      console.log("Form validation failed") // Debug log
      return
    }

    // Create new recipe
    const newRecipe: UserRecipe = {
      id: `user-recipe-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      ingredients: formData.ingredients.filter((i) => i.trim()),
      preparation: formData.preparation,
      estimatedTime: formData.estimatedTime,
      servings: formData.servings,
      image: formData.image,
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || "Usuario",
    }

    console.log("Creating new recipe:", newRecipe) // Debug log

    // Save recipe immediately to database and reload
    simulateApproval(newRecipe)

    setShowSuccessModal(true)
    resetForm()
    // Don't call onRecipeCreated immediately, let user close modal first
  }

  const simulateApproval = async (recipe: UserRecipe) => {
    console.log("simulateApproval called for recipe:", recipe.title) // Debug log

    // Add to main recipe history (simulate adding to public archive)
    try {
      const historyItem = {
        id: Date.now(),
        recipeId: recipe.id,
        image: recipe.image || "/placeholder.svg",
        analysis: formatRecipeForArchive(recipe),
        date: new Date().toISOString(),
        title: recipe.title,
        isFavorite: false,
      }

      // Save to database
      try {
        console.log("💾 Saving manual recipe to database...")
        await RecipeService.create({
          recipeId: recipe.id,
          title: recipe.title,
          analysis: formatRecipeForArchive(recipe),
          image: recipe.image || "",
          date: new Date().toISOString(),
          isFavorite: false,
          user_id: currentUser?.id || 'admin-001'
        })
        console.log("✅ Recipe saved to database successfully")

      } catch (dbError) {
        console.error("❌ Failed to save to database:", dbError)
      }

      // Also save to localStorage for offline access
      const existingHistory = JSON.parse(localStorage.getItem("recipeHistory") || "[]")

      // Always keep only the last 5 items plus the new one
      const limitedExisting = existingHistory.slice(-5)
      const finalHistory = [...limitedExisting, historyItem]

      try {
        localStorage.setItem("recipeHistory", JSON.stringify(finalHistory))
        console.log("✅ Recipe added to archive successfully:", historyItem.title)
      } catch (quotaError) {
        console.warn("⚠️ Still quota exceeded, emergency cleanup...")
        // Emergency: run full cleanup and try again
        cleanupLocalStorage()

        try {
          localStorage.setItem("recipeHistory", JSON.stringify([historyItem]))
          console.log("✅ Recipe saved after emergency cleanup:", historyItem.title)
        } catch (emergencyError) {
          console.error("❌ Emergency save failed:", emergencyError)
          alert("Error: No se pudo guardar la receta en el archivo. Por favor, actualiza la página.")
        }
      }
    } catch (error) {
      console.error("❌ Critical error saving to archive:", error)
      alert("Error crítico al guardar la receta.")
    }

    // Ya no necesitamos recarga automática porque el filtrado funciona correctamente
    console.log("✅ Recipe process completed - no reload needed")
  }

  const formatRecipeForArchive = (recipe: UserRecipe): string => {
    return `${recipe.title}

${recipe.description ? recipe.description + "\n\n" : ""}Zutaten:
${recipe.ingredients.map((ing) => `• ${ing}`).join("\n")}

Zubereitung:
${recipe.preparation}

${recipe.estimatedTime ? `Zubereitungszeit: ${recipe.estimatedTime}\n` : ""}Portionen: ${recipe.servings}

Erstellt von: ${recipe.createdBy || currentUser?.name || "Usuario"}
Erstellt am: ${formatDate(recipe.createdAt)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" color="blue" />
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
                onChange={(e) => handleInputChange("title", e.target.value)}
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
                value={isNaN(formData.servings) ? 2 : formData.servings}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === "" ? 2 : Number.parseInt(value);
                  handleInputChange("servings", isNaN(numValue) ? 2 : numValue);
                }}
                className="bg-white/70 dark:bg-gray-800/70"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
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
              onChange={(e) => handleInputChange("estimatedTime", e.target.value)}
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
                    src={formData.image || "/placeholder.svg"}
                    alt="Preview"
                    width={200}
                    height={150}
                    className="mx-auto rounded-lg object-cover"
                  />
                  <Button onClick={() => handleInputChange("image", "")} variant="outline" size="sm">
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
              onChange={(e) => handleInputChange("preparation", e.target.value)}
              placeholder="Beschreibe die Zubereitungsschritte..."
              rows={6}
              className="bg-white/70 dark:bg-gray-800/70"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex-1"
            >
              Zurücksetzen
            </Button>
            <Button
              onClick={submitRecipe}
              disabled={
                !formData.title ||
                !formData.preparation ||
                formData.ingredients.filter((i) => i.trim()).length === 0
              }
              className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              An Admin senden
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Erfolgreich gesendet!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ihr Rezept wurde zur Überprüfung an den Administrator gesendet. Sie erhalten eine Benachrichtigung,
                sobald es genehmigt wurde.
              </p>
              <Button onClick={() => {
                setShowSuccessModal(false)
                onRecipeCreated?.()
              }} className="w-full">
                Verstanden
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManualRecipeCreator