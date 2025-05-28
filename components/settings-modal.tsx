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
  const [language, setLanguage] = useState("english")
  const [autoSave, setAutoSave] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("recipeDigitizerSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setDarkMode(settings.darkMode || false)
      setLanguage(settings.language || "english")
      setAutoSave(settings.autoSave !== undefined ? settings.autoSave : true)
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = { darkMode, language, autoSave }
    localStorage.setItem("recipeDigitizerSettings", JSON.stringify(settings))

    // Apply dark mode to the document
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
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col">
              <span>Dark Mode</span>
              <span className="text-sm text-gray-500">Enable dark theme</span>
            </Label>
            <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-save" className="flex flex-col">
              <span>Auto-save</span>
              <span className="text-sm text-gray-500">Automatically save recipes to history</span>
            </Label>
            <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
