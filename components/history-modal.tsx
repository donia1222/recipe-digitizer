"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Trash2, Folder, FolderPlus, Edit3, Check, X, Star, Calendar, ChefHat } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface RecipeFolder {
  id: string
  name: string
  color: string
  createdAt: string
}

interface HistoryItem {
  id: number
  recipeId?: string
  image: string
  analysis: string
  date: string
  folderId?: string
  title?: string
  isFavorite?: boolean
}

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectItem: (item: HistoryItem) => void
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onSelectItem }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [folders, setFolders] = useState<RecipeFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")

  const folderColors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", 
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
  ]

  // Load history and folders from localStorage on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedHistory = localStorage.getItem("recipeHistory")
      const savedFolders = localStorage.getItem("recipeFolders")
      
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders))
      }
    }
  }, [isOpen])

  const createFolder = () => {
    if (!newFolderName.trim()) return
    
    const newFolder: RecipeFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: folderColors[Math.floor(Math.random() * folderColors.length)],
      createdAt: new Date().toISOString()
    }
    
    const updatedFolders = [...folders, newFolder]
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setNewFolderName("")
    setIsCreatingFolder(false)
  }

  const deleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Move recipes from this folder to uncategorized
    const updatedHistory = history.map(item => 
      item.folderId === folderId ? { ...item, folderId: undefined } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
    
    // Delete the folder
    const updatedFolders = folders.filter(f => f.id !== folderId)
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    
    if (selectedFolder === folderId) {
      setSelectedFolder(undefined)
    }
  }

  const editFolder = (folderId: string, newName: string) => {
    if (!newName.trim()) return
    
    const updatedFolders = folders.map(f => 
      f.id === folderId ? { ...f, name: newName.trim() } : f
    )
    setFolders(updatedFolders)
    localStorage.setItem("recipeFolders", JSON.stringify(updatedFolders))
    setEditingFolder(null)
    setEditFolderName("")
  }

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const moveToFolder = (recipeId: number, folderId: string | undefined) => {
    const updatedHistory = history.map(item =>
      item.id === recipeId ? { ...item, folderId } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const deleteHistoryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    // Find the item to delete and remove its associated images
    const itemToDelete = history.find(item => item.id === id)
    const recipeTitle = itemToDelete?.title || extractRecipeTitle(itemToDelete?.analysis || '')

    // Show confirmation dialog
    const confirmed = window.confirm(`¿Está seguro de que desea eliminar la receta "${recipeTitle}"?\n\nEsta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

    if (itemToDelete?.recipeId) {
      localStorage.removeItem(`recipe-images-${itemToDelete.recipeId}`)
    }

    const updatedHistory = history.filter((item) => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const clearAllHistory = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(`¿Está seguro de que desea eliminar TODAS las recetas (${history.length} recetas)?\n\nEsta acción no se puede deshacer y eliminará todas sus recetas guardadas.`)

    if (!confirmed) {
      return
    }

    // Remove all recipe images from localStorage
    history.forEach(item => {
      if (item.recipeId) {
        localStorage.removeItem(`recipe-images-${item.recipeId}`)
      }
    })

    setHistory([])
    localStorage.removeItem("recipeHistory")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const extractRecipeTitle = (analysis: string) => {
    const firstLine = analysis.split('\n')[0]
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
  }

  const filteredHistory = selectedFolder 
    ? history.filter(item => item.folderId === selectedFolder)
    : selectedFolder === 'uncategorized' 
      ? history.filter(item => !item.folderId)
      : history

  const getRecipeCount = (folderId: string | undefined) => {
    if (folderId === undefined) return history.filter(item => !item.folderId).length
    return history.filter(item => item.folderId === folderId).length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <ChefHat className="h-8 w-8 text-slate-600" />
            Mis Recetas
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Sidebar de carpetas */}
          <div className="w-80 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">Carpetas</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center gap-2"
              >
                <FolderPlus size={16} />
                Nueva
              </Button>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {/* Todas las recetas */}
                <motion.div
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFolder === undefined ? 'bg-slate-100 dark:bg-slate-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedFolder(undefined)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChefHat className="h-5 w-5 text-slate-600" />
                  <span className="flex-1 font-medium">Todas las recetas</span>
                  <span className="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {history.length}
                  </span>
                </motion.div>

                {/* Sin categorizar */}
                <motion.div
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFolder === 'uncategorized' ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedFolder('uncategorized')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Folder className="h-5 w-5 text-gray-500" />
                  <span className="flex-1">Sin categorizar</span>
                  <span className="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {getRecipeCount(undefined)}
                  </span>
                </motion.div>

                {/* Carpetas personalizadas */}
                {folders.map((folder) => (
                  <motion.div
                    key={folder.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedFolder === folder.id ? 'bg-blue-100 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedFolder(folder.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Folder className="h-5 w-5" style={{ color: folder.color }} />
                    {editingFolder === folder.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              editFolder(folder.id, editFolderName)
                            } else if (e.key === 'Escape') {
                              setEditingFolder(null)
                              setEditFolderName("")
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            editFolder(folder.id, editFolderName)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingFolder(null)
                            setEditFolderName("")
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 font-medium">{folder.name}</span>
                        <span className="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {getRecipeCount(folder.id)}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingFolder(folder.id)
                              setEditFolderName(folder.name)
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Edit3 size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => deleteFolder(folder.id, e)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}

                {/* Crear nueva carpeta */}
                <AnimatePresence>
                  {isCreatingFolder && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nombre de la carpeta..."
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            createFolder()
                          } else if (e.key === 'Escape') {
                            setIsCreatingFolder(false)
                            setNewFolderName("")
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={createFolder}
                        className="h-8 w-8 p-0"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsCreatingFolder(false)
                          setNewFolderName("")
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X size={14} />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

          {/* Área principal de recetas */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                {selectedFolder === undefined ? 'Todas las recetas' :
                 selectedFolder === 'uncategorized' ? 'Sin categorizar' :
                 folders.find(f => f.id === selectedFolder)?.name || 'Carpeta'}
                <span className="ml-2 text-sm text-gray-500">
                  ({filteredHistory.length} {filteredHistory.length === 1 ? 'receta' : 'recetas'})
                </span>
              </h3>
            </div>

            {filteredHistory.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {filteredHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
                      onClick={() => onSelectItem(item)}
                      whileHover={{ y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt="Receta"
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Botones flotantes */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={`h-8 w-8 p-0 ${item.isFavorite ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white/90'}`}
                          >
                            <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="h-8 w-8 p-0 bg-white/90 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        {/* Título de la receta */}
                        <div className="absolute bottom-2 left-2 right-2">
                          <h4 className="text-white font-semibold text-sm leading-tight">
                            {item.title || extractRecipeTitle(item.analysis)}
                          </h4>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <Calendar size={12} />
                          {formatDate(item.date)}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                          {item.analysis.substring(0, 120)}...
                        </p>

                        {/* Selector de carpeta */}
                        <div className="flex items-center gap-2">
                          <select
                            value={item.folderId || ''}
                            onChange={(e) => {
                              e.stopPropagation()
                              moveToFolder(item.id, e.target.value || undefined)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 flex-1"
                          >
                            <option value="">Sin categorizar</option>
                            {folders.map(folder => (
                              <option key={folder.id} value={folder.id}>
                                {folder.name}
                              </option>
                            ))}
                          </select>
                          {item.isFavorite && <Star size={14} className="text-yellow-500" fill="currentColor" />}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-4">
                  <ChefHat className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No hay recetas aquí
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedFolder === undefined ? 
                    'Comienza digitalizando tu primera receta' :
                    'Esta carpeta está vacía. Mueve algunas recetas aquí o crea una nueva.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t mt-4">
          <Button variant="destructive" onClick={clearAllHistory}>
            Eliminar todas
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default HistoryModal
