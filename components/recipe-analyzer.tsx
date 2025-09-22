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
  onRecipeUpdate,
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
          console.error("Error loading recipe images:", error)
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
                    section.toLowerCase().includes("preparation") ||
                    section.toLowerCase().includes("zutaten") ||
                    section.toLowerCase().includes("zubereitung"))

                const isIngredientList =
                  section.toLowerCase().includes("zutaten") ||
                  section.toLowerCase().includes("ingredients") ||
                  section
                    .split("\n")
                    .some((line) =>
                      /^\s*[-•*]?\s*\d+(\.\d+)?\s*(cup|tbsp|tsp|g|oz|lb|ml|l|teaspoon|tablespoon|pound|ounce|gram)/i.test(
                        line,
                      ),
                    )

                if (isHeader) {
                  return `<div class="recipe-header">${section}</div>`
                } else if (isIngredientList) {
                  const lines = section.split("\n").filter((line) => line.trim() !== "")
                  let ingredientCounter = 1

                  return `<div class="ingredient-list">${lines
                    .map((line, lineIndex) => {
                      // Skip title lines like "Zutaten:"
                      if (line.toLowerCase().includes("zutaten:") || line.toLowerCase().includes("ingredients:")) {
                        return `<div class="mb-3"><h4 class="text-lg font-semibold text-gray-800">${line}</h4></div>`
                      }

                      // Skip empty lines
                      if (line.trim() === "") return ""

                      const currentNumber = ingredientCounter++

                      return `<div class="flex items-start gap-3 py-2 hover:bg-white rounded-lg px-2 transition-colors duration-200"><span class="text-white mt-1 flex-shrink-0 font-bold text-sm bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center">${currentNumber}</span><span class="text-gray-800 leading-relaxed">${line}</span></div>`
                    })
                    .join("")}</div>`
                } else {
                  const lines = section.split("\n").filter((line) => line.trim() !== "")
                  const isNumberedList = lines.some((line) => /^\s*\d+\./.test(line))

                  // NO automatic numbering for any other sections - only show as plain text
                  return `<div class="recipe-section">${section.replace(/\n/g, "<br>")}</div>`
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
    const lines = recipe.split("\n").filter((line) => line.trim())
    for (const line of lines.slice(0, 5)) {
      if (
        line.length < 60 &&
        !line.toLowerCase().includes("ingredient") &&
        !line.toLowerCase().includes("zutaten") &&
        !line.toLowerCase().includes("instruction") &&
        !line.toLowerCase().includes("schritt") &&
        !line.toLowerCase().includes("portion") &&
        !line.includes("cup") &&
        !line.includes("tbsp") &&
        !line.includes("tsp") &&
        !line.includes("ml") &&
        !line.includes("g ") &&
        !line.includes("oz")
      ) {
        return line.trim()
      }
    }
    return "Mein Rezept"
  }

  return (
    <div className="space-y-6 mb-20">
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between border-b border-gray-200 pb-4">
        <div className="flex flex-wrap gap-2">
          <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors duration-200"
              >
                <ImagePlus className="h-4 w-4" />
                <span>Bild hinzufügen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border border-gray-200">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-gray-900">
                  <ImagePlus className="h-5 w-5 text-gray-600" />
                  Bild zum Rezept hinzufügen
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="recipe-image" className="text-gray-700">
                    Bild auswählen
                  </Label>
                  <Input
                    id="recipe-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer border-gray-300 focus:border-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600">Bilder werden lokal mit dem Rezept gespeichert.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto mt-2 sm:mt-0">
          <div className="flex gap-2 min-w-max pb-2">
            {onServingsClick && (
              <Button
                onClick={onServingsClick}
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                <span>Portionen ({currentServings || 2})</span>
              </Button>
            )}
            <Button
              onClick={handleShare}
              size="sm"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 whitespace-nowrap"
            >
              <Share className="h-4 w-4" />
              <span>Teilen</span>
            </Button>
            <Button
              onClick={handleSaveAsImage}
              size="sm"
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Herunterladen</span>
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200 whitespace-nowrap"
            >
              <Printer className="h-4 w-4" />
              <span>Drucken</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Recipe Images Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-gray-600" />
            Rezeptbilder ({allImages.length})
          </h4>
          <div className="overflow-x-auto">
            <div className="flex gap-4 px-2 py-2" style={{ minWidth: "max-content" }}>
              {allImages.map((image, index) => (
                <div key={index} className="relative group flex-none">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 relative overflow-hidden rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 transition-colors duration-200"
                    onClick={() => openGallery(index)}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={
                        index === 0 && originalImage
                          ? "Imagen original"
                          : `Rezeptbild ${originalImage ? index : index + 1}`
                      }
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    {index === 0 && originalImage && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
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
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors duration-200"
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

      {/* Recipe Title */}
      <div className="text-center py-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-balance">{getRecipeTitle()}</h2>
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

        const isIngredientList =
          section.toLowerCase().includes("zutaten") ||
          section.toLowerCase().includes("ingredients") ||
          section
            .split("\n")
            .some((line) =>
              /^\s*[-•*]?\s*\d+(\.\d+)?\s*(cup|tbsp|tsp|g|oz|lb|ml|l|teaspoon|tablespoon|pound|ounce|gram)/i.test(line),
            )

        if (isHeader) {
          return (
            <div key={index} className="relative">
              <h3 className="text-2xl font-bold text-gray-900 pb-3 mb-6 border-b-2 border-gray-300">{section}</h3>
            </div>
          )
        } else if (isIngredientList) {
          const lines = section.split("\n").filter((line) => line.trim() !== "")
          let ingredientCounter = 1

          return (
            <div key={index} className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
              {lines.map((line, lineIndex) => {
                // Skip title lines like "Zutaten:"
                if (line.toLowerCase().includes("zutaten:") || line.toLowerCase().includes("ingredients:")) {
                  return (
                    <div key={lineIndex} className="mb-4">
                      <h4 className="text-xl font-semibold text-gray-900">{line}</h4>
                    </div>
                  )
                }

                // Skip empty lines
                if (line.trim() === "") return null

                const currentNumber = ingredientCounter++

                return (
                  <div
                    key={lineIndex}
                    className="flex items-start gap-3 py-3 hover:bg-gray-50 rounded-lg px-3 transition-colors duration-200"
                  >
                    <span className="text-white mt-1 flex-shrink-0 font-bold text-sm bg-blue-600 w-7 h-7 rounded-full flex items-center justify-center">
                      {currentNumber}
                    </span>
                    <span className="text-gray-800 leading-relaxed">{line}</span>
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
            <div key={index} className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
              <p className="whitespace-pre-line text-gray-800 leading-relaxed">{section}</p>
            </div>
          )
        }
      })}

      {/* Edit Recipe Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleEditRecipe}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors duration-200"
        >
          <Edit className="h-4 w-4 mr-2" />
          Rezept bearbeiten
        </Button>
      </div>

      {/* Recipe Comments Section */}
      <div className="mt-12">
        <RecipeComments recipeId={recipeId} />
      </div>

      {/* Image Gallery Modal */}
      {showGalleryModal && allImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowGalleryModal(false)}
        >
          <div className="relative max-w-5xl max-h-[95vh] w-full mx-4 bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 z-10 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 z-10 transition-colors duration-200"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 z-10 transition-colors duration-200"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm">
              <span className="font-semibold">{currentImageIndex + 1}</span>
              <span className="mx-1 text-gray-300">/</span>
              <span className="text-gray-200">{allImages.length}</span>
              {currentImageIndex === 0 && originalImage && (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">(Original)</span>
              )}
            </div>

            {/* Main image */}
            <div
              className="relative w-full h-full flex items-center justify-center p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-full max-h-full bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                <Image
                  src={allImages[currentImageIndex] || "/placeholder.svg"}
                  alt={`Imagen ${currentImageIndex + 1}`}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border-2 border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Rezept bearbeiten
              </h3>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <Label htmlFor="recipe-content" className="text-sm font-medium text-gray-700">
                  Rezeptinhalt
                </Label>
                <Textarea
                  id="recipe-content"
                  value={editedRecipe}
                  onChange={(e) => setEditedRecipe(e.target.value)}
                  placeholder="Hier können Sie Ihr Rezept bearbeiten..."
                  className="min-h-[400px] resize-none font-mono text-sm border-2 border-gray-300 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Tipp: Verwenden Sie leere Zeilen, um Abschnitte zu trennen. Die Formatierung wird automatisch
                  angewendet.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-gray-200">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="px-6 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveRecipe}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 transition-colors duration-200"
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
