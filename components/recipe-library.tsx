"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { RecipeService } from "@/lib/services/recipeService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Star, Calendar, ChefHat, Search, Grid3x3, List, ChevronLeft, ChevronRight, Camera, Upload, RefreshCw, Scan, BookOpen, Home, LogOut, ArrowLeft, Shield } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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
  onBackToHome?: () => void
  handleLogout: () => void
}

const RecipeLibrary: React.FC<RecipeLibraryProps> = ({ onSelectItem, onCreateNew, onUploadImage, onTakePhoto, onStartAnalysis, onBackToHome, handleLogout }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [imageIndices, setImageIndices] = useState<{[key: number]: number}>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedImageData, setSelectedImageData] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

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
  }


  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
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
    if (!dateString) {
      return 'Datum unbekannt'
    }

    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Datum unbekannt'
    }

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

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header fijo - Solo título, subtítulo e icono logout */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              {onBackToHome && (
                <Button
                  onClick={onBackToHome}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </Button>
              )}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Rezept Bibliothek
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Ihre digitalisierten Rezepte
                </p>
              </div>
            </div>

            {/* Botones admin y logout */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.location.href = '/admin'}
                variant="ghost"
                size="sm"
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
                title="Panel de Administración"
              >
                <Shield size={18} />
              </Button>
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
        <div>
          <div className="w-full">

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
                  {searchTerm ? 'Keine Rezepte gefunden' : 'Ihre Bibliothek ist leer'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md leading-relaxed">
                  {searchTerm
                    ? `Wir haben keine Rezepte gefunden, die mit "${searchTerm}" übereinstimmen. Versuchen Sie andere Begriffe.`
                    : 'Beginnen Sie mit der Digitalisierung Ihres ersten Rezepts. Machen Sie ein Foto, scannen Sie ein Dokument oder laden Sie ein Bild hoch.'
                  }
                </p>
         
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