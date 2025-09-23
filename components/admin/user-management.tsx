"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserPlus, Edit, Trash2, Users, Mail, Calendar, MoreHorizontal, Eye, Ban, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserService } from "@/lib/services/userService"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'worker' | 'guest'
  status: 'active' | 'inactive'
  lastLogin: string
  recipesCount?: number
  joinDate?: string
}

interface UserManagementProps {
  users: User[]
  setUsers: (users: User[]) => void
}

export default function UserManagement({ users, setUsers }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user' | 'worker' | 'guest'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as User['role'],
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return

    setIsLoading(true)
    try {
      // Create user in database
      const createdUser = await UserService.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role === 'admin' ? 'admin' : newUser.role === 'worker' ? 'worker' : 'guest',
        status: 'active',
        created_at: new Date().toISOString()
      })

      // Add to local state
      const user: User = {
        id: createdUser.id?.toString() || Date.now().toString(),
        name: createdUser.name || createdUser.username || newUser.name,
        email: createdUser.email,
        role: createdUser.role as User['role'],
        status: createdUser.active ? 'active' : 'inactive',
        lastLogin: new Date().toISOString().split('T')[0],
        recipesCount: 0,
        joinDate: new Date().toISOString().split('T')[0]
      }

      setUsers([...users, user])
      setNewUser({ name: '', email: '', role: 'user', password: '' })
      setIsAddUserOpen(false)

      toast({
        title: "Usuario creado",
        description: `${newUser.name} ha sido añadido exitosamente.`,
      })
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el usuario. Intente nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setIsLoading(true)
    try {
      // Update user in database
      await UserService.updateUser(parseInt(selectedUser.id) || selectedUser.id as any, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role === 'admin' ? 'admin' : selectedUser.role === 'worker' ? 'worker' : 'guest',
        status: selectedUser.status
      })

      // Update local state
      setUsers(users.map(user =>
        user.id === selectedUser.id ? selectedUser : user
      ))
      setIsEditUserOpen(false)
      setSelectedUser(null)

      toast({
        title: "Usuario actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      })
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (user && window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.name}"?`)) {
      setIsLoading(true)
      try {
        // Delete from database
        await UserService.deleteUser(parseInt(id) || id)

        // Remove from local state
        setUsers(users.filter(u => u.id !== id))

        toast({
          title: "Usuario eliminado",
          description: "El usuario ha sido eliminado exitosamente.",
        })
      } catch (error) {
        console.error('Error deleting user:', error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleToggleStatus = async (id: string) => {
    const userToUpdate = users.find(u => u.id === id)
    if (!userToUpdate) return

    const newStatus = userToUpdate.status === 'active' ? 'inactive' : 'active'

    setIsLoading(true)
    try {
      // Update in database
      await UserService.updateUser(parseInt(id) || id, {
        status: newStatus
      })

      // Update local state
      setUsers(users.map(user =>
        user.id === id
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ))

      toast({
        title: "Estado actualizado",
        description: `Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente.`,
      })
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'user': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'worker': return 'bg-green-100 text-green-800 border-green-200'
      case 'guest': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'user': return 'Benutzer'
      case 'worker': return 'Trabajador'
      case 'guest': return 'Invitado'
      default: return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Benutzerverwaltung
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verwalten Sie alle Systembenutzer
          </p>
        </div>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
    
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Benutzer hinzufügen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Benutzerkonto für das System
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Vollständiger Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Vollständigen Namen eingeben"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@email.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Temporäres Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Temporäres Passwort"
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={newUser.role} onValueChange={(value: User['role']) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Mitarbeiter</SelectItem>
                    <SelectItem value="guest">Gast</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddUser} className="flex-1">
                  Benutzer erstellen
                </Button>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Benutzer suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterRole} onValueChange={(value) => setFilterRole(value as "admin" | "worker" | "guest" | "all" | "user")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="admin">Administratoren</SelectItem>
                <SelectItem value="user">Benutzer</SelectItem>
                <SelectItem value="worker">Trabajadores</SelectItem>
                <SelectItem value="guest">Invitados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Aktiv</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Administratoren</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <Users className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Benutzer</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'user').length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste der Benutzer */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map(user => (
            <Card key={user.id} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-4 w-4" />
                        Último acceso: {user.lastLogin}
                      </div>
                      {user.recipesCount !== undefined && (
                        <div>Recetas: {user.recipesCount}</div>
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
                            setSelectedUser(user)
                            setIsEditUserOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                          {user.status === 'active' ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Deaktivieren
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aktivieren
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
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
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine Benutzer gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Intenta cambiar los filtros de búsqueda
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición de usuario */}
      {selectedUser && (
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benutzer bearbeiten</DialogTitle>
              <DialogDescription>
                Modifica la información del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Vollständiger Name</Label>
                <Input
                  id="edit-name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rolle</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: User['role']) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="worker">Trabajador</SelectItem>
                    <SelectItem value="guest">Invitado</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Estado</Label>
                <Select
                  value={selectedUser.status}
                  onValueChange={(value: User['status']) => setSelectedUser({ ...selectedUser, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleEditUser} className="flex-1">
                  Guardar Cambios
                </Button>
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}