"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Upload, Settings, ChefHat, FileText, Plus, RefreshCw, X, ArrowLeft, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import RecipeAnalyzer from "@/components/recipe-analyzer"
import SettingsModal from "@/components/settings-modal"
import LoadingOverlay from "@/components/loading-overlay"
import RecipeLibrary from "@/components/recipe-library"
import { analyzeRecipeImage, recalculateServings } from "@/lib/actions"

export default function RecipeDigitizer() {
  const [image, setImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [recalculatingServings, setRecalculatingServings] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [servings, setServings] = useState<number>(2)
  const [servingsInput, setServingsInput] = useState<string>("2")
  const [originalServings, setOriginalServings] = useState<number>(2)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false)
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'library' | 'analyze'>('library')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()
  const [debouncedServings, setDebouncedServings] = useState<number>(2)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)

  // Verzögerung bei Portionsänderungen um zu viele API-Aufrufe zu vermeiden
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedServings(servings)
    }, 500)

    return () => clearTimeout(timer)
  }, [servings])

  // Effekt zur Neuberechnung der Portionen wenn sich der verzögerte Wert ändert
  useEffect(() => {
    if (analysis && debouncedServings !== originalServings) {
      handleServingsRecalculation(debouncedServings)
    }
  }, [debouncedServings, analysis, originalServings])

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

      // Set captured image and analyze
      setImage(imageDataUrl)
      analyzeImage(imageDataUrl)
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
        setCurrentView('analyze')
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
        setServings(extractedServings)
        setServingsInput(extractedServings.toString())
        setDebouncedServings(extractedServings)
      } else {
        // Standard auf 2 setzen wenn keine Portionsinfo gefunden wurde
        setOriginalServings(2)
        setServings(2)
        setServingsInput("2")
        setDebouncedServings(2)
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
    setDebouncedServings(2)
    setCurrentRecipeId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Vista de análisis cuando se ha seleccionado una receta o se está analizando una nueva
  const AnalysisView = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      {/* Header del modo análisis */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentView('library')
                  handleNewRecipe()
                }}
                className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
              >
                <ArrowLeft size={18} className="mr-2" />
                Zurück zur Bibliothek
              </Button>
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
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
            
            <div className="flex items-center gap-2">
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
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <Plus size={18} className="mr-2" />
                  Neues Rezept
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Bild Panel */}
          <div className="space-y-6">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
                  <FileText className="h-6 w-6 text-emerald-500 mr-3" />
                  Rezeptbild
                </h2>

                {!image && (
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
                    <Button
                      onClick={handleCameraCapture}
                      disabled={loading}
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
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
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl flex items-center justify-center mb-6">
                      <Upload className="h-10 w-10 text-emerald-500" />
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
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-2xl rounded-2xl overflow-hidden h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)]">
              <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col min-h-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-800 dark:text-white flex items-center">
                  <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 mr-2 sm:mr-3" />
                  Digitalisiertes Rezept
                </h2>

                {analysis ? (
                  <div className="space-y-6 flex-1">
                    <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 p-3 sm:p-4 lg:p-6 rounded-2xl border border-emerald-200/30 dark:border-emerald-800/30">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <label
                          htmlFor="servings"
                          className="text-gray-700 dark:text-gray-300 font-semibold text-sm sm:text-base min-w-[80px] sm:min-w-[100px]">
                        >
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
                          className="w-20 sm:w-24 text-center bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 focus:border-emerald-500 dark:focus:border-emerald-400 text-base sm:text-lg font-semibold"
                        />
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
                          {servings === 1 ? "Person" : "Personen"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-gray-700/30 relative flex-1 min-h-0">
                      {recalculatingServings && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                          <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl">
                            <RefreshCw className="h-10 w-10 text-emerald-500 mb-4" />
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              Portionen werden neu berechnet...
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="h-full max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-240px)] lg:max-h-[calc(100vh-300px)] overflow-y-auto p-3 sm:p-4 lg:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        <RecipeAnalyzer recipe={analysis} recipeId={currentRecipeId || undefined} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-3xl flex items-center justify-center mb-8">
                      <ChefHat className="h-12 w-12 text-emerald-500" />
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
      {currentView === 'library' ? (
        <RecipeLibrary
          onSelectItem={(item) => {
            setImage(item.image)
            setAnalysis(item.analysis)
            setCurrentRecipeId(item.recipeId || null)
            setCurrentView('analyze')
            
            // Extract servings from analysis if available
            const servingsMatch = item.analysis.match(/serves?\s+(\d+)/i) ||
                                  item.analysis.match(/für\s+(\d+)\s+person/i) ||
                                  item.analysis.match(/(\d+)\s+portion/i)
            
            if (servingsMatch && servingsMatch[1]) {
              const extractedServings = parseInt(servingsMatch[1], 10)
              setOriginalServings(extractedServings)
              setServings(extractedServings)
              setServingsInput(extractedServings.toString())
              setDebouncedServings(extractedServings)
            } else {
              setOriginalServings(2)
              setServings(2)
              setServingsInput("2")
              setDebouncedServings(2)
            }
          }}
          onCreateNew={() => setCurrentView('analyze')}
        />
      ) : (
        <AnalysisView />
      )}

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-4 border border-white/20 dark:border-gray-700/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <Camera className="h-6 w-6 text-emerald-500" />
                Foto aufnehmen
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCameraModal}
                className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-96 object-cover" />
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg px-8"
              >
                <Camera size={20} className="mr-2" />
                Foto aufnehmen
              </Button>
              <Button
                variant="outline"
                onClick={closeCameraModal}
                size="lg"
                className="px-8 bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}