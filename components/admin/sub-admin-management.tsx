"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, UserPlus, Edit, Trash2, Shield, Mail, Calendar, MoreHorizontal, Ban, CheckCircle, Key, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SubAdmin {
  id: string
  name: string
  email: string
  permissions: string[]
  createdDate: string
  status: 'active' | 'inactive'
  lastLogin?: string
}

interface SubAdminManagementProps {
  subAdmins: SubAdmin[]
  setSubAdmins: (subAdmins: SubAdmin[]) => void
}

const availablePermissions = [
  { id: 'recipes', label: 'Rezepteverwaltung', description: 'Rezepte anzeigen, genehmigen und löschen' },
  { id: 'users', label: 'Benutzerverwaltung', description: 'Benutzer erstellen, bearbeiten und löschen' },
  { id: 'pending_recipes', label: 'Ausstehende Rezepte', description: 'Ausstehende Rezepte überprüfen und genehmigen' },
  { id: 'analytics', label: 'Analysen', description: 'Systemstatistiken und Berichte anzeigen' },
  { id: 'settings', label: 'Konfiguration', description: 'Systemkonfigurationen ändern' },
  { id: 'backup', label: 'Backups', description: 'System-Backups erstellen und wiederherstellen' }
]

export default function SubAdminManagement({ subAdmins, setSubAdmins }: SubAdminManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddSubAdminOpen, setIsAddSubAdminOpen] = useState(false)
  const [isEditSubAdminOpen, setIsEditSubAdminOpen] = useState(false)
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null)
  const [newSubAdmin, setNewSubAdmin] = useState({
    name: '',
    email: '',
    password: '',
    permissions: [] as string[]
  })

  const filteredSubAdmins = subAdmins.filter(subAdmin =>
    subAdmin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subAdmin.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSubAdmin = () => {
    if (!newSubAdmin.name || !newSubAdmin.email || !newSubAdmin.password || newSubAdmin.permissions.length === 0) {
      alert('Por favor completa todos los campos y selecciona al menos un permiso')
      return
    }

    const subAdmin: SubAdmin = {
      id: Date.now().toString(),
      name: newSubAdmin.name,
      email: newSubAdmin.email,
      permissions: newSubAdmin.permissions,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'active',
      lastLogin: new Date().toISOString().split('T')[0]
    }

    setSubAdmins([...subAdmins, subAdmin])
    setNewSubAdmin({ name: '', email: '', password: '', permissions: [] })
    setIsAddSubAdminOpen(false)
  }

  const handleEditSubAdmin = () => {
    if (!selectedSubAdmin) return

    setSubAdmins(subAdmins.map(subAdmin =>
      subAdmin.id === selectedSubAdmin.id ? selectedSubAdmin : subAdmin
    ))
    setIsEditSubAdminOpen(false)
    setSelectedSubAdmin(null)
  }

  const handleDeleteSubAdmin = (id: string) => {
    const subAdmin = subAdmins.find(s => s.id === id)
    if (subAdmin && window.confirm(`Sind Sie sicher, dass Sie den Sub-Administrator "${subAdmin.name}" löschen möchten?`)) {
      setSubAdmins(subAdmins.filter(s => s.id !== id))
    }
  }

  const handleToggleStatus = (id: string) => {
    setSubAdmins(subAdmins.map(subAdmin =>
      subAdmin.id === id
        ? { ...subAdmin, status: subAdmin.status === 'active' ? 'inactive' : 'active' }
        : subAdmin
    ))
  }

  const handlePermissionChange = (permissionId: string, checked: boolean, isEdit = false) => {
    if (isEdit && selectedSubAdmin) {
      const newPermissions = checked
        ? [...selectedSubAdmin.permissions, permissionId]
        : selectedSubAdmin.permissions.filter(p => p !== permissionId)
      setSelectedSubAdmin({ ...selectedSubAdmin, permissions: newPermissions })
    } else {
      const newPermissions = checked
        ? [...newSubAdmin.permissions, permissionId]
        : newSubAdmin.permissions.filter(p => p !== permissionId)
      setNewSubAdmin({ ...newSubAdmin, permissions: newPermissions })
    }
  }

  const getPermissionLabel = (permissionId: string) => {
    const permission = availablePermissions.find(p => p.id === permissionId)
    return permission ? permission.label : permissionId
  }

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-1xl font-bold text-gray-900 dark:text-white mb-2">
            Sub-Administrator-Verwaltung
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verwalten Sie Sub-Administratoren und ihre Berechtigungen
          </p>
        </div>

        <Dialog open={isAddSubAdminOpen} onOpenChange={setIsAddSubAdminOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
             
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Sub-Administrator hinzufügen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Sub-Administrator-Konto mit spezifischen Berechtigungen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Vollständiger Name</Label>
                  <Input
                    id="name"
                    value={newSubAdmin.name}
                    onChange={(e) => setNewSubAdmin({ ...newSubAdmin, name: e.target.value })}
                    placeholder="Vollständigen Namen eingeben"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSubAdmin.email}
                    onChange={(e) => setNewSubAdmin({ ...newSubAdmin, email: e.target.value })}
                    placeholder="admin@email.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={newSubAdmin.password}
                  onChange={(e) => setNewSubAdmin({ ...newSubAdmin, password: e.target.value })}
                  placeholder="Sicheres Passwort"
                />
              </div>

              <div>
                <Label className="text-base font-semibold">Berechtigungen</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Wählen Sie die Berechtigungen, die dieser Sub-Administrator haben wird
                </p>
                <div className="space-y-3">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Checkbox
                        id={permission.id}
                        checked={newSubAdmin.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={permission.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddSubAdmin} className="flex-1">
                  Sub-Administrator erstellen
                </Button>
                <Button variant="outline" onClick={() => setIsAddSubAdminOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Sub-Administratoren suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Gesamt</p>
                <p className="text-2xl font-bold">{subAdmins.length}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Aktiv</p>
                <p className="text-2xl font-bold">{subAdmins.filter(s => s.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Mit vollständigen Berechtigungen</p>
                <p className="text-2xl font-bold">
                  {subAdmins.filter(s => s.permissions.length >= 4).length}
                </p>
              </div>
              <Key className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste der Sub-Administratoren */}
      {filteredSubAdmins.length > 0 ? (
        <div className="space-y-4">
          {filteredSubAdmins.map(subAdmin => (
            <Card key={subAdmin.id} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {subAdmin.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Mail className="h-4 w-4" />
                        {subAdmin.email}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(subAdmin.status)}>
                          {subAdmin.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge variant="outline">
                          {subAdmin.permissions.length} Berechtigungen
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subAdmin.permissions.slice(0, 3).map(permission => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {getPermissionLabel(permission)}
                          </Badge>
                        ))}
                        {subAdmin.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{subAdmin.permissions.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-4 w-4" />
                        Erstellt: {subAdmin.createdDate}
                      </div>
                      {subAdmin.lastLogin && (
                        <div>Último acceso: {subAdmin.lastLogin}</div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSubAdmin(subAdmin)
                            setIsEditSubAdminOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(subAdmin.id)}>
                          {subAdmin.status === 'active' ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSubAdmin(subAdmin.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine Sub-Administratoren gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta cambiar el término de búsqueda o crea un nuevo sub-administrador
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición de sub-administrador */}
      {selectedSubAdmin && (
        <Dialog open={isEditSubAdminOpen} onOpenChange={setIsEditSubAdminOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sub-Administrator bearbeiten</DialogTitle>
              <DialogDescription>
                Informationen und Berechtigungen des Sub-Administrators ändern
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Vollständiger Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedSubAdmin.name}
                    onChange={(e) => setSelectedSubAdmin({ ...selectedSubAdmin, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedSubAdmin.email}
                    onChange={(e) => setSelectedSubAdmin({ ...selectedSubAdmin, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Berechtigungen</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Berechtigungen des Sub-Administrators ändern
                </p>
                <div className="space-y-3">
                  {availablePermissions.map(permission => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Checkbox
                        id={`edit-${permission.id}`}
                        checked={selectedSubAdmin.permissions.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean, true)}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={`edit-${permission.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditSubAdmin} className="flex-1">
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={() => setIsEditSubAdminOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}