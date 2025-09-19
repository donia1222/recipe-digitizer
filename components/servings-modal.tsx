"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Calculator, X } from "lucide-react"

interface ServingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentServings: number
  originalServings: number
  onAdjust: (newServings: number) => Promise<void>
  isLoading?: boolean
}

export default function ServingsModal({
  isOpen,
  onClose,
  currentServings,
  originalServings,
  onAdjust,
  isLoading = false
}: ServingsModalProps) {
  const [servingsInput, setServingsInput] = useState<string>(currentServings.toString())

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 100)) {
      setServingsInput(value)
    }
  }

  const handleAdjust = async () => {
    const newServings = parseInt(servingsInput)
    if (newServings && newServings !== currentServings) {
      await onAdjust(newServings)
      onClose()
    }
  }

  const handleClose = () => {
    setServingsInput(currentServings.toString())
    onClose()
  }

  const canAdjust = servingsInput !== "" && parseInt(servingsInput) !== currentServings

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Portionen anpassen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-gray-600 dark:text-gray-400">
              Originalrezept für <span className="font-semibold text-blue-600">{originalServings}</span> {originalServings === 1 ? "Person" : "Personen"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Aktuell angepasst für <span className="font-semibold text-green-600">{currentServings}</span> {currentServings === 1 ? "Person" : "Personen"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <label htmlFor="modal-servings" className="text-gray-700 dark:text-gray-300 font-semibold">
                Neue Anzahl:
              </label>
              <Input
                id="modal-servings"
                type="number"
                min="1"
                max="100"
                value={servingsInput}
                onChange={handleInputChange}
                disabled={isLoading}
                className="w-24 text-center text-lg font-semibold bg-white/70 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-600/50 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="2"
                autoFocus
              />
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {parseInt(servingsInput) === 1 ? "Person" : "Personen"}
              </span>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Automatische Anpassung</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Die Mengen aller Zutaten werden automatisch entsprechend der neuen Personenanzahl angepasst.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={!canAdjust || isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Calculator className="h-4 w-4 mr-2 animate-pulse" />
                  Berechnung...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Mengen anpassen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}