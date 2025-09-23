"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { RecipeService } from "@/lib/services/recipeService"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Folder,
  FolderPlus,
  Check,
  X,
  Star,
  Calendar,
  ChefHat,
  ArrowLeft,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Search,
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface RecipeFolder {
  id: string
  name: string
  color: string
  createdAt: string
  parentId?: string
  isSubcategory?: boolean
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
  user_id?: string
}

interface RecipeArchivePageProps {
  onSelectRecipe: (item: HistoryItem) => void
  onBack: () => void
}

const RecipeArchivePage: React.FC<RecipeArchivePageProps> = ({ onSelectRecipe, onBack }) => {
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

  const folderColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"]

  // Load history and folders from database and localStorage
  const loadData = async () => {
      try {
        // Cargar recetas desde la BD
        console.log('📚 Cargando recetas desde la BD...');
        const recipesFromDB = await RecipeService.getAll();
        console.log('📚 Recetas desde BD:', recipesFromDB);

        // Por ahora también cargar de localStorage para compatibilidad
        const savedHistory = localStorage.getItem("recipeHistory")
        const localRecipes = savedHistory ? JSON.parse(savedHistory) : [];

        // Combinar recetas de BD y localStorage (evitar duplicados)
        const combinedRecipes = [...recipesFromDB];
        localRecipes.forEach((localRecipe: any) => {
          if (!combinedRecipes.find(r => r.id === localRecipe.id)) {
            combinedRecipes.push(localRecipe);
          }
        });

        setHistory(combinedRecipes);
      } catch (error) {
        console.error('Error cargando recetas:', error);
        // Fallback a localStorage si hay error
        const savedHistory = localStorage.getItem("recipeHistory")
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory))
        }
      }
  };

  useEffect(() => {
    loadData();

    // Cargar carpetas (todavía desde localStorage)
    const savedFolders = localStorage.getItem("recipeFolders")
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    }
  }, [])

  // Escuchar eventos de actualización y eliminación de recetas
  useEffect(() => {
    const handleRecipeUpdate = () => {
      console.log('📚 Recipe updated event received in archive, reloading data...');
      loadData();
    };

    const handleRecipeDelete = () => {
      console.log('📚 Recipe deleted event received in archive, reloading data...');
      loadData();
    };

    window.addEventListener('recipeUpdated', handleRecipeUpdate);
    window.addEventListener('recipeDeleted', handleRecipeDelete);

    return () => {
      window.removeEventListener('recipeUpdated', handleRecipeUpdate);
      window.removeEventListener('recipeDeleted', handleRecipeDelete);
    };
  }, [])

  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: RecipeFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: folderColors[Math.floor(Math.random() * folderColors.length)],
      createdAt: new Date().toISOString(),
      parentId: creatingSubcategoryFor || undefined,
      isSubcategory: !!creatingSubcategoryFor,
    }

    const updatedFolders = [...folders, newFolder]
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setNewFolderName("")
    setIsCreatingFolder(false)
    setCreatingSubcategoryFor(null)

    // Auto-expand parent folder when creating subcategory
    if (creatingSubcategoryFor) {
      setExpandedFolders((prev) => new Set([...prev, creatingSubcategoryFor]))
    }
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

  const editFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return

    const updatedFolders = folders.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f))
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setEditingFolder(null)
    setEditFolderName("")
  }

  const deleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // First, move all recipes from this folder and its subcategories to uncategorized
    const allSubfolderIds = getAllSubfolderIds(folderId)
    const updatedHistory = history.map((item) =>
      allSubfolderIds.includes(item.folderId || "") ? { ...item, folderId: undefined } : item,
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))

    // Remove the folder and all its subcategories
    const updatedFolders = folders.filter((f) => !allSubfolderIds.includes(f.id))
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))

    // Reset selected folder if it was deleted
    if (allSubfolderIds.includes(selectedFolder || "")) {
      setSelectedFolder(undefined)
    }
  }

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const updatedHistory = history.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const moveToFolder = (recipeId: number, folderId: string | undefined) => {
    const updatedHistory = history.map((item) => (item.id === recipeId ? { ...item, folderId } : item))
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const extractRecipeTitle = (analysis: string) => {
    const lines = analysis.split("\n").filter((line) => line.trim())
    for (const line of lines.slice(0, 5)) {
      if (
        line.length < 60 &&
        !line.toLowerCase().includes("ingredient") &&
        !line.toLowerCase().includes("zutaten") &&
        !line.toLowerCase().includes("instruction") &&
        !line.toLowerCase().includes("schritt") &&
        !line.toLowerCase().includes("portion") &&
        !line.toLowerCase().includes("serving") &&
        !line.toLowerCase().includes("cook") &&
        !line.toLowerCase().includes("prep") &&
        !line.toLowerCase().includes("total") &&
        !line.toLowerCase().includes("difficulty")
      ) {
        return line.trim()
      }
    }
    return "Mein Rezept"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getUserName = (userId?: string): string => {
    if (!userId) return 'Unbekannter Benutzer';

    // Try to get user name from current user if it matches
    const currentUserStr = localStorage.getItem('current-user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === userId) {
          return currentUser.name || 'Sie';
        }
      } catch (error) {
        console.error('Error parsing current user:', error);
      }
    }

    // Common user mappings (can be expanded with API call to get real user names)
    const userMappings: { [key: string]: string } = {
      'admin-001': 'Andrea Müller',
      'worker-001': 'Hans Weber',
      'worker-002': 'Maria Schmidt',
      'guest-001': 'Peter Fischer'
    };

    return userMappings[userId] || 'Benutzer';
  }

  const getSubcategories = (parentId: string) => {
    return folders.filter((folder) => folder.parentId === parentId)
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

  const filteredHistory =
    selectedFolder === "favorites"
      ? history.filter((item) => item.isFavorite)
      : selectedFolder
        ? history.filter((item) => {
            const allowedIds = getAllSubfolderIds(selectedFolder)
            return allowedIds.includes(item.folderId || "")
          })
        : history.filter((item) => !item.folderId)

  // Apply search filter
  const searchFilteredHistory = searchQuery
    ? filteredHistory.filter((item) => {
        const searchLower = searchQuery.toLowerCase()
        const title = item.title?.toLowerCase() || ""
        const analysis = item.analysis?.toLowerCase() || ""
        return title.includes(searchLower) || analysis.includes(searchLower)
      })
    : filteredHistory

  const favoriteRecipes = history.filter((item) => item.isFavorite)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Recipe Archive</h1>
                  <p className="text-sm text-gray-500">All saved recipes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <div className="w-full lg:w-80 space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-600" />
                Categories
              </h3>

              {/* All Recipes */}
              <button
                onClick={() => setSelectedFolder(undefined)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 flex items-center gap-3 ${
                  selectedFolder === undefined
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "hover:bg-gray-50 text-gray-700 border border-transparent"
                }`}
              >
                <ChefHat className="h-4 w-4" />
                <span className="font-medium">All Recipes</span>
                <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  {history.length}
                </span>
              </button>

              {/* Favorites */}
              {favoriteRecipes.length > 0 && (
                <button
                  onClick={() => setSelectedFolder("favorites")}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 flex items-center gap-3 ${
                    selectedFolder === "favorites"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "hover:bg-gray-50 text-gray-700 border border-transparent"
                  }`}
                >
                  <Star className="h-4 w-4" />
                  <span className="font-medium">Favorites</span>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    {favoriteRecipes.length}
                  </span>
                </button>
              )}

              {/* Folders */}
              <ScrollArea className="max-h-64">
                <AnimatePresence>
                  {getMainCategories().map((folder) => (
                    <motion.div
                      key={folder.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-2"
                    >
                      {/* Main Category */}
                      <div className="flex items-center">
                        {editingFolder === folder.id ? (
                          <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                            <Input
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              className="flex-1 h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  editFolder(folder.id, editFolderName)
                                } else if (e.key === "Escape") {
                                  setEditingFolder(null)
                                  setEditFolderName("")
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => editFolder(folder.id, editFolderName)}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingFolder(null)
                                setEditFolderName("")
                              }}
                              className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-50"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border ${
                              selectedFolder === folder.id
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                            }`}
                          >
                            {/* Expand/Collapse Icon */}
                            {getSubcategories(folder.id).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFolderExpansion(folder.id)
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {expandedFolders.has(folder.id) ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>
                            )}

                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
                            <span className="flex-1 truncate font-medium">{folder.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                              {getAllSubfolderIds(folder.id).reduce(
                                (count, id) => count + history.filter((item) => item.folderId === id).length,
                                0,
                              )}
                            </span>

                            {/* Edit and Delete buttons for main categories */}
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity ml-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingFolder(folder.id)
                                  setEditFolderName(folder.name)
                                }}
                                className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-50"
                              >
                                <Edit3 size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => deleteFolder(folder.id, e)}
                                className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Add Subcategory Button */}
                        {editingFolder !== folder.id && (
                          <button
                            onClick={() => createSubcategory(folder.id)}
                            className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Add Subcategory"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
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
                              className="ml-6 mt-1"
                            >
                              {editingFolder === subcategory.id ? (
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: subcategory.color }}
                                  />
                                  <Input
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    className="flex-1 h-7 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        editFolder(subcategory.id, editFolderName)
                                      } else if (e.key === "Escape") {
                                        setEditingFolder(null)
                                        setEditFolderName("")
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => editFolder(subcategory.id, editFolderName)}
                                    className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check size={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingFolder(null)
                                      setEditFolderName("")
                                    }}
                                    className="h-7 w-7 p-0 border-gray-300 hover:bg-gray-50"
                                  >
                                    <X size={12} />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className={`w-full text-left p-2 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer border ${
                                    selectedFolder === subcategory.id
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                                  }`}
                                  onClick={() => setSelectedFolder(subcategory.id)}
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: subcategory.color }}
                                  />
                                  <span className="flex-1 truncate text-sm font-medium">{subcategory.name}</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                                    {history.filter((item) => item.folderId === subcategory.id).length}
                                  </span>

                                  {/* Edit and Delete buttons for subcategories */}
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingFolder(subcategory.id)
                                        setEditFolderName(subcategory.name)
                                      }}
                                      className="h-6 w-6 p-0 border-gray-300 hover:bg-gray-50"
                                    >
                                      <Edit3 size={10} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => deleteFolder(subcategory.id, e)}
                                      className="h-6 w-6 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                    >
                                      <Trash2 size={10} />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </ScrollArea>

              {/* Create new folder */}
              {isCreatingFolder ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
                  {creatingSubcategoryFor && (
                    <div className="text-xs text-gray-500 mb-2">
                      Subcategory for: {folders.find((f) => f.id === creatingSubcategoryFor)?.name}
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
                      placeholder={creatingSubcategoryFor ? "Subcategory name..." : "Category name..."}
                      className="flex-1 h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      autoFocus
                    />
                    <Button size="sm" onClick={createFolder} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreatingFolder(false)
                        setNewFolderName("")
                        setCreatingSubcategoryFor(null)
                      }}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsCreatingFolder(true)}
                  variant="outline"
                  className="w-full mt-3 border-dashed border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              )}
            </div>
          </div>

          {/* Main Content - Recipes Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedFolder === "favorites"
                    ? "Favorites"
                    : selectedFolder
                      ? folders.find((f) => f.id === selectedFolder)?.name
                      : "All Recipes"}
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {searchQuery && searchFilteredHistory.length !== filteredHistory.length
                    ? `${searchFilteredHistory.length} von ${selectedFolder === "favorites" ? favoriteRecipes.length : filteredHistory.length}`
                    : selectedFolder === "favorites" ? favoriteRecipes.length : filteredHistory.length} recipes
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Suche nach Rezepttitel oder Inhalt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {searchFilteredHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all duration-200 bg-white border border-gray-200 group overflow-hidden"
                      onClick={() => onSelectRecipe(item)}
                    >
                      <div className="relative">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt="Recipe"
                          width={300}
                          height={200}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute top-3 right-3 flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={`h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm ${
                              item.isFavorite ? "text-amber-500" : "text-gray-400"
                            }`}
                          >
                            <Star className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                            {item.title || extractRecipeTitle(item.analysis)}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                          <Calendar className="h-3 w-3" />
                          <span>Von {getUserName(item.user_id)} • {formatDate(item.date)}</span>
                        </div>

                        {/* Category dropdown */}
                        <div className="mb-4">
                          <select
                            value={item.folderId || ""}
                            onChange={(e) => {
                              e.stopPropagation()
                              moveToFolder(item.id, e.target.value || undefined)
                            }}
                            className="w-full text-xs p-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 cursor-pointer hover:bg-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">📂 Uncategorized</option>
                            {getMainCategories().flatMap((folder) => [
                              <option key={folder.id} value={folder.id}>
                                📁 {folder.name}
                              </option>,
                              ...getSubcategories(folder.id).map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>
                                  &nbsp;&nbsp;&nbsp;&nbsp;📂 {subcategory.name}
                                </option>
                              )),
                            ])}
                          </select>
                        </div>

                        <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectRecipe(item)
                            }}
                            className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Recipe
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {searchFilteredHistory.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {searchQuery ? <Search className="h-8 w-8 text-gray-400" /> : <ChefHat className="h-8 w-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "Keine Rezepte gefunden" : "No recipes found"}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `Keine Rezepte für "${searchQuery}" gefunden. Versuchen Sie einen anderen Suchbegriff.`
                    : selectedFolder === "favorites"
                    ? "You haven't marked any recipes as favorites yet"
                    : "No recipes in this category yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeArchivePage
