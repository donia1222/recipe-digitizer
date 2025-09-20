"use client"

import React, { useState } from "react"
import { Download, Printer, Share, ImagePlus, X, ChevronLeft, ChevronRight, Eye, Users, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import RecipeComments from "./recipe-comments"

interface RecipeAnalyzerProps {
  recipe: string
  recipeId?: string
  originalImage?: string
  onServingsClick?: () => void
  currentServings?: number
  originalServings?: number
  onRecipeUpdate?: (newRecipe: string) => void
}

const RecipeAnalyzer: React.FC<RecipeAnalyzerProps> = ({
  recipe,
  recipeId,
  originalImage,
  onServingsClick,
  currentServings,
  originalServings,
  onRecipeUpdate
}) => {
  const sections = recipe.split("\n\n")
  const [recipeImages, setRecipeImages] = useState<string[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedRecipe, setEditedRecipe] = useState(recipe)
  const { toast } = useToast()

  // Load recipe images from localStorage on component mount
  React.useEffect(() => {
    if (recipeId) {
      const savedImages = localStorage.getItem(`recipe-images-${recipeId}`)
      if (savedImages) {
        try {
          setRecipeImages(JSON.parse(savedImages))
        } catch (error) {
          console.error('Error loading recipe images:', error)
        }
      }
    }
  }, [recipeId])

  // Update edited recipe when recipe prop changes
  React.useEffect(() => {
    setEditedRecipe(recipe)
  }, [recipe])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        const updatedImages = [...recipeImages, imageData]
        setRecipeImages(updatedImages)
        
        // Save to localStorage
        if (recipeId) {
          localStorage.setItem(`recipe-images-${recipeId}`, JSON.stringify(updatedImages))
        }
        
        toast({
          title: "Bild hinzugefügt",
          description: "Das Bild wurde lokal mit dem Rezept gespeichert.",
        })
      }
      reader.readAsDataURL(file)
    }
    setShowImageModal(false)
  }

  const removeImage = (index: number) => {
    const updatedImages = recipeImages.filter((_, i) => i !== index)
    setRecipeImages(updatedImages)
    
    // Update localStorage
    if (recipeId) {
      localStorage.setItem(`recipe-images-${recipeId}`, JSON.stringify(updatedImages))
    }
    
    toast({
      title: "Bild entfernt",
      description: "Das Bild wurde aus dem Rezept entfernt.",
    })
  }

  const handleShare = async () => {
    const shareData = {
      title: "Rezept",
      text: recipe,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(recipe)
        alert("Rezept wurde in die Zwischenablage kopiert zum Teilen")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(recipe)
        alert("Rezept wurde in die Zwischenablage kopiert")
      } catch (clipboardError) {
        alert("Fehler beim Teilen des Rezepts")
      }
    }
  }

  const handleSaveAsImage = async () => {
    try {
      // Create a canvas to render the recipe
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size
      canvas.width = 800
      canvas.height = 1000

      // Set background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set text properties
      ctx.fillStyle = "#000000"
      ctx.font = "16px Arial"

      // Split recipe into lines and draw
      const lines = recipe.split("\n")
      let y = 30
      const lineHeight = 20
      const maxWidth = canvas.width - 40

      lines.forEach((line) => {
        if (line.trim() === "") {
          y += lineHeight / 2
          return
        }

        // Word wrap
        const words = line.split(" ")
        let currentLine = ""

        words.forEach((word) => {
          const testLine = currentLine + word + " "
          const metrics = ctx.measureText(testLine)

          if (metrics.width > maxWidth && currentLine !== "") {
            ctx.fillText(currentLine, 20, y)
            currentLine = word + " "
            y += lineHeight
          } else {
            currentLine = testLine
          }
        })

        if (currentLine) {
          ctx.fillText(currentLine, 20, y)
          y += lineHeight
        }
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `rezept-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, "image/png")
    } catch (error) {
      console.error("Error saving image:", error)
      alert("Fehler beim Speichern des Bildes")
    }
  }

  const handleEditRecipe = () => {
    setShowEditModal(true)
  }

  const handleSaveRecipe = () => {
    if (onRecipeUpdate) {
      onRecipeUpdate(editedRecipe)
    }
    setShowEditModal(false)
    toast({
      title: "Rezept aktualisiert",
      description: "Das Rezept wurde erfolgreich gespeichert.",
    })
  }

  const handleCancelEdit = () => {
    setEditedRecipe(recipe) // Reset to original
    setShowEditModal(false)
  }

  const handlePrint = () => {
    // Create a print-friendly version
    const printContent = `
      <html>
        <head>
          <title>Rezept</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 20px;
              color: #333;
            }
            .recipe-section {
              margin-bottom: 20px;
            }
            .recipe-header {
              font-size: 18px;
              font-weight: bold;
              color: #475569;
              border-bottom: 2px solid #475569;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .ingredient-list {
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
            }
            .instruction-step {
              margin-bottom: 10px;
              display: flex;
              align-items: flex-start;
            }
            .step-number {
              background-color: #475569;
              color: white;
              width: 25px;
              height: 25px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              margin-right: 10px;
              flex-shrink: 0;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="recipe-content">
            ${sections
              .map((section) => {
                const isHeader =
                  section.trim().length < 50 &&
                  (section.toLowerCase().includes("ingredient") ||
                    section.toLowerCase().includes("instruction") ||
                    section.toLowerCase().includes("direction") ||
                    section.toLowerCase().includes("step") ||
                    section.toLowerCase().includes("preparation"))

                const isIngredientList = section
                  .split("\n")
                  .some((line) =>
                    /^\s*[-•*]?\s*\d+(\.\d+)?\s*(cup|tbsp|tsp|g|oz|lb|ml|l|teaspoon|tablespoon|pound|ounce|gram)/i.test(
                      line,
                    ),
                  )

                if (isHeader) {
                  return `<div class="recipe-header">${section}</div>`
                } else if (isIngredientList) {
                  return `<div class="ingredient-list">${section
                    .split("\n")
                    .map((line) => (line.trim() ? `<div>• ${line}</div>` : ""))
                    .join("")}</div>`
                } else {
                  const lines = section.split("\n").filter((line) => line.trim() !== "")
                  const isNumberedList = lines.some((line) => /^\s*\d+\./.test(line))

                  if (isNumberedList || lines.length <= 1) {
                    return `<div class="recipe-section">${section.replace(/\n/g, "<br>")}</div>`
                  } else {
                    return `<div class="recipe-section">${lines
                      .map(
                        (line, lineIndex) =>
                          `<div class="instruction-step">
                      <div class="step-number">${lineIndex + 1}</div>
                      <div>${line}</div>
                    </div>`,
                      )
                      .join("")}</div>`
                  }
                }
              })
              .join("")}
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.body.innerHTML = printContent
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  // Combine all images (original + additional)
  const allImages = originalImage ? [originalImage, ...recipeImages] : recipeImages

  const openGallery = (index: number) => {
    setCurrentImageIndex(index)
    setShowGalleryModal(true)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  // Extract recipe title from analysis
  const getRecipeTitle = () => {
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

  return (
    <div className="space-y-6 mb-20">
      {/* Recipe Title */}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex flex-wrap gap-2">
          <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/20 dark:to-blue-900/20 border-slate-200 dark:border-slate-700 hover:from-slate-100 hover:to-blue-100 dark:hover:from-slate-900/30 dark:hover:to-blue-900/30 transition-all duration-200">
                <ImagePlus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Bild hinzufügen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-slate-600" />
                  Bild zum Rezept hinzufügen
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="recipe-image">Bild auswählen</Label>
                  <Input
                    id="recipe-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bilder werden lokal mit dem Rezept gespeichert.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="overflow-x-auto mt-2 sm:mt-0">
          <div className="flex gap-3 min-w-max pb-2">
            {onServingsClick && (
              <Button
                onClick={onServingsClick}
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                <span>Portionen ({currentServings || 2})</span>
              </Button>
            )}
            <Button
              onClick={handleShare}
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <Share className="h-4 w-4" />
              <span>Teilen</span>
            </Button>
            <Button
              onClick={handleSaveAsImage}
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Herunterladen</span>
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <Printer className="h-4 w-4" />
              <span>Drucken</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Recipe Images Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-3 mt-8">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            Rezeptbilder ({allImages.length})
          </h4>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-4 py-4" style={{ minWidth: 'max-content' }}>
              {allImages.map((image, index) => (
                <div key={index} className="relative group flex-none">
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 relative overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => openGallery(index)}
                  >
                    <Image
                      src={image}
                      alt={index === 0 && originalImage ? "Imagen original" : `Rezeptbild ${originalImage ? index : index + 1}`}
                      fill
                      className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  {index === 0 && originalImage && (
                    <div className="absolute top-2 left-2 bg-slate-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Original
                    </div>
                  )}
                </div>
                {index > 0 || !originalImage ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(originalImage ? index - 1 : index)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Recipe sections */}
      {/* Recipe Title */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          {getRecipeTitle()}
        </h2>
      </div>

      {sections.map((section, index) => {
        // Skip if this section is the title we already extracted
        const sectionTitle = getRecipeTitle()
        if (section.trim() === sectionTitle && index === 0) {
          return null
        }
        const isHeader =
          section.trim().length < 50 &&
          (section.toLowerCase().includes("ingredient") ||
            section.toLowerCase().includes("instruction") ||
            section.toLowerCase().includes("direction") ||
            section.toLowerCase().includes("step") ||
            section.toLowerCase().includes("preparation") ||
            section.toLowerCase().includes("zutaten") ||
            section.toLowerCase().includes("zubereitung"))

        const isIngredientList = section.toLowerCase().includes('zutaten') ||
                                  section.toLowerCase().includes('ingredients') ||
                                  section
                                    .split("\n")
                                    .some((line) =>
                                      /^\s*[-•*]?\s*\d+(\.\d+)?\s*(cup|tbsp|tsp|g|oz|lb|ml|l|teaspoon|tablespoon|pound|ounce|gram)/i.test(line),
                                    )

        if (isHeader) {
          return (
            <div key={index} className="relative">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-blue-600 dark:from-slate-400 dark:to-blue-400 pb-3 mb-4 relative">
                {section}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-slate-500 to-blue-500 dark:from-slate-400 dark:to-blue-400 rounded-full" />
              </h3>
            </div>
          )
        } else if (isIngredientList) {
          const lines = section.split("\n").filter(line => line.trim() !== "")
          let ingredientCounter = 1

          return (
            <div key={index} className="bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              {lines.map((line, lineIndex) => {
                // Skip title lines like "Zutaten:"
                if (line.toLowerCase().includes('zutaten:') || line.toLowerCase().includes('ingredients:')) {
                  return (
                    <div key={lineIndex} className="mb-3">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{line}</h4>
                    </div>
                  )
                }

                // Skip empty lines
                if (line.trim() === "") return null

                const currentNumber = ingredientCounter++

                return (
                  <div key={lineIndex} className="flex items-start gap-3 py-2 hover:bg-white/50 dark:hover:bg-black/10 rounded-lg px-2 transition-colors duration-200">
                    <span className="text-slate-600 dark:text-slate-400 mt-1 flex-shrink-0 font-bold text-sm bg-gray-200 dark:bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center">
                      {currentNumber}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{line}</span>
                  </div>
                )
              })}
            </div>
          )
        } else {
          const lines = section.split("\n").filter((line) => line.trim() !== "")
          const isNumberedList = lines.some((line) => /^\s*\d+\./.test(line))

          // NO automatic numbering for any other sections - only show as plain text
          return (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
                {section}
              </p>
            </div>
          )
        }
      })}

      {/* Edit Recipe Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleEditRecipe}
          className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Edit className="h-4 w-4 mr-2" />
          Rezept bearbeiten
        </Button>
      </div>

      {/* Recipe Comments Section */}
      <div className="mt-8">
        <RecipeComments recipeId={recipeId} />
      </div>

      {/* Image Gallery Modal */}
      {showGalleryModal && allImages.length > 0 && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-slate-900/98 to-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowGalleryModal(false)}>
          <div className="relative max-w-5xl max-h-[95vh] w-full mx-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-4 right-4 bg-gradient-to-br from-red-500/80 to-red-600/80 hover:from-red-600/90 hover:to-red-700/90 text-white rounded-full p-3 z-10 backdrop-blur-sm shadow-lg transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90 text-white rounded-full p-4 z-10 backdrop-blur-sm shadow-lg transition-all duration-200"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-blue-500/80 to-blue-600/80 hover:from-blue-600/90 hover:to-blue-700/90 text-white rounded-full p-4 z-10 backdrop-blur-sm shadow-lg transition-all duration-200"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-slate-800/90 to-slate-700/90 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md shadow-lg border border-white/10">
              <span className="font-semibold">{currentImageIndex + 1}</span>
              <span className="mx-1 text-slate-300">/</span>
              <span className="text-slate-200">{allImages.length}</span>
              {currentImageIndex === 0 && originalImage && (
                <span className="ml-2 px-2 py-1 bg-blue-500/80 text-white text-xs rounded-full">(Original)</span>
              )}
            </div>

            {/* Main image */}
            <div
              className="relative w-full h-full flex items-center justify-center p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-full max-h-full bg-white/5 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden">
                <Image
                  src={allImages[currentImageIndex]}
                  alt={`Imagen ${currentImageIndex + 1}`}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Rezept bearbeiten
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <Label htmlFor="recipe-content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rezeptinhalt
                </Label>
                <Textarea
                  id="recipe-content"
                  value={editedRecipe}
                  onChange={(e) => setEditedRecipe(e.target.value)}
                  placeholder="Hier können Sie Ihr Rezept bearbeiten..."
                  className="min-h-[400px] resize-none font-mono text-sm border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tipp: Verwenden Sie leere Zeilen, um Abschnitte zu trennen. Die Formatierung wird automatisch angewendet.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="px-6"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveRecipe}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6"
              >
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeAnalyzer