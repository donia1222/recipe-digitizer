"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Edit, Trash2, User, Heart, X } from "lucide-react"

interface Comment {
  id: string
  author: string
  role: string
  content: string
  timestamp: string
  likes: number
  likedBy: string[]
  isEdited: boolean
}

interface RecipeCommentsProps {
  recipeId?: string
  isAnalysisMode?: boolean  // Nueva prop para indicar si está en modo análisis
}

const RecipeComments: React.FC<RecipeCommentsProps> = ({ recipeId, isAnalysisMode = false }) => {
  console.log("🎯 RecipeComments initialized with recipeId:", recipeId, "isAnalysisMode:", isAnalysisMode)

  // No mostrar comentarios si está en modo análisis
  if (isAnalysisMode) {
    console.log("🚫 Hiding comments - analysis mode active")
    return null
  }

  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showLikesDialog, setShowLikesDialog] = useState<string | null>(null)
  const [likesUsers, setLikesUsers] = useState<any[]>([])

  // Load current user
  useEffect(() => {
    try {
      const currentUserStr = localStorage.getItem('current-user')
      console.log("👤 Loading current user from localStorage:", currentUserStr)

      if (currentUserStr) {
        const user = JSON.parse(currentUserStr)
        setCurrentUser({ id: user.id, name: user.name, role: user.role })
        console.log("✅ Current user set:", user.name, "ID:", user.id, "Role:", user.role)
      } else {
        console.log("❌ No current user found in localStorage")
      }
    } catch (error) {
      console.error("❌ Error loading current user:", error)
    }
  }, [])

  // Load comments from API
  useEffect(() => {
    if (recipeId) {
      loadComments()
    }
  }, [recipeId])

  const loadComments = async () => {
    console.log("🔍 loadComments called with recipeId:", recipeId)

    if (!recipeId) {
      console.log("❌ No recipeId provided, skipping comment load")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const url = `https://web.lweb.ch/recipedigitalizer/apis/comments.php?recipe_id=${recipeId}`
      console.log("📡 Fetching comments from:", url)

      const response = await fetch(url)
      const data = await response.json()

      console.log("📦 API Response:", data)

      if (data.success) {
        console.log("✅ Comments loaded successfully:", data.data?.length || 0, "comments")
        setComments(data.data || [])
      } else {
        console.error("❌ API Error:", data.message)
        setComments([])
      }
    } catch (error) {
      console.error("❌ Network Error:", error)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser || !recipeId) return

    try {
      const response = await fetch('https://web.lweb.ch/recipedigitalizer/apis/comments.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe_id: recipeId,
          user_id: currentUser.id,
          content: newComment.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewComment("")
        await loadComments() // Reload comments to show the new one
      } else {
        console.error("Error creating comment:", data.message)
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !currentUser) return

    try {
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/comments.php?id=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
          user_id: currentUser.id  // Agregar user_id para verificación
        })
      })

      const data = await response.json()

      if (data.success) {
        setEditingId(null)
        setEditContent("")
        await loadComments() // Reload comments
      } else {
        console.error("Error updating comment:", data.message)
      }
    } catch (error) {
      console.error("Error editing comment:", error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este comentario?")) return
    if (!currentUser) return

    try {
      // Agregar user_id y user_role como parámetros GET para verificación
      const url = `https://web.lweb.ch/recipedigitalizer/apis/comments.php?id=${commentId}&user_id=${currentUser.id}&user_role=${currentUser.role || 'guest'}`
      const response = await fetch(url, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await loadComments() // Reload comments
      } else {
        console.error("Error deleting comment:", data.message)
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleToggleLike = async (commentId: string) => {
    if (!currentUser) return

    try {
      const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/comments.php?id=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_like',
          user_id: currentUser.id
        })
      })

      const data = await response.json()

      if (data.success) {
        // Actualizar el comentario específico con los nuevos valores
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  likes: data.data.likes,
                  likedBy: data.data.userLiked
                    ? [...comment.likedBy.filter(id => id !== currentUser.id), currentUser.id]
                    : comment.likedBy.filter(id => id !== currentUser.id)
                }
              : comment
          )
        )
      } else {
        console.error("Error toggling like:", data.message)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "gerade eben"
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minuten`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `vor ${diffInHours} Stunden`

    const diffInDays = Math.floor(diffInHours / 24)
    return `vor ${diffInDays} Tagen`
  }

  const isMyComment = (comment: Comment) => {
    return currentUser && comment.author === currentUser.name
  }

  const hasUserLiked = (comment: Comment) => {
    return currentUser && comment.likedBy.includes(currentUser.id)
  }

  const showLikesUsers = async (comment: Comment) => {
    if (comment.likes === 0) return

    try {
      // Obtener información de usuarios que dieron like
      const userIds = comment.likedBy
      const usersPromises = userIds.map(async (userId: string) => {
        // Si es el usuario actual, usar su información local
        if (currentUser && userId === currentUser.id) {
          return {
            id: userId,
            name: `Du (${currentUser.name})`,
            role: currentUser.role || 'guest',
            isCurrentUser: true
          }
        }

        try {
          // Solución temporal: obtener todos los usuarios y filtrar en el frontend
          const response = await fetch(`https://web.lweb.ch/recipedigitalizer/apis/users.php`)
          const data = await response.json()

          console.log(`🔍 API Response for user ${userId}:`, data)

          if (data.success && data.data && Array.isArray(data.data)) {
            // Buscar el usuario específico en el array
            const user = data.data.find((u: any) => u.id === userId)

            if (user) {
              console.log(`✅ Found user: ${user.name}`)
              return {
                id: userId,
                name: user.name || user.username || user.email || generateFriendlyName(userId),
                role: user.role || 'guest',
                isCurrentUser: false
              }
            } else {
              console.log(`❌ User not found in API array: ${userId}`)
              return {
                id: userId,
                name: generateFriendlyName(userId),
                role: 'guest',
                isCurrentUser: false
              }
            }
          } else {
            console.log(`❌ API returned invalid data: ${userId}`)
            return {
              id: userId,
              name: generateFriendlyName(userId),
              role: 'guest',
              isCurrentUser: false
            }
          }
        } catch (error) {
          console.log(`❌ API Error for user ${userId}:`, error)
          return {
            id: userId,
            name: generateFriendlyName(userId),
            role: 'guest',
            isCurrentUser: false
          }
        }
      })

      const users = await Promise.all(usersPromises)
      setLikesUsers(users)
      setShowLikesDialog(comment.id)
    } catch (error) {
      console.error("Error loading likes users:", error)
    }
  }

  const generateFriendlyName = (userId: string) => {
    if (userId.startsWith('user_')) {
      // Extraer timestamp o parte final del ID para crear un nombre único
      const timestamp = userId.split('.')[1] || userId.split('_')[1]
      if (timestamp) {
        const shortId = timestamp.substring(0, 6)
        return `Benutzer ${shortId}`
      }
      return 'Gast Benutzer'
    }

    // Si es un ID corto, mostrar como "Usuario ###"
    if (userId.length < 10) {
      return `Benutzer ${userId}`
    }

    // Para IDs largos, tomar las primeras 6 caracteres
    const shortId = userId.substring(0, 6)
    return `Benutzer ${shortId}`
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-blue-900/20 border border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Lade Kommentare...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-blue-900/20 border border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg text-gray-800 dark:text-gray-200">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Kommentare
          <Badge variant="outline" className="bg-white/70 dark:bg-gray-800/70">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Comments */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Noch keine Kommentare. Sei der erste, der kommentiert!
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {comment.author}
                        {comment.isEdited && (
                          <span className="text-xs text-gray-400 ml-2">(bearbeitet)</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(comment.timestamp)}
                    </span>
                    {isMyComment(comment) && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(comment.id)
                            setEditContent(comment.content)
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Speichern
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null)
                          setEditContent("")
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>

                    {/* Like Button and Counter */}
                    <div className="flex items-center gap-2 pt-2">
                      {currentUser?.role !== 'guest' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleLike(comment.id)}
                          disabled={!currentUser}
                          className={`h-6 px-2 text-xs transition-colors ${
                            hasUserLiked(comment)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Heart
                            className={`h-3 w-3 mr-1 ${hasUserLiked(comment) ? 'fill-current' : ''}`}
                          />
                          {comment.likes}
                        </Button>
                      ) : (
                        // Solo mostrar el contador para guests
                        <div className="flex items-center h-6 px-2 text-xs text-gray-400">
                          <Heart className="h-3 w-3 mr-1" />
                          {comment.likes}
                        </div>
                      )}

                      {/* Show likes users button */}
                      {comment.likes > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showLikesUsers(comment)}
                          className="h-6 px-2 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          {comment.likes === 1 ? '1 Person' : `${comment.likes} Personen`}
                        </Button>
                      )}

                      {!currentUser && (
                        <span className="text-xs text-gray-400">
                          Anmelden um zu liken
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add New Comment */}
        {currentUser && currentUser.role !== 'guest' ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Kommentar hinzufügen als {currentUser.name}
                </span>
              </div>

              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Was denkst du über dieses Rezept? Teile deine Erfahrungen oder Tipps..."
                className="min-h-[100px] resize-none bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-800 dark:text-gray-200"
                maxLength={500}
              />

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {newComment.length}/500 Zeichen
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || newComment.length > 500}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kommentar posten
                </Button>
              </div>
            </div>
          </div>
        ) : currentUser?.role === 'guest' ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border border-amber-200 dark:border-amber-800">
            <p className="text-amber-700 dark:text-amber-300">
              Als Gast können Sie nur Kommentare lesen, aber keine eigenen schreiben
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Melde dich an, um Kommentare zu schreiben
            </p>
          </div>
        )}

        {/* Likes Dialog */}
        {showLikesDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-96 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Gefällt {likesUsers.length} {likesUsers.length === 1 ? 'Person' : 'Personen'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLikesDialog(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto p-4">
                {likesUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    Laden...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {likesUsers.map((user, index) => (
                      <div key={user.id || index} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <User className={`h-4 w-4 ${user.isCurrentUser ? 'text-blue-500' : 'text-gray-400'}`} />
                          <span className={`font-medium ${user.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                            {user.name}
                          </span>
                          {user.role && user.role !== 'guest' && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                user.role === 'admin'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {user.role === 'admin' ? 'Admin' : 'Worker'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecipeComments