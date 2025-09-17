"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Folder, FolderPlus, Edit3, Check, X, Star, Calendar, ChefHat, Search, Plus, Grid3x3, List, Filter } from "lucide-react"
import Image from "next/image"

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

interface RecipeLibraryProps {
  onSelectItem: (item: HistoryItem) => void
  onCreateNew: () => void
}

const RecipeLibrary: React.FC<RecipeLibraryProps> = ({ onSelectItem, onCreateNew }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [folders, setFolders] = useState<RecipeFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSidebar, setShowSidebar] = useState(false)

  const folderColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", 
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
  ]

  useEffect(() => {
    loadData()
    
    // Set initial sidebar state based on screen size
    setShowSidebar(window.innerWidth >= 1024)
    
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowSidebar(true)
      } else {
        setShowSidebar(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadData = () => {
    const savedHistory = localStorage.getItem("recipeHistory")
    const savedFolders = localStorage.getItem("recipeFolders")
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders))
    }
  }

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
    
    const updatedHistory = history.map(item => 
      item.folderId === folderId ? { ...item, folderId: undefined } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
    
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
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const moveToFolder = (recipeId: number, folderId: string | undefined) => {
    const updatedHistory = history.map(item =>
      item.id === recipeId ? { ...item, folderId } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const deleteHistoryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const itemToDelete = history.find(item => item.id === id)
    if (itemToDelete?.recipeId) {
      localStorage.removeItem(`recipe-images-${itemToDelete.recipeId}`)
    }

    const updatedHistory = history.filter((item) => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const extractRecipeTitle = (analysis: string) => {
    const firstLine = analysis.split('\n')[0]
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
  }

  const getRecipeCount = (folderId: string | undefined) => {
    if (folderId === undefined) return history.filter(item => !item.folderId).length
    return history.filter(item => item.folderId === folderId).length
  }

  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.analysis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFolder = selectedFolder === undefined ||
      (selectedFolder === 'uncategorized' && !item.folderId) ||
      item.folderId === selectedFolder

    return matchesSearch && matchesFolder
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Moderner Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20">
        <div className="container mx-auto px-4 sm:px-6 py-1 sm:py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Meine Rezepte
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                    {history.length} {history.length === 1 ? 'gespeichertes Rezept' : 'gespeicherte Rezepte'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 w-full lg:w-auto">
              {/* Suchleiste */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rezepte suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64 lg:w-80 bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                />
              </div>

              {/* Mobile Sidebar Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 h-7 w-7 p-0"
              >
                <Filter size={14} />
              </Button>
              
              {/* Ansichtssteuerung - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List size={16} />
                </Button>
              </div>

              {/* Neues Rezept Button */}
              <Button
                onClick={onCreateNew}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus size={18} className="mr-2" />
                Neues Rezept
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Verbessertes Ordner-Sidebar */}
            {showSidebar && (
              <>
                {/* Mobile Overlay */}
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setShowSidebar(false)}
                />
                
                <div
                  className="fixed left-0 top-0 h-full w-80 z-50 lg:relative lg:w-80 flex-shrink-0 order-2 lg:order-1 lg:z-auto"
                >
                <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800/20 shadow-xl p-3 sm:p-4 lg:p-6 mt-16 sm:mt-20 lg:mt-0">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Organisation</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingFolder(true)}
                      className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
                    >
                      <FolderPlus size={16} className="mr-1" />
                      Neue
                    </Button>
                  </div>

                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <div className="space-y-3">
                      {/* Alle Rezepte */}
                      <div
                        className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedFolder === undefined 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-300/30 shadow-lg' 
                            : 'hover:bg-white/40 dark:hover:bg-gray-800/40'
                        }`}
                        onClick={() => setSelectedFolder(undefined)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200">Alle</span>
                          <p className="text-xs text-gray-500">Alle Rezepte</p>
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
                          {history.length}
                        </span>
                      </div>

                      {/* Unkategorisiert */}
                      <div
                        className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedFolder === 'uncategorized' 
                            ? 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-300/30 shadow-lg' 
                            : 'hover:bg-white/40 dark:hover:bg-gray-800/40'
                        }`}
                        onClick={() => setSelectedFolder('uncategorized')}
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-slate-500 rounded-xl flex items-center justify-center">
                          <Folder className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200">Unkategorisiert</span>
                          <p className="text-xs text-gray-500">Lose Rezepte</p>
                        </div>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                          {getRecipeCount(undefined)}
                        </span>
                      </div>

                      {/* Benutzerdefinierte Ordner */}
                      {folders.map((folder) => (
                        <div
                          key={folder.id}
                          className={`group flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedFolder === folder.id 
                              ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-300/30 shadow-lg' 
                              : 'hover:bg-white/40 dark:hover:bg-gray-800/40'
                          }`}
                          onClick={() => setSelectedFolder(folder.id)}
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${folder.color}, ${folder.color}cc)` }}
                          >
                            <Folder className="h-5 w-5 text-white" />
                          </div>
                          
                          {editingFolder === folder.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editFolderName}
                                onChange={(e) => setEditFolderName(e.target.value)}
                                className="h-8 text-sm bg-white/50 dark:bg-gray-800/50"
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
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  editFolder(folder.id, editFolderName)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Check size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingFolder(null)
                                  setEditFolderName("")
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{folder.name}</span>
                                <p className="text-xs text-gray-500">
                                  Erstellt am {new Date(folder.createdAt).toLocaleDateString('de-DE')}
                                </p>
                              </div>
                              <span 
                                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: folder.color + '80' }}
                              >
                                {getRecipeCount(folder.id)}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingFolder(folder.id)
                                    setEditFolderName(folder.name)
                                  }}
                                  className="h-8 w-8 p-0 bg-white/50 dark:bg-gray-800/50"
                                >
                                  <Edit3 size={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => deleteFolder(folder.id, e)}
                                  className="h-8 w-8 p-0 bg-white/50 dark:bg-gray-800/50 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Neuen Ordner erstellen */}
                        {isCreatingFolder && (
                          <div
                            className="flex items-center gap-3 p-4 bg-white/40 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300/50 dark:border-gray-600/50"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                              <FolderPlus className="h-5 w-5 text-white" />
                            </div>
                            <Input
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              placeholder="Ordnername..."
                              className="flex-1 h-8 text-sm bg-white/50 dark:bg-gray-800/50"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  createFolder()
                                } else if (e.key === 'Escape') {
                                  setIsCreatingFolder(false)
                                  setNewFolderName("")
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={createFolder}
                              className="h-8 w-8 p-0"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsCreatingFolder(false)
                                setNewFolderName("")
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )}
                    </div>
                  </ScrollArea>
                </div>
                </div>
              </>
            )}

          {/* Hauptbereich für Rezepte */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            {filteredHistory.length > 0 ? (
              <div>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {filteredHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800/20 shadow-xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
                        onClick={() => onSelectItem(item)}
                      >
                        <div className="relative aspect-[4/3]">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt="Rezept"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Verbesserte schwebende Buttons */}
                          <div className="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0">
                            <button
                              onClick={(e) => toggleFavorite(item.id, e)}
                              className={`w-9 h-9 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-200 ${
                                item.isFavorite 
                                  ? 'bg-yellow-500/90 text-white shadow-lg shadow-yellow-500/25' 
                                  : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={(e) => deleteHistoryItem(item.id, e)}
                              className="w-9 h-9 rounded-full bg-red-500/20 backdrop-blur-xl border border-white/20 text-white hover:bg-red-500/90 transition-all duration-200 flex items-center justify-center"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Überlagerter Titel */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="text-white font-bold text-sm sm:text-lg leading-tight mb-1 drop-shadow-lg">
                              {item.title || extractRecipeTitle(item.analysis)}
                            </h4>
                            <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                              <Calendar size={14} />
                              {formatDate(item.date)}
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="max-h-24 sm:max-h-32 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                              {item.analysis.length > 200 ? item.analysis.substring(0, 200) + '...' : item.analysis}
                            </p>
                          </div>

                          {/* Verbesserter Ordner-Selektor */}
                          <div className="flex items-center justify-between">
                            <select
                              value={item.folderId || ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                moveToFolder(item.id, e.target.value || undefined)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-3 py-2 flex-1 mr-2 backdrop-blur-sm"
                            >
                              <option value="">Unkategorisiert</option>
                              {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                            {item.isFavorite && (
                              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                                <Star size={14} className="text-yellow-500" fill="currentColor" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800/20 shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
                        onClick={() => onSelectItem(item)}
                      >
                        <div className="flex gap-6">
                          <div className="w-32 h-24 relative rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt="Rezept"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-tight">
                                {item.title || extractRecipeTitle(item.analysis)}
                              </h4>
                              <div className="flex items-center gap-2">
                                {item.isFavorite && <Star size={16} className="text-yellow-500" fill="currentColor" />}
                                <button
                                  onClick={(e) => deleteHistoryItem(item.id, e)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <Calendar size={14} />
                              {formatDate(item.date)}
                            </div>
                            <div className="max-h-20 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {item.analysis}
                              </p>
                            </div>
                            <select
                              value={item.folderId || ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                moveToFolder(item.id, e.target.value || undefined)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-3 py-2 w-48 backdrop-blur-sm"
                            >
                              <option value="">Unkategorisiert</option>
                              {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex-1 flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                  <ChefHat className="h-16 w-16 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  {searchTerm ? 'Keine Rezepte gefunden' : selectedFolder === undefined ? 'Ihre Bibliothek ist leer' : 'Dieser Ordner ist leer'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                  {searchTerm 
                    ? `Wir haben keine Rezepte gefunden, die mit "${searchTerm}" übereinstimmen. Versuchen Sie andere Begriffe.`
                    : selectedFolder === undefined 
                      ? 'Beginnen Sie mit der Digitalisierung Ihres ersten Rezepts. Machen Sie ein Foto oder laden Sie ein Bild hoch.'
                      : 'Dieser Ordner hat noch keine Rezepte. Verschieben Sie einige Rezepte hierher oder erstellen Sie ein neues.'
                  }
                </p>
                <Button
                  onClick={onCreateNew}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus size={20} className="mr-2" />
                  {searchTerm ? 'Neues Rezept erstellen' : 'Erstes Rezept digitalisieren'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeLibrary