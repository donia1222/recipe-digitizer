"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Folder, FolderPlus, Check, X, Star, Calendar, ChefHat,
  ArrowLeft, Eye, ChevronDown, ChevronRight, Plus, Edit3, Trash2
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

  const folderColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
  ]

  // Load history and folders from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("recipeHistory")
    const savedFolders = localStorage.getItem("recipeFolders")

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    }
  }, [])

  const createFolder = () => {
    if (!newFolderName.trim()) return

    const newFolder: RecipeFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: folderColors[Math.floor(Math.random() * folderColors.length)],
      createdAt: new Date().toISOString(),
      parentId: creatingSubcategoryFor || undefined,
      isSubcategory: !!creatingSubcategoryFor
    }

    const updatedFolders = [...folders, newFolder]
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setNewFolderName("")
    setIsCreatingFolder(false)
    setCreatingSubcategoryFor(null)

    // Auto-expand parent folder when creating subcategory
    if (creatingSubcategoryFor) {
      setExpandedFolders(prev => new Set([...prev, creatingSubcategoryFor]))
    }
  }

  const createSubcategory = (parentId: string) => {
    setCreatingSubcategoryFor(parentId)
    setIsCreatingFolder(true)
  }

  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders(prev => {
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

    const updatedFolders = folders.map(f =>
      f.id === folderId ? { ...f, name: newName.trim() } : f
    )
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setEditingFolder(null)
    setEditFolderName("")
  }

  const deleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // First, move all recipes from this folder and its subcategories to uncategorized
    const allSubfolderIds = getAllSubfolderIds(folderId)
    const updatedHistory = history.map(item =>
      allSubfolderIds.includes(item.folderId || '') ? { ...item, folderId: undefined } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))

    // Remove the folder and all its subcategories
    const updatedFolders = folders.filter(f => !allSubfolderIds.includes(f.id))
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))

    // Reset selected folder if it was deleted
    if (allSubfolderIds.includes(selectedFolder || '')) {
      setSelectedFolder(undefined)
    }
  }

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const moveToFolder = (recipeId: number, folderId: string | undefined) => {
    const updatedHistory = history.map(item =>
      item.id === recipeId ? { ...item, folderId } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
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

  const getSubcategories = (parentId: string) => {
    return folders.filter(folder => folder.parentId === parentId)
  }

  const getMainCategories = () => {
    return folders.filter(folder => !folder.parentId)
  }

  const getAllSubfolderIds = (folderId: string): string[] => {
    const subcategories = getSubcategories(folderId)
    const allIds = [folderId]
    subcategories.forEach(sub => {
      allIds.push(...getAllSubfolderIds(sub.id))
    })
    return allIds
  }

  const filteredHistory = selectedFolder === 'favorites'
    ? history.filter(item => item.isFavorite)
    : selectedFolder
    ? history.filter(item => {
        const allowedIds = getAllSubfolderIds(selectedFolder)
        return allowedIds.includes(item.folderId || '')
      })
    : history.filter(item => !item.folderId)

  const favoriteRecipes = history.filter(item => item.isFavorite)

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

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ChefHat className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-800">
                    Rezept Archiv
                  </h1>
                  <p className="text-sm text-blue-600/80">
                    Alle gespeicherten Rezepte
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 pt-32 sm:pt-36 lg:pt-40 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <div className="w-full lg:w-80 space-y-4">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
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
              <ScrollArea className="max-h-64">
                <AnimatePresence>
                  {getMainCategories().map(folder => (
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
                          <div className="flex-1 flex items-center gap-2 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-300/50">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: folder.color }}
                            />
                            <Input
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              className="flex-1 h-8 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  editFolder(folder.id, editFolderName)
                                } else if (e.key === 'Escape') {
                                  setEditingFolder(null)
                                  setEditFolderName("")
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => editFolder(folder.id, editFolderName)}
                              className="h-8 w-8 p-0"
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
                              className="h-8 w-8 p-0"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`flex-1 text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer ${
                              selectedFolder === folder.id
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {/* Expand/Collapse Icon */}
                            {getSubcategories(folder.id).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFolderExpansion(folder.id)
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                {expandedFolders.has(folder.id) ?
                                  <ChevronDown className="h-3 w-3" /> :
                                  <ChevronRight className="h-3 w-3" />
                                }
                              </button>
                            )}

                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: folder.color }}
                            />
                            <span className="flex-1 truncate">{folder.name}</span>
                            <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                              {getAllSubfolderIds(folder.id).reduce((count, id) =>
                                count + history.filter(item => item.folderId === id).length, 0
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
                                className="h-7 w-7 p-0 bg-white/70 dark:bg-gray-800/70"
                              >
                                <Edit3 size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => deleteFolder(folder.id, e)}
                                className="h-7 w-7 p-0 bg-white/70 dark:bg-gray-800/70 text-red-500 hover:bg-red-500 hover:text-white"
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
                            className="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Subcategoria añadir"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      <AnimatePresence>
                        {expandedFolders.has(folder.id) && getSubcategories(folder.id).map(subcategory => (
                          <motion.div
                            key={subcategory.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-6 mt-1"
                          >
                            {editingFolder === subcategory.id ? (
                              <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-300/50">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: subcategory.color }}
                                />
                                <Input
                                  value={editFolderName}
                                  onChange={(e) => setEditFolderName(e.target.value)}
                                  className="flex-1 h-7 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      editFolder(subcategory.id, editFolderName)
                                    } else if (e.key === 'Escape') {
                                      setEditingFolder(null)
                                      setEditFolderName("")
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => editFolder(subcategory.id, editFolderName)}
                                  className="h-7 w-7 p-0"
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
                                  className="h-7 w-7 p-0"
                                >
                                  <X size={12} />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`w-full text-left p-2 rounded-lg transition-all duration-200 flex items-center gap-3 group cursor-pointer ${
                                  selectedFolder === subcategory.id
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => setSelectedFolder(subcategory.id)}
                              >
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: subcategory.color }}
                                />
                                <span className="flex-1 truncate text-sm">{subcategory.name}</span>
                                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">
                                  {history.filter(item => item.folderId === subcategory.id).length}
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
                                    className="h-6 w-6 p-0 bg-white/70 dark:bg-gray-800/70"
                                  >
                                    <Edit3 size={10} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => deleteFolder(subcategory.id, e)}
                                    className="h-6 w-6 p-0 bg-white/70 dark:bg-gray-800/70 text-red-500 hover:bg-red-500 hover:text-white"
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
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border mt-2">
                  {creatingSubcategoryFor && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Subcategoria für: {folders.find(f => f.id === creatingSubcategoryFor)?.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') createFolder()
                        if (e.key === 'Escape') {
                          setIsCreatingFolder(false)
                          setNewFolderName("")
                          setCreatingSubcategoryFor(null)
                        }
                      }}
                      placeholder={creatingSubcategoryFor ? "Subcategoria Name..." : "Kategorie Name..."}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <Button size="sm" onClick={createFolder}>
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
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      onClick={() => onSelectRecipe(item)}
                    >
                        <div className="relative">
                          <Image
                            src={item.image}
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
                              className="w-full text-xs p-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border border-gray-200/50 dark:border-gray-600/50 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-700/50 transition-all duration-200 cursor-pointer hover:shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">📂 Unkategorisiert</option>
                              {getMainCategories().map(folder => [
                                <option key={folder.id} value={folder.id}>
                                  📁 {folder.name}
                                </option>,
                                ...getSubcategories(folder.id).map(subcategory => (
                                  <option key={subcategory.id} value={subcategory.id}>
                                    &nbsp;&nbsp;&nbsp;&nbsp;📂 {subcategory.name}
                                  </option>
                                ))
                              ]).flat()}
                            </select>
                          </div>

                          <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectRecipe(item)
                              }}
                              className="w-full h-8 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Rezept anzeigen
                            </Button>
                          </div>
                        </CardContent>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeArchivePage