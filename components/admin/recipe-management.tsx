"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Eye, Trash2, ChefHat, Calendar, User, Filter, Grid3x3, List, MoreHorizontal, Folder, Plus, Edit3, X, Check, FolderPlus, ChevronDown, ChevronRight, Download, Printer, Share2, Minus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { RecipeService } from "@/lib/services/recipeService"

// Types
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

interface RecipeFolder {
  id: string
  name: string
  color: string
  createdAt: string
  parentId?: string
  isSubcategory?: boolean
}

export default function RecipeManagement() {
  // Estados principales del recipe-archive-page
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [folders, setFolders] = useState<RecipeFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [creatingSubcategoryFor, setCreatingSubcategoryFor] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [selectedRecipe, setSelectedRecipe] = useState<HistoryItem | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printingRecipe, setPrintingRecipe] = useState<HistoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Colores para las carpetas
  const folderColors = [
    "#4F7B52", "#8B4513", "#D2691E", "#228B22", "#4682B4", "#9ACD32", "#32CD32",
    "#FFD700", "#FF6347", "#FF1493", "#8A2BE2", "#00CED1", "#FF4500", "#2E8B57"
  ]

  // Load data from database
  const loadData = async () => {
    try {
      console.log('📚 Cargando recetas desde la BD...');
      const recipesFromDB = await RecipeService.getAll();
      console.log('📚 Recetas desde BD:', recipesFromDB);

      const syncedRecipes = recipesFromDB.map((recipe: any) => {
        let mainImage = recipe.image_base64 || recipe.image_url || recipe.image;

        if (!mainImage && recipe.additional_images && recipe.additional_images.length > 0) {
          const firstAdditionalImage = recipe.additional_images[0];
          mainImage = firstAdditionalImage.image_base64 || firstAdditionalImage.image_url;
        }

        return {
          ...recipe,
          folderId: recipe.category_id || recipe.folderId,
          image: mainImage,
          title: recipe.title || recipe.name,
          date: recipe.created_at || recipe.date,
          recipeId: recipe.recipe_id || recipe.recipeId
        };
      });

      setHistory(syncedRecipes);
    } catch (error) {
      console.error('Error cargando recetas:', error);
      setHistory([]);
    }
  };

  // Load categories from database
  const loadCategories = async () => {
    try {
      console.log('📁 Cargando categorías desde la BD...');
      const timestamp = Date.now();
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php?_t=${timestamp}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const dbCategories = data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          createdAt: cat.created_at,
          parentId: cat.parent_id,
          isSubcategory: !!cat.parent_id
        }));

        setFolders(dbCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([loadData(), loadCategories()]);
      setIsLoading(false);
    };
    initializeData();
  }, []);

  const getSubcategories = (parentId: string) => {
    const subcats = folders.filter((folder) => folder.parentId === parentId);
    const uniqueSubcats = subcats.filter((folder, index, arr) =>
      arr.findIndex(f => f.name === folder.name) === index
    );
    return uniqueSubcats;
  }

  const getMainCategories = () => {
    return folders.filter((folder) => !folder.parentId)
  }

  const getAllSubfolderIds = (folderId: string): string[] => {
    const subcategories = getSubcategories(folderId)
    const allIds = [folderId]
    subcategories.forEach((sub) => {
      allIds.push(...getAllSubfolderIds(sub.id))
    })
    return allIds
  }

  const createSubcategory = (parentId: string) => {
    setCreatingSubcategoryFor(parentId)
    setIsCreatingFolder(true)
  }

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          color: folderColors[Math.floor(Math.random() * folderColors.length)],
          parent_id: creatingSubcategoryFor || null,
          user_id: 'admin-001',
          display_order: folders.length + 1
        })
      })

      if (response.ok) {
        await loadCategories();
        setNewFolderName("")
        setIsCreatingFolder(false)
        setCreatingSubcategoryFor(null)

        if (creatingSubcategoryFor) {
          setExpandedFolders((prev) => new Set([...prev, creatingSubcategoryFor]))
        }
      }
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const editFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php?id=${folderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName.trim() })
      })

      if (response.ok) {
        console.log('✅ Category updated in database successfully');
        await loadCategories();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadData();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to update category in database:', errorText);
        throw new Error('Failed to update category in database');
      }

      setEditingFolder(null)
      setEditFolderName("")
    } catch (error) {
      console.error('Error editing folder:', error)
    }
  }

  const moveToFolder = async (recipeId: number, categoryId: string | undefined) => {
    try {
      console.log('📁 Moviendo receta a categoría:', { recipeId, categoryId });

      // Buscar el ID numérico de la base de datos para esta receta
      const searchResponse = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php`);
      const searchData = await searchResponse.json();

      let numericId = null;
      if (searchData.success && searchData.data) {
        const recipe = searchData.data.find((r: any) => r.id === recipeId);
        if (recipe) {
          numericId = recipe.id;
        }
      }

      if (!numericId) {
        console.error('❌ No se encontró el ID numérico de la receta');
        return;
      }

      // Actualizar en la base de datos
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/recipes-simple.php?id=${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: categoryId || null
        })
      });

      if (response.ok) {
        console.log('✅ Receta movida correctamente en la base de datos');

        // Actualizar el estado local inmediatamente
        setHistory(prev => prev.map(item =>
          item.id === recipeId
            ? { ...item, folderId: categoryId }
            : item
        ));

        // Recargar desde la base de datos para sincronizar
        await loadData();
      } else {
        console.error('❌ Error al mover la receta en la base de datos');
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error moviendo receta:', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return

    const allSubfolderIds = getAllSubfolderIds(folderId)
    const confirmText = `"${folder.name}" löschen${
      allSubfolderIds.length > 1 ? ` und ${allSubfolderIds.length - 1} Unterkategorien` : ""
    }?`

    if (!window.confirm(confirmText)) return

    try {
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/categories-simple.php?id=${folderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        console.log('✅ Category deleted from database successfully');
        await loadCategories();
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadData();

        if (editingFolder === folderId) {
          setEditingFolder(null);
          setEditFolderName("");
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to delete category from database:', errorText);
        throw new Error('Failed to delete category from database');
      }

      if (allSubfolderIds.includes(selectedFolder || "")) {
        setSelectedFolder(undefined)
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
    }
  }


  const filteredHistory = selectedFolder
    ? history.filter((item) => {
        const allSubfolderIds = getAllSubfolderIds(selectedFolder)
        return allSubfolderIds.includes(item.folderId || "")
      })
    : history

  const searchFilteredHistory = searchQuery
    ? filteredHistory.filter((item) => {
        const searchLower = searchQuery.toLowerCase()
        const title = item.title || ""
        const analysis = item.analysis || ""
        return (
          title.toLowerCase().includes(searchLower) ||
          analysis.toLowerCase().includes(searchLower)
        )
      })
    : filteredHistory

  const handleDeleteRecipe = async (id: number) => {
    const recipe = history.find(r => r.id === id)
    if (recipe && window.confirm(`Rezept "${recipe.title}" löschen?`)) {
      try {
        await RecipeService.delete(id)
        await loadData()
      } catch (error) {
        console.error('Error deleting recipe:', error)
      }
    }
  }

  const handlePrintRecipe = (recipe: HistoryItem) => {
    setPrintingRecipe(recipe)
    setShowPrintModal(true)
  }

  const handleShareRecipe = (recipe: HistoryItem) => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title || 'Rezept',
        text: recipe.analysis || '',
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(recipe.analysis || '')
      alert('Rezept in die Zwischenablage kopiert')
    }
  }

  const printRecipe = () => {
    if (!printingRecipe) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${printingRecipe.title || 'Rezept'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .recipe-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .recipe-image { max-width: 300px; margin: 20px 0; }
            .recipe-content { white-space: pre-wrap; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="recipe-title">${printingRecipe.title || 'Rezept'}</div>
          ${printingRecipe.image ? `<img src="${printingRecipe.image}" alt="Recipe" class="recipe-image" />` : ''}
          <div class="recipe-content">${printingRecipe.analysis || ''}</div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
    setShowPrintModal(false)
    setPrintingRecipe(null)
  }

  const RecipeCard = ({ recipe }: { recipe: HistoryItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200/50"
    >
      <div className="relative aspect-square">
        <Image
          src={recipe.image || "/placeholder.svg"}
          alt={recipe.title || "Recipe"}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-2">
        <h3 className="font-medium text-sm mb-1 text-gray-900 line-clamp-2 leading-tight">
          {recipe.title || "Ohne Titel"}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Calendar className="h-3 w-3" />
          {new Date(recipe.date).toLocaleDateString('de-DE')}
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2"
            onClick={() => setSelectedRecipe(recipe)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ansehen
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handlePrintRecipe(recipe)}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShareRecipe(recipe)}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteRecipe(recipe.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )

  const RecipeListItem = ({ recipe }: { recipe: HistoryItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200/50"
    >
      <div className="p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={recipe.image || "/placeholder.svg"}
              alt={recipe.title || "Recipe"}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                {recipe.title || "Ohne Titel"}
              </h3>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSelectedRecipe(recipe)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Details ansehen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintRecipe(recipe)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Drucken
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareRecipe(recipe)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Teilen
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                {new Date(recipe.date).toLocaleDateString('de-DE')}
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">
              {recipe.analysis?.substring(0, 150)}...
            </p>

            {/* Category dropdown - ABAJO - MEJORADO */}
            <div className="mt-4 pt-3 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 -mx-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Folder className="w-2.5 h-2.5 text-white" />
                </div>
                <label className="text-sm font-semibold text-blue-800">Kategorie zuweisen:</label>
              </div>
              <select
                value={recipe.folderId || ""}
                onChange={(e) => {
                  e.stopPropagation()
                  moveToFolder(recipe.id, e.target.value || undefined)
                }}
                className="w-full text-sm p-3 rounded-xl bg-white border-2 border-blue-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-300 cursor-pointer hover:border-blue-400 hover:shadow-md font-medium text-gray-700 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.25rem 1.25rem'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="" className="text-gray-500 bg-gray-50">📂 Unkategorisiert</option>
                {getMainCategories().flatMap((folder) => [
                  <option key={folder.id} value={folder.id} className="font-semibold text-blue-700 bg-blue-50">
                    📁 {folder.name}
                  </option>,
                  ...getSubcategories(folder.id).map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id} className="text-gray-600 bg-gray-50">
                      📂 {folder.name} → {subcategory.name}
                    </option>
                  ))
                ])}
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">
            Rezepte laden...
          </h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Rezept-Archiv
        </h2>
        <p className="text-gray-600">
          Verwalten Sie alle genehmigten Rezepte des Systems
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar con categorías */}
        <div className="lg:col-span-1">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-600" />
                Categorías
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* All Recipes */}
              <button
                onClick={() => setSelectedFolder(undefined)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border ${
                  !selectedFolder
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                }`}
              >
                <ChefHat className="h-4 w-4" />
                <span className="flex-1 truncate font-medium">Alle Rezepte</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  {history.length}
                </span>
              </button>

              {/* Main Categories */}
              {getMainCategories().map((folder) => (
                <div key={folder.id} className="space-y-1">
                  <div className="flex items-center gap-1">
                    {/* Add Subcategory Button - FUERA del botón principal */}
                    {editingFolder !== folder.id && !isCreatingFolder && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          createSubcategory(folder.id)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                        title="Unterkategorie hinzufügen"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}

                    {/* Expand/Collapse Icon - FUERA del botón principal */}
                    {getSubcategories(folder.id).length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFolderExpansion(folder.id)
                        }}
                        className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      >
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    )}

                    {/* Main Category Button */}
                    <button
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border ${
                        selectedFolder === folder.id
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                      }`}
                    >

                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />

                      {editingFolder === folder.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                editFolder(folder.id, editFolderName)
                              } else if (e.key === "Escape") {
                                setEditingFolder(null)
                                setEditFolderName("")
                              }
                            }}
                            className="h-7 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              setEditingFolder(null)
                              setEditFolderName("")
                            }}
                            className="h-8 w-8 p-0 border border-gray-300 hover:bg-gray-50 rounded flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 truncate font-medium">{folder.name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                            {getAllSubfolderIds(folder.id).reduce(
                              (count, id) => count + history.filter((item) => item.folderId === id).length,
                              0,
                            )}
                          </span>

                          {/* Action buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingFolder(folder.id)
                                setEditFolderName(folder.name)
                              }}
                              className="h-7 w-7 p-0 border border-gray-300 hover:bg-gray-50 rounded flex items-center justify-center"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteFolder(folder.id)
                              }}
                              className="h-7 w-7 p-0 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded flex items-center justify-center"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Subcategories */}
                  <AnimatePresence>
                    {expandedFolders.has(folder.id) &&
                      getSubcategories(folder.id).map((subcategory) => (
                        <motion.div
                          key={subcategory.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-6"
                        >
                          <div className="flex items-center">
                            <button
                              onClick={() => setSelectedFolder(subcategory.id)}
                              className={`flex-1 text-left p-2 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border text-sm ${
                                selectedFolder === subcategory.id
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subcategory.color }} />

                              {editingFolder === subcategory.id ? (
                                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        editFolder(subcategory.id, editFolderName)
                                      } else if (e.key === "Escape") {
                                        setEditingFolder(null)
                                        setEditFolderName("")
                                      }
                                    }}
                                    className="h-7 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      setEditingFolder(null)
                                      setEditFolderName("")
                                    }}
                                    className="h-7 w-7 p-0 border border-gray-300 hover:bg-gray-50 rounded flex items-center justify-center"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="flex-1 truncate font-medium">{subcategory.name}</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                                    {history.filter((item) => item.folderId === subcategory.id).length}
                                  </span>

                                  {/* Action buttons */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingFolder(subcategory.id)
                                        setEditFolderName(subcategory.name)
                                      }}
                                      className="h-6 w-6 p-0 border border-gray-300 hover:bg-gray-50 rounded flex items-center justify-center"
                                    >
                                      <Edit3 className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteFolder(subcategory.id)
                                      }}
                                      className="h-6 w-6 p-0 border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded flex items-center justify-center"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              ))}

              {/* Create new folder */}
              {isCreatingFolder ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                  {creatingSubcategoryFor && (
                    <div className="text-xs text-gray-500 mb-2">
                      Unterkategorie für: {folders.find((f) => f.id === creatingSubcategoryFor)?.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createFolder()
                        if (e.key === "Escape") {
                          setIsCreatingFolder(false)
                          setNewFolderName("")
                          setCreatingSubcategoryFor(null)
                        }
                      }}
                      placeholder={creatingSubcategoryFor ? "Name der Unterkategorie..." : "Kategoriename..."}
                      className="flex-1 h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={createFolder} className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingFolder(false)
                        setNewFolderName("")
                        setCreatingSubcategoryFor(null)
                      }}
                      className="h-8 px-3 border border-gray-300 hover:bg-gray-50 rounded flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingFolder(true)}
                  className="w-full mt-3 p-3 border-2 border-dashed border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FolderPlus className="h-4 w-4" />
                  Neue Kategorie
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and filters */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rezepte suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-80"
                    />
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total</p>
                    <p className="text-2xl font-bold">{history.length}</p>
                  </div>
                  <ChefHat className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Aprobadas</p>
                    <p className="text-2xl font-bold">{history.length}</p>
                  </div>
                  <Check className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Categorías</p>
                    <p className="text-2xl font-bold">{folders.length}</p>
                  </div>
                  <Folder className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recipe list */}
          {searchFilteredHistory.length > 0 ? (
            <div className="space-y-3">
              {searchFilteredHistory.map(recipe => (
                <RecipeListItem key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Keine Rezepte gefunden
                </h3>
                <p className="text-gray-600">
                  {selectedFolder
                    ? "Es gibt keine Rezepte in dieser Kategorie"
                    : "Versuchen Sie, die Suchfilter zu ändern"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedRecipe.title || "Rezept"}</DialogTitle>
              <DialogDescription>
                {new Date(selectedRecipe.date).toLocaleDateString('de-DE')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {selectedRecipe.image && (
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                  <Image
                    src={selectedRecipe.image}
                    alt={selectedRecipe.title || "Recipe"}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedRecipe.analysis}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handlePrintRecipe(selectedRecipe)}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Drucken
                </Button>
                <Button
                  onClick={() => handleShareRecipe(selectedRecipe)}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Teilen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Print Modal */}
      {showPrintModal && printingRecipe && (
        <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rezept drucken</DialogTitle>
              <DialogDescription>
                Möchten Sie "{printingRecipe.title}" drucken?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3">
              <Button onClick={() => setShowPrintModal(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
              <Button onClick={printRecipe} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}