"use client"

import type React from "react"
import { ChefHat } from "lucide-react"

interface LoadingOverlayProps {
  progress: number
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress }) => {
  // Asegurar un mínimo de progreso para evitar parpadeo
  const safeProgress = Math.max(progress, 0.05)
  const percentage = Math.round(safeProgress * 100)

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-80 max-w-[90%]"
      >
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Rezept digitalisieren...</h3>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex justify-between w-full text-sm text-gray-600 dark:text-gray-300">
            <span>Bild verarbeiten...</span>
            <span className="font-medium">{percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay