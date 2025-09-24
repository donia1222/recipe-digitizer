"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import RecipeArchivePage from "@/components/recipe-archive-page"
import type { HistoryItem } from "@/types"

export default function RecipeArchive() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [userRole, setUserRole] = useState<'admin' | 'worker' | 'guest' | null>(null)

  useEffect(() => {
    // Get current user and role from localStorage
    const currentUserStr = localStorage.getItem('current-user')
    const role = localStorage.getItem('user-role') as 'admin' | 'worker' | 'guest' | null

    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        setCurrentUserId(currentUser.id || "")
      } catch (error) {
        console.error('Error parsing current user:', error)
      }
    }

    setUserRole(role)
  }, [])

  const handleSelectRecipe = (item: HistoryItem) => {
    // Navigate back to main app with selected recipe
    router.push("/")
    // You might want to pass the recipe data somehow, perhaps through URL params or localStorage
    localStorage.setItem('selectedRecipe', JSON.stringify(item))
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <RecipeArchivePage
      onSelectRecipe={handleSelectRecipe}
      onBack={handleBack}
      userRole={userRole}
      currentUserId={currentUserId}
    />
  )
}