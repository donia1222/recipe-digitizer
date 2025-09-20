"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Heart, Reply, Shield, User } from "lucide-react"

interface Comment {
  id: string
  author: string
  role: 'admin' | 'worker' | 'user'
  content: string
  date: string
  likes: number
  isLiked: boolean
}

interface RecipeCommentsProps {
  recipeId?: string
}

const RecipeComments: React.FC<RecipeCommentsProps> = ({ recipeId }) => {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Admin Markus",
      role: "admin",
      content: "Fantastisches Rezept! Die Kombination der Gewürze ist perfekt abgestimmt. Ich habe dieses Rezept selbst ausprobiert und kann es nur weiterempfehlen. Besonders die Garzeit ist sehr gut beschrieben.",
      date: "vor 2 Stunden",
      likes: 8,
      isLiked: false
    },
    {
      id: "2",
      author: "Andrea Salvador",
      role: "worker",
      content: "Als Köchin kann ich bestätigen, dass dieses Rezept wirklich hervorragend ist! Ein kleiner Tipp: Wenn ihr die Zwiebeln etwas länger anbratet, bekommt ihr noch mehr Geschmack. Großartige Arbeit bei der Digitalisierung!",
      date: "vor 45 Minuten",
      likes: 12,
      isLiked: true
    }
  ])

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `${Date.now()}`,
      author: "Current User", // In a real app, this would come from auth
      role: "user",
      content: newComment.trim(),
      date: "gerade eben",
      likes: 0,
      isLiked: false
    }

    setComments([...comments, comment])
    setNewComment("")
  }

  const toggleLike = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        }
      }
      return comment
    }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'worker':
        return <User className="h-4 w-4 text-green-600" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Administrator</Badge>
      case 'worker':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Mitarbeiter</Badge>
      default:
        return <Badge variant="outline">Benutzer</Badge>
    }
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
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(comment.role)}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.author}
                    </span>
                  </div>
                  {getRoleBadge(comment.role)}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {comment.date}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {comment.content}
              </p>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLike(comment.id)}
                  className={`flex items-center gap-2 h-8 px-3 ${
                    comment.isLiked
                      ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  } transition-colors`}
                >
                  <Heart className={`h-4 w-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{comment.likes}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 h-8 px-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Reply className="h-4 w-4" />
                  <span className="text-sm">Antworten</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Comment */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-4 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-800 dark:text-gray-200">
                Kommentar hinzufügen
              </span>
            </div>

            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Was denkst du über dieses Rezept? Teile deine Erfahrungen oder Tipps..."
              className="min-h-[100px] resize-none bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-800 dark:text-gray-200"
            />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {newComment.length}/500 Zeichen
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="h-4 w-4 mr-2" />
                Kommentar posten
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecipeComments