"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  

  useEffect(() => {
    // Check authentication and role
    const savedAuth = localStorage.getItem("recipe-auth")
    const savedRole = localStorage.getItem("user-role")
    if (savedAuth === "granted" && savedRole === "admin") {
      setIsAuthenticated(true)
    } else {
      // Redirect to home if not authenticated or not admin
      router.push('/')
      return
    }
    setIsLoading(false)
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to home
  }

  return <AdminDashboard />
}