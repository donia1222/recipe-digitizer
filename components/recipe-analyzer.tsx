"use client"

import type React from "react"
import { Download, Printer, Share } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecipeAnalyzerProps {
  recipe: string
}

const RecipeAnalyzer: React.FC<RecipeAnalyzerProps> = ({ recipe }) => {
  const sections = recipe.split("\n\n")

  const handleShare = async () => {
    const shareData = {
      title: "Receta",
      text: recipe,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(recipe)
        alert("Receta copiada al portapapeles para compartir")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      // Final fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(recipe)
        alert("Receta copiada al portapapeles")
      } catch (clipboardError) {
        alert("Error al compartir la receta")
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
          a.download = `receta-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, "image/png")
    } catch (error) {
      console.error("Error saving image:", error)
      alert("Error al guardar la imagen")
    }
  }

  const handlePrint = () => {
    // Create a print-friendly version
    const printContent = `
      <html>
        <head>
          <title>Receta</title>
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
              .map((section, index) => {
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
      printWindow.document.write(printContent)
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
      <div className="flex flex-wrap gap-2 justify-end border-b border-gray-200 dark:border-gray-700 pb-4">
        <Button onClick={handleShare} variant="outline" size="sm" className="flex items-center gap-2">
          <Share className="h-4 w-4" />
          Compartir
        </Button>
        <Button onClick={handleSaveAsImage} variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Guardar Imagen
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Existing recipe sections */}
      {sections.map((section, index) => {
        // ... rest of the existing mapping logic remains the same
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
            <h3
              key={index}
              className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800 pb-2"
            >
              {section}
            </h3>
          )
        } else if (isIngredientList) {
          return (
            <div key={index} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
              {section.split("\n").map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-start gap-2 py-1">
                  {!line.trim().startsWith("-") && !line.trim().startsWith("•") && line.trim() !== "" && (
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">{line}</span>
                </div>
              ))}
            </div>
          )
        } else {
          const lines = section.split("\n").filter((line) => line.trim() !== "")
          const isNumberedList = lines.some((line) => /^\s*\d+\./.test(line))

          if (isNumberedList || lines.length <= 1) {
            return (
              <p key={index} className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                {section}
              </p>
            )
          } else {
            return (
              <ol key={index} className="list-none pl-0 space-y-4">
                {lines.map((line, lineIndex) => (
                  <li key={lineIndex} className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 w-7 h-7 rounded-full flex items-center justify-center font-medium">
                      {lineIndex + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{line}</span>
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
