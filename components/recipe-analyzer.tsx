"use client"

import React, { useState } from "react"
import { Download, Printer, Share, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface RecipeAnalyzerProps {
  recipe: string
  recipeId?: string
}

const RecipeAnalyzer: React.FC<RecipeAnalyzerProps> = ({ recipe, recipeId }) => {
  const sections = recipe.split("\n\n")
  const [recipeImages, setRecipeImages] = useState<string[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
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
              color: #059669;
              border-bottom: 2px solid #059669;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .ingredient-list {
              background-color: #f0fdf4;
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
              background-color: #059669;
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

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex flex-wrap gap-2">
          <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30 transition-all duration-200">
                <ImagePlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">Bild hinzufügen</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-emerald-600" />
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
        
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button onClick={handleShare} variant="outline" size="sm" className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
            <Share className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-200">Teilen</span>
          </Button>
          <Button onClick={handleSaveAsImage} variant="outline" size="sm" className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200">
            <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-700 dark:text-gray-200">Herunterladen</span>
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200">
            <Printer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-gray-700 dark:text-gray-200">Drucken</span>
          </Button>
        </div>
      </div>
      
      {/* Recipe Images */}
      {recipeImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Rezeptbilder ({recipeImages.length})
          </h4>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {recipeImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <Image
                    src={image}
                    alt={`Rezeptbild ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe sections */}
      {sections.map((section, index) => {
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
            /^\s*[-•*]?\s*\d+(\.\d+)?\s*(cup|tbsp|tsp|g|oz|lb|ml|l|teaspoon|tablespoon|pound|ounce|gram)/i.test(line),
          )

        if (isHeader) {
          return (
            <div key={index} className="relative">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 pb-3 mb-4 relative">
                {section}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400 rounded-full" />
              </h3>
            </div>
          )
        } else if (isIngredientList) {
          return (
            <div key={index} className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
              {section.split("\n").map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-start gap-3 py-2 hover:bg-white/50 dark:hover:bg-black/10 rounded-lg px-2 transition-colors duration-200">
                  {!line.trim().startsWith("-") && !line.trim().startsWith("•") && line.trim() !== "" && (
                    <span className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0 font-bold text-lg">•</span>
                  )}
                  <span className="text-gray-800 dark:text-gray-200 leading-relaxed">{line}</span>
                </div>
              ))}
            </div>
          )
        } else {
          const lines = section.split("\n").filter((line) => line.trim() !== "")
          const isNumberedList = lines.some((line) => /^\s*\d+\./.test(line))

          if (isNumberedList || lines.length <= 1) {
            return (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
                  {section}
                </p>
              </div>
            )
          } else {
            return (
              <ol key={index} className="list-none pl-0 space-y-4">
                {lines.map((line, lineIndex) => (
                  <li key={lineIndex} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:shadow-md transition-all duration-200">
                    <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {lineIndex + 1}
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 leading-relaxed flex-1">{line}</span>
                  </li>
                ))}
              </ol>
            )
          }
        }
      })}
    </div>
  )
}

export default RecipeAnalyzer