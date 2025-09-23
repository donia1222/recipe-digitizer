"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RecipeService } from "@/lib/services/recipeService"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Trash2, Folder, FolderPlus, Edit3, Check, X, Star, Calendar, ChefHat,
  Plus, Users, Clock, ArrowLeft, Save, Eye, RefreshCw
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface RecipeFolder {
  id: string
  name: string
  color: string
  createdAt: string
}

interface HistoryItem {
  id: number
  recipeId?: string
  image: string
  analysis: string
  date: string
  folderId?: string
  title?: string
  isFavorite?: boolean
}

interface RecipeArchiveProps {
  isOpen: boolean
  onClose: () => void
  onSelectRecipe: (item: HistoryItem) => void
}

const RecipeArchive: React.FC<RecipeArchiveProps> = ({ isOpen, onClose, onSelectRecipe }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [folders, setFolders] = useState<RecipeFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [editingRecipe, setEditingRecipe] = useState<number | null>(null)
  const [editRecipeData, setEditRecipeData] = useState({ title: "", analysis: "" })

  const folderColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
  ]

  // Load history and folders from database and localStorage
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 Recipe Archive opened, loading fresh data...');
      const loadData = async () => {
        try {
          // Cargar recetas directamente desde la BD con cache busting
          console.log('📚 Cargando recetas desde la BD...');

          // Hacer llamada directa a la API para forzar datos frescos
          const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-cache'
          });

          const data = await response.json();
          const recipesFromDB = data.data || [];
          console.log('📚 Recetas desde BD (fresh):', recipesFromDB);

          // IMPORTANTE: Usar imagen adicional como miniatura si no hay imagen principal
          const optimizedRecipes = recipesFromDB.map((recipe: any) => {
            // Determinar imagen principal: usar imagen principal, o primera imagen adicional si no hay principal
            let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

            // Debug: Mostrar información de la receta
            console.log('🔍 Processing recipe:', {
              id: recipe.id,
              title: recipe.title,
              hasMainImage: !!mainImage,
              hasAdditionalImages: !!(recipe.additional_images && recipe.additional_images.length > 0),
              additionalImagesCount: recipe.additional_images ? recipe.additional_images.length : 0
            });

            // Si no hay imagen principal pero sí hay imágenes adicionales, usar la primera
            if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
              const firstAdditionalImage = recipe.additional_images[0];
              mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
              console.log('🖼️ Using first additional image as main for recipe:', recipe.id, 'has additional images:', recipe.additional_images.length);
            }

            return {
              ...recipe,
              image: mainImage, // Imagen principal o primera adicional
              folderId: recipe.category_id || recipe.folderId,
              title: recipe.title || recipe.name,
              date: recipe.created_at || recipe.date,
              recipeId: recipe.recipe_id || recipe.recipeId
            };
          });

          setHistory(optimizedRecipes);
        } catch (error) {
          console.error('Error cargando recetas:', error);
          setHistory([]); // Si hay error, mostrar lista vacía
        }
      };

      loadData();

      // Cargar carpetas (todavía desde localStorage)
      const savedFolders = localStorage.getItem("recipeFolders")
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders))
      }
    }
  }, [isOpen])

  // Escuchar eventos de actualización de recetas para recarga automática
  useEffect(() => {
    const handleRecipeUpdate = async () => {
      if (!isOpen) return;

      console.log('📚 Recipe updated event received in archive, reloading data from database...');
      try {
        // Hacer llamada directa a la API para forzar datos frescos
        const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache'
        });

        const data = await response.json();
        const recipesFromDB = data.data || [];

        // Aplicar la misma lógica de optimización de imágenes
        const optimizedRecipes = recipesFromDB.map((recipe: any) => {
          let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

          // Debug: Mostrar información durante la actualización
          console.log('🔄 Update - Processing recipe:', {
            id: recipe.id,
            title: recipe.title,
            hasMainImage: !!mainImage,
            hasAdditionalImages: !!(recipe.additional_images && recipe.additional_images.length > 0),
            additionalImagesCount: recipe.additional_images ? recipe.additional_images.length : 0
          });

          if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
            const firstAdditionalImage = recipe.additional_images[0];
            mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
            console.log('🖼️ Update - Using first additional image as main for recipe:', recipe.id);
          }

          return {
            ...recipe,
            image: mainImage,
            folderId: recipe.category_id || recipe.folderId,
            title: recipe.title || recipe.name,
            date: recipe.created_at || recipe.date,
            recipeId: recipe.recipe_id || recipe.recipeId
          };
        });

        setHistory(optimizedRecipes);
      } catch (error) {
        console.error('Error reloading recipes after update:', error);
      }
    };

    const handleRecipeDelete = async () => {
      if (!isOpen) return;

      console.log('📚 Recipe deleted event received in archive, reloading data...');
      handleRecipeUpdate(); // Reutilizar la misma lógica
    };

    window.addEventListener('recipeUpdated', handleRecipeUpdate);
    window.addEventListener('recipeDeleted', handleRecipeDelete);

    return () => {
      window.removeEventListener('recipeUpdated', handleRecipeUpdate);
      window.removeEventListener('recipeDeleted', handleRecipeDelete);
    };
  }, [isOpen])

  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: RecipeFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: folderColors[Math.floor(Math.random() * folderColors.length)],
      createdAt: new Date().toISOString()
    }

    const updatedFolders = [...folders, newFolder]
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setNewFolderName("")
    setIsCreatingFolder(false)
  }

  const deleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!window.confirm("Möchten Sie diese Kategorie wirklich löschen? Alle Rezepte werden in 'Unkategorisiert' verschoben.")) {
      return
    }

    const updatedHistory = history.map(item =>
      item.folderId === folderId ? { ...item, folderId: undefined } : item
    )
    setHistory(updatedHistory)

    const updatedFolders = folders.filter(f => f.id !== folderId)
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))

    if (selectedFolder === folderId) {
      setSelectedFolder(undefined)
    }
  }

  const editFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return

    const updatedFolders = folders.map(f =>
      f.id === folderId ? { ...f, name: newName.trim() } : f
    )
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setEditingFolder(null)
    setEditFolderName("")
  }

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    setHistory(updatedHistory)
  }

  const moveToFolder = (recipeId: number, folderId: string | undefined) => {
    const updatedHistory = history.map(item =>
      item.id === recipeId ? { ...item, folderId } : item
    )
    setHistory(updatedHistory)
  }

  const deleteRecipe = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const itemToDelete = history.find(item => item.id === id)
    const recipeTitle = itemToDelete?.title || extractRecipeTitle(itemToDelete?.analysis || '')

    if (!window.confirm(`Möchten Sie das Rezept "${recipeTitle}" wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`)) {
      return
    }

    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)
  }

  const startEditingRecipe = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingRecipe(item.id)
    setEditRecipeData({
      title: item.title || extractRecipeTitle(item.analysis),
      analysis: item.analysis
    })
  }

  const saveRecipeEdit = () => {
    if (!editingRecipe) return

    const updatedHistory = history.map(item =>
      item.id === editingRecipe ? {
        ...item,
        title: editRecipeData.title.trim(),
        analysis: editRecipeData.analysis
      } : item
    )
    setHistory(updatedHistory)
    setEditingRecipe(null)
    setEditRecipeData({ title: "", analysis: "" })
  }

  const cancelRecipeEdit = () => {
    setEditingRecipe(null)
    setEditRecipeData({ title: "", analysis: "" })
  }

  const extractRecipeTitle = (analysis: string) => {
    const lines = analysis.split('\n').filter(line => line.trim())
    for (let line of lines.slice(0, 5)) {
      if (line.length < 60 && !line.toLowerCase().includes('ingredient') &&
          !line.toLowerCase().includes('zutaten') && !line.toLowerCase().includes('instruction') &&
          !line.toLowerCase().includes('schritt') && !line.toLowerCase().includes('portion') &&
          !line.toLowerCase().includes('serving') && !line.toLowerCase().includes('cook') &&
          !line.toLowerCase().includes('prep') && !line.toLowerCase().includes('total') &&
          !line.toLowerCase().includes('difficulty')) {
        return line.trim()
      }
    }
    return 'Mein Rezept'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredHistory = selectedFolder
    ? history.filter(item => item.folderId === selectedFolder)
    : selectedFolder === undefined && !isCreatingFolder && !editingFolder
    ? history.filter(item => !item.folderId)
    : history

  const favoriteRecipes = history.filter(item => item.isFavorite)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <ChefHat className="h-6 w-6 text-blue-600" />
            Rezept Archiv
            <Button
              onClick={async () => {
                console.log('🔄 Manual refresh triggered...');
                // Hacer llamada directa a la API para forzar datos frescos
                try {
                  const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?t=${Date.now()}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    cache: 'no-cache'
                  });

                  const data = await response.json();
                  const recipesFromDB = data.data || [];

                  const optimizedRecipes = recipesFromDB.map((recipe: any) => {
                    let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

                    if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
                      const firstAdditionalImage = recipe.additional_images[0];
                      mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
                      console.log('🖼️ Manual refresh - Using first additional image as main for recipe:', recipe.id);
                    }

                    return {
                      ...recipe,
                      image: mainImage,
                      folderId: recipe.category_id || recipe.folderId,
                      title: recipe.title || recipe.name,
                      date: recipe.created_at || recipe.date,
                      recipeId: recipe.recipe_id || recipe.recipeId
                    };
                  });

                  setHistory(optimizedRecipes);
                  console.log('✅ Manual refresh completed');
                } catch (error) {
                  console.error('❌ Error in manual refresh:', error);
                }
              }}
              size="sm"
              variant="outline"
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(90vh-120px)]">
          {/* Sidebar - Categories */}
          <div className="w-full lg:w-80 space-y-4">
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Kategorien
              </h3>

              {/* All Recipes */}
              <button
                onClick={() => setSelectedFolder(undefined)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 flex items-center gap-3 ${
                  selectedFolder === undefined
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <ChefHat className="h-4 w-4" />
                <span>Alle Rezepte</span>
                <span className="ml-auto text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                  {history.length}
                </span>
              </button>

              {/* Favorites */}
              {favoriteRecipes.length > 0 && (
                <button
                  onClick={() => setSelectedFolder('favorites')}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 flex items-center gap-3 ${
                    selectedFolder === 'favorites'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Star className="h-4 w-4" />
                  <span>Favoriten</span>
                  <span className="ml-auto text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {favoriteRecipes.length}
                  </span>
                </button>
              )}

              {/* Folders */}
              <ScrollArea className="max-h-48">
                <AnimatePresence>
                  {folders.map(folder => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-2"
                    >
                      {editingFolder === folder.id ? (
                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border">
                          <Input
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') editFolder(folder.id, editFolderName)
                              if (e.key === 'Escape') { setEditingFolder(null); setEditFolderName("") }
                            }}
                            className="flex-1 h-8"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => editFolder(folder.id, editFolderName)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingFolder(null); setEditFolderName("") }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedFolder(folder.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group ${
                            selectedFolder === folder.id
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: folder.color }}
                          />
                          <span className="flex-1 truncate">{folder.name}</span>
                          <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                            {history.filter(item => item.folderId === folder.id).length}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingFolder(folder.id)
                                setEditFolderName(folder.name)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => deleteFolder(folder.id, e)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </ScrollArea>

              {/* Create new folder */}
              {isCreatingFolder ? (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border mt-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createFolder()
                      if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName("") }
                    }}
                    placeholder="Kategorie Name..."
                    className="flex-1 h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={createFolder}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setIsCreatingFolder(false); setNewFolderName("") }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsCreatingFolder(true)}
                  variant="outline"
                  className="w-full mt-2 border-dashed"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Neue Kategorie
                </Button>
              )}
            </div>
          </div>

          {/* Main Content - Recipes Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {selectedFolder === 'favorites'
                  ? 'Favoriten'
                  : selectedFolder
                    ? folders.find(f => f.id === selectedFolder)?.name
                    : 'Alle Rezepte'
                }
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFolder === 'favorites' ? favoriteRecipes.length : filteredHistory.length} Rezepte
              </span>
            </div>

            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                <AnimatePresence>
                  {(selectedFolder === 'favorites' ? favoriteRecipes : filteredHistory).map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 group"
                        onClick={() => {
                          if (editingRecipe !== item.id) {
                            onSelectRecipe(item)
                            onClose()
                          }
                        }}
                      >
                        {editingRecipe === item.id ? (
                          <div className="p-4 space-y-4">
                            <Input
                              value={editRecipeData.title}
                              onChange={(e) => setEditRecipeData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Rezept Titel..."
                              className="font-semibold"
                            />
                            <Textarea
                              value={editRecipeData.analysis}
                              onChange={(e) => setEditRecipeData(prev => ({ ...prev, analysis: e.target.value }))}
                              placeholder="Rezept Inhalt..."
                              rows={6}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button onClick={saveRecipeEdit} size="sm" className="flex-1">
                                <Save className="h-3 w-3 mr-1" />
                                Speichern
                              </Button>
                              <Button onClick={cancelRecipeEdit} size="sm" variant="outline" className="flex-1">
                                <X className="h-3 w-3 mr-1" />
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt="Rezept"
                                width={300}
                                height={200}
                                className="w-full h-40 object-cover rounded-t-lg"
                              />
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => toggleFavorite(item.id, e)}
                                  className={`h-8 w-8 p-0 ${item.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                                >
                                  <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                                  {item.title || extractRecipeTitle(item.analysis)}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(item.date)}</span>
                              </div>

                              {/* Category dropdown */}
                              <div className="mb-3">
                                <select
                                  value={item.folderId || ''}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    moveToFolder(item.id, e.target.value || undefined)
                                  }}
                                  className="w-full text-xs p-2 border rounded bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">Unkategorisiert</option>
                                  {folders.map(folder => (
                                    <option key={folder.id} value={folder.id}>
                                      {folder.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => startEditingRecipe(item, e)}
                                  className="flex-1 h-7 text-xs"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Bearbeiten
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectRecipe(item)
                                    onClose()
                                  }}
                                  className="flex-1 h-7 text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Anzeigen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => deleteRecipe(item.id, e)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {(selectedFolder === 'favorites' ? favoriteRecipes : filteredHistory).length === 0 && (
                <div className="text-center py-12">
                  <ChefHat className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Keine Rezepte gefunden
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500">
                    {selectedFolder === 'favorites'
                      ? 'Sie haben noch keine Favoriten markiert'
                      : 'In dieser Kategorie sind noch keine Rezepte vorhanden'
                    }
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RecipeArchive