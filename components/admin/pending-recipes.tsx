"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, Eye, MessageCircle, User, Calendar, ChefHat, AlertTriangle } from "lucide-react"
import Image from "next/image"

interface PendingRecipe {
  id: string
  recipe_id?: string
  title: string
  user_name?: string
  user: string
  date: string
  created_at?: string
  status: 'pending' | 'approved' | 'rejected'
  image?: string
  image_url?: string
  image_base64?: string
  ingredients?: string | string[]
  instructions?: string
  analysis?: string
  servings?: number
  cookTime?: string
  category?: string
  description?: string
  additional_images?: any[]
}

interface PendingRecipesProps {
  pendingRecipes: PendingRecipe[]
  setPendingRecipes: (recipes: PendingRecipe[]) => void
  setNotifications: (count: number) => void
}

export default function PendingRecipes({ pendingRecipes, setPendingRecipes, setNotifications }: PendingRecipesProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<PendingRecipe | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar recetas pendientes al montar el componente
  useEffect(() => {
    loadPendingRecipes()
  }, [])

  const loadPendingRecipes = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/pending-recipes.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Mapear los datos de la API al formato del componente
          const mappedRecipes = result.data.map((recipe: any) => ({
            id: recipe.id.toString(),
            recipe_id: recipe.recipe_id,
            title: recipe.title || 'Sin título',
            user: recipe.user_name || 'Usuario desconocido',
            user_name: recipe.user_name,
            date: recipe.created_at ? new Date(recipe.created_at).toLocaleDateString('de-DE') : 'Sin fecha',
            created_at: recipe.created_at,
            status: 'pending' as const,
            image: recipe.image_url || recipe.image_base64 || '',
            image_url: recipe.image_url,
            image_base64: recipe.image_base64,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            analysis: recipe.analysis,
            servings: recipe.servings,
            category: recipe.category,
            additional_images: recipe.additional_images || []
          }))

          setPendingRecipes(mappedRecipes)
          setNotifications(mappedRecipes.length)
        }
      }
    } catch (error) {
      console.error('Error loading pending recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewRecipe = (recipe: PendingRecipe, action: 'approve' | 'reject') => {
    setSelectedRecipe(recipe)
    setReviewAction(action)
    setReviewComment("")
    setIsReviewModalOpen(true)
  }

  const confirmReview = async () => {
    if (!selectedRecipe || !reviewAction) return

    try {
      setLoading(true)

      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/pending-recipes.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: reviewAction,
          recipe_id: selectedRecipe.id,
          approved_by: 'admin-001', // Aquí puedes usar el ID del admin actual
          comment: reviewComment
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Recargar las recetas después de la acción
          await loadPendingRecipes()

          // Mostrar mensaje de éxito
          const actionText = reviewAction === 'approve' ? 'genehmigt' : 'abgelehnt'
          console.log(`Rezept "${selectedRecipe.title}" wurde ${actionText}`)

          setIsReviewModalOpen(false)
          setSelectedRecipe(null)
          setReviewAction(null)
          setReviewComment("")
        } else {
          console.error('Error in review action:', result.error)
          alert('Error: ' + result.error)
        }
      } else {
        console.error('HTTP error:', response.status)
        alert('Error de conexión')
      }
    } catch (error) {
      console.error('Error reviewing recipe:', error)
      alert('Error al procesar la receta')
    } finally {
      setLoading(false)
    }
  }

  const handleViewRecipe = (recipe: PendingRecipe) => {
    setSelectedRecipe(recipe)
    setReviewAction(null)
    setIsReviewModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const pendingCount = pendingRecipes.filter(r => r.status === 'pending').length
  const approvedCount = pendingRecipes.filter(r => r.status === 'approved').length
  const rejectedCount = pendingRecipes.filter(r => r.status === 'rejected').length

  // Funciones helpers para parsear ingredientes e instrucciones
  const parseIngredients = (ingredients: string | string[] | undefined): string[] => {
    if (!ingredients) return []
    if (Array.isArray(ingredients)) return ingredients
    try {
      return JSON.parse(ingredients)
    } catch {
      // Si no es JSON válido, intentar dividir por líneas o bullets
      return ingredients.split(/[\n•]/).filter(item => item.trim()).map(item => item.trim())
    }
  }

  const parseInstructions = (instructions: string | undefined): string[] => {
    if (!instructions) return []
    // Dividir por líneas numeradas o bullets
    return instructions.split(/[\n\d+\.]/).filter(item => item.trim()).map(item => item.trim())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ausstehende Rezepte zur Genehmigung
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Überprüfen und genehmigen Sie die von Benutzern eingereichten Rezepte
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Ausstehend</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Genehmigt</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Abgelehnt</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta si hay muchas pendientes */}
      {pendingCount > 5 && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                  Hohe Anzahl ausstehender Rezepte
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Es gibt {pendingCount} Rezepte, die auf Überprüfung warten. Überprüfen Sie sie bald, um die Benutzer bei der Stange zu halten.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {loading && (
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Recetas cargando...</p>
          </CardContent>
        </Card>
      )}

      {/* Lista de recetas pendientes */}
      {!loading && pendingRecipes.length > 0 ? (
        <div className="space-y-4">
          {pendingRecipes.map(recipe => (
            <Card key={recipe.id} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Imagen de la receta */}
                  <div className="w-32 h-32 relative rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={recipe.image || "/placeholder.svg"}
                      alt={recipe.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Información de la receta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                          {recipe.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {recipe.user}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {recipe.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(recipe.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(recipe.status)}
                              {recipe.status === 'pending' && 'Ausstehend'}
                              {recipe.status === 'approved' && 'Genehmigt'}
                              {recipe.status === 'rejected' && 'Abgelehnt'}
                            </div>
                          </Badge>
                          {recipe.category && (
                            <Badge variant="outline">{recipe.category}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {recipe.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    {/* Información adicional */}
                    {(recipe.servings || recipe.cookTime) && (
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {recipe.servings && (
                          <span>{recipe.servings} Portionen</span>
                        )}
                        {recipe.cookTime && (
                          <span>{recipe.cookTime}</span>
                        )}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleViewRecipe(recipe)}
                        variant="outline"
                        size="sm"
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details anzeigen
                      </Button>

                      {recipe.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleReviewRecipe(recipe, 'approve')}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Genehmigen
                          </Button>
                          <Button
                            onClick={() => handleReviewRecipe(recipe, 'reject')}
                            size="sm"
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Ablehnen
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading ? (
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine ausstehenden Rezepte
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Alle Rezepte wurden überprüft
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Modal de revisión/detalles */}
      {selectedRecipe && (
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedRecipe.title}</DialogTitle>
              <DialogDescription>
                Eingereicht von {selectedRecipe.user} am {selectedRecipe.date}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Imagen de la receta */}
              {selectedRecipe.image && (
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                  <Image
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Aktueller Status</h4>
                  <Badge className={getStatusColor(selectedRecipe.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedRecipe.status)}
                      {selectedRecipe.status === 'pending' && 'Ausstehend'}
                      {selectedRecipe.status === 'approved' && 'Genehmigt'}
                      {selectedRecipe.status === 'rejected' && 'Abgelehnt'}
                    </div>
                  </Badge>
                </div>
                {(selectedRecipe.servings || selectedRecipe.cookTime) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Information</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRecipe.servings && <div>{selectedRecipe.servings} Portionen</div>}
                      {selectedRecipe.cookTime && <div>Zeit: {selectedRecipe.cookTime}</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              {selectedRecipe.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Beschreibung</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedRecipe.description}
                  </p>
                </div>
              )}

              {/* Análisis completo o descripción */}
              {selectedRecipe.analysis && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vollständiges Rezept</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {selectedRecipe.analysis}
                  </div>
                </div>
              )}

              {/* Ingredientes */}
              {(() => {
                const ingredients = parseIngredients(selectedRecipe.ingredients)
                return ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Zutaten</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {ingredients.map((ingredient, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}

              {/* Instrucciones */}
              {(() => {
                const instructions = parseInstructions(selectedRecipe.instructions)
                return instructions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Anweisungen</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      {instructions.map((instruction, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                )
              })()}

              {/* Solo mostrar formulario de revisión si se está aprobando/rechazando */}
              {reviewAction && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {reviewAction === 'approve' ? 'Rezept genehmigen' : 'Rezept ablehnen'}
                  </h4>
                  <Textarea
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Optionaler Kommentar für den Benutzer zur Genehmigung...'
                        : 'Erklären Sie, warum das Rezept abgelehnt wird (wird an den Benutzer gesendet)...'
                    }
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4">
                {reviewAction ? (
                  <>
                    <Button
                      onClick={confirmReview}
                      disabled={loading}
                      className={
                        reviewAction === 'approve'
                          ? 'bg-green-500 hover:bg-green-600 text-white flex-1'
                          : 'bg-red-500 hover:bg-red-600 text-white flex-1'
                      }
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : reviewAction === 'approve' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Genehmigung bestätigen
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Ablehnung bestätigen
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReviewAction(null)
                        setReviewComment("")
                      }}
                    >
                      Abbrechen
                    </Button>
                  </>
                ) : selectedRecipe.status === 'pending' ? (
                  <>
                    <Button
                      onClick={() => {
                        setReviewAction('approve')
                        setReviewComment("")
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Genehmigen
                    </Button>
                    <Button
                      onClick={() => {
                        setReviewAction('reject')
                        setReviewComment("")
                      }}
                      variant="destructive"
                      className="bg-red-500 hover:bg-red-600 flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Ablehnen
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="w-full"
                  >
                    Schließen
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}