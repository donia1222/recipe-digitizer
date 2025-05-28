"use client"

import { useState } from "react"
import RecipeDigitizer from "../recipe-digitizer"

export default function Page() {
  const [password, setPassword] = useState("")
  const [accessGranted, setAccessGranted] = useState(false)

  const correctPassword = process.env.NEXT_PUBLIC_RECIPE

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === correctPassword) {
      setAccessGranted(true)
    } else {
      alert("Contraseña incorrecta")
    }
  }

  if (!accessGranted) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center min-h-screen">
        <label className="mb-2 text-lg font-medium">Geben Sie das Passwort ein:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded"
        />
        <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Beitreten
        </button>
      </form>
    )
  }

  return <RecipeDigitizer />
}
