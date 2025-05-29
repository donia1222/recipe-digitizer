"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Camera, Upload, Settings, History, ChefHat, FileText, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import RecipeAnalyzer from "@/components/recipe-analyzer"
import SettingsModal from "@/components/settings-modal"
import HistoryModal from "@/components/history-modal"
import LoadingOverlay from "@/components/loading-overlay"
import { analyzeRecipeImage, recalculateServings } from "@/lib/actions"
import { motion, AnimatePresence } from "framer-motion"

export default function RecipeDigitizer() {
  const [image, setImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [recalculatingServings, setRecalculatingServings] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [servings, setServings] = useState<number>(2)
  const [originalServings, setOriginalServings] = useState<number>(2)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false)
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
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
        setProgress(0)

        // Fortschritt simulieren
        const interval = setInterval(() => {
          setProgress((oldProgress) => {
            if (oldProgress < 0.9) {
              return oldProgress + 0.1
            }
            clearInterval(interval)
            return 0.9
          })
        }, 300)

        setProgressInterval(interval)
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
    setProgress(0.1)

    try {
      // Fortschritt simulieren
      const interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress < 0.9) {
            return oldProgress + 0.1
          }
          clearInterval(interval)
          return 0.9
        })
      }, 500)

      setProgressInterval(interval)

      // Base64-Daten aus der Daten-URL extrahieren
      const base64Data = imageData.split(",")[1]

      // Server Action verwenden um das Bild zu analysieren
      const result = await analyzeRecipeImage(base64Data)

      if (!result.success) {
        throw new Error(result.error || "Bildanalyse fehlgeschlagen")
      }

      setAnalysis(result.analysis)

      // Im Verlauf speichern
      saveToHistory(imageData, result.analysis)

      // Versuchen die ursprünglichen Portionen aus dem Rezept zu extrahieren
      const servingsMatch =
        result.analysis.match(/serves?\s+(\d+)/i) ||
        result.analysis.match(/for\s+(\d+)\s+person/i) ||
        result.analysis.match(/(\d+)\s+person/i) ||
        result.analysis.match(/(\d+)\s+serving/i) ||
        result.analysis.match(/para\s+(\d+)\s+persona/i) || // Spanisch
        result.analysis.match(/pour\s+(\d+)\s+personne/i) || // Französisch
        result.analysis.match(/für\s+(\d+)\s+person/i) || // Deutsch
        result.analysis.match(/(\d+)\s+portion/i) // Deutsch

      if (servingsMatch && servingsMatch[1]) {
        const extractedServings = Number.parseInt(servingsMatch[1], 10)
        setOriginalServings(extractedServings)
        setServings(extractedServings)
        setDebouncedServings(extractedServings)
      } else {
        // Standard auf 2 setzen wenn keine Portionsinfo gefunden wurde
        setOriginalServings(2)
        setServings(2)
        setDebouncedServings(2)
      }

      setProgress(1)

      // Erfolg-Toast anzeigen
      toast({
        title: "Rezept digitalisiert",
        description: "Ihr Rezept wurde erfolgreich analysiert!",
        variant: "default",
      })
    } catch (error) {
      console.error("Fehler beim Analysieren des Bildes:", error)
      setAnalysis("Fehler beim Analysieren des Bildes. Bitte versuchen Sie es erneut.")
      toast({
        title: "Fehler",
        description:
          error instanceof Error ? error.message : "Bildanalyse fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
        setProgressInterval(null)
      }
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
        title: "Portionen aktualisiert",
        description: `Rezept angepasst für ${newServings} ${newServings === 1 ? "Person" : "Personen"}.`,
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
  const historyItem = {
    id: Date.now(),
    image: imageData,
    analysis: analysisText,
    date: new Date().toISOString(),
  }

  try {
    const existingHistory = localStorage.getItem("recipeHistory")
    const history = existingHistory ? JSON.parse(existingHistory) : []

    // Agrega el nuevo item al inicio del array
    const updatedHistory = [historyItem, ...history]

    // Limita el historial a un máximo de 4 elementos
    const limitedHistory = updatedHistory.slice(0, 4)

    localStorage.setItem("recipeHistory", JSON.stringify(limitedHistory))
  } catch (error) {
    console.error("Fehler beim Speichern des Verlaufs:", error)
  }
}


  const handleServingsChange = (value: number[]) => {
    setServings(value[0])
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
    setOriginalServings(2)
    setDebouncedServings(2)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Kopfzeile */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <ChefHat className="h-10 w-10 text-emerald-500 mr-2" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Rezept Digitalisierer</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Verwandeln Sie Ihre Rezeptbilder mit KI in digitale, bearbeitbare Rezepte. Passen Sie Portionen an und
            speichern Sie Ihre Favoriten.
          </p>
        </motion.div>

        {/* Aktionsleiste */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={18} className="text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:inline text-gray-700 dark:text-gray-200">Einstellungen</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <History size={18} className="text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:inline text-gray-700 dark:text-gray-200">Verlauf</span>
            </Button>
          </div>

          {analysis && (
            <Button
              onClick={handleNewRecipe}
              variant="outline"
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus size={18} className="text-emerald-500" />
              <span className="text-gray-700 dark:text-gray-200">Neues Rezept</span>
            </Button>
          )}
        </div>

        {/* Hauptinhalt */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Upload-Karte */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
              <div className="p-6 flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                  <FileText className="h-5 w-5 text-emerald-500 mr-2" />
                  Rezept Bild
                </h2>

                <div className="flex gap-4 mb-6 w-full justify-center">
                  <Button
                    onClick={handleCameraCapture}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <Camera size={18} />
                    <span>Kamera</span>
                  </Button>

                  <Button
                    onClick={triggerFileInput}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <Upload size={18} />
                    <span>Hochladen</span>
                  </Button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <AnimatePresence>
                  {image ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="w-full relative aspect-square max-h-80 overflow-hidden rounded-xl shadow-md"
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt="Hochgeladenes Rezept"
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900"
                    >
                      <Upload className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        Laden Sie ein Rezeptbild hoch oder machen Sie ein Foto um zu beginnen
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>

          {/* Rezept-Karte */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl h-full">
              <div className="p-6 flex flex-col h-full">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                  <ChefHat className="h-5 w-5 text-emerald-500 mr-2" />
                  Digitalisiertes Rezept
                </h2>

                <AnimatePresence>
                  {analysis ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6 flex-1"
                    >
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                        <div className="flex items-center gap-4">
                          <label
                            htmlFor="servings"
                            className="min-w-[80px] text-gray-700 dark:text-gray-300 font-medium"
                          >
                            Portionen:
                          </label>
                          <Slider
                            id="servings"
                            min={1}
                            max={100}
                            step={1}
                            value={[servings]}
                            onValueChange={handleServingsChange}
                            className="flex-1"
                            disabled={recalculatingServings}
                          />
                          <div className="min-w-[40px] text-center bg-white dark:bg-gray-700 rounded-md py-1 px-2 font-medium text-emerald-600 dark:text-emerald-400 shadow-sm">
                            {servings}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl max-h-[400px] overflow-y-auto relative flex-1 shadow-inner">
                        {recalculatingServings && (
                          <div className="absolute inset-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                            <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-3" />
                              <p className="text-gray-700 dark:text-gray-300">Mengen werden neu berechnet...</p>
                            </div>
                          </div>
                        )}
                        <RecipeAnalyzer recipe={analysis} />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center p-10 text-center"
                    >
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-full mb-4">
                        <ChefHat className="h-16 w-16 text-emerald-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        Laden Sie ein Bild Ihres Rezepts hoch um es hier digitalisiert zu sehen. Sie können dann
                        Portionen anpassen und es zu Ihrer Sammlung hinzufügen.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {loading && <LoadingOverlay progress={progress} />}

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectItem={(item) => {
          setImage(item.image)
          setAnalysis(item.analysis)
          setIsHistoryModalOpen(false)
        }}
      />

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Foto aufnehmen</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCameraModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-96 object-cover" />
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={capturePhoto} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2">
                <Camera size={18} className="mr-2" />
                Foto aufnehmen
              </Button>
              <Button variant="outline" onClick={closeCameraModal} className="px-6 py-2">
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
