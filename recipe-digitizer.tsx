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
import { RecipeService } from "@/lib/services/recipeService"

interface RecipeDigitizerProps {
  handleLogout: () => void
  userRole: 'admin' | 'worker' | 'guest' | null
}

export default function RecipeDigitizer({ handleLogout, userRole }: RecipeDigitizerProps) {
  const [image, setImage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
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

  // Load current user from localStorage
  useEffect(() => {
    const currentUserStr = localStorage.getItem('current-user');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        setCurrentUser({ id: user.id, name: user.name });
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
  }, []);
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
    // Only update previous view if it's different from the new view
    if (currentView !== newView) {
      setPreviousView(currentView)
    }
    setCurrentView(newView)
  }

  // Function to go back to previous view
  const goBack = () => {
    // Ensure we always go back to home screen when coming from archive or users page
    if (currentView === 'archive' || currentView === 'users') {
      setCurrentView('home')
      setPreviousView('home')
    } else if (currentView === 'analyze') {
      // When going back from analyze view, return to the previous view (archive or library)
      setCurrentView(previousView)
      setPreviousView('home')
    } else {
      // Default behavior - use previous view or fall back to home
      const targetView = previousView === currentView ? 'home' : previousView
      setCurrentView(targetView)
    }
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
      await saveToHistory(imageData, result.analysis)
      
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

  const saveToHistory = async (imageData: string, analysisText: string) => {
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
      user_id: currentUser?.id || 'admin-001', // Add user_id
    }

    try {
      console.log('🟢 Guardando receta en BD...');

      // Usar RecipeService para guardar en la BD
      const createdRecipe = await RecipeService.create(historyItem);
      console.log('✅ Receta guardada en BD:', createdRecipe);

      // También guardar en localStorage por compatibilidad temporal
      const existingHistory = localStorage.getItem("recipeHistory")
      const history = existingHistory ? JSON.parse(existingHistory) : []
      const updatedHistory = [historyItem, ...history]
      const limitedHistory = updatedHistory.slice(0, 10)
      localStorage.setItem("recipeHistory", JSON.stringify(limitedHistory))

      setCurrentRecipeId(recipeId)
    } catch (error) {
      console.error("❌ Error al guardar receta:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la receta",
        variant: "destructive"
      })
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


  return (
    <div>
      {currentView === 'home' ? (
        <HomeDashboard
          onStartDigitalization={() => changeView('library')}
          handleLogout={handleLogout}
          onOpenArchive={() => changeView('archive')}
          onOpenUsers={() => changeView('users')}
          userRole={userRole}
        />
      ) : currentView === 'archive' ? (
        <RecipeArchivePage
          onSelectRecipe={(item) => {
            setImage(item.image)
            setAnalysis(item.analysis)
            setCurrentRecipeId(item.id.toString())
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
            setCurrentRecipeId(item.id.toString())
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
                recipeId={currentRecipeId || `recipe_${Date.now()}`}
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