"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Folder, FolderPlus, Edit3, Check, X, Star, Calendar, ChefHat, Search, Plus, Grid3x3, List, Filter, ChevronLeft, ChevronRight, Camera, Upload, RefreshCw, Scan, FileText, BookOpen, Home, Heart, Users, LogOut } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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
  onUploadImage: (file: File, onProgress?: (progress: number) => void, onComplete?: () => void) => void
  onTakePhoto: (onPhotoTaken: (imageData: string) => void) => void
  onStartAnalysis: () => void
  handleLogout: () => void
}

const RecipeLibrary: React.FC<RecipeLibraryProps> = ({ onSelectItem, onCreateNew, onUploadImage, onTakePhoto, onStartAnalysis, handleLogout }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [folders, setFolders] = useState<RecipeFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showSidebar, setShowSidebar] = useState(false)
  const [imageIndices, setImageIndices] = useState<{[key: number]: number}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedImageData, setSelectedImageData] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const folderColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
  ]

  useEffect(() => {
    loadData()

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
    const recipeTitle = itemToDelete?.title || extractRecipeTitle(itemToDelete?.analysis || '')

    const confirmed = window.confirm(`¿Está seguro de que desea eliminar la receta "${recipeTitle}"?\n\nEsta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

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

  const getRecipeImages = (item: HistoryItem): string[] => {
    const allImages: string[] = []

    if (item.image) {
      allImages.push(item.image)
    }

    const savedImages = localStorage.getItem(`recipe-images-${item.recipeId || item.id}`)
    if (savedImages) {
      try {
        const additionalImages = JSON.parse(savedImages)
        allImages.push(...additionalImages)
      } catch (error) {
        console.error('Error loading additional images:', error)
      }
    }

    return allImages
  }

  const nextImageInMiniature = (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const item = history.find(h => h.id === itemId)
    if (!item) return

    const images = getRecipeImages(item)
    const currentIndex = imageIndices[itemId] || 0
    const nextIndex = (currentIndex + 1) % images.length

    setImageIndices(prev => ({
      ...prev,
      [itemId]: nextIndex
    }))
  }

  const prevImageInMiniature = (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const item = history.find(h => h.id === itemId)
    if (!item) return

    const images = getRecipeImages(item)
    const currentIndex = imageIndices[itemId] || 0
    const prevIndex = (currentIndex - 1 + images.length) % images.length

    setImageIndices(prev => ({
      ...prev,
      [itemId]: prevIndex
    }))
  }

  const getCurrentImage = (item: HistoryItem): string => {
    const images = getRecipeImages(item)
    const currentIndex = imageIndices[item.id] || 0
    return images[currentIndex] || item.image || "/placeholder.svg"
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImageData(event.target.result as string)
          setShowConfirmModal(true)
        }
      }

      reader.readAsDataURL(file)
      e.target.value = ""
    }
  }

  const updateProgress = useCallback((progress: number) => {
    setTimeout(() => {
      setAnalysisProgress(progress * 100)
    }, 0)
  }, [])

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      setShowConfirmModal(false)
      setSelectedImageData(null)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      onStartAnalysis()
    }, 0)
  }, [onStartAnalysis])

  const confirmAnalysis = () => {
    if (selectedImageData) {
      setIsAnalyzing(true)
      setAnalysisProgress(0)

      // Convert back to File object for the onUploadImage function
      fetch(selectedImageData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "uploaded_image.jpg", { type: "image/jpeg" })
          onUploadImage(file, updateProgress, handleComplete)
        })
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleTakePhoto = () => {
    onTakePhoto((imageData: string) => {
      setSelectedImageData(imageData)
      setShowConfirmModal(true)
    })
  }

  const handleScanDocument = async () => {
    try {
      // Intentar usar la API Web Scanning si está disponible
      if ('scanner' in navigator) {
        // @ts-ignore - API experimental
        const scanner = await navigator.scanner.requestDevice()
        const scanResult = await scanner.scan()

        if (scanResult && scanResult.imageData) {
          setSelectedImageData(scanResult.imageData)
          setShowConfirmModal(true)
        }
      } else {
        // Fallback: Simular input file con accept específico para scanner
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment' // Priorizar cámara trasera/scanner

        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImageData(event.target.result as string)
                setShowConfirmModal(true)
              }
            }
            reader.readAsDataURL(file)
          }
        }

        input.click()
      }
    } catch (error) {
      console.error('Error al acceder al scanner:', error)
      // Fallback a selección de archivo normal
      triggerFileInput()
    }
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
      {/* Header fijo - Solo título, subtítulo e icono logout */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Altersheim Gärbi
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <ChefHat className="h-3 w-3" />
                  Digitalisierung von Rezepten
                </p>
              </div>
            </div>

            {/* Botón logout siempre visible */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
              title="Ausloggen"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Controles que hacen scroll - No fijos */}
      {history.length > 0 && (
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border-b border-white/10 dark:border-gray-800/10 pt-16 sm:pt-20">
          <div className="container mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Rezepte suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 lg:w-80 bg-white/70 dark:bg-gray-800/70 border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 dark:hover:from-blue-800/40 dark:hover:to-indigo-800/40 border-blue-200/50 dark:border-blue-700/50 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">Kategorien</span>
                  <Filter size={14} className="text-blue-600 dark:text-blue-400 ml-1" />
                </Button>
              </div>

              <div className="flex items-center gap-1 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-full p-1 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-9 w-9 p-0 rounded-full transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <Grid3x3 size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-9 w-9 p-0 rounded-full transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20" style={{ paddingTop: history.length > 0 ? '8px' : '80px' }}>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {showSidebar && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />

              <div className="fixed left-0 top-0 h-full w-80 z-50 lg:relative lg:w-80 flex-shrink-0 order-2 lg:order-1 lg:z-auto">
                <div className="space-y-4 h-full lg:h-auto">
                  <div className="lg:hidden bg-gradient-to-r from-slate-600 to-blue-600 text-white p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Kategorien</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSidebar(false)}
                      className="text-white hover:bg-white/20 p-2"
                    >
                      <X size={20} />
                    </Button>
                  </div>

                  <h3 className="hidden lg:block text-lg font-semibold text-gray-800 dark:text-gray-200 px-2">Kategorien</h3>

                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-none lg:rounded-2xl border-0 lg:border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-4 lg:p-6 h-full lg:h-auto">
                    <div className="flex flex-col items-center justify-center mb-6 space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreatingFolder(true)}
                        className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white border-slate-500 hover:border-blue-600 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <FolderPlus size={16} className="mr-1" />
                        Neue Kategorie
                      </Button>
                      {history.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          {history.length} {history.length === 1 ? 'gespeichertes Rezept' : 'gespeicherte Rezepte'}
                        </p>
                      )}
                    </div>

                    <ScrollArea className="h-[calc(100vh-200px)] lg:h-[calc(100vh-300px)]">
                      <div className="space-y-3">
                        <div
                          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedFolder === undefined
                              ? 'bg-gradient-to-r from-slate-500/20 to-blue-500/20 border border-slate-300/30 shadow-lg'
                              : 'hover:bg-white/40 dark:hover:bg-gray-800/40'
                          }`}
                          onClick={() => setSelectedFolder(undefined)}
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <ChefHat className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-800 dark:text-gray-200">Alle</span>
                            <p className="text-xs text-gray-500">Alle Rezepte</p>
                          </div>
                          <span className="bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium">
                            {history.length}
                          </span>
                        </div>

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

                        {isCreatingFolder && (
                          <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300/50 dark:border-gray-600/50">
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
              </div>
            </>
          )}

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
                            src={getCurrentImage(item)}
                            alt="Rezept"
                            fill
                            className="object-cover"
                          />

                          {(() => {
                            const images = getRecipeImages(item)
                            const currentIndex = imageIndices[item.id] || 0

                            return images.length > 1 ? (
                              <>
                                <button
                                  onClick={(e) => prevImageInMiniature(item.id, e)}
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 z-10 backdrop-blur-sm transition-all duration-200"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={(e) => nextImageInMiniature(item.id, e)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 z-10 backdrop-blur-sm transition-all duration-200"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>

                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                                  {currentIndex + 1} / {images.length}
                                </div>
                              </>
                            ) : null
                          })()}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              onClick={(e) => toggleFavorite(item.id, e)}
                              className={`w-8 h-8 rounded-full backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-200 shadow-lg ${
                                item.isFavorite
                                  ? 'bg-gray-700/80 text-yellow-400 shadow-gray-700/60'
                                  : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700/80 hover:text-yellow-400'
                              }`}
                            >
                              <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={(e) => deleteHistoryItem(item.id, e)}
                              className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md border border-white/30 text-white hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-gray-50/90 to-white/90 dark:from-gray-800/90 dark:to-gray-900/90">
                          <h4 className="text-gray-900 dark:text-gray-100 font-bold text-base leading-tight mb-2 line-clamp-2">
                            {item.title || extractRecipeTitle(item.analysis)}
                          </h4>

                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-3">
                            <Calendar size={14} />
                            {formatDate(item.date)}
                          </div>

                          <select
                            value={item.folderId || ''}
                            onChange={(e) => {
                              e.stopPropagation()
                              moveToFolder(item.id, e.target.value || undefined)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 font-medium text-gray-700 dark:text-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all duration-200 cursor-pointer"
                          >
                            <option value="">🗂️ Keine Kategorien</option>
                            {folders.map(folder => (
                              <option key={folder.id} value={folder.id}>
                                📁 {folder.name}
                              </option>
                            ))}
                          </select>
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
                            <select
                              value={item.folderId || ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                moveToFolder(item.id, e.target.value || undefined)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm bg-white/90 dark:bg-gray-800/90 border-2 border-gray-200/60 dark:border-gray-600/60 rounded-lg px-2 py-2 w-full max-w-[180px] sm:max-w-[200px] font-medium text-gray-700 dark:text-gray-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 transition-all duration-200 cursor-pointer"
                            >
                              <option value="">🗂️ Keine Kategorien</option>
                              {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                  📁 {folder.name}
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
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900/20 dark:to-blue-900/20 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                  <ChefHat className="h-16 w-16 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  {searchTerm ? 'Keine Rezepte gefunden' : selectedFolder === undefined ? 'Ihre Bibliothek ist leer' : 'Dieser Ordner ist leer'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                  {searchTerm
                    ? `Wir haben keine Rezepte gefunden, die mit "${searchTerm}" übereinstimmen. Versuchen Sie andere Begriffe.`
                    : selectedFolder === undefined
                      ? 'Beginnen Sie mit der Digitalisierung Ihres ersten Rezepts. Machen Sie ein Foto, scannen Sie ein Dokument oder laden Sie ein Bild hoch.'
                      : 'Dieser Ordner hat noch keine Rezepte. Verschieben Sie einige Rezepte hierher oder erstellen Sie ein neues.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleTakePhoto}
                    size="lg"
                    className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                  >
                    <Camera size={20} className="mr-3" />
                    Foto aufnehmen
                  </Button>
                  <Button
                    onClick={handleScanDocument}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                  >
                    <Scan size={20} className="mr-3" />
                    Scannen
                  </Button>
                  <Button
                    onClick={triggerFileInput}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                  >
                    <Upload size={20} className="mr-3" />
                    Bild hochladen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input file oculto para subir imágenes */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Modal de confirmación */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => {
        if (!isAnalyzing) {
          setShowConfirmModal(open)
          if (!open) {
            setSelectedImageData(null)
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-slate-600" />
              {isAnalyzing ? 'Rezept wird analysiert...' : 'Rezept analysieren?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImageData && (
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden">
                <Image
                  src={selectedImageData}
                  alt="Ausgewähltes Bild"
                  fill
                  className="object-cover"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-blue-600 font-medium">Analysiere...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAnalyzing ? (
              <div className="space-y-3">
                <Progress value={analysisProgress} className="w-full [&>div]:bg-blue-600" />
                <p className="text-sm text-blue-600 dark:text-blue-400 text-center font-medium">
                  <span className="text-lg font-bold">{Math.round(analysisProgress)}%</span> - Bitte warten Sie, während das Rezept analysiert wird...
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Möchten Sie dieses Bild analysieren und das Rezept digitalisieren?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setShowConfirmModal(false)
                      setSelectedImageData(null)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={confirmAnalysis}
                    className="flex-1 bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white"
                  >
                    Analysieren
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer fijo con botones principales */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-center gap-3 sm:gap-4">
            <Button
              onClick={handleTakePhoto}
              size="sm"
              className="flex-1 max-w-[120px] bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2"
            >
              <Camera size={16} className="mr-2" />
              <span className="text-xs sm:text-sm">Foto</span>
            </Button>
            <Button
              onClick={handleScanDocument}
              size="sm"
              className="flex-1 max-w-[120px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2"
            >
              <Scan size={16} className="mr-2" />
              <span className="text-xs sm:text-sm">Scanner</span>
            </Button>
            <Button
              onClick={triggerFileInput}
              size="sm"
              className="flex-1 max-w-[120px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2"
            >
              <Upload size={16} className="mr-2" />
              <span className="text-xs sm:text-sm">Upload</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecipeLibrary