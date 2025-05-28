"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2 } from "lucide-react"
import Image from "next/image"

interface HistoryItem {
  id: number
  image: string
  analysis: string
  date: string
}

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectItem: (item: HistoryItem) => void
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onSelectItem }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Load history from localStorage on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedHistory = localStorage.getItem("recipeHistory")
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    }
  }, [isOpen])

  const deleteHistoryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const updatedHistory = history.filter((item) => item.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem("recipeHistory", JSON.stringify(updatedHistory))
  }

  const clearAllHistory = () => {
    setHistory([])
    localStorage.removeItem("recipeHistory")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recipe History</DialogTitle>
        </DialogHeader>

        {history.length > 0 ? (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors relative"
                    onClick={() => onSelectItem(item)}
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-20 relative rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt="Recipe"
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                        <p className="line-clamp-2 text-sm mt-1">{item.analysis.substring(0, 100)}...</p>
                      </div>
                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500 transition-colors"
                        aria-label="Delete item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between pt-4 border-t mt-4">
              <Button variant="destructive" onClick={clearAllHistory}>
                Clear All
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No recipe history found</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default HistoryModal
