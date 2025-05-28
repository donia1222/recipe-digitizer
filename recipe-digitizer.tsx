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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [debouncedServings, setDebouncedServings] = useState<number>(2)
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null)

  // Debounce servings changes to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedServings(servings)
    }, 500)

    return () => clearTimeout(timer)
  }, [servings])

  // Effect to recalculate servings when debounced value changes
  useEffect(() => {
    if (analysis && debouncedServings !== originalServings) {
      handleServingsRecalculation(debouncedServings)
    }
  }, [debouncedServings, analysis, originalServings])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [progressInterval])

  const resetState = () => {
    // Reset progress and clear any existing intervals
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

        // Simulate progress
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

      // Reset file input so the same file can be selected again
      e.target.value = ""
    }
  }

  const handleCameraCapture = async () => {
    try {
      resetState()

      // Check if the browser supports the camera API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Error",
          description: "Your browser does not support camera access",
          variant: "destructive",
        })
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const videoElement = document.createElement("video")
      const canvasElement = document.createElement("canvas")

      videoElement.srcObject = stream
      videoElement.play()

      setTimeout(() => {
        const context = canvasElement.getContext("2d")
        canvasElement.width = videoElement.videoWidth
        canvasElement.height = videoElement.videoHeight

        if (context) {
          context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
          const imageDataUrl = canvasElement.toDataURL("image/jpeg")

          // Stop all video tracks to turn off the camera
          stream.getTracks().forEach((track) => track.stop())

          setImage(imageDataUrl)
          analyzeImage(imageDataUrl)
        }
      }, 300)
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast({
        title: "Error",
        description: "Could not access the camera. Please check permissions.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const analyzeImage = async (imageData: string) => {
    setLoading(true)
    setProgress(0.1)

    try {
      // Simulate progress
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

      // Extract base64 data from the data URL
      const base64Data = imageData.split(",")[1]

      // Use server action to analyze the image
      const result = await analyzeRecipeImage(base64Data)

      if (!result.success) {
        throw new Error(result.error || "Failed to analyze image")
      }

      setAnalysis(result.analysis)

      // Save to history
      saveToHistory(imageData, result.analysis)

      // Try to extract original servings from the recipe
      const servingsMatch =
        result.analysis.match(/serves?\s+(\d+)/i) ||
        result.analysis.match(/for\s+(\d+)\s+person/i) ||
        result.analysis.match(/(\d+)\s+person/i) ||
        result.analysis.match(/(\d+)\s+serving/i) ||
        result.analysis.match(/para\s+(\d+)\s+persona/i) || // Spanish
        result.analysis.match(/pour\s+(\d+)\s+personne/i) // French

      if (servingsMatch && servingsMatch[1]) {
        const extractedServings = Number.parseInt(servingsMatch[1], 10)
        setOriginalServings(extractedServings)
        setServings(extractedServings)
        setDebouncedServings(extractedServings)
      } else {
        // Default to 2 if no servings info found
        setOriginalServings(2)
        setServings(2)
        setDebouncedServings(2)
      }

      setProgress(1)

      // Show success toast
      toast({
        title: "Recipe Digitized",
        description: "Your recipe has been successfully analyzed!",
        variant: "default",
      })
    } catch (error) {
      console.error("Error analyzing image:", error)
      setAnalysis("Error analyzing the image. Please try again.")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze the image. Please try again.",
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
        throw new Error(result.error || "Failed to recalculate servings")
      }

      setAnalysis(result.analysis)
      setOriginalServings(newServings)

      // Show success toast
      toast({
        title: "Servings Updated",
        description: `Recipe adjusted for ${newServings} ${newServings === 1 ? "person" : "people"}.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error recalculating servings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recalculate servings. Please try again.",
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

    // Get existing history from localStorage
    const existingHistory = localStorage.getItem("recipeHistory")
    const history = existingHistory ? JSON.parse(existingHistory) : []

    // Add new item to the beginning of the array
    const updatedHistory = [historyItem, ...history]

    // Save back to localStorage
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <ChefHat className="h-10 w-10 text-emerald-500 mr-2" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Recipe Digitizer</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your recipe images into digital, editable recipes with AI. Adjust servings and save your
            favorites.
          </p>
        </motion.div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings size={18} className="text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:inline text-gray-700 dark:text-gray-200">Settings</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <History size={18} className="text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:inline text-gray-700 dark:text-gray-200">History</span>
            </Button>
          </div>

          {analysis && (
            <Button
              onClick={handleNewRecipe}
              variant="outline"
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus size={18} className="text-emerald-500" />
              <span className="text-gray-700 dark:text-gray-200">New Recipe</span>
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl">
              <div className="p-6 flex flex-col items-center">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                  <FileText className="h-5 w-5 text-emerald-500 mr-2" />
                  Recipe Image
                </h2>

                <div className="flex gap-4 mb-6 w-full justify-center">
                  <Button
                    onClick={handleCameraCapture}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <Camera size={18} />
                    <span>Camera</span>
                  </Button>

                  <Button
                    onClick={triggerFileInput}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <Upload size={18} />
                    <span>Upload</span>
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
                        alt="Uploaded recipe"
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
                        Upload a recipe image or take a photo to get started
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>

          {/* Recipe Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800 rounded-xl h-full">
              <div className="p-6 flex flex-col h-full">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                  <ChefHat className="h-5 w-5 text-emerald-500 mr-2" />
                  Digitized Recipe
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
                            Servings:
                          </label>
                          <Slider
                            id="servings"
                            min={1}
                            max={12}
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
                              <p className="text-gray-700 dark:text-gray-300">Recalculando cantidades...</p>
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
                        Upload an image of your recipe to see it digitized here. You'll be able to adjust servings and
                        save it to your collection.
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
    </main>
  )
}
