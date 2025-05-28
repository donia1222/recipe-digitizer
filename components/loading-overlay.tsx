"use client"

import type React from "react"
import { motion } from "framer-motion"
import { ChefHat } from "lucide-react"

interface LoadingOverlayProps {
  progress: number
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress }) => {
  const percentage = Math.round(progress * 100)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-80 max-w-[90%]"
      >
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <ChefHat className="h-12 w-12 text-emerald-500" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full"
            />
          </div>

          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Analyzing Recipe...</h3>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3 }}
              className="bg-emerald-500 h-3 rounded-full"
            />
          </div>

          <div className="flex justify-between w-full text-sm text-gray-600 dark:text-gray-300">
            <span>Extracting ingredients...</span>
            <span className="font-medium">{percentage}%</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default LoadingOverlay
