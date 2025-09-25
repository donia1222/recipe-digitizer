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
  user_id?: string
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

  // Escuchar eventos de actualización y eliminación de recetas
  useEffect(() => {
    const handleRecipeUpdate = () => {
      console.log('📚 Recipe updated event received in LIBRARY, reloading data...');
      loadData();
    };

    const handleRecipeDelete = () => {
      console.log('📚 Recipe deleted event received, reloading data...');
      loadData();
    };

    window.addEventListener('recipeUpdated', handleRecipeUpdate);
    window.addEventListener('recipeDeleted', handleRecipeDelete);

    return () => {
      window.removeEventListener('recipeUpdated', handleRecipeUpdate);
      window.removeEventListener('recipeDeleted', handleRecipeDelete);
    };
  }, [])

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
        console.log('🔍 Processing recipe in library:', {
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
          console.log('🖼️ Library - Using first additional image as main for recipe:', recipe.id, 'has additional images:', recipe.additional_images.length);
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

  const [userNameCache, setUserNameCache] = useState<{[key: string]: string}>({})

  const getUserName = (userId?: string): string => {
    if (!userId) return 'Unbekannter Benutzer';

    // Check cache first
    if (userNameCache[userId]) {
      return userNameCache[userId];
    }

    // Try to get user name from current user if it matches
    const currentUserStr = localStorage.getItem('current-user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === userId) {
          const name = currentUser.name || 'Sie';
          setUserNameCache(prev => ({ ...prev, [userId]: name }));
          return name;
        }
      } catch (error) {
        console.error('Error parsing current user:', error);
      }
    }

    // Fetch from API in background
    fetchUserName(userId);

    return 'Cargando...';
  }

  const fetchUserName = async (userId: string) => {
    try {
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/users.php?id=${userId}`);
      const data = await response.json();

      if (data.success && data.data) {
        // Check if data.data is an array (all users) or single user
        if (Array.isArray(data.data)) {
          const user = data.data.find((u: any) => u.id === userId);
          if (user && user.name) {
            setUserNameCache(prev => ({ ...prev, [userId]: user.name }));
            return;
          }
        } else if (data.data.name) {
          setUserNameCache(prev => ({ ...prev, [userId]: data.data.name }));
          return;
        }
      }

      // Fallback to static mapping
      const staticMappings: { [key: string]: string } = {
        '1': 'Andrea Müller',
        '2': 'Hans Weber',
        '3': 'Maria Schmidt',
        '4': 'Peter Fischer',
        'admin-001': 'Andrea Müller',
        'worker-001': 'Hans Weber',
        'worker-002': 'Maria Schmidt',
        'guest-001': 'Peter Fischer'
      };
      const fallbackName = staticMappings[userId] || 'Usuario';
      setUserNameCache(prev => ({ ...prev, [userId]: fallbackName }));
    } catch (error) {
      console.error('Error fetching user:', error);
      setUserNameCache(prev => ({ ...prev, [userId]: 'Usuario' }));
    }
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
      {/* Header fijo - Con icono, título y subtítulo */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBackToHome && (
                <Button
                  onClick={onBackToHome}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 border-gray-300 hover:bg-gray-50 bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Rezepte Digitalisieren</h1>
                  <p className="text-sm text-gray-600">Foto aufnehmen oder hochladen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Contenido principal - 3 botones uno debajo del otro */}
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <div className="space-y-6">

          {/* Botón Foto */}
          <div
            onClick={handleTakePhoto}
            className="group bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl overflow-hidden mt-20"
          >
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors duration-200">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Foto machen</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Machen Sie ein Foto Ihres Rezepts direkt mit der Kamera Ihres Geräts
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Direkte Aufnahme</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4" />
                      <span>Optimiert für Dokumente</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200">
                    →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón Upload */}
          <div
            onClick={triggerFileInput}
            className="group bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl overflow-hidden"
          >
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-700 transition-colors duration-200">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Bild hochladen</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Wählen Sie ein bereits gespeichertes Bild aus Ihrer Galerie oder Ihrem Computer aus
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Aus Galerie</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4" />
                      <span>Alle Formate</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-200">
                    →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón Scanner */}
          <div
            onClick={handleScanDocument}
            className="group bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl overflow-hidden"
          >
            <div className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-purple-700 transition-colors duration-200">
                    <Scan className="h-8 w-8 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Dokument scannen</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Verwenden Sie die Scanner-Funktion für beste Qualität bei Rezeptbüchern und Dokumenten
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Scan className="h-4 w-4" />
                      <span>Dokumenten-Scanner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Für Rezeptbücher</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200">
                    →
                  </div>
                </div>
              </div>
            </div>
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

    </div>
  )
}

export default RecipeLibrary