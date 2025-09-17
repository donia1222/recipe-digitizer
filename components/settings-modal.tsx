"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState("deutsch")
  const [autoSave, setAutoSave] = useState(true)

  // Einstellungen beim Laden aus localStorage abrufen
  useEffect(() => {
    const savedSettings = localStorage.getItem("recipeDigitizerSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setDarkMode(settings.darkMode || false)
      setLanguage(settings.language || "deutsch")
      setAutoSave(settings.autoSave !== undefined ? settings.autoSave : true)
    }
  }, [])

  // Einstellungen in localStorage speichern wenn sie sich ändern
  useEffect(() => {
    const settings = { darkMode, language, autoSave }
    localStorage.setItem("recipeDigitizerSettings", JSON.stringify(settings))

    // Dunklen Modus auf das Dokument anwenden
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode, language, autoSave])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col">
              <span>Dunkler Modus</span>
              <span className="text-sm text-gray-500">Dunkles Design aktivieren</span>
            </Label>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>



          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save" className="flex flex-col">
              <span>Automatisch speichern</span>
              <span className="text-sm text-gray-500">Rezepte automatisch im Verlauf speichern</span>
            </Label>
            <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
