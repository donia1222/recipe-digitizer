"use client"

import type React from "react"

import { useState, useEffect } from "react"
import RecipeDigitizer from "../recipe-digitizer"

export default function Page() {
  const [password, setPassword] = useState("")
  const [accessGranted, setAccessGranted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const correctPassword = process.env.NEXT_PUBLIC_RECIPE

  // Check for existing session on component mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("recipe-auth")
    if (savedAuth === "granted") {
      setAccessGranted(true)
    }
    setIsLoading(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === correctPassword) {
      setAccessGranted(true)
      // Save authentication state to localStorage
      localStorage.setItem("recipe-auth", "granted")
    } else {
      alert("Contraseña incorrecta")
    }
  }

  function handleLogout() {
    setAccessGranted(false)
    setPassword("")
    // Remove authentication state from localStorage
    localStorage.removeItem("recipe-auth")
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!accessGranted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Acceso Requerido</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingrese la contraseña:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingrese la contraseña..."
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 font-medium"
            >
              Ingresar
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">Tu sesión se guardará hasta que cierres sesión</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Logout button in the top right corner */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
        >
          Cerrar Sesión
        </button>
      </div>
      <RecipeDigitizer />
    </div>
  )
}
