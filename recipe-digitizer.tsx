"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Upload, Settings, ChefHat, FileText, Plus, RefreshCw, X, ArrowLeft, Sparkles, LogOut, Shield, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import RecipeAnalyzer from "@/components/recipe-analyzer"
import SettingsModal from "@/components/settings-modal"
import LoadingOverlay from "@/components/loading-overlay"
import RecipeLibrary from "@/components/recipe-library"
import HomeDashboard from "@/components/home-dashboard"
import RecipeArchivePage from "@/components/recipe-archive-page"
import UserPage from "@/components/user-page"
import { analyzeRecipeImage, recalculateServings } from "@/lib/actions"
import ServingsModal from "@/components/servings-modal"

interface RecipeDigitizerProps {
  handleLogout: () => void
}

export default function RecipeDigitizer({ handleLogout }: RecipeDigitizerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [recalculatingServings, setRecalculatingServings] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [servings, setServings] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recipe-servings')
      return saved ? parseInt(saved) : 2
    }
    return 2
  })
  const [servingsInput, setServingsInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recipe-servings')
      return saved ? saved : "2"
    }
    return "2"
  })
  const [originalServings, setOriginalServings] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recipe-original-servings')
      return saved ? parseInt(saved) : 2
    }
    return 2
  })
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false)
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'home' | 'library' | 'analyze' | 'archive' | 'users'>('home')
  const [showServingsModal, setShowServingsModal] = useState<boolean>(false)
  const [previousView, setPreviousView] = useState<'home' | 'library' | 'analyze' | 'archive' | 'users'>('home')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)
  const [photoCallback, setPhotoCallback] = useState<((imageData: string) => void) | null>(null)

  // Save servings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recipe-servings', servings.toString())
    }
  }, [servings])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recipe-original-servings', originalServings.toString())
    }
  }, [originalServings])

  // Extract recipe title from analysis
  const getRecipeTitle = (recipe: string) => {
    const lines = recipe.split('\n').filter(line => line.trim())
    for (let line of lines.slice(0, 5)) {
      if (line.length < 60 && !line.toLowerCase().includes('ingredient') &&
          !line.toLowerCase().includes('zutaten') && !line.toLowerCase().includes('instruction') &&
          !line.toLowerCase().includes('schritt') && !line.toLowerCase().includes('portion') &&
          !line.includes('cup') && !line.includes('tbsp') && !line.includes('tsp') &&
          !line.includes('ml') && !line.includes('g ') && !line.includes('oz')) {
        return line.trim()
      }
    }
    return 'Mein Rezept'
  }

  // Interval beim Unmount bereinigen
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [progressInterval])

  const resetState = () => {
    // Fortschritt zurücksetzen und bestehende Intervalle löschen
    if (progressInterval) {
      clearInterval(progressInterval)
    }
    setProgress(0)
    setAnalysis("")
  }

  // Function to change view and save previous view
  const changeView = (newView: 'home' | 'library' | 'analyze' | 'archive' | 'users') => {
    setPreviousView(currentView)
    setCurrentView(newView)
  }

  // Function to go back to previous view
  const goBack = () => {
    setCurrentView(previousView)
  }

  // Handler for recipe updates from edit functionality
  const handleRecipeUpdate = (newRecipe: string) => {
    setAnalysis(newRecipe)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      resetState()

      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onloadstart = () => {
        setLoading(true)
        setProgress(0.1)
      }

      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string)
          analyzeImage(event.target.result as string)
        }
      }

      reader.readAsDataURL(file)

      // Datei-Input zurücksetzen damit dieselbe Datei erneut ausgewählt werden kann
      e.target.value = ""
    }
  }

  const handleCameraCapture = async () => {
    try {
      resetState()

      // Prüfen ob der Browser die Kamera-API unterstützt
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Fehler",
          description: "Ihr Browser unterstützt keinen Kamera-Zugriff",
          variant: "destructive",
        })
        return
      }

      // Request camera access with better settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setCameraStream(stream)
      setShowCameraModal(true)

      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch (error) {
      console.error("Fehler beim Kamera-Zugriff:", error)
      toast({
        title: "Fehler",
        description: "Konnte nicht auf die Kamera zugreifen. Bitte überprüfen Sie die Berechtigungen.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !cameraStream) return

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8)

      // Stop camera stream
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
      setShowCameraModal(false)

      // If there's a callback (from RecipeLibrary), use it
      if (photoCallback) {
        photoCallback(imageDataUrl)
        setPhotoCallback(null)
      } else {
        // Original behavior for direct analysis
        setImage(imageDataUrl)
        analyzeImage(imageDataUrl)
      }
    }
  }

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setShowCameraModal(false)
  }

  const analyzeImage = async (imageData: string) => {
    setLoading(true)
    setProgress(0.2)

    try {
      setProgress(0.3)

      // Base64-Daten aus der Daten-URL extrahieren
      const base64Data = imageData.split(",")[1]
      
      setProgress(0.5)
      
      // Server Action verwenden um das Bild zu analysieren
      const result = await analyzeRecipeImage(base64Data)
      
      setProgress(0.8)

      if (!result.success) {
        throw new Error(result.error || "Bildanalyse fehlgeschlagen")
      }

      setAnalysis(result.analysis)

      // Im Verlauf speichern
      saveToHistory(imageData, result.analysis)
      
      // Cambiar a vista de análisis si estamos en la biblioteca
      if (currentView === 'library') {
        changeView('analyze')
      }

      // Versuchen die ursprünglichen Portionen aus dem Rezept zu extrahieren
      const servingsMatch =
        result.analysis.match(/serves?\s+(\d+)/i) ||
        result.analysis.match(/for\s+(\d+)\s+person/i) ||
        result.analysis.match(/(\d+)\s+person/i) ||
        result.analysis.match(/(\d+)\s+serving/i) ||
        result.analysis.match(/für\s+(\d+)\s+person/i) || // Deutsch
        result.analysis.match(/(\d+)\s+portion/i) // Deutsch

      if (servingsMatch && servingsMatch[1]) {
        const extractedServings = Number.parseInt(servingsMatch[1], 10)
        setOriginalServings(extractedServings)
        // Solo actualizar servings si es la primera vez o si no hay servings ajustados manualmente
        if (servings === originalServings) {
          setServings(extractedServings)
          setServingsInput(extractedServings.toString())
        }
      } else {
        // Solo establecer por defecto si es la primera vez
        if (originalServings === 2 && servings === 2) {
          setOriginalServings(2)
          setServings(2)
          setServingsInput("2")
        } else {
          // Mantener las porciones ajustadas por el usuario
          setOriginalServings(2)
        }
      }

      setProgress(1)

      // Erfolg-Toast anzeigen
      toast({
        title: "Rezept digitalisiert",
        description: "Rezept erfolgreich digitalisiert",
        variant: "default",
      })
    } catch (error) {
      console.error("Fehler beim Analysieren des Bildes:", error)
      setAnalysis("Fehler beim Analysieren des Bildes. Bitte versuchen Sie es erneut.")
      toast({
        title: "Fehler",
        description: "Fehler beim Digitalisieren des Rezepts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualRecalculation = async () => {
    setShowServingsModal(true)
  }

  const handleServingsRecalculation = async (newServings: number) => {
    if (!analysis || newServings === originalServings) return

    setRecalculatingServings(true)
    try {
      const result = await recalculateServings(analysis, originalServings, newServings)

      if (!result.success) {
        throw new Error(result.error || "Neuberechnung der Portionen fehlgeschlagen")
      }

      setAnalysis(result.analysis)
      setOriginalServings(newServings)
      setServings(newServings)
      setServingsInput(newServings.toString())

      // Erfolg-Toast anzeigen
      toast({
        title: "Portionen angepasst",
        description: `Für ${newServings} ${newServings === 1 ? "Person" : "Personen"}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Fehler beim Neuberechnen der Portionen:", error)
      toast({
        title: "Fehler",
        description:
          error instanceof Error
            ? error.message
            : "Neuberechnung der Portionen fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setRecalculatingServings(false)
    }
  }

  const saveToHistory = (imageData: string, analysisText: string) => {
    const recipeId = `recipe-${Date.now()}`
    const extractRecipeTitle = (analysis: string) => {
      const firstLine = analysis.split('\n')[0]
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
    }
    
    const historyItem = {
      id: Date.now(),
      recipeId: recipeId,
      image: imageData,
      analysis: analysisText,
      date: new Date().toISOString(),
      title: extractRecipeTitle(analysisText),
      isFavorite: false,
      folderId: undefined,
    }

    try {
      const existingHistory = localStorage.getItem("recipeHistory")
      const history = existingHistory ? JSON.parse(existingHistory) : []

      // Agrega el nuevo item al inicio del array
      const updatedHistory = [historyItem, ...history]

      // Limita el historial a un máximo de 10 elementos
      const limitedHistory = updatedHistory.slice(0, 10)

      localStorage.setItem("recipeHistory", JSON.stringify(limitedHistory))
      setCurrentRecipeId(recipeId)
    } catch (error) {
      console.error("Fehler beim Speichern des Verlaufs:", error)
    }
  }

  const handleServingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setServingsInput(value)

    // Validar y convertir a número
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue > 0 && numValue <= 100) {
      setServings(numValue)
    }
  }

  const handleServingsInputBlur = () => {
    // Asegurar que el input tenga un valor válido al perder el foco
    const numValue = Number.parseInt(servingsInput, 10)
    if (isNaN(numValue) || numValue < 1) {
      setServingsInput("1")
      setServings(1)
    } else if (numValue > 100) {
      setServingsInput("100")
      setServings(100)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleNewRecipe = () => {
    resetState()
    setImage(null)
    setAnalysis("")
    setServings(2)
    setServingsInput("2")
    setOriginalServings(2)
    setCurrentRecipeId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Vista de análisis cuando se ha seleccionado una receta o se está analizando una nueva
  const AnalysisView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header del modo análisis */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20">
        <div className="container mx-auto px-4 sm:px-6 py-1 sm:py-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  changeView('library')
                  handleNewRecipe()
                }}
                className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
              >
                <ArrowLeft size={18} className="mr-2" />
                Zurück zur Bibliothek
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-500 to-blue-600 rounded-xl flex items-center justify-center">
                <ChefHat className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
         
                <div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {analysis ? 'Digitalisiertes Rezept' : 'Neues Rezept digitalisieren'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {analysis ? 'Rezept bearbeiten' : 'Bild hochladen oder Foto aufnehmen'}
                  </p>
                </div>
              </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-10">
              <Button
                variant="outline"
                onClick={() => setIsSettingsModalOpen(true)}
                className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
              >
                <Settings size={18} />
              </Button>
              {analysis && (
                <Button
                  onClick={handleNewRecipe}
                  className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white"
                >
                  <Plus size={18} className="mr-2" />
                Neues Rezept
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4 lg:py-8 max-w-7xl pt-20 sm:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Bild Panel */}
          <div className="space-y-6">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
                  <FileText className="h-6 w-6 text-slate-500 mr-3" />
                  Rezeptbild
                </h2>

                {!image && (
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
                    <Button
                      onClick={handleCameraCapture}
                      disabled={loading}
                      size="lg"
                      className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white shadow-lg"
                    >
                      <Camera size={20} className="mr-2" />
                      Kamera
                    </Button>

                    <Button
                      onClick={triggerFileInput}
                      disabled={loading}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Upload size={20} className="mr-2" />
                      Datei hochladen
                    </Button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}

                {image ? (
                  <div className="relative group">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                      <Image
                        src={image}
                        alt="Hochgeladenes Rezept"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                    
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        onClick={triggerFileInput}
                        size="sm"
                        className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30"
                        variant="outline"
                      >
                        <Upload size={16} className="mr-1" />
                        Ändern
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-gray-300/50 dark:border-gray-600/50 rounded-2xl bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900/20 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
                      <Upload className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Laden Sie Ihr Rezept hoch
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-md leading-relaxed">
                      Nehmen Sie ein Foto mit der Kamera auf oder laden Sie ein Bild von Ihrem Gerät hoch, um mit der Digitalisierung zu beginnen
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Rezept Panel */}
          <div className="space-y-6">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-2xl rounded-2xl overflow-hidden h-[calc(100vh-80px)] sm:h-[calc(100vh-120px)] lg:h-[calc(100vh-160px)]">
              <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col min-h-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-800 dark:text-white flex items-center">
                  <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 mr-2 sm:mr-3" />
                  Digitalisiertes Rezept
                </h2>

                {analysis ? (
                  <div className="space-y-3 sm:space-y-4 lg:space-y-6 flex-1">
                    <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 dark:from-slate-900/20 dark:to-blue-900/20 p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <label
                          htmlFor="servings"
                          className="text-gray-700 dark:text-gray-300 font-semibold text-sm sm:text-base min-w-[80px] sm:min-w-[100px]">
                
                          Portionen:
                        </label>
                        <Input
                          id="servings"
                          type="number"
                          min="1"
                          max="100"
                          value={servingsInput}
                          onChange={handleServingsInputChange}
                          onBlur={handleServingsInputBlur}
                          disabled={recalculatingServings}
                          className="w-20 sm:w-24 text-center bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 focus:border-slate-500 dark:focus:border-slate-400 text-base sm:text-lg font-semibold"
                        />
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                          {servings === 1 ? "Person" : "Personen"}
                        </span>
                        <Button
                          onClick={handleManualRecalculation}
                          disabled={recalculatingServings}
                          size="sm"
                          className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Ajustar porciones
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-gray-700/30 relative flex-1 min-h-0">
                      {recalculatingServings && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                          <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl">
                            <RefreshCw className="h-10 w-10 text-slate-500 mb-4" />
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              Portionen werden neu berechnet...
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="h-full max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-180px)] lg:max-h-[calc(100vh-250px)] overflow-y-auto p-3 sm:p-4 lg:p-6 pb-8 sm:pb-12 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        <RecipeAnalyzer
                          recipe={analysis}
                          recipeId={currentRecipeId || undefined}
                          originalImage={image || undefined}
                          onServingsClick={() => setShowServingsModal(true)}
                          currentServings={servings}
                          originalServings={originalServings}
                          onRecipeUpdate={handleRecipeUpdate}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900/20 dark:to-blue-900/20 rounded-3xl flex items-center justify-center mb-8">
                      <ChefHat className="h-12 w-12 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                      Laden Sie ein Bild hoch, um zu beginnen!
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                      Sobald Sie das Bild Ihres Rezepts hochladen, wird die KI es analysieren und Sie können die Portionen anpassen.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {loading && <LoadingOverlay progress={progress} />}
    </div>
  )

  return (
    <div>
      {currentView === 'home' ? (
        <HomeDashboard
          onStartDigitalization={() => changeView('library')}
          handleLogout={handleLogout}
          onOpenArchive={() => changeView('archive')}
          onOpenUsers={() => changeView('users')}
        />
      ) : currentView === 'archive' ? (
        <RecipeArchivePage
          onSelectRecipe={(item) => {
            setImage(item.image)
            setAnalysis(item.analysis)
            setCurrentRecipeId(item.recipeId || null)
            changeView('analyze')

            // Extract servings from analysis if available
            const servingsMatch = item.analysis.match(/serves?\s+(\d+)/i) ||
                                  item.analysis.match(/für\s+(\d+)\s+person/i) ||
                                  item.analysis.match(/(\d+)\s+portion/i)

            if (servingsMatch && servingsMatch[1]) {
              const extractedServings = parseInt(servingsMatch[1], 10)
              setOriginalServings(extractedServings)
              setServings(extractedServings)
              setServingsInput(extractedServings.toString())
            } else {
              setOriginalServings(2)
              setServings(2)
              setServingsInput("2")
            }
          }}
          onBack={goBack}
        />
      ) : currentView === 'users' ? (
        <UserPage
          onBack={goBack}
          onOpenArchive={() => changeView('archive')}
        />
      ) : currentView === 'library' ? (
        <RecipeLibrary
          onSelectItem={(item) => {
            setImage(item.image)
            setAnalysis(item.analysis)
            setCurrentRecipeId(item.recipeId || null)
            changeView('analyze')

            // Extract servings from analysis if available
            const servingsMatch = item.analysis.match(/serves?\s+(\d+)/i) ||
                                  item.analysis.match(/für\s+(\d+)\s+person/i) ||
                                  item.analysis.match(/(\d+)\s+portion/i)

            if (servingsMatch && servingsMatch[1]) {
              const extractedServings = parseInt(servingsMatch[1], 10)
              setOriginalServings(extractedServings)
              setServings(extractedServings)
              setServingsInput(extractedServings.toString())
            } else {
              setOriginalServings(2)
              setServings(2)
              setServingsInput("2")
            }
          }}
          onCreateNew={() => changeView('analyze')}
          onUploadImage={(file: File, onProgress, onComplete) => {
            resetState()

            const reader = new FileReader()

            reader.onloadstart = () => {
              setLoading(true)
              setProgress(0.1)
              onProgress?.(0.1)
            }

            reader.onload = async (event) => {
              if (event.target?.result) {
                setImage(event.target.result as string)

                // Simulate progress updates during analysis
                let localProgressInterval: NodeJS.Timeout | null = null
                if (onProgress) {
                  localProgressInterval = setInterval(() => {
                    setProgress(prev => {
                      const newProgress = Math.min(prev + 0.1, 0.9)
                      onProgress(newProgress)
                      return newProgress
                    })
                  }, 200)

                  // Store interval to clear it later
                  setProgressInterval(localProgressInterval)
                }

                // Call analyzeImage and handle completion
                analyzeImage(event.target.result as string).finally(() => {
                  // Clear the progress interval when analysis is done
                  if (localProgressInterval) {
                    clearInterval(localProgressInterval)
                    setProgressInterval(null)
                  }
                  onComplete?.()
                })
              }
            }

            reader.readAsDataURL(file)
          }}
          onTakePhoto={(onPhotoTaken) => {
            setPhotoCallback(() => onPhotoTaken)
            handleCameraCapture()
          }}
          onStartAnalysis={() => changeView('analyze')}
          onBackToHome={() => changeView('home')}
          handleLogout={handleLogout}
        />
      ) : (
        // Vista de receta guardada - solo análisis con imágenes
        <div>
          {/* Header principal */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b-4 border-blue-500 shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <div className="flex items-center gap-2 lg:justify-center lg:relative">
                <Button
                  onClick={goBack}
                  size="lg"
                  className="bg-gradient-to-r from-slate-500 to-blue-600 hover:from-slate-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-10 h-10 p-0 lg:absolute lg:left-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

              </div>
            </div>
          </div>

          {/* Recipe Analysis */}
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-4xl pt-32 sm:pt-36 lg:pt-40">
            {analysis && (
              <RecipeAnalyzer
                recipe={analysis}
                recipeId={currentRecipeId || undefined}
                originalImage={image || undefined}
                onServingsClick={() => setShowServingsModal(true)}
                currentServings={servings}
                originalServings={originalServings}
                onRecipeUpdate={handleRecipeUpdate}
              />
            )}
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Rezept fotografieren
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeCameraModal}
              className="text-white hover:bg-white/20 p-2"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Camera View - Formato vertical para recetas */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-md" style={{ aspectRatio: '3/4' }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Overlay guide for recipe positioning */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                  Receta hier positionieren
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-black/80 backdrop-blur-sm p-4 pb-8">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={closeCameraModal}
                variant="outline"
                size="lg"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 px-6"
              >
                Abbrechen
              </Button>
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg px-8"
              >
                <Camera size={20} className="mr-2" />
                Aufnehmen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Servings Modal */}
      <ServingsModal
        isOpen={showServingsModal}
        onClose={() => setShowServingsModal(false)}
        currentServings={servings}
        originalServings={originalServings}
        onAdjust={handleServingsRecalculation}
        isLoading={recalculatingServings}
      />
    </div>
  )
}